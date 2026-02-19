from fastapi import FastAPI, HTTPException

from .core.config import settings
from .database import Base, engine
from .routers import auth, hospitals, patients
from .core.logging_config import setup_logging

# Initialize Logging
setup_logging()

# Create database tables
Base.metadata.create_all(bind=engine)

# --- AUTO MIGRATION (Fix for UndefinedColumn Errors) ---
from sqlalchemy import text
def run_migrations():
    print("🐘 Running auto-migrations...")
    try:
        with engine.connect() as conn:
            # 1. Add download_request_count to pdf_files
            conn.execute(text("ALTER TABLE pdf_files ADD COLUMN IF NOT EXISTS download_request_count INTEGER DEFAULT 0"))
            
            # 2. Add missing columns to users
            # full_name is NOT NULL, so we need a default for existing records
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR NOT NULL DEFAULT 'Legacy User'"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT 0"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS previous_login_at TIMESTAMP"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS known_devices TEXT DEFAULT '[]'"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP"))

            # 3. Add Medical Fields to Patients
            conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS doctor_name VARCHAR"))
            conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS weight VARCHAR"))
            conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS diagnosis TEXT"))
            conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS operative_notes TEXT"))
            conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS mediclaim VARCHAR"))
            conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS medical_summary TEXT"))
            conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS remarks TEXT"))
            conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS mother_record_id INTEGER"))

            # 5. Dental & Genericization
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS specialty VARCHAR DEFAULT 'General'"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS terminology JSON DEFAULT '{}'"))
            conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS specialty_data JSON DEFAULT '{}'"))
            
            # 5b. Dental Patient Enhanced Fields
            conn.execute(text("ALTER TABLE dental_patients ADD COLUMN IF NOT EXISTS clinical_data JSON DEFAULT '{}'"))
            conn.execute(text("ALTER TABLE dental_patients ADD COLUMN IF NOT EXISTS habits JSON DEFAULT '{}'"))

            # 6. Accounting Config Enhancements
            conn.execute(text("ALTER TABLE accounting_config ADD COLUMN IF NOT EXISTS company_phone VARCHAR"))
            conn.execute(text("ALTER TABLE accounting_config ADD COLUMN IF NOT EXISTS company_pan VARCHAR"))
            conn.execute(text("ALTER TABLE accounting_config ADD COLUMN IF NOT EXISTS company_bank_branch VARCHAR"))

            conn.commit()
            print("✅ Auto-migrations completed successfully.")
    except Exception as e:
        print(f"⚠️ Auto-migration skipped or failed: {e}")

run_migrations()

app = FastAPI(
    title="THE DIGIFORT LABS - Hospital Archive",
    description="Secure PDF Archival System for Hospitals ",
    version="1.0.0",
    docs_url=None if settings.ENVIRONMENT == "production" else "/docs",
    redoc_url=None if settings.ENVIRONMENT == "production" else "/redoc",
)

import time
from datetime import datetime
app.state.startup_time = datetime.utcnow()
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

from .middleware.bandwidth import BandwidthMiddleware
from .middleware.security import RateLimitMiddleware, SecurityHeadersMiddleware

# Add security middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, requests_per_minute=60, auth_requests_per_minute=15)
app.add_middleware(BandwidthMiddleware)

# IMPORTANT: CORS must be added LAST to be the outermost middleware 
# and handle preflight requests before security headers or rate limits.
cors_origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
# Ensure production domains are always included if not matched
# Ensure production domains and localhost are always included
if "https://digifortlabs.com" not in cors_origins:
    cors_origins.extend(["https://digifortlabs.com", "http://digifortlabs.com", "https://www.digifortlabs.com"])

# Explicitly add localhost:3000 for frontend development
if "http://localhost:3000" not in cors_origins:
    cors_origins.append("http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError, ResponseValidationError

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the detail for debugging
    print(f"🔥 Global Exception: {type(exc).__name__}: {str(exc)}")
    import traceback
    traceback.print_exc()
    
    # Try to log to Audit DB
    try:
        from .database import SessionLocal
        from .audit import log_audit
        db = SessionLocal()
        # Attempt to get user_id if possible (token might be invalid though)
        # For now, we log as System (None)
        log_audit(db, None, "SYSTEM_ERROR", f"{type(exc).__name__}: {str(exc)}")
        db.commit()
        db.close()
    except Exception as e:
        print(f"Failed to log global exception to DB: {e}")
    
    status_code = 500
    if isinstance(exc, HTTPException): status_code = exc.status_code
    
    response = JSONResponse(
        status_code=status_code,
        content={"detail": str(exc), "type": type(exc).__name__}
    )
    
    # Manually add CORS headers since middleware might be bypassed on error
    origin = request.headers.get("origin")
    if "*" in cors_origins or origin in cors_origins:
        response.headers["Access-Control-Allow-Origin"] = origin or "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        
    return response

@app.exception_handler(ResponseValidationError)
async def validation_exception_handler(request: Request, exc: ResponseValidationError):
    print(f"❌ Response Validation Error: {exc.errors()}")
    response = JSONResponse(
        status_code=500,
        content={"detail": "Data formatting error in server response.", "errors": exc.errors()}
    )
    origin = request.headers.get("origin")
    if "*" in cors_origins or origin in cors_origins:
        response.headers["Access-Control-Allow-Origin"] = origin or "*"
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
from .routers import audit_logs, platform

app.include_router(audit_logs.router, prefix="/audit", tags=["audit"])
app.include_router(platform.router, prefix="/platform", tags=["platform"])

from .routers import server_files
app.include_router(server_files.router, prefix="/server-files", tags=["server-files"])

from .routers import storage

app.include_router(storage.router, prefix="/storage", tags=["storage"])
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
app.include_router(inventory.router, prefix="/inventory", tags=["inventory"])

from .routers import dental
app.include_router(dental.router, prefix="/dental", tags=["dental"])

try:
    from .routers import scanner
    app.include_router(scanner.router) # Scanner Service
except Exception as e:
    print(f"⚠️  WARNING: Failed to load scanner router. Error: {e}")
    # Continue running app even if scanner fails
    pass


# Always mount local_storage for dental scans (and simulation mode)
import os
from fastapi.staticfiles import StaticFiles

local_path = os.path.join(os.getcwd(), "local_storage")
os.makedirs(local_path, exist_ok=True)
# Mount at /local_storage to match DB file_paths
app.mount("/local_storage", StaticFiles(directory=local_path), name="local_storage")



@app.on_event("startup")
async def startup_event():
    # Start periodic background tasks
    import asyncio
    from .services.storage_service import StorageService
    from .database import SessionLocal

    async def auto_confirm_loop():
        loop = asyncio.get_event_loop()
        
        def run_confirm_task():
            try:
                # Create a new session for this thread
                db = SessionLocal()
                # print("Running Scheduled Task: Auto-Confirming Drafts...")
                # Only log specifically if items found, to avoid spam
                results = StorageService.process_auto_confirmations(db)
                if results["total"] > 0:
                     print(f"Auto-confirmed {results['success']} files ({results['failed']} failed)")
                db.close()
            except Exception as e:
                print(f"Auto-confirm Task Error: {e}")

        while True:
            try:
                # Run synchronous task in thread pool to avoid blocking async loop
                await loop.run_in_executor(None, run_confirm_task)
            except Exception as e:
                print(f"Auto-confirm Loop Error: {e}")
            
            # Run every 1 hour
            await asyncio.sleep(3600)

    asyncio.create_task(auto_confirm_loop())

@app.get("/")
def read_root():
    return {"message": "Welcome to Digifort Labs API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
