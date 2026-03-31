from datetime import datetime

from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from jose import jwt, JWTError
from ..database import SessionLocal
from ..models import BandwidthUsage
from ..core.config import settings

class BandwidthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Only track download/upload endpoints
        if request.method not in ["POST", "GET"] or "patients" not in request.url.path:
             return await call_next(request)

        # Extract hospital_id strictly from the authenticated JWT token to prevent spoofing.
        hospital_id = None
        token = request.cookies.get("access_token") or request.headers.get("Authorization")
        if token:
            token = token.replace("Bearer ", "")
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                hospital_id = payload.get("hospital_id")
            except JWTError:
                pass

        if not hospital_id:
            # Skip tracking if no authenticated hospital context
            return await call_next(request)

        # Calculate Request Size (Approximate)
        content_length = request.headers.get('content-length')
        size_mb = int(content_length) / (1024 * 1024) if content_length else 0.0

        # Check Quota
        db: Session = SessionLocal()
        try:
            current_month = datetime.now().strftime("%Y-%m")
            usage_record = db.query(BandwidthUsage).filter(
                BandwidthUsage.hospital_id == hospital_id,
                BandwidthUsage.month_year == current_month
            ).first()

            if not usage_record:
                # Create if new month
                usage_record = BandwidthUsage(
                    hospital_id=hospital_id,
                    month_year=current_month,
                    used_mb=0.0,
                    quota_limit_mb=1000.0 # 1GB Hard Limit
                )
                db.add(usage_record)
            
            # Check Limit
            if usage_record.used_mb + size_mb > usage_record.quota_limit_mb:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Monthly bandwidth quota exceeded (1GB Limit)."}
                )

            # Process Request
            response = await call_next(request)
            
            # Post-processing: Add response size to usage
            # (Note: Streaming responses are harder to measure)
            response_length = response.headers.get('content-length')
            if response_length:
                 size_mb += int(response_length) / (1024 * 1024)
            
            usage_record.used_mb += size_mb
            db.commit()
            
            return response
        except Exception as e:
            print(f"Bandwidth Middleware Error: {e}")
            return await call_next(request)
        finally:
            db.close()
