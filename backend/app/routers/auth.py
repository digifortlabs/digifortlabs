import os
import re
import uuid
import json
import hmac

import hashlib
import logging
import secrets
from typing import Optional, cast
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi_csrf_protect import CsrfProtect
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr
from sqlalchemy import func
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# Rate limiting storage for OTPs
otp_request_tracker = defaultdict(list)

from ..core.config import settings
from ..database import get_db
from ..models import SystemSetting, User, UserRole, PasswordResetOTP, Permission, ROLE_PERMISSIONS, UserTrustedDevice
from ..utils import create_access_token, verify_password, get_password_hash
from ..audit import log_audit
from ..services.email_service import EmailService

# Define IST Timezone globally
IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(tags=["auth"], redirect_slashes=False)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    email: str
    otp: str
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

@router.get("/csrf-token")
async def get_csrf_token(csrf_protect: CsrfProtect = Depends()):
    """Returns a CSRF token and sets the signed cookie for frontend usage."""
    csrf_token, signed_token = csrf_protect.generate_csrf_tokens()
    response = JSONResponse(content={"csrf_token": csrf_token})
    csrf_protect.set_csrf_cookie(signed_token, response)
    return response

class EmailCheckRequest(BaseModel):
    email: EmailStr

@router.post("/check-email")
@router.post("/check-email/", include_in_schema=False)
def check_email(data: EmailCheckRequest, db: Session = Depends(get_db)):
    """Check if an email belongs to a hospital and return the target subdomain slug."""
    user = db.query(User).filter(func.lower(User.email) == func.lower(data.email), User.is_deleted == False).first()  # noqa: E712
    if not user:
        raise HTTPException(status_code=404, detail="Email address not found in our registry.")
        
    if user.hospital:
        hospital_slug = user.hospital.hospital_slug or re.sub(r'[^a-z0-9]', '', user.hospital.legal_name.lower())
    else:
        hospital_slug = None

    import os
    is_demo = user.email.lower() == os.environ.get("DEMO_ACCOUNT_EMAIL", "demo@digifortlabs.com").lower()

    # Determine subdomain
    target_subdomain = 'dashboard'
    if is_demo:
        target_subdomain = 'demo'
    elif user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF, UserRole.WEBSITE_ADMIN, UserRole.WAREHOUSE_MANAGER]:
        target_subdomain = 'admin'
    elif user.subdomain:
        target_subdomain = user.subdomain
    elif hospital_slug:
        target_subdomain = hospital_slug

    return {
        "email": user.email,
        "role": user.role,
        "hospital_slug": hospital_slug,
        "target_subdomain": target_subdomain
    }

@router.post("/token", response_model=Token)
@router.post("/token/", response_model=Token, include_in_schema=False)
async def login_for_access_token(
    request: Request,
    background_tasks: BackgroundTasks,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    logger.info("[AUTH] Login attempt for: %s", form_data.username)
    
    # Query user (Case insensitive)
    user = db.query(User).filter(func.lower(User.email) == func.lower(form_data.username)).first()
    if not user:
        # Security: Generic invalid credentials
        try:
             log_audit(db, None, "LOGIN_FAILED", f"User not found: {form_data.username}")
             db.commit()
        except (OSError, RuntimeError, ValueError) as e:
            logger.warning("[AUTH] Failed to log audit for missing user: %s", e)
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 1. Check Lockout Status
    if user.locked_until:
        # Current time in IST
        current_time = datetime.now(IST)
        
        # Ensure lock_time is aware (if stored as naive, assume it was IST)
        lock_time = user.locked_until
        if lock_time.tzinfo is None:
            lock_time = lock_time.replace(tzinfo=IST)
        else:
            lock_time = lock_time.astimezone(IST)
            
        if lock_time > current_time:
            remaining_mins = int((lock_time - current_time).total_seconds() / 60)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account locked due to multiple failed attempts. Try again in {remaining_mins + 1} minutes."
            )
        else:
            # Lock expired, reset counters
            user.locked_until = None  # type: ignore[assignment]
            user.failed_login_attempts = 0  # type: ignore[assignment]

    # 2. Verify Password
    if not verify_password(form_data.password, user.hashed_password):
        # Audit Failure
        log_audit(db, cast(int, user.user_id), "LOGIN_FAILED", "Incorrect password")
        
        # Increment failed attempts
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1  # type: ignore[assignment]
        db.commit()

        if user.failed_login_attempts >= 6:
            # Requirements: Lockout 30 mins after 6 attempts (in IST)
            user.locked_until = datetime.now(IST) + timedelta(minutes=30)  # type: ignore[assignment]
            db.commit()
            
            # Send Lockout Email
            try:
                EmailService.send_account_locked_email(cast(str, user.email), "Multiple failed login attempts")
            except (ConnectionError, OSError, TimeoutError, RuntimeError) as e:
                logger.warning("[AUTH] Failed to send lockout email: %s", e)

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account locked for 30 minutes due to too many failed login attempts."
            )
        
        remaining_attempts = 6 - user.failed_login_attempts
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Incorrect username or password. {remaining_attempts} attempts remaining.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if Hospital is Suspended
    if user.hospital_id:
        if user.hospital and not user.hospital.is_active:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your organization's access has been suspended. Contact Platform Support.",
            )

    # Success: Reset counters & Update Session
    if (user.failed_login_attempts or 0) > 0 or user.locked_until:
        user.failed_login_attempts = 0  # type: ignore[assignment]
        user.locked_until = None  # type: ignore[assignment]
    
    new_session_id = str(uuid.uuid4())
    user.current_session_id = new_session_id  # type: ignore[assignment]
    
    # --- NOTIFICATIONS & AUDIT ---
    # Audit Log (Non-blocking add)
    log_audit(db, cast(int, user.user_id), "LOGIN_SUCCESS", "User logged in successfully")
    
    # Device Tracking & MFA
    try:
        if request and request.client:
            client_ip = request.client.host
            user_agent = request.headers.get("User-Agent", "Unknown")
            # Extract device_id sent by frontend or fallback to IP+Agent
            device_signature = request.headers.get("X-Device-Id") or f"{client_ip}|{user_agent}"
            
            # Parse existing known devices
            known_devices = []
            if user.known_devices:
                try:
                    known_devices = json.loads(cast(str, user.known_devices))
                except (ValueError, TypeError) as e:
                    logger.warning("[AUTH] Failed to parse known_devices for user %s: %s", user.user_id, e)
                    known_devices = []
            
            # --- TRUSTED DEVICE CHECK ---
            # MFA/OTP is enabled for administrative accounts (if user has mfa_enabled = True).
            is_demo = user.email.lower() == os.environ.get("DEMO_ACCOUNT_EMAIL", "").lower()
            is_admin = user.role in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.WAREHOUSE_MANAGER] and getattr(user, 'mfa_enabled', True)
            trusted_token = request.cookies.get("trusted_device")
            is_trusted = False
            
            if trusted_token:
                token_hash = hmac.new(settings.SECRET_KEY.get_secret_value().encode(), trusted_token.encode(), hashlib.sha256).hexdigest()
                trusted_device = db.query(UserTrustedDevice).filter(
                    UserTrustedDevice.user_id == user.user_id,
                    UserTrustedDevice.device_token_hash == token_hash
                ).first()
                if trusted_device:
                    logger.info("[AUTH] Trusted Device recognized for %s. Skipping MFA.", user.email)
                    is_trusted = True
                    trusted_device.last_used_at = datetime.now(IST)  # type: ignore[assignment]
            
            # Check if this device is new
            skip_mfa = os.environ.get("SKIP_MFA", "false").lower() == "true"
            if not is_trusted and device_signature not in known_devices:
                if is_admin and not skip_mfa:
                    # NEW DEVICE FOR ADMIN: Trigger MFA
                    logger.info("[AUTH] New Device MFA Triggered for %s", user.email)
                    
                    otp_code = str(secrets.randbelow(900000) + 100000)
                    
                    from ..models import LoginOTP
                    db.query(LoginOTP).filter(LoginOTP.user_id == user.user_id, LoginOTP.device_id == device_signature).delete()
                    
                    new_otp = LoginOTP(
                        user_id=user.user_id,
                        device_id=device_signature,
                        otp_code=otp_code,
                        expires_at=datetime.now(IST) + timedelta(minutes=15)
                    )
                    db.add(new_otp)
                    db.commit()
                    
                    background_tasks.add_task(
                        EmailService.send_mfa_otp_email,
                        cast(str, user.email),
                        otp_code,
                        client_ip,
                        user_agent
                    )
                    
                    return JSONResponse(status_code=202, content={
                        "mfa_required": True,
                        "device_id": device_signature,
                        "message": "Unrecognized device. Please check your email for an OTP verification code."
                    })
                else:
                    # NEW DEVICE FOR STANDARD USER: Send Alert
                    logger.info("[AUTH] New Device Detected for %s", user.email)
                    background_tasks.add_task(EmailService.send_login_alert, cast(str, user.email), client_ip, user_agent)
                    
                    # Add to known devices automatically for non-admins
                    known_devices.append(device_signature)
                    if len(known_devices) > 10:
                        known_devices.pop(0)
                        
                    user.known_devices = json.dumps(known_devices)  # type: ignore[assignment]
                    db.commit()
            elif is_trusted:
                 # Ensure it's in known_devices if it's trusted but signature changed (e.g. IP changed)
                 if device_signature not in known_devices:
                    known_devices.append(device_signature)
                    if len(known_devices) > 10: known_devices.pop(0)
                    user.known_devices = json.dumps(known_devices)  # type: ignore[assignment]
                 logger.info("[AUTH] Trusted Device Login for %s. Alert/MFA Skipped.", user.email)
            else:
                # KNOWN DEVICE: Skip Alert & MFA
                logger.info("[AUTH] Known Device Login for %s. Alert Skipped.", user.email)
                
    except Exception as e:
        logger.error("[AUTH] Device tracking error for user %s: %s", getattr(user, 'user_id', 'unknown'), e)

    # Update Login Timestamps
    user.previous_login_at = user.last_login_at
    user.last_login_at = datetime.now(IST)  # type: ignore[assignment]
    
    # Create Token
    multi_hospital_ids = []
    is_multi_hospital_doctor = False
    if not user.hospital_id and user.subdomain and user.role.startswith("doctor"):
        is_multi_hospital_doctor = True
        multi_hospital_ids = [p.hospital_id for p in user.doctor_profile]

    token_data = {
        "sub": user.email, 
        "role": user.role, 
        "hospital_id": user.hospital_id,
        "is_multi_hospital": is_multi_hospital_doctor,
        "allowed_hospital_ids": multi_hospital_ids,
        "subdomain": user.subdomain,
        "group_id": user.hospital.group_id if user.hospital else None,
        "pricing_tier": user.hospital.pricing_tier if user.hospital else "C",
        "hospital_name": user.hospital.legal_name if user.hospital else None,
        "specialty": user.hospital.specialty if user.hospital else "General",
        "terminology": user.hospital.terminology if user.hospital else {},
        "enabled_modules": user.hospital.enabled_modules if user.hospital else ["core"],
        "session_id": new_session_id,
        "force_password_change": user.force_password_change or False,
        "previous_login": user.previous_login_at.isoformat() if user.previous_login_at else None
    }

    expires_delta = None
    if user.role == UserRole.SUPER_ADMIN:
        expires_delta = timedelta(days=30)

    if user.hospital:
        token_data["hospital_name"] = user.hospital.legal_name

    access_token = create_access_token(data=token_data, expires_delta=expires_delta)  # type: ignore[arg-type]
    
    # Final Commit for Session & Audit
    db.commit()
    
    # Return as JSONResponse and set the secure HttpOnly cookie
    if user.hospital:
        hospital_slug = user.hospital.hospital_slug or re.sub(r'[^a-z0-9]', '', user.hospital.legal_name.lower())
    else:
        hospital_slug = None
    response = JSONResponse(content={
        "message": "Login successful",
        "access_token": access_token, # Needed for desktop app handoff
        # Optionally return non-sensitive user metadata here if frontend needs it immediately
        "role": user.role,
        "email": user.email,
        "hospital_slug": hospital_slug,
        "specialty": user.hospital.specialty if user.hospital else "General",
        "enabled_modules": user.hospital.enabled_modules if user.hospital else ["core"],
        "terminology": user.hospital.terminology if user.hospital else {}
    })
    
    # Calculate max_age in seconds based on expiration
    max_age = int(expires_delta.total_seconds()) if expires_delta else settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=settings.ENVIRONMENT == "production", # Must be true in prod for HTTPS
        samesite="lax", # Protects against CSRF for most GET navigations, but strict is safer if API is same-domain
        max_age=max_age,
        path="/",
        domain=settings.COOKIE_DOMAIN if settings.COOKIE_DOMAIN else None
    )
    
    return response


class VerifyDeviceRequest(BaseModel):
    email: str
    password: str
    otp_code: str
    device_id: str

@router.post("/mfa/verify-device", response_model=Token)
@router.post("/mfa/verify-device/", response_model=Token, include_in_schema=False)
async def verify_device_otp(req: VerifyDeviceRequest, db: Session = Depends(get_db)):
    """
    Verifies the email OTP for a new device and, if successful, registers the device
    and issues the final access token.
    """
    # 1. Verify credentials again (acts as a secure bound session)
    user = db.query(User).filter(func.lower(User.email) == func.lower(req.email)).first()
    if not user or not verify_password(req.password, user.hashed_password):
        log_audit(db, None, "LOGIN_FAILED", f"MFA failed for {req.email}: Invalid credentials")
        raise HTTPException(status_code=401, detail="Invalid username or password.")
        
    # 2. Check Lockout Status
    if user.locked_until:
        current_time = datetime.now(IST)
        lock_time = user.locked_until
        if lock_time.tzinfo is None: lock_time = lock_time.replace(tzinfo=IST)
        else: lock_time = lock_time.astimezone(IST)
            
        if lock_time > current_time:
            remaining_mins = int((lock_time - current_time).total_seconds() / 60)
            raise HTTPException(status_code=403, detail=f"Account locked. Try again in {remaining_mins + 1} minutes.")
            
    # 3. Verify OTP
    from ..models import LoginOTP
    otp_record = db.query(LoginOTP).filter(
        LoginOTP.user_id == user.user_id,
        LoginOTP.device_id == req.device_id,
        LoginOTP.otp_code == req.otp_code
    ).first()
    
    if not otp_record:
        # Increment failed attempts on MFA failure
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1  # type: ignore[assignment]
        if user.failed_login_attempts >= 6:
            user.locked_until = datetime.now(IST) + timedelta(minutes=30)  # type: ignore[assignment]
            try:
                EmailService.send_account_locked_email(cast(str, user.email), "Multiple failed MFA attempts")
            except (ConnectionError, OSError, TimeoutError, RuntimeError) as e:
                logger.warning("[AUTH] Failed to send lockout email during MFA: %s", e)
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")
        
    # Normalize timezone: SQLite stores naive datetimes; make comparison timezone-safe
    otp_expires = otp_record.expires_at
    if otp_expires.tzinfo is None:
        otp_expires = otp_expires.replace(tzinfo=IST)
    if otp_expires < datetime.now(IST):
        raise HTTPException(status_code=400, detail="Verification code has expired.")
        
    # 4. OTP Valid -> Add device to known devices
    known_devices = []
    if user.known_devices:
        try:
            known_devices = json.loads(cast(str, user.known_devices))
        except (ValueError, TypeError) as e:
            logger.warning("[AUTH] Failed to parse known_devices during MFA verify: %s", e)
            
    if req.device_id not in known_devices:
        known_devices.append(req.device_id)
        if len(known_devices) > 10: known_devices.pop(0)
        user.known_devices = json.dumps(known_devices)  # type: ignore[assignment]
    
    # 5. Clean up OTPs and reset locks
    db.query(LoginOTP).filter(LoginOTP.user_id == user.user_id, LoginOTP.device_id == req.device_id).delete()
    user.failed_login_attempts = 0  # type: ignore[assignment]
    user.locked_until = None  # type: ignore[assignment]
    
    # 6. Generate Session Token (same logic as /token)
    new_session_id = str(uuid.uuid4())
    user.current_session_id = new_session_id  # type: ignore[assignment]
    user.previous_login_at = user.last_login_at
    user.last_login_at = datetime.now(IST)  # type: ignore[assignment]
    
    log_audit(db, cast(int, user.user_id), "LOGIN_SUCCESS", "MFA User logged in successfully")
    
    multi_hospital_ids = []
    is_multi_hospital_doctor = False
    if not user.hospital_id and user.subdomain and user.role.startswith("doctor"):
        is_multi_hospital_doctor = True
        multi_hospital_ids = [p.hospital_id for p in user.doctor_profile]

    token_data = {
        "sub": user.email, 
        "role": user.role, 
        "hospital_id": user.hospital_id,
        "is_multi_hospital": is_multi_hospital_doctor,
        "allowed_hospital_ids": multi_hospital_ids,
        "subdomain": user.subdomain,
        "group_id": user.hospital.group_id if user.hospital else None,
        "pricing_tier": user.hospital.pricing_tier if user.hospital else "C",
        "hospital_name": user.hospital.legal_name if user.hospital else None,
        "specialty": user.hospital.specialty if user.hospital else "General",
        "terminology": user.hospital.terminology if user.hospital else {},
        "enabled_modules": user.hospital.enabled_modules if user.hospital else ["core"],
        "session_id": new_session_id,
        "force_password_change": user.force_password_change or False,
        "previous_login": user.previous_login_at.isoformat() if user.previous_login_at else None
    }

    expires_delta = timedelta(days=30) if user.role == UserRole.SUPER_ADMIN else None
    access_token = create_access_token(data=token_data, expires_delta=expires_delta)  # type: ignore[arg-type]
    db.commit()
    
    # 7. Generate Trusted Device Token
    raw_token = secrets.token_urlsafe(64)
    token_hash = hmac.new(settings.SECRET_KEY.get_secret_value().encode(), raw_token.encode(), hashlib.sha256).hexdigest()
    
    new_trusted_device = UserTrustedDevice(
        user_id=user.user_id,
        device_token_hash=token_hash,
        device_name=f"Verified Device ({datetime.now(IST).strftime('%Y-%m-%d %H:%M')})"
    )
    db.add(new_trusted_device)
    db.commit()

    if user.hospital:
        hospital_slug = user.hospital.hospital_slug or re.sub(r'[^a-z0-9]', '', user.hospital.legal_name.lower())
    else:
        hospital_slug = None
    response = JSONResponse(content={
        "message": "Login successful",
        "access_token": access_token,
        "role": user.role, "email": user.email,
        "hospital_slug": hospital_slug,
        "specialty": user.hospital.specialty if user.hospital else "General",
        "enabled_modules": user.hospital.enabled_modules if user.hospital else ["core"],
        "terminology": user.hospital.terminology if user.hospital else {}
    })
    
    max_age = int(expires_delta.total_seconds()) if expires_delta else settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key="access_token", value=f"Bearer {access_token}", httponly=True,
        secure=settings.ENVIRONMENT == "production", samesite="none", max_age=max_age, path="/",
        domain=settings.COOKIE_DOMAIN if settings.COOKIE_DOMAIN else None
    )
    
    # Set Trusted Device Cookie (Long lived: 1 year)
    response.set_cookie(
        key="trusted_device",
        value=raw_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=31536000, # 1 year
        path="/",
        domain=settings.COOKIE_DOMAIN if settings.COOKIE_DOMAIN else None
    )
    return response

@router.post("/request-password-reset")
@router.post("/request-password-reset/", include_in_schema=False)
async def request_password_reset(request: PasswordResetRequest, db: Session = Depends(get_db)):
    email = request.email.lower()
    
    # Rate limiting: 3 requests per hour
    now = datetime.now(IST)
    otp_request_tracker[email] = [t for t in otp_request_tracker[email] if now - t < timedelta(hours=1)]
    
    if len(otp_request_tracker[email]) >= 3:
        raise HTTPException(status_code=429, detail="Too many OTP requests. Try again in 1 hour.")
    
    otp_request_tracker[email].append(now)

    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user:
        return {"message": "If this email is registered, you will receive an OTP shortly."}
    
    # Invalidate previous active OTPs
    db.query(PasswordResetOTP).filter(
        func.lower(PasswordResetOTP.email) == email,
        PasswordResetOTP.is_used == False  # noqa: E712 - SQLAlchemy requires == for column comparison
    ).update({PasswordResetOTP.is_used: True}, synchronize_session=False)

    # Generate 8-digit secure OTP
    otp_code = str(secrets.randbelow(90000000) + 10000000)
    # Expires in 10 mins (IST)
    expires_at = datetime.now(IST) + timedelta(minutes=10)

    # Save to DB
    otp_entry = PasswordResetOTP(
        email=user.email,
        otp_code=otp_code,
        expires_at=expires_at,
        attempt_count=0
    )
    db.add(otp_entry)
    db.commit()

    # Send Email
    EmailService.send_otp_email(cast(str, user.email), otp_code)

    return {"message": "If this email is registered, you will receive an OTP shortly."}


@router.post("/reset-password")
@router.post("/reset-password/", include_in_schema=False)
async def reset_password(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    from ..models import PasswordResetOTP
    from ..utils import get_password_hash
    
    email = data.email.lower()
    
    # Find Valid OTP
    otp_entry = db.query(PasswordResetOTP).filter(
        func.lower(PasswordResetOTP.email) == email,
        PasswordResetOTP.is_used == False,  # noqa: E712 - SQLAlchemy requires == for column comparison
        PasswordResetOTP.expires_at > datetime.now(IST).replace(microsecond=0)
    ).first()

    if not otp_entry:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    # Check attempt count (max 5 attempts to protect against brute force)
    if otp_entry.attempt_count >= 5:
        otp_entry.is_used = True  # type: ignore[assignment]
        db.commit()
        raise HTTPException(status_code=429, detail="Too many failed attempts. Request a new OTP.")
        
    # Verify OTP
    if otp_entry.otp_code != data.otp:
        otp_entry.attempt_count += 1  # type: ignore[assignment]
        db.commit()
        raise HTTPException(status_code=400, detail=f"Invalid OTP. {5 - otp_entry.attempt_count} attempts remaining.")

    # Update User Password
    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(data.new_password)
    
    # Unlock account if it was locked
    user.locked_until = None  # type: ignore[assignment]
    user.failed_login_attempts = 0  # type: ignore[assignment]

    # Mark OTP as used
    otp_entry.is_used = True  # type: ignore[assignment]
    
    db.commit()

    return {"message": "Password updated successfully"}


def get_current_user(request: Request, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    
    # 1. Prefer Authorization header ? used by admin subdomain (localStorage-based Bearer token).
    #    This must take priority over the cookie so that fresh tokens from the header
    #    are not shadowed by a stale/expired HttpOnly cookie from a prior session.
    auth_header = request.headers.get("Authorization")
    token = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header  # Full "Bearer <token>" string ? stripped below

    # 2. Fallback to HttpOnly Cookie ? used by hospital subdomains (cookie-based auth).
    if not token:
        token = request.cookies.get("access_token")
            
    if not token:
        logger.debug("[AUTH] No token found in Authorization header or cookies.")
        raise credentials_exception

    # Strip 'Bearer ' prefix if present
    if token.startswith("Bearer "):
         token = token.replace("Bearer ", "", 1)

    try:
        payload = jwt.decode(token, settings.SECRET_KEY.get_secret_value(), algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub") or ""
        session_id: str = payload.get("session_id") or ""
        if email is None:
            logger.debug("[AUTH] Token decoded but email (sub) is missing.")
            raise credentials_exception
    except JWTError as e:
        logger.debug("[AUTH] JWT decoding failed: %s", e)
        raise credentials_exception
    
    
    user = db.query(User).filter(func.lower(User.email) == func.lower(email)).first()
    if user is None:
        logger.debug("[AUTH] User with email %s not found in database.", email)
        raise credentials_exception
    
    # Single Session Verification
    if user.role != UserRole.SUPER_ADMIN:
        if user.current_session_id and session_id != user.current_session_id:
            logger.debug("[AUTH] Session Expired for %s. Expected: %s, Got: %s", email, user.current_session_id, session_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session Expired: You have logged in fromanother device.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    # Global Maintenance Mode Check
    maintenance = db.query(SystemSetting).filter(SystemSetting.key == "maintenance_mode").first()
    if maintenance and maintenance.value == "true" and user.role != UserRole.SUPER_ADMIN:
         raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="System is currently under maintenance. Please try again later.",
        )
    
    # Update Last Active Timestamp (IST)
    now = datetime.now(IST)
    
    # Needs checking if last_active_at is naive
    last_active = user.last_active_at
    if last_active and last_active.tzinfo is None:
        last_active = last_active.replace(tzinfo=IST)
        
    if not last_active or (now - last_active).total_seconds() > 300:
        user.last_active_at = now  # type: ignore[assignment]
        db.commit()

    # Demo Account Expiration Check
    if user.hospital and user.hospital.trial_ends_at:
        trial_end = user.hospital.trial_ends_at
        if trial_end.tzinfo is None:
            trial_end = trial_end.replace(tzinfo=IST)
        if now > trial_end:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your trial period has expired. Please upgrade your subscription to continue.",
            )
    
    return user


@router.get("/session-token")
@router.get("/session-token/", include_in_schema=False)
async def get_session_token(current_user: User = Depends(get_current_user)):
    """Returns the JWT for the currently active session. Useful for desktop app handoff."""
    token_data = {
        "sub": current_user.email, 
        "role": current_user.role, 
        "hospital_id": current_user.hospital_id,
        "group_id": current_user.hospital.group_id if current_user.hospital else None,
        "pricing_tier": current_user.hospital.pricing_tier if current_user.hospital else "C",
        "hospital_name": current_user.hospital.legal_name if current_user.hospital else None,
        "specialty": current_user.hospital.specialty if current_user.hospital else "General",
        "terminology": current_user.hospital.terminology if current_user.hospital else {},
        "enabled_modules": current_user.hospital.enabled_modules if current_user.hospital else ["core"],
        "session_id": current_user.current_session_id,
        "force_password_change": current_user.force_password_change or False,
        "previous_login": current_user.previous_login_at.isoformat() if current_user.previous_login_at else None
    }
    
    expires_delta = None
    if current_user.role == UserRole.SUPER_ADMIN:
        expires_delta = timedelta(days=30)

    access_token = create_access_token(data=token_data, expires_delta=expires_delta)  # type: ignore[arg-type]
    return {"access_token": access_token}


def require_permission(required_permission: Permission):
    """
    Dependency generator that checks if the current user has the required permission.
    """
    def permission_checker(current_user: User = Depends(get_current_user)):
        # Give SUPER_ADMIN bypass if they magically don't have it in the mapping
        if current_user.role == UserRole.SUPER_ADMIN:
            return current_user
            
        user_permissions = ROLE_PERMISSIONS.get(cast(UserRole, current_user.role), [])
        if required_permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Require: {required_permission.value}"
            )
        return current_user
    return permission_checker


def require_module(module_name: str):
    """
    Dependency generator that checks if the current tenant hospital has the required module enabled.
    """
    def module_checker(current_user: User = Depends(get_current_user)):
        # Super Admin has global bypass
        if current_user.role == UserRole.SUPER_ADMIN:
            return current_user
            
        hospital = current_user.hospital
        if not hospital:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not associated with any registered client hospital."
            )
            
        # Core module is mandatory
        if module_name == "core":
            return current_user
            
        enabled = hospital.enabled_modules or []
        if module_name not in enabled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Subscription upgrade required. The module '{module_name}' is not active for your organization."
            )
        return current_user
    return module_checker


def require_tier(required_tier: str):
    """
    Dependency generator that checks if the hospital has the required pricing tier.
    Tiers: A (Platinum), B (Gold), C (Standard)
    Note: A > B > C (lower letter = higher tier)
    """
    def tier_checker(current_user: User = Depends(get_current_user)):
        if current_user.role == UserRole.SUPER_ADMIN:
            return current_user
            
        tier_order = {"A": 1, "B": 2, "C": 3}
        user_tier = current_user.hospital.pricing_tier if current_user.hospital else "C"
        
        user_tier_val = tier_order.get(user_tier, 3)
        req_tier_val = tier_order.get(required_tier, 3)
        
        if user_tier_val > req_tier_val:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Package upgrade required for this feature. Required: {required_tier}"
            )
        return current_user
    return tier_checker


@router.post("/logout")
@router.post("/logout/", include_in_schema=False)
async def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logs the user out by clearing the HttpOnly cookie and session ID."""
    # Invalidate session in DB immediately
    current_user.current_session_id = str(uuid.uuid4())  # type: ignore[assignment]
    db.commit()
    
    response = JSONResponse(content={"message": "Successfully logged out"})
    
    # Clear the cookie explicitly
    response.delete_cookie(
        key="access_token",
        path="/",
        secure=settings.ENVIRONMENT == "production",
        httponly=True,
        samesite="lax",
        domain=settings.COOKIE_DOMAIN if settings.COOKIE_DOMAIN else None
    )
    
    return response

@router.post("/register-demo")
@router.post("/register-demo/", include_in_schema=False)
async def register_demo(data: dict, db: Session = Depends(get_db)):
    from ..services.demo_service import register_demo_account, DemoRegistrationRequest
    return register_demo_account(DemoRegistrationRequest(**data), db)

class HospitalRegistrationRequest(BaseModel):
    # Step 1: Organization
    legal_name: str
    organization_type: str = "Hospital" 
    specialty: str = "General"
    phone: str
    
    # Step 2: Admin
    admin_first_name: str
    admin_last_name: str
    email: EmailStr
    password: str

@router.post("/register")
@router.post("/register/", include_in_schema=False)
async def register_hospital(data: HospitalRegistrationRequest, db: Session = Depends(get_db)):
    from ..models import Hospital, User, UserRole
    from ..utils import get_password_hash
    from ..audit import log_audit
    from ..services.email_service import EmailService

    email_lower = data.email.lower()

    # 1. Check if email exists
    if db.query(User).filter(func.lower(User.email) == email_lower).first():
        raise HTTPException(status_code=400, detail="Email is already registered.")

    # 2. Determine initial enabled modules based on industry logic
    enabled_modules = ["core"]
    specialty_lower = data.specialty.lower()
    
    if "dental" in specialty_lower:
        enabled_modules.append("dental")
    elif "ent" in specialty_lower:
        enabled_modules.append("ent")
    elif "pharma" in specialty_lower:
        enabled_modules.append("pharma")
    elif "legal" in specialty_lower or "law" in specialty_lower:
        enabled_modules.append("legal")
    elif "corporate" in specialty_lower or "business" in specialty_lower or "cooperate" in specialty_lower or "co-operate" in specialty_lower or "co opreate" in specialty_lower:
        enabled_modules.append("corporate")
    elif "hospital" in specialty_lower or "hms" in specialty_lower:
        enabled_modules.append("hms")
    elif "clinic" in specialty_lower:
        enabled_modules.append("clinic")
    else:
        # Default for General Medical
        enabled_modules.append("mrd")

    # 3. Create Hospital or Global Doctor
    if data.organization_type == "Independent Doctor":
        import re
        full_name = f"{data.admin_first_name} {data.admin_last_name}".strip()
        base_slug = re.sub(r'[^a-z0-9]', '', full_name.lower())
        if not base_slug:
            base_slug = "doc"
        subdomain = f"dr-{base_slug}"
        
        counter = 1
        original_subdomain = subdomain
        while db.query(User).filter(User.subdomain == subdomain).first():
            subdomain = f"{original_subdomain}{counter}"
            counter += 1

        new_doctor = User(
            email=email_lower,
            full_name=full_name,
            phone=data.phone,
            role=UserRole.DOCTOR_OPD,
            hashed_password=get_password_hash(data.password),
            hospital_id=None,
            subdomain=subdomain,
            is_active=True,
            is_verified=False,
            force_password_change=False
        )
        db.add(new_doctor)
        db.flush()
        
        from ..models import DoctorProfile
        profile = DoctorProfile(
            user_id=new_doctor.user_id,
            hospital_id=None,
            is_residential=True,
            specialization=data.specialty
        )
        db.add(profile)
        db.commit()
        
        try:
            EmailService.send_welcome_email(
                email=email_lower,
                name=full_name,
                password="<Hidden>",
                login_url=f"https://{subdomain}.digifortlabs.com/login"
            )
        except Exception:
            pass
            
        return {"message": "Independent Doctor registered successfully.", "hospital_id": None, "subdomain": subdomain}

    new_hospital = Hospital(
        legal_name=data.legal_name,
        email=email_lower,
        phone=data.phone,
        organization_type=data.organization_type,
        specialty=data.specialty,
        enabled_modules=enabled_modules,
        subscription_tier="Standard", # Default Free/Standard Tier
        is_active=True
    )
    db.add(new_hospital)
    db.flush()

    # 4. Create Admin User
    full_name = f"{data.admin_first_name} {data.admin_last_name}".strip()
    new_admin = User(
        email=email_lower,
        full_name=full_name,
        phone=data.phone,
        role=UserRole.HOSPITAL_ADMIN,
        hashed_password=get_password_hash(data.password),
        hospital_id=new_hospital.hospital_id,
        is_active=True,
        is_verified=False,
        force_password_change=False
    )
    db.add(new_admin)
    
    # 5. Log Audit and Commit
    try:
        log_audit(db, None, "HOSPITAL_REGISTERED", f"New registration: {data.legal_name}")
    except (OSError, RuntimeError, ValueError) as e:
        logger.warning("[AUTH] Failed to log audit for hospital registration: %s", e)
        
    db.commit()

    # 6. Welcome Email
    try:
        EmailService.send_welcome_email(
            email=email_lower,
            name=full_name,
            password="[As defined during registration]"
        )
    except (ConnectionError, OSError, TimeoutError, RuntimeError) as e:
        logger.warning("[AUTH] Failed to send welcome email to %s: %s", email_lower, e)

    return {
        "message": "Registration successful",
        "hospital_id": new_hospital.hospital_id,
        "email": new_admin.email
    }


def get_subdomain_hospital_id(request: Request, db: Session = Depends(get_db)) -> Optional[int]:
    """
    FastAPI dependency that parses the Host header to resolve the tenant's hospital_id dynamically.
    E.g. fortis.digifortlabs.com -> hospital_id of Fortis.
    """
    from ..models import Hospital
    host = request.headers.get("Host", "")
    if not host:
        return None
        
    # Standardize Host: remove port number if any
    host_name = host.split(":")[0]
    
    # Split by '.'
    domain_parts = host_name.split(".")
    
    # Identify subdomain:
    # 1. Localhost setup (e.g. fortis.localhost or fortis.localhost.com)
    if "localhost" in host_name or "127.0.0.1" in host_name or "10.0" in host_name:
        if len(domain_parts) > 1 and domain_parts[-1] != "localhost":
            subdomain = domain_parts[0]
        elif len(domain_parts) > 2 and domain_parts[-1] == "localhost":
            subdomain = domain_parts[0]
        else:
            return None
    else:
        # Production domain: e.g. fortis.digifortlabs.com (length > 2)
        if len(domain_parts) > 2:
            subdomain = domain_parts[0]
        else:
            return None
            
    if subdomain.lower() in ["www", "dashboard", "admin", "api", "app"]:
        return None
        
    # Query database for the hospital matching the subdomain slug
    import re
    target = subdomain.lower()
    hospital = db.query(Hospital).filter(
        Hospital.is_deleted == False,  # noqa: E712 - SQLAlchemy requires == for column comparison
        Hospital.hospital_slug == target
    ).first()
    if hospital:
        return cast(int, hospital.hospital_id)
    # Fallback: derive from legal_name for rows without a stored slug
    for h in db.query(Hospital).filter(
        Hospital.is_deleted == False,  # noqa: E712
        Hospital.hospital_slug == None  # noqa: E711
    ).all():
        if re.sub(r'[^a-z0-9]', '', h.legal_name.lower()) == target:
            return cast(int, h.hospital_id)
            
    return None

