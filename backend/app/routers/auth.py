import uuid
import random
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.responses import JSONResponse

# Rate limiting storage for OTPs
otp_request_tracker = defaultdict(list)
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..core.config import settings
from ..database import get_db
from ..models import SystemSetting, User, UserRole, PasswordResetOTP, Permission, ROLE_PERMISSIONS
from ..utils import create_access_token, verify_password
from ..audit import log_audit
from ..services.email_service import EmailService

# Define IST Timezone globally
IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(tags=["auth"])

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

from fastapi_csrf_protect import CsrfProtect

@router.get("/csrf-token")
async def get_csrf_token(csrf_protect: CsrfProtect = Depends()):
    """Returns a CSRF token and sets the signed cookie for frontend usage."""
    csrf_token, signed_token = csrf_protect.generate_csrf_tokens()
    response = JSONResponse(content={"csrf_token": csrf_token})
    csrf_protect.set_csrf_cookie(signed_token, response)
    return response



@router.post("/token", response_model=Token)
async def login_for_access_token(
    request: Request,
    background_tasks: BackgroundTasks,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    print(f"🔐 [AUTH] Login attempt for: {form_data.username}")
    
    # Query user (Case insensitive)
    user = db.query(User).filter(func.lower(User.email) == func.lower(form_data.username)).first()
    if not user:
        # Security: Generic invalid credentials
        try:
             log_audit(db, None, "LOGIN_FAILED", f"User not found: {form_data.username}")
             db.commit()
        except: pass
        
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
            user.locked_until = None
            user.failed_login_attempts = 0

    # 2. Verify Password
    if not verify_password(form_data.password, user.hashed_password):
        # Audit Failure
        log_audit(db, user.user_id, "LOGIN_FAILED", "Incorrect password")
        
        # Increment failed attempts
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        db.commit()

        if user.failed_login_attempts >= 6:
            # Requirements: Lockout 30 mins after 6 attempts (in IST)
            user.locked_until = datetime.now(IST) + timedelta(minutes=30)
            db.commit()
            
            # Send Lockout Email
            try:
                EmailService.send_account_locked_email(user.email, "Multiple failed login attempts")
            except Exception as e:
                print(f"[AUTH] Failed to send lockout email: {e}")

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
        user.failed_login_attempts = 0
        user.locked_until = None
    
    new_session_id = str(uuid.uuid4())
    user.current_session_id = new_session_id
    
    # --- NOTIFICATIONS & AUDIT ---
    # Audit Log (Non-blocking add)
    log_audit(db, user.user_id, "LOGIN_SUCCESS", "User logged in successfully")
    
    # Device Tracking & MFA
    try:
        import json
        if request:
            client_ip = request.client.host
            user_agent = request.headers.get("User-Agent", "Unknown")
            # Extract device_id sent by frontend or fallback to IP+Agent
            device_signature = request.headers.get("X-Device-Id") or f"{client_ip}|{user_agent}"
            
            # Parse existing known devices
            known_devices = []
            if user.known_devices:
                try:
                    known_devices = json.loads(user.known_devices)
                except:
                    known_devices = []
            
            is_admin = user.role in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN]
            
            # Check if this device is new
            if device_signature not in known_devices:
                if is_admin:
                    # NEW DEVICE FOR ADMIN: Trigger MFA
                    print(f"🔐 [AUTH] New Device MFA Triggered for {user.email}")
                    
                    otp_code = f"{random.randint(100000, 999999)}"
                    
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
                        user.email,
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
                    print(f"🔐 [AUTH] New Device Detected for {user.email}")
                    background_tasks.add_task(EmailService.send_login_alert, user.email, client_ip, user_agent)
                    
                    # Add to known devices automatically for non-admins
                    known_devices.append(device_signature)
                    if len(known_devices) > 10:
                        known_devices.pop(0)
                        
                    user.known_devices = json.dumps(known_devices)
                    db.commit()
            else:
                # KNOWN DEVICE: Skip Alert & MFA
                print(f"🔐 [AUTH] Known Device Login for {user.email}. Alert Skipped.")
                
    except Exception as e:
        print(f"Device Tracking Error: {e}")
        # Not blocking login unless we intentionally return earlier

    # Update Login Timestamps
    user.previous_login_at = user.last_login_at
    user.last_login_at = datetime.now(IST)
    
    # Create Token
    token_data = {
        "sub": user.email, 
        "role": user.role, 
        "hospital_id": user.hospital_id,
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

    access_token = create_access_token(data=token_data, expires_delta=expires_delta)
    
    # Final Commit for Session & Audit
    db.commit()
    
    # Return as JSONResponse and set the secure HttpOnly cookie
    response = JSONResponse(content={
        "message": "Login successful",
        "access_token": access_token, # Needed for desktop app handoff
        # Optionally return non-sensitive user metadata here if frontend needs it immediately
        "role": user.role,
        "email": user.email,
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
        path="/"
    )
    
    return response


class VerifyDeviceRequest(BaseModel):
    email: str
    password: str
    otp_code: str
    device_id: str

@router.post("/mfa/verify-device", response_model=Token)
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
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= 6:
            user.locked_until = datetime.now(IST) + timedelta(minutes=30)
            try: EmailService.send_account_locked_email(user.email, "Multiple failed MFA attempts")
            except: pass
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")
        
    if otp_record.expires_at < datetime.now(IST):
        raise HTTPException(status_code=400, detail="Verification code has expired.")
        
    # 4. OTP Valid -> Add device to known devices
    import json
    known_devices = []
    if user.known_devices:
        try: known_devices = json.loads(user.known_devices)
        except: pass
            
    if req.device_id not in known_devices:
        known_devices.append(req.device_id)
        if len(known_devices) > 10: known_devices.pop(0)
        user.known_devices = json.dumps(known_devices)
    
    # 5. Clean up OTPs and reset locks
    db.query(LoginOTP).filter(LoginOTP.user_id == user.user_id, LoginOTP.device_id == req.device_id).delete()
    user.failed_login_attempts = 0
    user.locked_until = None
    
    # 6. Generate Session Token (same logic as /token)
    new_session_id = str(uuid.uuid4())
    user.current_session_id = new_session_id
    user.previous_login_at = user.last_login_at
    user.last_login_at = datetime.now(IST)
    
    log_audit(db, user.user_id, "LOGIN_SUCCESS", "MFA User logged in successfully")
    
    token_data = {
        "sub": user.email, "role": user.role, "hospital_id": user.hospital_id,
        "hospital_name": user.hospital.legal_name if user.hospital else None,
        "specialty": user.hospital.specialty if user.hospital else "General",
        "terminology": user.hospital.terminology if user.hospital else {},
        "enabled_modules": user.hospital.enabled_modules if user.hospital else ["core"],
        "session_id": new_session_id,
        "force_password_change": user.force_password_change or False,
        "previous_login": user.previous_login_at.isoformat() if user.previous_login_at else None
    }

    expires_delta = timedelta(days=30) if user.role == UserRole.SUPER_ADMIN else None
    access_token = create_access_token(data=token_data, expires_delta=expires_delta)
    db.commit()
    
    response = JSONResponse(content={
        "message": "Login successful",
        "access_token": access_token,
        "role": user.role, "email": user.email,
        "specialty": user.hospital.specialty if user.hospital else "General",
        "enabled_modules": user.hospital.enabled_modules if user.hospital else ["core"],
        "terminology": user.hospital.terminology if user.hospital else {}
    })
    
    max_age = int(expires_delta.total_seconds()) if expires_delta else settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key="access_token", value=f"Bearer {access_token}", httponly=True,
        secure=settings.ENVIRONMENT == "production", samesite="lax", max_age=max_age, path="/"
    )
    return response

@router.post("/request-password-reset")
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
        PasswordResetOTP.is_used == False
    ).update({PasswordResetOTP.is_used: True}, synchronize_session=False)

    # Generate 8-digit secure OTP
    otp_code = str(random.randint(10000000, 99999999))
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
    EmailService.send_otp_email(user.email, otp_code)

    return {"message": "If this email is registered, you will receive an OTP shortly."}


@router.post("/reset-password")
async def reset_password(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    from ..models import PasswordResetOTP
    from ..utils import get_password_hash
    
    email = data.email.lower()
    
    # Find Valid OTP
    otp_entry = db.query(PasswordResetOTP).filter(
        func.lower(PasswordResetOTP.email) == email,
        PasswordResetOTP.is_used == False,
        PasswordResetOTP.expires_at > datetime.now(IST)
    ).first()

    if not otp_entry:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    # Check attempt count (max 5 attempts to protect against brute force)
    if otp_entry.attempt_count >= 5:
        otp_entry.is_used = True
        db.commit()
        raise HTTPException(status_code=429, detail="Too many failed attempts. Request a new OTP.")
        
    # Verify OTP
    if otp_entry.otp_code != data.otp:
        otp_entry.attempt_count += 1
        db.commit()
        raise HTTPException(status_code=400, detail=f"Invalid OTP. {5 - otp_entry.attempt_count} attempts remaining.")

    # Update User Password
    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(data.new_password)
    
    # Unlock account if it was locked
    user.locked_until = None
    user.failed_login_attempts = 0

    # Mark OTP as used
    otp_entry.is_used = True
    
    db.commit()

    return {"message": "Password updated successfully"}


def get_current_user(request: Request, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    
    # 1. Try to get token from HttpOnly Cookie
    token = request.cookies.get("access_token")
    
    # 2. Fallback to Authorization Header (for Swagger UI / programmatic API access)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header
            
    if not token:
        print("[AUTH_DEBUG] No token found in cookies or Authorization header.")
        raise credentials_exception

    # Strip 'Bearer ' prefix if present
    if token.startswith("Bearer "):
         token = token.replace("Bearer ", "")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        session_id: str = payload.get("session_id")
        if email is None:
            print("[AUTH_DEBUG] Token decoded but email (sub) is missing.")
            raise credentials_exception
    except JWTError as e:
        print(f"[AUTH_DEBUG] JWT decoding failed: {e}")
        raise credentials_exception
    
    
    from sqlalchemy import func
    user = db.query(User).filter(func.lower(User.email) == func.lower(email)).first()
    if user is None:
        print(f"[AUTH_DEBUG] User with email {email} not found in database.")
        raise credentials_exception
    
    # Single Session Verification
    if user.role != UserRole.SUPER_ADMIN:
        if user.current_session_id and session_id != user.current_session_id:
            print(f"[AUTH_DEBUG] Session Expired. Expected: {user.current_session_id}, Got: {session_id}")
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
        user.last_active_at = now
        db.commit()
    
    return user


@router.get("/session-token")
async def get_session_token(current_user: User = Depends(get_current_user)):
    """Returns the JWT for the currently active session. Useful for desktop app handoff."""
    token_data = {
        "sub": current_user.email, 
        "role": current_user.role, 
        "hospital_id": current_user.hospital_id,
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

    access_token = create_access_token(data=token_data, expires_delta=expires_delta)
    return {"access_token": access_token}


def require_permission(required_permission: Permission):
    """
    Dependency generator that checks if the current user has the required permission.
    """
    def permission_checker(current_user: User = Depends(get_current_user)):
        # Give SUPER_ADMIN bypass if they magically don't have it in the mapping
        if current_user.role == UserRole.SUPER_ADMIN:
            return current_user
            
        user_permissions = ROLE_PERMISSIONS.get(current_user.role, [])
        if required_permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Require: {required_permission.value}"
            )
        return current_user
    return permission_checker


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logs the user out by clearing the HttpOnly cookie and session ID."""
    import uuid
    
    # Invalidate session in DB immediately
    current_user.current_session_id = str(uuid.uuid4())
    db.commit()
    
    response = JSONResponse(content={"message": "Successfully logged out"})
    
    # Clear the cookie explicitly
    response.delete_cookie(
        key="access_token",
        path="/",
        secure=settings.ENVIRONMENT == "production",
        httponly=True,
        samesite="lax"
    )
    
    return response

@router.post("/register-demo")
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
    elif "corporate" in specialty_lower or "business" in specialty_lower:
        enabled_modules.append("corporate")
    elif "hospital" in specialty_lower or "hms" in specialty_lower:
        enabled_modules.append("hms")
    elif "clinic" in specialty_lower:
        enabled_modules.append("clinic")
    else:
        # Default for General Medical
        enabled_modules.append("mrd")

    # 3. Create Hospital
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
    except:
        pass
        
    db.commit()

    # 6. Welcome Email
    try:
        EmailService.send_welcome_email(
            email=email_lower,
            name=full_name,
            password="[As defined during registration]"
        )
    except Exception as e:
        print(f"Failed to send welcome email: {e}")

    return {
        "message": "Registration successful",
        "hospital_id": new_hospital.hospital_id,
        "email": new_admin.email
    }

