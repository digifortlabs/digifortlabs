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
        OPDPatient.hospital_id == target_hospital,
        Patient.is_deleted == False
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
    
    total_patients = db.query(OPDPatient).join(Patient).filter(
        OPDPatient.hospital_id == target_hospital,
        Patient.is_deleted == False
    ).count()
    
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

class VisitCreate(BaseModel):
    patient_id: int
    temperature: Optional[float] = None
    blood_pressure: Optional[str] = None
    pulse_rate: Optional[int] = None
    weight: Optional[float] = None
    chief_complaint: str
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    consultation_fee: Optional[float] = 0.0
    is_paid: Optional[bool] = False

class PrescriptionCreate(BaseModel):
    visit_id: int
    medicine_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None

@router.post('/visits')
def create_visit(
    payload: VisitCreate,
    hospital_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_hospital = hospital_id if hospital_id else current_user.hospital_id
    
    # get opd_patient
    opd_pat = db.query(OPDPatient).filter(OPDPatient.patient_id == payload.patient_id, OPDPatient.hospital_id == target_hospital).first()
    opd_patient_id = opd_pat.opd_patient_id if opd_pat else None

    # Get doctor if doctor
    from ..models import DoctorProfile
    doc = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.user_id).first()
    doctor_id = doc.profile_id if doc else None
    
    new_visit = OPDVisit(
        patient_id=payload.patient_id,
        opd_patient_id=opd_patient_id,
        hospital_id=target_hospital,
        doctor_id=doctor_id,
        temperature=payload.temperature,
        blood_pressure=payload.blood_pressure,
        pulse_rate=payload.pulse_rate,
        weight=payload.weight,
        chief_complaint=payload.chief_complaint,
        diagnosis=payload.diagnosis,
        treatment=payload.treatment,
        consultation_fee=payload.consultation_fee,
        is_paid=payload.is_paid
    )
    db.add(new_visit)
    db.commit()
    db.refresh(new_visit)
    return new_visit

@router.get('/visits/{patient_id}')
def get_visits(
    patient_id: int,
    hospital_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_hospital = hospital_id if hospital_id else current_user.hospital_id
    visits = db.query(OPDVisit).filter(
        OPDVisit.patient_id == patient_id,
        OPDVisit.hospital_id == target_hospital
    ).order_by(OPDVisit.visit_date.desc()).all()
    return visits

@router.post('/prescriptions')
def create_prescription(
    payload: PrescriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from ..models import Prescription
    new_px = Prescription(
        visit_id=payload.visit_id,
        medicine_name=payload.medicine_name,
        dosage=payload.dosage,
        frequency=payload.frequency,
        duration=payload.duration,
        instructions=payload.instructions
    )
    db.add(new_px)
    db.commit()
    db.refresh(new_px)
    return new_px

