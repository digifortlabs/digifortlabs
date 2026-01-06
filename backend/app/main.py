from fastapi import FastAPI
from .core.config import settings
from .database import engine, Base
from .routers import hospitals, patients, auth # We will create these next

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="THE DIGIFORT LABS - Hospital Archive",
    description="Secure PDF Archival System for Hospitals",
    version="1.0.0",
    docs_url=None if settings.ENVIRONMENT == "production" else "/docs",
    redoc_url=None if settings.ENVIRONMENT == "production" else "/redoc",
)

from .middleware.bandwidth import BandwidthMiddleware
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(BandwidthMiddleware)

# Debug CORS
print(f"Loaded CORS Origins: {settings.BACKEND_CORS_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
from .routers import stats
app.include_router(stats.router, prefix="/stats", tags=["stats"])
from .routers import diagnoses
app.include_router(diagnoses.router, prefix="/diagnoses", tags=["diagnoses"])
from .routers import procedures
app.include_router(procedures.router, prefix="/icd11", tags=["procedures"])

# Mount local storage for simulation mode (if no AWS keys)
import os
from fastapi.staticfiles import StaticFiles
if not os.getenv("AWS_ACCESS_KEY_ID"):
    local_path = os.path.join(os.getcwd(), "local_storage")
    os.makedirs(local_path, exist_ok=True)
    app.mount("/local-storage", StaticFiles(directory=local_path), name="local-storage")



@app.get("/")
def read_root():
    return {"message": "Welcome to Digifort Labs API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
