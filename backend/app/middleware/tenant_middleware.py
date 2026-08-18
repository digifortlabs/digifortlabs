import logging
from typing import Optional
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Hospital

logger = logging.getLogger(__name__)

class TenantMiddleware(BaseHTTPMiddleware):
    """
    Resolves tenant context (hospital_id & hospital_slug) from request host headers or X-Tenant-Slug header.
    Attaches `request.state.tenant` and `request.state.tenant_id`.
    """
    async def dispatch(self, request: Request, call_next):
        request.state.tenant = None
        request.state.tenant_id = None
        request.state.tenant_slug = None

        # 1. Header Fallback (for local dev & mobile apps)
        tenant_slug = request.headers.get("X-Tenant-Slug")
        
        # 2. Host Subdomain Extraction (e.g. cityhospital.digifortlabs.com)
        if not tenant_slug:
            host = request.headers.get("host", "").split(":")[0]
            parts = host.split(".")
            if len(parts) >= 3 and parts[0] not in ["www", "api", "admin", "app"]:
                tenant_slug = parts[0]

        if tenant_slug:
            db: Session = SessionLocal()
            try:
                hospital = db.query(Hospital).filter(
                    Hospital.hospital_slug == tenant_slug,
                    Hospital.is_deleted == False
                ).first()
                if hospital:
                    request.state.tenant = hospital
                    request.state.tenant_id = hospital.hospital_id
                    request.state.tenant_slug = hospital.hospital_slug
            except Exception as e:
                logger.error(f"Error resolving tenant slug '{tenant_slug}': {e}")
            finally:
                db.close()

        response = await call_next(request)
        return response
