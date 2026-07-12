from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..crud import crud_all
from ..models import User, IPDAdmission, Patient, NursingVitalsLog, Bed, Ward
from .auth import get_current_user

router = APIRouter(
    prefix="/nursing",
    tags=["nursing"]
)

class VitalsLogCreate(BaseModel):
    admission_id: int
    temperature: Optional[float] = None
    blood_pressure: Optional[str] = None
    pulse_rate: Optional[int] = None
    respiratory_rate: Optional[int] = None
    spo2: Optional[int] = None
    blood_sugar: Optional[float] = None
    notes: Optional[str] = None

@router.get("/admitted-patients")
def get_admitted_patients(
    hospital_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_hospital = hospital_id if hospital_id else current_user.hospital_id
    
    admissions = db.query(IPDAdmission, Patient, Bed, Ward).join(Patient, IPDAdmission.patient_id == Patient.record_id)\
        .join(Bed, IPDAdmission.bed_id == Bed.bed_id)\
        .join(Ward, IPDAdmission.ward_id == Ward.ward_id)\
        .filter(
            IPDAdmission.hospital_id == target_hospital,
            IPDAdmission.status == "admitted"
        ).all()
        
    result = []
    for adm, pat, bed, ward in admissions:
        result.append({
            "admission_id": adm.admission_id,
            "patient_id": pat.record_id,
            "patient_name": pat.full_name,
            "mrd_number": pat.patient_u_id,
            "ward_name": ward.ward_name,
            "bed_number": bed.bed_number,
            "diagnosis": adm.diagnosis,
            "admission_date": adm.admission_date,
            "vitals_log_count": len(adm.vitals_log) if adm.vitals_log else 0
        })
    return result

@router.post("/vitals")
def log_vitals(
    payload: VitalsLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    admission = crud_all.i_p_d_admission.get_first(db, IPDAdmission.admission_id == payload.admission_id)
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    new_log = NursingVitalsLog(
        admission_id=admission.admission_id,
        patient_id=admission.patient_id,
        hospital_id=admission.hospital_id,
        nurse_id=current_user.user_id,
        temperature=payload.temperature,
        blood_pressure=payload.blood_pressure,
        pulse_rate=payload.pulse_rate,
        respiratory_rate=payload.respiratory_rate,
        spo2=payload.spo2,
        blood_sugar=payload.blood_sugar,
        notes=payload.notes
    )
    
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@router.get("/vitals/{admission_id}")
def get_vitals(
    admission_id: int,
    db: Session = Depends(get_db)
):
    logs = db.query(NursingVitalsLog, User.full_name.label("nurse_name"))\
        .join(User, NursingVitalsLog.nurse_id == User.user_id)\
        .filter(NursingVitalsLog.admission_id == admission_id)\
        .order_by(NursingVitalsLog.recorded_at.desc())\
        .all()
        
    result = []
    for log, nurse_name in logs:
        result.append({
            "log_id": log.log_id,
            "recorded_at": log.recorded_at,
            "temperature": log.temperature,
            "blood_pressure": log.blood_pressure,
            "pulse_rate": log.pulse_rate,
            "respiratory_rate": log.respiratory_rate,
            "spo2": log.spo2,
            "blood_sugar": log.blood_sugar,
            "notes": log.notes,
            "nurse_name": nurse_name
        })
    return result
