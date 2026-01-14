from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AuditLog, Hospital, User, UserRole
from ..routers.auth import get_current_user

# ... (omitted lines)
from ..utils import get_password_hash

router = APIRouter()

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target_user = db.query(User).filter(User.user_id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Permission Check
    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.hospital_id != target_user.hospital_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if current_user.role != UserRole.HOSPITAL_ADMIN:
             raise HTTPException(status_code=403, detail="Not authorized")

    # Decouple from Audit Logs (Set user_id to NULL to keep history)
    db.query(AuditLog).filter(AuditLog.user_id == user_id).update({AuditLog.user_id: None})
    
    db.delete(target_user)
    db.commit()
    return {"message": "User deleted"}

PLAN_LIMITS = {
    "Standard": 2,
    "Premium": 5,
    "Enterprise": 10
}

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: UserRole

class UserResponse(BaseModel):
    user_id: int
    email: str
    role: UserRole
    plain_password: Optional[str] = None
    
    class Config:
        from_attributes = True

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Return the currently logged-in user's profile."""
    # Hide password for security
    current_user.plain_password = None
    return current_user

@router.get("/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Security Check
    if current_user.role not in [UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to view users")

    try:
        if current_user.role == UserRole.SUPER_ADMIN:
            return db.query(User).all()

        # If not Super Admin, ensure plain_password is hidden
        users = db.query(User).filter(User.hospital_id == current_user.hospital_id).all()
        for u in users:
            u.plain_password = None
        return users
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

@router.post("/change-password")
def change_password(data: PasswordChange, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from ..utils import verify_password
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    import uuid
    current_user.hashed_password = get_password_hash(data.new_password)
    current_user.plain_password = None # Clear plain password for security
    current_user.force_password_change = False
    current_user.current_session_id = str(uuid.uuid4()) # Invalidate current session
    db.commit()
    return {"message": "Password updated successfully"}

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Security Check
    if current_user.role not in [UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to create users")

    # 1. Check Hospital Seat Limit (Only for Hospital-level users)
    target_hospital_id = current_user.hospital_id
    
    # Super Admin can create Website Staff (hospital_id = None) or Hospital Users (if they provide ID)
    # For now, let's assume create_user is for internal team management.
    if current_user.role == UserRole.SUPER_ADMIN:
        if user.role == UserRole.PLATFORM_STAFF:
            target_hospital_id = None
        else:
            # If Super Admin creates a hospital-role user, we need a hospital_id.
            # But usually, they use the /hospitals/{id}/admin route.
            # Let's restrict this generic endpoint to same-context users.
            if not target_hospital_id:
                 raise HTTPException(status_code=400, detail="Cannot create hospital user without hospital context")

    if target_hospital_id:
        hospital = db.query(Hospital).filter(Hospital.hospital_id == target_hospital_id).first()
        if not hospital:
            raise HTTPException(status_code=404, detail="Hospital not found")
        
        current_count = db.query(User).filter(User.hospital_id == target_hospital_id).count()
        limit = PLAN_LIMITS.get(hospital.subscription_tier, 2)
        
        if current_count >= limit:
            raise HTTPException(
                status_code=403, 
                detail=f"Subscription Seat Limit Reached. Your current plan ({hospital.subscription_tier}) allows only {limit} users. Please contact sales@dizivault.com to upgrade."
            )

    # 2. Check if email exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 3. Create User
    new_user = User(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        plain_password=user.password, # For visibility as requested
        role=user.role,
        hospital_id=target_hospital_id
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


class UserUpdate(BaseModel):
    role: Optional[UserRole] = None
    password: Optional[str] = None

@router.patch("/{user_id}")
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target_user = db.query(User).filter(User.user_id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Permission Check
    if current_user.role != UserRole.SUPER_ADMIN:
         if current_user.hospital_id != target_user.hospital_id or current_user.role != UserRole.HOSPITAL_ADMIN:
              raise HTTPException(status_code=403, detail="Not authorized")

    if data.role:
        target_user.role = data.role
    if data.password:
        import uuid
        target_user.hashed_password = get_password_hash(data.password)
        target_user.plain_password = data.password
        target_user.current_session_id = str(uuid.uuid4()) # Invalidate existing sessions
        
    db.commit()
    return {"message": "User updated"}
