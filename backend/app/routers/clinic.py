from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel

from ..database import get_db
from ..models import User, Patient, OPDPatient, OPDVisit, Prescription
from .auth import get_current_user

router = APIRouter(prefix="/clinic", tags=["Clinic OPD"])

# --- Pydantic Schemas ---

class OPDPatientCreate(BaseModel):
    patient_id: int
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[dict] = {}

class OPDVisitCreate(BaseModel):
    patient_id: int
    doctor_id: Optional[int] = None
    temperature: Optional[float] = None
    blood_pressure: Optional[str] = None
    pulse_rate: Optional[int] = None
    weight: Optional[float] = None
    chief_complaint: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    consultation_fee: Optional[float] = 0.0
    is_paid: bool = False

class PrescriptionCreate(BaseModel):
    visit_id: int
    medicine_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None

# --- Endpoints ---

@router.post("/patients")
def register_opd_patient(
    patient: OPDPatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register patient to OPD"""
    existing = db.query(OPDPatient).filter(
        OPDPatient.patient_id == patient.patient_id,
        OPDPatient.hospital_id == current_user.hospital_id
    ).first()
    
    if existing:
        return existing
    
    opd_patient = OPDPatient(
        patient_id=patient.patient_id,
        hospital_id=current_user.hospital_id,
        blood_group=patient.blood_group,
        allergies=patient.allergies,
        chronic_conditions=patient.chronic_conditions
    )
    db.add(opd_patient)
    db.commit()
    db.refresh(opd_patient)
    return opd_patient

@router.get("/patients")
def get_opd_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all OPD patients"""
    patients = db.query(OPDPatient).filter(
        OPDPatient.hospital_id == current_user.hospital_id
    ).all()
    
    result = []
    for op in patients:
        base_patient = db.query(Patient).filter(Patient.record_id == op.patient_id).first()
        if base_patient:
            result.append({
                "opd_patient_id": op.opd_patient_id,
                "patient_id": op.patient_id,
                "full_name": base_patient.full_name,
                "phone": base_patient.phone,
                "mrd_number": base_patient.mrd_number,
                "blood_group": op.blood_group,
                "allergies": op.allergies
            })
    return result

@router.post("/visits")
def create_visit(
    visit: OPDVisitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record OPD visit"""
    opd_visit = OPDVisit(
        patient_id=visit.patient_id,
        hospital_id=current_user.hospital_id,
        doctor_id=visit.doctor_id or current_user.user_id,
        temperature=visit.temperature,
        blood_pressure=visit.blood_pressure,
        pulse_rate=visit.pulse_rate,
        weight=visit.weight,
        chief_complaint=visit.chief_complaint,
        diagnosis=visit.diagnosis,
        treatment=visit.treatment,
        consultation_fee=visit.consultation_fee,
        is_paid=visit.is_paid
    )
    db.add(opd_visit)
    db.commit()
    db.refresh(opd_visit)
    return opd_visit

@router.get("/visits/{patient_id}")
def get_patient_visits(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all visits for a patient"""
    visits = db.query(OPDVisit).filter(
        OPDVisit.patient_id == patient_id,
        OPDVisit.hospital_id == current_user.hospital_id
    ).order_by(OPDVisit.visit_date.desc()).all()
    return visits

@router.post("/prescriptions")
def add_prescription(
    prescription: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add prescription to visit"""
    rx = Prescription(
        visit_id=prescription.visit_id,
        medicine_name=prescription.medicine_name,
        dosage=prescription.dosage,
        frequency=prescription.frequency,
        duration=prescription.duration,
        instructions=prescription.instructions
    )
    db.add(rx)
    db.commit()
    db.refresh(rx)
    return rx

@router.get("/stats")
def get_clinic_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get clinic statistics"""
    total_patients = db.query(OPDPatient).filter(
        OPDPatient.hospital_id == current_user.hospital_id
    ).count()
    
    total_visits = db.query(OPDVisit).filter(
        OPDVisit.hospital_id == current_user.hospital_id
    ).count()
    
    today_visits = db.query(OPDVisit).filter(
        OPDVisit.hospital_id == current_user.hospital_id,
        func.date(OPDVisit.visit_date) == date.today()
    ).count()
    
    return {
        "total_patients": total_patients,
        "total_visits": total_visits,
        "today_visits": today_visits
    }
