from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..models import Role, User, UserRoleMap, UserRole
from ..dependencies import get_current_user

router = APIRouter(
    prefix="/roles",
    tags=["roles"]
)

class RoleBase(BaseModel):
    name: str
    permissions: Dict[str, Any]

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = None

class RoleResponse(RoleBase):
    role_id: int
    hospital_id: Optional[int] = None
    is_system_locked: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class UserRoleAssignRequest(BaseModel):
    user_id: int
    role_ids: List[int]

@router.get("/", response_model=List[RoleResponse])
def get_roles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get all roles available for the current user's hospital, plus system global roles (hospital_id=None).
    Superadmins can see all roles.
    """
    if current_user.role == UserRole.SUPER_ADMIN:
        roles = db.query(Role).all()
    else:
        roles = db.query(Role).filter(
            (Role.hospital_id == current_user.hospital_id) | (Role.hospital_id == None)
        ).all()
    return roles

@router.post("/", response_model=RoleResponse)
def create_role(role_in: RoleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Create a custom role for a hospital. Only Hospital Admins or Super Admins can do this.
    """
    if current_user.role not in [UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized to create roles")

    # Super admins can create system-wide roles by setting hospital_id = None manually? 
    # For now, it defaults to the hospital_id of the creator, unless they are super admin and want a global role.
    new_role = Role(
        hospital_id=current_user.hospital_id,
        name=role_in.name,
        permissions=role_in.permissions,
        is_system_locked=False
    )
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role

@router.patch("/{role_id}", response_model=RoleResponse)
def update_role(role_id: int, role_in: RoleUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Update a custom role's permissions or name.
    """
    if current_user.role not in [UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized to update roles")

    role = db.query(Role).filter(Role.role_id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role.is_system_locked and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot modify a system-locked role")

    if role.hospital_id != current_user.hospital_id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to modify this role")

    if role_in.name is not None:
        role.name = role_in.name
    if role_in.permissions is not None:
        role.permissions = role_in.permissions

    db.commit()
    db.refresh(role)
    return role

@router.delete("/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Delete a custom role.
    """
    if current_user.role not in [UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized to delete roles")

    role = db.query(Role).filter(Role.role_id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if role.is_system_locked:
        raise HTTPException(status_code=403, detail="Cannot delete a system-locked role")

    if role.hospital_id != current_user.hospital_id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this role")

    db.delete(role)
    db.commit()
    return {"detail": "Role deleted successfully"}

@router.post("/assign")
def assign_roles(request: UserRoleAssignRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Assign multiple custom roles to a user. Overwrites existing custom roles for that user.
    """
    if current_user.role not in [UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized to assign roles")

    target_user = db.query(User).filter(User.user_id == request.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if target_user.hospital_id != current_user.hospital_id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot assign roles to a user from another hospital")

    # Clear existing roles
    db.query(UserRoleMap).filter(UserRoleMap.user_id == target_user.user_id).delete()
    
    # Assign new roles
    for role_id in request.role_ids:
        role = db.query(Role).filter(Role.role_id == role_id).first()
        if not role:
            continue
        if role.hospital_id is not None and role.hospital_id != target_user.hospital_id and current_user.role != UserRole.SUPER_ADMIN:
            continue
            
        new_mapping = UserRoleMap(user_id=target_user.user_id, role_id=role.role_id)
        db.add(new_mapping)
        
    db.commit()
    return {"detail": "Roles assigned successfully"}
