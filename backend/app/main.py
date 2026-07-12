import sys
import io
# Force UTF-8 stdout/stderr on Windows to prevent emoji encoding crashes
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if sys.stderr.encoding and sys.stderr.encoding.lower() != 'utf-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

from fastapi import FastAPI, HTTPException

from .core.config import settings
from .database import Base, engine
from .routers import auth, hospitals, patients
from .routers.auth import require_module
from .core.logging_config import setup_logging

# Initialize Logging
setup_logging()

import logging
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

from sqlalchemy.orm import configure_mappers
configure_mappers()

# --- SECURITY CHECKS ---
if settings.ENVIRONMENT == "production" and settings.IS_UNSAFE_SECRET_KEY:
    logger.critical("CRITICAL SECURITY WARNING")
    logger.critical("The application is running in PRODUCTION with the DEFAULT SECRET_KEY.")
    logger.critical("This is a massive security risk. Authentication tokens can be forged.")
    logger.critical("Please set the SECRET_KEY environment variable immediately.")
    # Based on user feedback: "make sure website should not crash or data both"
    # We will log a critical warning but allow the application to proceed.


from fastapi_csrf_protect import CsrfProtect
from fastapi_csrf_protect.exceptions import CsrfProtectError
from pydantic import BaseModel
from fastapi import Depends, Request

class CsrfSettings(BaseModel):
    secret_key: str = settings.SECRET_KEY.get_secret_value()
    cookie_samesite: str = "lax"
    cookie_secure: bool = settings.ENVIRONMENT == "production" and not any(x in str(settings.BACKEND_CORS_ORIGINS) for x in ["localhost", "127.0.0.1", "100.", "192.", "10."])

@CsrfProtect.load_config  # type: ignore
def get_csrf_config():
    return CsrfSettings()

async def verify_csrf(request: Request, csrf_protect: CsrfProtect = Depends()):
    """
    Global dependency to validate CSRF tokens on all state-changing requests.
    Excludes public endpoints and health checks.
    """
    if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json", "/auth/csrf-token", "/auth/token", "/optimization/trigger", "/optimization/ocr/result"]:
        return
        
    # 2. Skip for non-mutating methods (GET, HEAD, OPTIONS)
    if request.method in ["GET", "HEAD", "OPTIONS"]:
        return

    # 2.5. Skip CSRF check for API integrations (Bearer tokens or Worker API keys)
    auth_header = request.headers.get("Authorization")
    if (auth_header and auth_header.startswith("Bearer ")) or request.headers.get("WORKER-API-KEY"):
        return

    # 3. Validate
    try:
        await csrf_protect.validate_csrf(request)
    except CsrfProtectError as e:
        logger.info(f"CSRF Validation Failed: {e.message}")
        raise e


from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start periodic background tasks
    import asyncio
    from .database import SessionLocal

    async def retention_cleanup_loop():
        loop = asyncio.get_event_loop()
        def run_cleanup_task():
            try:
                db = SessionLocal()
                from .services.cleanup_service import CleanupService
                CleanupService.run_retention_policy(db)
                CleanupService.cleanup_temp_jobs() # Added job cleanup
                db.close()
            except Exception as e:
                logger.info(f"Retention Cleanup Error: {e}")

        while True:
            try:
                # Run every 24 hours
                await loop.run_in_executor(None, run_cleanup_task)
            except Exception as e:
                logger.info(f"Retention Cleanup Loop Error: {e}")
            
            await asyncio.sleep(86400) # 24 hours

    task = asyncio.create_task(retention_cleanup_loop())
    yield
    task.cancel()

app = FastAPI(
    title="THE DIGIFORT LABS - Hospital Archive",
    description="Secure PDF Archival System for Hospitals ",
    version="1.0.0",
    docs_url=None if settings.ENVIRONMENT == "production" else "/docs",
    redoc_url=None if settings.ENVIRONMENT == "production" else "/redoc",
    dependencies=[Depends(verify_csrf)],
    lifespan=lifespan,
    root_path="/api" if settings.ENVIRONMENT == "production" else ""
)

import time
from datetime import datetime, timezone
app.state.startup_time = datetime.now(timezone.utc)
app.state.total_requests = 0
app.state.total_latency = 0.0

@app.middleware("http")
async def latency_middleware(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Update global stats
    app.state.total_requests += 1
    app.state.total_latency += process_time
    
    return response

from fastapi.middleware.cors import CORSMiddleware
import re

# CORS origin validation regex (matches localhost, 127.0.0.1, and any subdomain of digifortlabs.com)
CORS_ORIGIN_REGEX = r"^https?://(localhost|127\.0\.0\.1|(.*\.)?digifortlabs\.com)(:\d+)?$"

@app.middleware("http")
async def remove_trailing_slash(request: Request, call_next):
    path = request.url.path
    if path != "/" and path.endswith("/"):
        # Strip '/api' prefix to get the relative path
        rel_path = path[4:] if path.startswith("/api") else path
        rel_path = rel_path.strip("/")
        
        # Determine if this is a root list endpoint (e.g. /patients/, /hospitals/)
        # or an endpoint that explicitly requires a trailing slash (e.g. search/, pending-deletions/)
        is_root_endpoint = "/" not in rel_path
        is_explicit_slash = any(rel_path.endswith(s) for s in ["search", "pending-deletions"])
        
        if not is_root_endpoint and not is_explicit_slash:
            request.scope["path"] = request.scope["path"].rstrip("/")
    return await call_next(request)


from .middleware.bandwidth import BandwidthMiddleware
from .middleware.security import RateLimitMiddleware, SecurityHeadersMiddleware

# Add security middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, requests_per_minute=300, auth_requests_per_minute=60)
app.add_middleware(BandwidthMiddleware)

# IMPORTANT: CORS must be added LAST to be the outermost middleware 
# and handle preflight requests before security headers or rate limits.

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://digifortlabs.com",
        "https://admin.digifortlabs.com",
        "https://www.digifortlabs.com",
        "https://dome.digifortlabs.com",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ],
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError, ResponseValidationError

@app.exception_handler(CsrfProtectError)
async def csrf_protect_exception_handler(request: Request, exc: CsrfProtectError):
    return JSONResponse(status_code=403, content={"detail": exc.message})

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the detail for debugging
    logger.info(f"Global Exception: {type(exc).__name__}: {str(exc)}")
    import traceback
    tb_str = traceback.format_exc()
    traceback.print_exc()
    
    # Try to log to System Error Log DB
    try:
        from .database import SessionLocal
        from .models import SystemErrorLog
        db = SessionLocal()
        
        err_log = SystemErrorLog(
            severity="ERROR",
            module=request.url.path.split("/")[1] if request.url.path else "unknown",
            message=f"[{type(exc).__name__}] {str(exc)[:500]} | {request.method} {str(request.url)}",
            traceback=tb_str
        )
        db.add(err_log)
        db.commit()
        db.close()

    except Exception as dbe:
        logger.info(f"WARNING: Failed to write to system_error_logs: {dbe}")
        
    try:
        with open("error_dump.txt", "w") as f:
            f.write(tb_str)
    except Exception:
        pass
    
    import secrets
    err_ref = f"ERR-{secrets.token_hex(2).upper()}-{secrets.token_hex(2).upper()}"
    
    status_code = 500
    detail_msg = f"An internal server error occurred. (Ref: {err_ref})"

    if isinstance(exc, HTTPException): 
        status_code = exc.status_code
        detail_msg = exc.detail
    elif "sqlalchemy" in type(exc).__module__ or "psycopg2" in type(exc).__module__:
        exc_name = type(exc).__name__
        if "TimeoutError" in exc_name:
            detail_msg = f"Database connection timeout. The server is under heavy load. (Ref: {err_ref})"
        elif "IntegrityError" in exc_name or "NotNullViolation" in exc_name:
            detail_msg = f"Database constraint violation. The data submitted is invalid or conflicting. (Ref: {err_ref})"
        elif "OperationalError" in exc_name:
            detail_msg = f"Database operational error. Please try again later. (Ref: {err_ref})"
        else:
            detail_msg = f"A database error occurred. (Ref: {err_ref})"
        
        logger.error(f"[{err_ref}] Database Error: {exc_name} - {str(exc)}")
    elif settings.ENVIRONMENT != "production":
        # Only show raw errors in non-production if it's not a DB error
        detail_msg = str(exc)
    
    logger.error(f"[{err_ref}] Traceback:\n{tb_str}")
    
    response = JSONResponse(
        status_code=status_code,
        content={"detail": detail_msg, "type": type(exc).__name__, "ref": err_ref}
    )
    
    # Manually add CORS headers since middleware might be bypassed on error
    origin = request.headers.get("origin")
    import re
    if origin and re.match(CORS_ORIGIN_REGEX, origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        
    return response

@app.exception_handler(ResponseValidationError)
async def validation_exception_handler(request: Request, exc: ResponseValidationError):
    logger.info(f"Response Validation Error: {exc.errors()}")
    response = JSONResponse(
        status_code=500,
        content={"detail": "Data formatting error in server response.", "errors": exc.errors()}
    )
    origin = request.headers.get("origin")
    import re
    if origin and re.match(CORS_ORIGIN_REGEX, origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# Request size limits (100MB for file uploads)
app.router.route_class = type(
    "CustomRoute",
    (app.router.route_class,),
    {"max_request_body_size": 100 * 1024 * 1024}  # 100MB
)


# Include Routers
app.include_router(hospitals.router, prefix="/hospitals", tags=["hospitals"])
app.include_router(patients.router, prefix="/patients", tags=["patients"])
from .routers import users

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
from .routers import audit_logs, platform, platform_ops

app.include_router(audit_logs.router, prefix="/audit", tags=["audit"])
app.include_router(platform.router, prefix="/platform", tags=["platform"])
app.include_router(platform_ops.router)


from .routers import server_files
app.include_router(server_files.router, prefix="/server-files", tags=["server-files"])

from .routers import storage

app.include_router(storage.router, prefix="/storage", tags=["storage"], dependencies=[Depends(require_module("core"))])
from .routers import stats, diagnoses

app.include_router(stats.router, prefix="/stats", tags=["stats"])
app.include_router(diagnoses.router, prefix="/icd11/diagnoses", tags=["diagnoses"])
from .routers import procedures

app.include_router(procedures.router, prefix="/icd11/procedures", tags=["procedures"])
from .routers import qa

app.include_router(qa.router, prefix="/qa", tags=["qa"])
from .routers import reports, contact
app.include_router(reports.router, prefix="/reports", tags=["reports"])
app.include_router(contact.router, prefix="/contact", tags=["contact"])
from .routers import accounting, accounting_advanced
app.include_router(accounting.router, prefix="/accounting", tags=["accounting"])
app.include_router(accounting_advanced.router, prefix="/accounting-adv", tags=["accounting-advanced"])

from .routers import inventory 
app.include_router(inventory.router, prefix="/inventory", tags=["inventory"], dependencies=[Depends(require_module("inventory"))])

from .routers import dental
app.include_router(dental.router, prefix="/dental", tags=["dental"])

from .routers import appointments
app.include_router(appointments.router)

from .routers import doctors
app.include_router(doctors.router)

from .routers import ent
app.include_router(ent.router)


from .routers import patient_billing, patient_ledger
app.include_router(patient_billing.router)
app.include_router(patient_ledger.router)


from .routers import hms
app.include_router(hms.router, dependencies=[Depends(require_module("hms"))])

from .routers import clinic
app.include_router(clinic.router, dependencies=[Depends(require_module("clinic"))])

from .routers import emergency
app.include_router(emergency.router)

from .routers import tpa, nursing, pharmacy, pharmacy_inventory, lab, maternity
app.include_router(tpa.router)
app.include_router(nursing.router)
app.include_router(pharmacy.router)
app.include_router(pharmacy_inventory.router)
app.include_router(lab.router)
app.include_router(maternity.router)

from .routers import whatsapp
app.include_router(whatsapp.router)

try:
    from .routers import scanner
    app.include_router(scanner.router) # Scanner Service
except Exception as e:
    logger.info(f"WARNING: Failed to load scanner router. Error: {e}")
    # Continue running app even if scanner fails
    pass

from .routers import compliance, optimization
app.include_router(compliance.router)
app.include_router(optimization.router, prefix="/optimization", tags=["optimization"])


# Always mount local_storage for dental scans (and simulation mode)
import os
from fastapi.staticfiles import StaticFiles

local_path = os.path.join(os.getcwd(), "local_storage")
os.makedirs(local_path, exist_ok=True)
# Mount at /local_storage to match DB file_paths
app.mount("/local_storage", StaticFiles(directory=local_path), name="local_storage")





@app.get("/")
def read_root():
    return {"message": "Welcome to Digifort Labs API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
