from fastapi import FastAPI, HTTPException

from .core.config import settings
from .database import Base, engine
from .routers import auth, hospitals, patients
from .core.logging_config import setup_logging

# Initialize Logging
setup_logging()

# Create database tables
Base.metadata.create_all(bind=engine)

# --- SECURITY CHECKS ---
if settings.ENVIRONMENT == "production" and settings.IS_UNSAFE_SECRET_KEY:
    import logging
    logger = logging.getLogger(__name__)
    logger.critical("🚨 CRITICAL SECURITY WARNING 🚨")
    logger.critical("The application is running in PRODUCTION with the DEFAULT SECRET_KEY.")
    logger.critical("This is a massive security risk. Authentication tokens can be forged.")
    logger.critical("Please set the SECRET_KEY environment variable immediately.")
    # Based on user feedback: "make sure website should not crash or data both"
    # We will log a critical warning but allow the application to proceed.

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
            
            # Security Fix: Drop plain_password column if it exists
            try:
                conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS plain_password"))
            except Exception as drop_e:
                print(f"Notice: Could not drop plain_password column (maybe it doesn't exist): {drop_e}")

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
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS enabled_modules JSON DEFAULT '[\"core\"]'"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS ai_settings JSON DEFAULT '{\"enabled\": false, \"api_key\": \"\"}'"))
            
            # Additional hospital columns
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS director_name VARCHAR"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS registration_number VARCHAR"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS established_year INTEGER"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS address VARCHAR"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS address_line2 VARCHAR"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS city VARCHAR"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS state VARCHAR"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS pincode VARCHAR"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS country VARCHAR DEFAULT 'India'"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS phone VARCHAR"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS secondary_email VARCHAR"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS landline VARCHAR"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS google_maps_url TEXT"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS price_per_file FLOAT DEFAULT 100.0"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS included_pages INTEGER DEFAULT 20"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS price_per_extra_page FLOAT DEFAULT 1.0"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS custom_pricing JSON DEFAULT '{}'"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS pricing_effective_date TIMESTAMP"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS pricing_notes TEXT"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS expected_monthly_volume INTEGER"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS expected_users INTEGER"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS storage_requirements VARCHAR"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS special_requirements TEXT"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS accept_marketing BOOLEAN DEFAULT false"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS per_user_price FLOAT DEFAULT 500.0"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS registration_fee FLOAT DEFAULT 0.0"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS is_reg_fee_paid BOOLEAN DEFAULT true"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS gst_number VARCHAR"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS bank_name VARCHAR"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS bank_account_no VARCHAR"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS pan_number VARCHAR"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
            conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS specialty_data JSON DEFAULT '{}'"))
            
            # 5b. Dental Patient Enhanced Fields
            conn.execute(text("ALTER TABLE dental_patients ADD COLUMN IF NOT EXISTS clinical_data JSON DEFAULT '{}'"))
            conn.execute(text("ALTER TABLE dental_patients ADD COLUMN IF NOT EXISTS habits JSON DEFAULT '{}'"))

            # 6. Accounting Config Enhancements
            conn.execute(text("ALTER TABLE accounting_config ADD COLUMN IF NOT EXISTS company_phone VARCHAR"))
            conn.execute(text("ALTER TABLE accounting_config ADD COLUMN IF NOT EXISTS company_pan VARCHAR"))
            conn.execute(text("ALTER TABLE accounting_config ADD COLUMN IF NOT EXISTS company_bank_branch VARCHAR"))

            # 7. System Settings
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS system_settings (
                    id SERIAL PRIMARY KEY,
                    key VARCHAR UNIQUE NOT NULL,
                    value TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))

            # 8. System Error Logs
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS system_error_logs (
                    id SERIAL PRIMARY KEY,
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    error_type VARCHAR NOT NULL,
                    error_message TEXT NOT NULL,
                    stack_trace TEXT,
                    endpoint VARCHAR,
                    user_id INTEGER REFERENCES users(user_id),
                    method VARCHAR,
                    status VARCHAR DEFAULT 'unresolved',
                    notes TEXT
                )
            """))

            # 9. MFA Login OTPs
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS login_otps (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(user_id) NOT NULL,
                    device_id VARCHAR NOT NULL,
                    otp_code VARCHAR NOT NULL,
                    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """))

            # 10. User Trusted Devices (Skip MFA)
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS user_trusted_devices (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(user_id) NOT NULL,
                    device_token_hash VARCHAR NOT NULL,
                    device_name VARCHAR,
                    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # Index for performance
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_trusted_device_token ON user_trusted_devices(device_token_hash)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_trusted_device_user ON user_trusted_devices(user_id)"))

            # 11. Dental Treatment Plans & Phases (fixes UndefinedColumn: phase_id)
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS dental_treatment_plans (
                    plan_id SERIAL PRIMARY KEY,
                    patient_id INTEGER REFERENCES dental_patients(patient_id) NOT NULL,
                    name VARCHAR NOT NULL,
                    status VARCHAR DEFAULT 'proposed',
                    priority VARCHAR DEFAULT 'normal',
                    estimated_cost FLOAT DEFAULT 0.0,
                    notes TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS dental_treatment_phases (
                    phase_id SERIAL PRIMARY KEY,
                    plan_id INTEGER REFERENCES dental_treatment_plans(plan_id) NOT NULL,
                    name VARCHAR NOT NULL,
                    phase_order INTEGER DEFAULT 1,
                    status VARCHAR DEFAULT 'pending',
                    estimated_duration_days INTEGER
                )
            """))
            # Add phase_id to dental_treatments if not present
            conn.execute(text("ALTER TABLE dental_treatments ADD COLUMN IF NOT EXISTS phase_id INTEGER REFERENCES dental_treatment_phases(phase_id)"))

            conn.commit()
            print("✅ Auto-migrations completed successfully.")
    except Exception as e:
        print(f"⚠️ Auto-migration skipped or failed: {e}")

run_migrations()

from fastapi_csrf_protect import CsrfProtect
from fastapi_csrf_protect.exceptions import CsrfProtectError
from pydantic import BaseModel
from fastapi import Depends, Request

class CsrfSettings(BaseModel):
    secret_key: str = settings.SECRET_KEY
    cookie_samesite: str = "lax"
    cookie_secure: bool = settings.ENVIRONMENT == "production"

@CsrfProtect.load_config
def get_csrf_config():
    return CsrfSettings()

async def verify_csrf(request: Request, csrf_protect: CsrfProtect = Depends()):
    # Apply CSRF to all mutative state changes
    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        path = request.url.path
        # Exclude endpoints that create sessions/auth where token cannot exist yet
        # OR desktop scanner app endpoints that cannot manage browser cookies
        if (path.endswith("/auth/token") or 
            path.endswith("/auth/request-password-reset") or
            "/scanner/" in path or 
            path.endswith("/upload")):
            return
        await csrf_protect.validate_csrf(request)

app = FastAPI(
    title="THE DIGIFORT LABS - Hospital Archive",
    description="Secure PDF Archival System for Hospitals ",
    version="1.0.0",
    docs_url=None if settings.ENVIRONMENT == "production" else "/docs",
    redoc_url=None if settings.ENVIRONMENT == "production" else "/redoc",
    dependencies=[Depends(verify_csrf)]
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
app.add_middleware(RateLimitMiddleware, requests_per_minute=300, auth_requests_per_minute=60)
app.add_middleware(BandwidthMiddleware)

# IMPORTANT: CORS must be added LAST to be the outermost middleware 
# and handle preflight requests before security headers or rate limits.
cors_origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]

# Determine if we are running locally based on the presence of localhost in origins
# Ensure production domains and localhost are always included
is_dev_env = any("localhost" in origin for origin in cors_origins) or settings.ENVIRONMENT == "development"

if is_dev_env:
    if "http://localhost:3000" not in cors_origins:
        cors_origins.append("http://localhost:3000")
    if "https://localhost:3000" not in cors_origins:
        cors_origins.append("https://localhost:3000")
        
# Always secure live domain paths
if "https://digifortlabs.com" not in cors_origins:
    cors_origins.extend([
        "https://digifortlabs.com", 
        "https://www.digifortlabs.com",
        "https://admin.digifortlabs.com"
    ])

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

@app.exception_handler(CsrfProtectError)
async def csrf_protect_exception_handler(request: Request, exc: CsrfProtectError):
    return JSONResponse(status_code=403, content={"detail": exc.message})

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the detail for debugging
    print(f"🔥 Global Exception: {type(exc).__name__}: {str(exc)}")
    import traceback
    tb_str = traceback.format_exc()
    traceback.print_exc()
    
    # Try to log to System Error Log DB
    try:
        from .database import SessionLocal
        from .models import SystemErrorLog
        db = SessionLocal()
        
        err_log = SystemErrorLog(
            error_type=type(exc).__name__,
            error_message=str(exc)[:1000], # Trucate if too long
            stack_trace=tb_str,
            endpoint=str(request.url),
            method=request.method
        )
        db.add(err_log)
        db.commit()
        db.close()
        
    except Exception as dbe:
        print(f"⚠️ Failed to write to system_error_logs: {dbe}")
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

from .routers import appointments
app.include_router(appointments.router)

from .routers import ent
app.include_router(ent.router)

from .routers import clinic
app.include_router(clinic.router)

from .routers import pharma
app.include_router(pharma.router)

from .routers import legal
app.include_router(legal.router)

from .routers import corporate
app.include_router(corporate.router)

from .routers import hms
app.include_router(hms.router)

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

    async def retention_cleanup_loop():
        loop = asyncio.get_event_loop()
        def run_cleanup_task():
            try:
                db = SessionLocal()
                from .services.cleanup_service import CleanupService
                CleanupService.run_retention_policy(db)
                db.close()
            except Exception as e:
                print(f"Retention Cleanup Error: {e}")

        while True:
            try:
                # Run every 24 hours
                await loop.run_in_executor(None, run_cleanup_task)
            except Exception as e:
                print(f"Retention Cleanup Loop Error: {e}")
            
            await asyncio.sleep(86400) # 24 hours


    asyncio.create_task(retention_cleanup_loop())

@app.get("/")
def read_root():
    return {"message": "Welcome to Digifort Labs API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
