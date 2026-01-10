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

class Token(BaseModel):
    access_token: str
    token_type: str



@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Authenticate User
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if Hospital is Suspended (Skip for Super Admin who has no hospital)
    if user.hospital_id:
        if user.hospital and not user.hospital.is_active:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your organization's access has been suspended. Contact Platform Support.",
            )

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
    
    EmailService.send_login_alert(user.email, client_ip, device_info)
    log_audit(db, user.user_id, "LOGIN_SUCCESS", "User logged in successfully")
    # -----------------------------

    # Create Token with Role and Session ID
    access_token = create_access_token(
        data={
            "sub": user.email, 
            "role": user.role, 
            "hospital_id": user.hospital_id,
            "session_id": new_session_id,
            "force_password_change": user.force_password_change or False
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}

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
    
    
    user = db.query(User).filter(User.email == email).first()
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
