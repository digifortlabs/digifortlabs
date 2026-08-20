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
        
    if group_id <= 0:
        hospital.group_id = None
        db.commit()
        return {"message": f"Hospital {hospital.legal_name} unlinked from group"}
        
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

class GroupBulkConfigUpdate(BaseModel):
    subscription_tier: Optional[str] = None
    price_per_file: Optional[float] = None
    included_pages: Optional[int] = None
    price_per_extra_page: Optional[float] = None
    enabled_modules: Optional[List[str]] = None

@router.delete("/{group_id}")
def delete_hospital_group(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_superadmin)):
    group = db.query(HospitalGroup).filter(HospitalGroup.group_id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    # Unlink member hospitals so they aren't orphaned
    db.query(Hospital).filter(Hospital.group_id == group_id).update({"group_id": None})
    
    # Soft delete group
    group.is_active = False
    db.commit()
    
    return {"message": f"Group {group.group_name} deactivated and member hospitals unlinked."}

@router.patch("/{group_id}/bulk-config")
def bulk_update_group_hospitals(group_id: int, config: GroupBulkConfigUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_superadmin)):
    group = db.query(HospitalGroup).filter(HospitalGroup.group_id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    hospitals = db.query(Hospital).filter(Hospital.group_id == group_id, Hospital.is_deleted == False).all()
    
    updates = config.dict(exclude_unset=True)
    count = 0
    for h in hospitals:
        for key, value in updates.items():
            setattr(h, key, value)
        count += 1
        
    db.commit()
    return {"message": f"Updated SaaS & Billing configurations across {count} branch hospital(s) in {group.group_name}."}
