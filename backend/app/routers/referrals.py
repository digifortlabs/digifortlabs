from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Referral, Patient, Hospital
from ..routers.auth import get_current_user
from datetime import datetime

router = APIRouter(tags=["referrals"])

class ReferralCreate(BaseModel):
    patient_id: int
    target_hospital_id: int
    reason: Optional[str] = None

class ReferralResponse(BaseModel):
    referral_id: int
    patient_id: int
    source_hospital_id: int
    target_hospital_id: int
    status: str
    reason: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.post("", response_model=ReferralResponse)
def create_referral(referral: ReferralCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    source_hospital_id = current_user.hospital_id
    if not source_hospital_id:
        raise HTTPException(status_code=400, detail="User context missing hospital ID")
        
    patient = db.query(Patient).filter(Patient.record_id == referral.patient_id, Patient.hospital_id == source_hospital_id).first()
    if not patient:
         raise HTTPException(status_code=404, detail="Patient not found in your hospital")
         
    # Enforce Group constraints
    target_hospital = db.query(Hospital).filter(Hospital.hospital_id == referral.target_hospital_id).first()
    if not target_hospital or target_hospital.group_id != current_user.hospital.group_id:
         raise HTTPException(status_code=403, detail="Referrals are only permitted to hospitals within the same Group")
         
    new_referral = Referral(
        patient_id=referral.patient_id,
        source_hospital_id=source_hospital_id,
        target_hospital_id=referral.target_hospital_id,
        referred_by_user_id=current_user.user_id,
        reason=referral.reason,
        status="PENDING"
    )
    db.add(new_referral)
    db.commit()
    db.refresh(new_referral)
    return new_referral

@router.get("/inbox", response_model=List[ReferralResponse])
def get_incoming_referrals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    hospital_id = current_user.hospital_id
    if not hospital_id:
        return []
        
    return db.query(Referral).filter(Referral.target_hospital_id == hospital_id).order_by(Referral.created_at.desc()).all()

@router.post("/{referral_id}/accept")
def accept_referral(referral_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    hospital_id = current_user.hospital_id
    referral = db.query(Referral).filter(Referral.referral_id == referral_id, Referral.target_hospital_id == hospital_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
        
    if referral.status != "PENDING":
        raise HTTPException(status_code=400, detail="Referral is already processed")
        
    referral.status = "ACCEPTED"
    
    source_patient = db.query(Patient).filter(Patient.record_id == referral.patient_id).first()
    if source_patient:
        # Check if patient already exists in target hospital by UHID
        existing = db.query(Patient).filter(Patient.uhid == source_patient.uhid, Patient.hospital_id == hospital_id).first()
        if not existing:
            # Clone patient profile for the new branch
            import copy
            new_patient_data = {
                c.name: getattr(source_patient, c.name) 
                for c in source_patient.__table__.columns 
                if c.name not in ['record_id', 'hospital_id', 'patient_u_id', 'created_at', 'updated_at']
            }
            
            # Generate local patient_u_id
            import secrets
            local_id = f"PAT-{secrets.token_hex(3).upper()}"
            
            new_patient = Patient(
                **new_patient_data,
                hospital_id=hospital_id,
                patient_u_id=local_id,
            )
            db.add(new_patient)
            
    db.commit()
    return {"message": "Referral accepted and patient imported into local registry"}
