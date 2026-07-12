import logging
logger = logging.getLogger(__name__)
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from ..database import get_db
from ..crud import crud_all
from ..models import AuditLog, Hospital, User, UserRole, Permission
from ..routers.auth import get_current_user, require_permission

# ... (omitted lines)
from ..utils import get_password_hash

router = APIRouter(redirect_slashes=False)

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITAL_USERS))):
    target_user = crud_all.user.get_first(db, User.user_id == user_id, User.is_deleted == False)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Permission Check
    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.hospital_id != target_user.hospital_id:
            raise HTTPException(status_code=403, detail="Not authorized")

    # Soft Delete
    target_user.is_deleted = True
    target_user.is_active = False
    
    try:
        from ..audit import log_audit
        log_audit(db, current_user.user_id, "USER_DELETED", f"Soft-deleted user: {target_user.email}", hospital_id=current_user.hospital_id)
    except Exception as e:
        logger.info(f"Audit Log Error: {e}")

    db.commit()

    return {"message": "User deleted (soft delete)"}

PLAN_LIMITS = {
    "Standard": 2,
    "Premium": 5,
    "Enterprise": 10
}

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str # Fix: Added full_name
    password: str
    role: UserRole
    mfa_enabled: Optional[bool] = True

class HospitalMini(BaseModel):
    hospital_id: int
    legal_name: str
    specialty: str
    terminology: dict
    enabled_modules: List[str] = ["core"]
    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    user_id: int
    email: str
    full_name: Optional[str] = None
    role: UserRole
    hospital_id: Optional[int] = None
    hospital: Optional[HospitalMini] = None
    mfa_enabled: bool = True
    allowed_hospitals: Optional[list] = None
    
    class Config:
        from_attributes = True

@router.get("/me", response_model=UserResponse)
@router.get("/me/", response_model=UserResponse, include_in_schema=False)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Return the currently logged-in user's profile."""
    # Hide password for security
    current_user.plain_password = None
    
    # Calculate allowed hospitals for doctor
    allowed_hospitals = []
    is_global = current_user.subdomain and current_user.role.startswith("doctor") and (not current_user.hospital_id or getattr(current_user, 'is_global_mocked', False))
    if is_global:
        for p in current_user.doctor_profile:
            if p.hospital_id:
                allowed_hospitals.append({
                    "hospital_id": p.hospital_id,
                    "legal_name": p.hospital.legal_name if p.hospital else "Unknown Hospital",
                    "hospital_slug": p.hospital.hospital_slug if p.hospital else ""
                })
    
    # We must return a dict to satisfy Pydantic since we are injecting allowed_hospitals which isn't on the User model
    response_data = {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "hospital_id": current_user.hospital_id,
        "hospital": current_user.hospital,
        "mfa_enabled": True,
        "allowed_hospitals": allowed_hospitals
    }
    return response_data

@router.get("/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Security Check
    if current_user.role not in [UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.HOSPITAL_STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized to view users")

    try:
        if current_user.role == UserRole.SUPER_ADMIN:
            return db.query(User).filter(User.is_deleted == False).all()

        elif current_user.role == UserRole.HOSPITAL_ADMIN:
            return crud_all.user.get_multi(db, User.hospital_id == current_user.hospital_id, User.is_deleted == False)
            
        else: # HOSPITAL_STAFF
            # Hospital staff can only see themselves (Issue 46)
            return crud_all.user.get_multi(db, User.user_id == current_user.user_id, User.is_deleted == False)
            
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
def create_user(user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITAL_USERS))):

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
        hospital = crud_all.hospital.get_first(db, Hospital.hospital_id == target_hospital_id)
        if not hospital:
            raise HTTPException(status_code=404, detail="Hospital not found")
        
        current_count = crud_all.user.count(db, User.hospital_id == target_hospital_id, User.is_deleted == False)
        
        # Use Hospital-specific limit if set, otherwise fallback to Plan limit (which is now just a label)
        # Default max_users in DB is 2.
        limit = hospital.max_users if hospital.max_users is not None else PLAN_LIMITS.get(hospital.subscription_tier, 2)
        
        if current_count >= limit:
            # SOFT LIMIT: Allow creation but log for billing
            try:
                from ..audit import log_audit
                overage_count = current_count - limit + 1
                log_audit(
                    db, 
                    current_user.user_id, 
                    "BILLING_OVERAGE", 
                    f"User limit {limit} exceeded for {hospital.legal_name}. Overage: {overage_count} user(s).",
                    hospital_id=target_hospital_id
                )
            except:
                pass

    # 2. Check if email exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 3. Create User
    new_user = User(
        email=user.email,
        full_name=user.full_name, # Fix: Populate full_name
        hashed_password=get_password_hash(user.password),
        role=user.role,
        hospital_id=target_hospital_id,
        mfa_enabled=user.mfa_enabled if user.mfa_enabled is not None else True
    )
    
    try:
        from ..audit import log_audit
        log_audit(db, current_user.user_id, "USER_CREATED", f"Created user: {new_user.email} ({new_user.role})", hospital_id=current_user.hospital_id)
    except Exception as e:
        logger.info(f"Audit Log Error: {e}")
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


class UserUpdate(BaseModel):
    role: Optional[UserRole] = None
    password: Optional[str] = None
    mfa_enabled: Optional[bool] = None

@router.patch("/{user_id}")
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITAL_USERS))):
    target_user = crud_all.user.get_first(db, User.user_id == user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Permission & Isolation Check
    is_self = current_user.user_id == target_user.user_id
    if not is_self:
        if current_user.role != UserRole.SUPER_ADMIN:
            if current_user.hospital_id != target_user.hospital_id:
                raise HTTPException(status_code=403, detail="Not authorized to update this user")

    # Role updates are highly restricted
    if data.role and data.role != target_user.role:
        if is_self:
            raise HTTPException(status_code=403, detail="Cannot change your own role")
            
        if current_user.role != UserRole.SUPER_ADMIN:
            # Hospital Admins cannot promote anyone to SUPER_ADMIN or PLATFORM_STAFF
            if data.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
                raise HTTPException(status_code=403, detail="Not authorized to assign platform-level roles")
                
        old_role = target_user.role
        target_user.role = data.role
        
        # Log the role change specifically
        try:
            from ..audit import log_audit
            log_audit(db, current_user.user_id, "ROLE_CHANGED", f"Role changed for {target_user.email} from {old_role} to {data.role}", hospital_id=current_user.hospital_id)
        except Exception as e:
            logger.info(f"Audit Log Error: {e}")
            
        # Invalidate target user's session so they must re-login with new permissions
        import uuid
        target_user.current_session_id = str(uuid.uuid4())

    if data.password:
        import uuid
        target_user.hashed_password = get_password_hash(data.password)
        target_user.plain_password = None # Clear plain password for security
        if is_self:
            current_user.force_password_change = False
        target_user.current_session_id = str(uuid.uuid4()) # Invalidate existing sessions

    if data.mfa_enabled is not None:
        target_user.mfa_enabled = data.mfa_enabled
        
    try:
        from ..audit import log_audit
        log_audit(db, current_user.user_id, "USER_UPDATED", f"Updated user: {target_user.email}", hospital_id=current_user.hospital_id)
    except Exception as e:
        logger.info(f"Audit Log Error: {e}")

    db.commit()

    return {"message": "User updated"}

class LoginActivityResponse(BaseModel):
    user_id: int
    email: str
    role: UserRole
    hospital_name: Optional[str] = None
    last_login_at: Optional[str] = None
    previous_login_at: Optional[str] = None
    last_active_at: Optional[str] = None
    
    class Config:
        from_attributes = True

@router.get("/login-activity", response_model=List[LoginActivityResponse])
def get_login_activity(
    limit: int = 50,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Get recent login activity for admins and staff."""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    from sqlalchemy import or_
    
    # Build query based on role
    if current_user.role == UserRole.SUPER_ADMIN:
        # Super Admin sees all active users
        users = db.query(User).filter(
            User.last_login_at.isnot(None),
            User.is_deleted == False
        ).order_by(User.last_login_at.desc()).limit(limit)
    else:
        # Hospital Admin sees only their hospital users
        users = crud_all.user.get_multi(db, 
            User.hospital_id == current_user.hospital_id,
            User.last_login_at.isnot(None),
            User.is_deleted == False
        ).order_by(User.last_login_at.desc()).limit(limit)
    
    # Format response
    result = []
    for user in users:
        result.append({
            "user_id": user.user_id,
            "email": user.email,
            "role": user.role,
            "hospital_name": user.hospital.legal_name if user.hospital else "Platform Staff",
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
            "previous_login_at": user.previous_login_at.isoformat() if user.previous_login_at else None,
            "last_active_at": user.last_active_at.isoformat() if user.last_active_at else None
        })
    
    return result
