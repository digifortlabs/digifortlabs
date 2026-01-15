from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.config import settings
from ..database import get_db
from ..models import SystemSetting, User, UserRole
from ..utils import create_access_token, verify_password

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
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Authenticate User
    from sqlalchemy import func
    from datetime import datetime, timedelta

    user = db.query(User).filter(func.lower(User.email) == func.lower(form_data.username)).first()
    if not user:
        # Security: Generic invalid credentials
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 1. Check Lockout Status
    if user.locked_until:
        if user.locked_until > datetime.utcnow():
            remaining_mins = int((user.locked_until - datetime.utcnow()).total_seconds() / 60)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account locked due to multiple failed attempts. Try again in {remaining_mins + 1} minutes."
            )
        else:
            # Lock expired, reset counters
            user.locked_until = None
            user.failed_login_attempts = 0
            db.commit()

    # 2. Verify Password
    if not verify_password(form_data.password, user.hashed_password):
        # Increment failed attempts
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        db.commit()

        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=15)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account locked for 15 minutes due to too many failed login attempts."
            )
        
        remaining_attempts = 5 - user.failed_login_attempts
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Incorrect username or password. {remaining_attempts} attempts remaining.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if Hospital is Suspended (Skip for Super Admin who has no hospital)
    if user.hospital_id:
        if user.hospital and not user.hospital.is_active:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your organization's access has been suspended. Contact Platform Support.",
            )

    # Success: Reset counters
    if user.failed_login_attempts > 0 or user.locked_until:
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()

    # Single Login Management: Update Session ID
    import uuid
    new_session_id = str(uuid.uuid4())
    user.current_session_id = new_session_id
    db.commit()

    # --- NOTIFICATIONS & AUDIT ---
    from ..audit import log_audit
    from ..services.email_service import EmailService
    
    # Get Request Data (Need to modify signature to accept Request)
    # Since we can't easily inject Request into this specific signature without changing it,
    # we will rely on a background task or simple extraction if Request is available.
    # Actually, let's just use "Unknown Device" for now or use Depends(Request) if feasible.
    # For now, simplistic implementation:
    
    client_ip = "Unknown IP" # In real app, inject Request: Request
    device_info = "Unknown Device"
    
    try:
        EmailService.send_login_alert(user.email, client_ip, device_info)
    except Exception as e:
        print(f"[AUTH] Failed to send login alert: {e}")

    log_audit(db, user.user_id, "LOGIN_SUCCESS", "User logged in successfully")
    # -----------------------------

    # Create Token with Role and Session ID
    token_data = {
        "sub": user.email, 
        "role": user.role, 
        "hospital_id": user.hospital_id,
        "session_id": new_session_id,
        "force_password_change": user.force_password_change or False
    }

    # Add Hospital Name if available
    if user.hospital:
        token_data["hospital_name"] = user.hospital.legal_name

    access_token = create_access_token(data=token_data)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/request-password-reset")
async def request_password_reset(request: PasswordResetRequest, db: Session = Depends(get_db)):
    from sqlalchemy import func
    user = db.query(User).filter(func.lower(User.email) == func.lower(request.email)).first()
    if not user:
        # Security: Do not reveal if user exists
        return {"message": "If this email is registered, you will receive an OTP shortly."}
    
    # Generate OTP
    import random
    from datetime import datetime, timedelta
    from ..models import PasswordResetOTP
    from ..services.email_service import EmailService

    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)

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
    from datetime import datetime
    from ..models import PasswordResetOTP
    from ..utils import get_password_hash

    # Find Valid OTP
    otp_entry = db.query(PasswordResetOTP).filter(
        func.lower(PasswordResetOTP.email) == func.lower(data.email),
        PasswordResetOTP.otp_code == data.otp,
        PasswordResetOTP.is_used == False,
        PasswordResetOTP.expires_at > datetime.utcnow()
    ).first()

    if not otp_entry:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # Update User Password
    user = db.query(User).filter(func.lower(User.email) == func.lower(data.email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(data.new_password)
    user.plain_password = data.new_password # Demo transparency
    
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
    
    # Single Session Verification - ENABLED
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
    
    # Update Last Active Timestamp
    from datetime import datetime
    user.last_active_at = datetime.utcnow()
    db.commit()
    
    return user
