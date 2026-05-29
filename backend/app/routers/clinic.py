from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from ..database import get_db
from ..models import OPDPatient, Patient, OPDVisit, User
from .auth import get_current_user

router = APIRouter(
    prefix="/clinic",
    tags=["clinic"]
)

class RegisterOPDPatient(BaseModel):
    patient_id: int
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[dict] = None

@router.get("/patients")
def get_opd_patients(
    hospital_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_hospital = hospital_id if hospital_id else current_user.hospital_id
    
    opd_patients = db.query(OPDPatient, Patient).join(Patient).filter(
        OPDPatient.hospital_id == target_hospital
    ).all()
    
    result = []
    for opd, pat in opd_patients:
        result.append({
            "opd_patient_id": opd.opd_patient_id,
            "patient_id": opd.patient_id,
            "full_name": pat.full_name,
            "mrd_number": pat.patient_u_id,
            "phone": pat.contact_number,
            "blood_group": opd.blood_group,
            "allergies": opd.allergies,
            "chronic_conditions": opd.chronic_conditions
        })
    return result

@router.post("/patients")
def register_opd_patient(
    payload: RegisterOPDPatient,
    hospital_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_hospital = hospital_id if hospital_id else current_user.hospital_id
    
    # Check if exists
    existing = db.query(OPDPatient).filter(
        OPDPatient.patient_id == payload.patient_id,
        OPDPatient.hospital_id == target_hospital
    ).first()
    
    if existing:
        existing.blood_group = payload.blood_group
        existing.allergies = payload.allergies
        existing.chronic_conditions = payload.chronic_conditions
        db.commit()
        db.refresh(existing)
        return existing
        
    new_opd = OPDPatient(
        patient_id=payload.patient_id,
        hospital_id=target_hospital,
        blood_group=payload.blood_group,
        allergies=payload.allergies,
        chronic_conditions=payload.chronic_conditions or {}
    )
    db.add(new_opd)
    
    # Also update patient category to OPD
    core_patient = db.query(Patient).filter(Patient.record_id == payload.patient_id).first()
    if core_patient:
        core_patient.patient_category = "OPD"
        
    db.commit()
    db.refresh(new_opd)
    return new_opd

@router.get("/stats")
def get_clinic_stats(
    hospital_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_hospital = hospital_id if hospital_id else current_user.hospital_id
    
    total_patients = db.query(OPDPatient).filter(OPDPatient.hospital_id == target_hospital).count()
    
    # Today visits
    today = datetime.now().date()
    from sqlalchemy import func
    today_visits = db.query(OPDVisit).filter(
        OPDVisit.hospital_id == target_hospital,
        func.date(OPDVisit.visit_date) == today
    ).count()
    
    total_visits = db.query(OPDVisit).filter(OPDVisit.hospital_id == target_hospital).count()
    
    return {
        "total_patients": total_patients,
        "today_visits": today_visits,
        "total_visits": total_visits
    }
