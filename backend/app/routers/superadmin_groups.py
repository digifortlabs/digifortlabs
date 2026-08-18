from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from ..database import get_db
from ..models import HospitalGroup, Hospital, User, UserRole, Permission
from ..routers.auth import get_current_user

router = APIRouter()

def require_superadmin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Superadmin access required")
    return current_user

class HospitalGroupCreate(BaseModel):
    group_name: str
    location: Optional[str] = None
    admin_email: Optional[str] = None

class HospitalGroupUpdate(BaseModel):
    group_name: Optional[str] = None
    location: Optional[str] = None
    admin_email: Optional[str] = None

class HospitalGroupResponse(BaseModel):
    group_id: int
    group_name: str
    location: Optional[str]
    admin_email: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.post("/", response_model=HospitalGroupResponse)
@router.post("", response_model=HospitalGroupResponse, include_in_schema=False)
def create_hospital_group(group: HospitalGroupCreate, db: Session = Depends(get_db), current_user: User = Depends(require_superadmin)):
    new_group = HospitalGroup(
        group_name=group.group_name,
        location=group.location,
        admin_email=group.admin_email
    )
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    return new_group

@router.get("/", response_model=List[HospitalGroupResponse])
@router.get("", response_model=List[HospitalGroupResponse], include_in_schema=False)
def get_hospital_groups(db: Session = Depends(get_db), current_user: User = Depends(require_superadmin)):
    return db.query(HospitalGroup).filter(HospitalGroup.is_active == True).all()

@router.post("/{hospital_id}/assign-group/{group_id}")
def assign_hospital_to_group(hospital_id: int, group_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_superadmin)):
    hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
        
    group = db.query(HospitalGroup).filter(HospitalGroup.group_id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    hospital.group_id = group_id
    db.commit()
    
    return {"message": f"Hospital {hospital.legal_name} assigned to group {group.group_name}"}

@router.patch("/{group_id}", response_model=HospitalGroupResponse)
def update_hospital_group(group_id: int, updates: HospitalGroupUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_superadmin)):
    group = db.query(HospitalGroup).filter(HospitalGroup.group_id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    update_data = updates.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(group, key, value)
        
    db.commit()
    db.refresh(group)
    return group

@router.delete("/{group_id}")
def delete_hospital_group(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_superadmin)):
    group = db.query(HospitalGroup).filter(HospitalGroup.group_id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    # Soft delete
    group.is_active = False
    db.commit()
    
    return {"message": f"Group {group.group_name} deactivated"}
