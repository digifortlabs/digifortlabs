from fastapi import FastAPI

from .core.config import settings
from .database import Base, engine
from .routers import auth, hospitals, patients  # We will create these next

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="THE DIGIFORT LABS - Hospital Archive",
    description="Secure PDF Archival System for Hospitals",
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

app.add_middleware(BandwidthMiddleware)

# Debug CORS
print(f"Loaded CORS Origins: {settings.BACKEND_CORS_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
from .routers import storage

app.include_router(storage.router, prefix="/storage", tags=["storage"])
from .routers import stats, diagnoses

app.include_router(stats.router, prefix="/stats", tags=["stats"])
app.include_router(diagnoses.router, prefix="/icd11/diagnoses", tags=["diagnoses"])
from .routers import procedures

app.include_router(procedures.router, prefix="/icd11/procedures", tags=["procedures"])
from .routers import qa

app.include_router(qa.router, prefix="/qa", tags=["qa"])
from .routers import scanner
app.include_router(scanner.router) # Scanner Service


# Mount local storage for simulation mode (if no AWS keys)
import os

from fastapi.staticfiles import StaticFiles

if not os.getenv("AWS_ACCESS_KEY_ID"):
    local_path = os.path.join(os.getcwd(), "local_storage")
    os.makedirs(local_path, exist_ok=True)
    app.mount("/local-storage", StaticFiles(directory=local_path), name="local-storage")



@app.on_event("startup")
async def startup_event():
    # Start periodic background tasks
    import asyncio
    from .services.storage_service import StorageService
    from .database import SessionLocal

    async def auto_confirm_loop():
        while True:
            try:
                db = SessionLocal()
                print("🕒 Running Scheduled Task: Auto-Confirming Drafts...")
                results = StorageService.process_auto_confirmations(db)
                if results["total"] > 0:
                     print(f"✅ Auto-confirmed {results['success']} files ({results['failed']} failed)")
                db.close()
            except Exception as e:
                print(f"❌ Auto-confirm Loop Error: {e}")
            
            # Run every 1 hour
            await asyncio.sleep(3600)

    asyncio.create_task(auto_confirm_loop())

@app.get("/")
def read_root():
    return {"message": "Welcome to Digifort Labs API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
