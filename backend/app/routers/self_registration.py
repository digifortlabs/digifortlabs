from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, SelfRegistration, Hospital
from ..routers.auth import get_current_user
from datetime import datetime

router = APIRouter(tags=["self-registration"])

class SelfRegistrationCreate(BaseModel):
    hospital_id: int
    full_name: str
    phone: str
    gender: Optional[str] = None
    age: Optional[int] = None

class SelfRegistrationResponse(BaseModel):
    registration_id: int
    hospital_id: int
    full_name: str
    phone: str
    gender: Optional[str]
    age: Optional[int]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.post("", response_model=SelfRegistrationResponse)
def create_self_registration(reg: SelfRegistrationCreate, db: Session = Depends(get_db)):
    # This route is PUBLIC. Patients scan a QR code to access it.
    new_reg = SelfRegistration(
        hospital_id=reg.hospital_id,
        full_name=reg.full_name,
        phone=reg.phone,
        gender=reg.gender,
        age=reg.age,
        status="DRAFT"
    )
    db.add(new_reg)
    db.commit()
    db.refresh(new_reg)
    return new_reg

@router.get("/pending", response_model=List[SelfRegistrationResponse])
def get_pending_registrations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    hospital_id = current_user.hospital_id
    if not hospital_id:
        return []
        
    return db.query(SelfRegistration).filter(
        SelfRegistration.hospital_id == hospital_id,
        SelfRegistration.status == "DRAFT"
    ).order_by(SelfRegistration.created_at.asc()).all()

@router.post("/{registration_id}/convert")
def convert_registration(registration_id: int, patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    hospital_id = current_user.hospital_id
    reg = db.query(SelfRegistration).filter(SelfRegistration.registration_id == registration_id, SelfRegistration.hospital_id == hospital_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
        
    reg.status = "CONVERTED"
    reg.converted_patient_id = patient_id
    db.commit()
    return {"message": "Registration converted to patient"}
