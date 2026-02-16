import uuid
import random
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..core.config import settings
from ..database import get_db
from ..models import SystemSetting, User, UserRole, PasswordResetOTP
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
    
    # Device Tracking
    try:
        import json
        if request:
            client_ip = request.client.host
            user_agent = request.headers.get("User-Agent", "Unknown")
            device_signature = f"{client_ip}|{user_agent}"
            
            # Parse existing known devices
            known_devices = []
            if user.known_devices:
                try:
                    known_devices = json.loads(user.known_devices)
                except:
                    known_devices = []
            
            # Check if this device is new
            if device_signature not in known_devices:
                # NEW DEVICE: Send Alert
                print(f"🔐 [AUTH] New Device Detected for {user.email}")
                try:
                    EmailService.send_login_alert(user.email, client_ip, user_agent)
                except Exception as e:
                    print(f"Failed to send login alert: {e}")
                
                # Add to known devices
                known_devices.append(device_signature)
                # Keep only last 10 devices to save space
                if len(known_devices) > 10:
                    known_devices.pop(0)
                    
                user.known_devices = json.dumps(known_devices)
                db.commit()
            else:
                # KNOWN DEVICE: Skip Alert
                print(f"🔐 [AUTH] Known Device Login for {user.email}. Alert Skipped.")
                
    except Exception as e:
        print(f"Device Tracking Error: {e}")
        # Fallback: Send alert just in case
        try:
            if request:
                EmailService.send_login_alert(user.email, request.client.host, request.headers.get("User-Agent"))
        except:
            pass

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
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/request-password-reset")
async def request_password_reset(request: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(func.lower(User.email) == func.lower(request.email)).first()
    if not user:
        return {"message": "If this email is registered, you will receive an OTP shortly."}
    
    # Invalidate previous active OTPs
    db.query(PasswordResetOTP).filter(
        func.lower(PasswordResetOTP.email) == func.lower(request.email),
        PasswordResetOTP.is_used == False
    ).update({PasswordResetOTP.is_used: True}, synchronize_session=False)

    otp_code = str(random.randint(100000, 999999))
    # Expires in 10 mins (IST)
    expires_at = datetime.now(IST) + timedelta(minutes=10)

    # Save to DB
    otp_entry = PasswordResetOTP(
        email=user.email,
        otp_code=otp_code,
        expires_at=expires_at
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
    
    # Find Valid OTP
    otp_entry = db.query(PasswordResetOTP).filter(
        func.lower(PasswordResetOTP.email) == func.lower(data.email),
        PasswordResetOTP.otp_code == data.otp,
        PasswordResetOTP.is_used == False,
        PasswordResetOTP.expires_at > datetime.now(IST)
    ).first()

    if not otp_entry:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # Update User Password
    user = db.query(User).filter(func.lower(User.email) == func.lower(data.email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(data.new_password)
    user.plain_password = data.new_password # Demo transparency
    
    # Unlock account if it was locked
    user.locked_until = None
    user.failed_login_attempts = 0

    # Mark OTP as used
    otp_entry.is_used = True
    
    db.commit()

    return {"message": "Password updated successfully"}


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        session_id: str = payload.get("session_id")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    
    from sqlalchemy import func
    user = db.query(User).filter(func.lower(User.email) == func.lower(email)).first()
    if user is None:
        raise credentials_exception
    
    # Single Session Verification
    if user.role != UserRole.SUPER_ADMIN:
        if user.current_session_id and session_id != user.current_session_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session Expired: You have logged in from another device.",
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
