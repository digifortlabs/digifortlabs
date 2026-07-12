from fastapi import APIRouter, Depends, HTTPException, status
from ..crud import crud_all
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Dict, Any
from datetime import datetime

from app.database import get_db
from app.models import (
    User, Hospital, Patient, 
    ENTPatient, AudiometryTest, ENTExamination, ENTSurgery
)
# No schemas imported here, using inline Pydantic models below
from app.routers.auth import get_current_user
from pydantic import BaseModel, ConfigDict
from typing import Optional, Union

router = APIRouter(
    prefix="/ent",
    tags=["ENT"]
)

# --- Pydantic Schemas for ENT ---

class ENTPatientCreate(BaseModel):
    patient_id: int
    chief_complaint: Optional[str] = None
    ent_history: Optional[dict] = {}
    allergies: Optional[list] = []
    family_ent_history: Optional[dict] = {}

class AudiometryTestCreate(BaseModel):
    patient_id: int
    test_type: str
    results: Optional[dict] = {}
    hearing_loss_degree: Optional[str] = None
    recommendations: Optional[str] = None

class ENTExaminationCreate(BaseModel):
    patient_id: int
    examination_data: Optional[dict] = {"otoscopy": {}, "rhinoscopy": {}, "laryngoscopy": {}}
    findings: Optional[str] = None

class ENTSurgeryCreate(BaseModel):
    patient_id: int
    surgeon_id: Optional[int] = None
    procedure_code: Optional[str] = None
    surgery_type: str
    scheduled_date: Optional[str] = None # ISO format
    duration_minutes: Optional[int] = None
    anesthesia_type: Optional[str] = None
    pre_op_notes: Optional[str] = None
    post_op_notes: Optional[str] = None
    status: Optional[str] = "scheduled"

# --- Endpoints ---

@router.get("/patients")
def get_ent_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all ENT patients for the hospital"""
    patients = db.query(ENTPatient).filter(ENTPatient.hospital_id == current_user.hospital_id).all()
    
    result = []
    for ep in patients:
        base_patient = crud_all.patient.get_first(db, Patient.record_id == ep.patient_id)
        if base_patient:
            patient_dict = {
                "ent_patient_id": ep.ent_patient_id,
                "patient_id": ep.patient_id,
                "chief_complaint": ep.chief_complaint,
                "ent_history": ep.ent_history,
                "allergies": ep.allergies,
                "family_ent_history": ep.family_ent_history,
                "created_at": ep.created_at,
                "full_name": base_patient.full_name,
                "phone": base_patient.phone,
                "mrd_number": base_patient.patient_u_id
            }
            result.append(patient_dict)
    
    return result

@router.post("/patients")
def create_ent_patient(
    patient: ENTPatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register a patient to the ENT department"""
    # Check if exists
    existing = crud_all.e_n_t_patient.get_first(db, 
        ENTPatient.patient_id == patient.patient_id,
        ENTPatient.hospital_id == current_user.hospital_id
    )
    
    if existing:
        return existing
        
    db_patient = ENTPatient(
        patient_id=patient.patient_id,
        hospital_id=current_user.hospital_id,
        chief_complaint=patient.chief_complaint,
        ent_history=patient.ent_history,
        allergies=patient.allergies,
        family_ent_history=patient.family_ent_history
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.get("/patients/{patient_id}")
def get_ent_patient_detail(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ent_patient = crud_all.e_n_t_patient.get_first(db, 
        ENTPatient.patient_id == patient_id,
        ENTPatient.hospital_id == current_user.hospital_id
    )
    
    if not ent_patient:
        raise HTTPException(status_code=404, detail="ENT record not found for this patient")
        
    audiometry = crud_all.audiometry_test.get_first(db, AudiometryTest.patient_id == patient_id)
    exams = crud_all.e_n_t_examination.get_multi(db, ENTExamination.patient_id == patient_id)
    surgeries = crud_all.e_n_t_surgery.get_multi(db, ENTSurgery.patient_id == patient_id)
    
    return {
        "ent_profile": ent_patient,
        "audiometry_tests": audiometry,
        "examinations": exams,
        "surgeries": surgeries
    }

@router.post("/patients/{patient_id}/audiometry")
def add_audiometry_test(
    patient_id: int,
    test: AudiometryTestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify Patient ownership
    patient = crud_all.patient.get_first(db, 
        Patient.record_id == patient_id,
        Patient.hospital_id == current_user.hospital_id
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
        
    new_test = AudiometryTest(
        patient_id=patient_id,
        hospital_id=current_user.hospital_id,
        audiologist_id=current_user.user_id,
        test_type=test.test_type,
        results=test.results,
        hearing_loss_degree=test.hearing_loss_degree,
        recommendations=test.recommendations
    )
    db.add(new_test)
    db.commit()
    db.refresh(new_test)
    return new_test

@router.post("/examinations")
def add_ent_examination(
    exam: ENTExaminationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify Patient ownership
    patient = crud_all.patient.get_first(db, 
        Patient.record_id == exam.patient_id,
        Patient.hospital_id == current_user.hospital_id
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
        
    new_exam = ENTExamination(
        patient_id=exam.patient_id,
        hospital_id=current_user.hospital_id,
        examiner_id=current_user.user_id,
        examination_data=exam.examination_data,
        findings=exam.findings
    )
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)
    return new_exam

@router.post("/surgeries/schedule")
def schedule_surgery(
    surgery: ENTSurgeryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    import dateutil.parser  # type: ignore
    
    # Verify Patient ownership
    patient = crud_all.patient.get_first(db, 
        Patient.record_id == surgery.patient_id,
        Patient.hospital_id == current_user.hospital_id
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
        
    parsed_date = None
    if surgery.scheduled_date:
        parsed_date = dateutil.parser.isoparse(surgery.scheduled_date)
        
    new_surgery = ENTSurgery(
        patient_id=surgery.patient_id,
        hospital_id=current_user.hospital_id,
        surgeon_id=surgery.surgeon_id or current_user.user_id,
        procedure_code=surgery.procedure_code,
        surgery_type=surgery.surgery_type,
        scheduled_date=parsed_date,
        duration_minutes=surgery.duration_minutes,
        anesthesia_type=surgery.anesthesia_type,
        pre_op_notes=surgery.pre_op_notes,
        post_op_notes=surgery.post_op_notes,
        status=surgery.status
    )
    db.add(new_surgery)
    db.commit()
    db.refresh(new_surgery)
    return new_surgery

@router.get("/surgeries")
def get_surgeries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    surgeries = db.query(ENTSurgery).filter(ENTSurgery.hospital_id == current_user.hospital_id).all().order_by(ENTSurgery.scheduled_date.asc())
    # attach patient names
    result = []
    for s in surgeries:
        patient = crud_all.patient.get_first(db, Patient.record_id == s.patient_id)
        result.append({
            "surgery_id": s.surgery_id,
            "patient_id": s.patient_id,
            "patient_name": patient.full_name if patient else "Unknown",
            "procedure_code": s.procedure_code,
            "surgery_type": s.surgery_type,
            "scheduled_date": s.scheduled_date,
            "status": s.status
        })
    return result

@router.get("/stats")
def get_ent_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get high level stats for ENT dashboard"""
    total_patients = db.query(ENTPatient).join(
        Patient, ENTPatient.patient_id == Patient.record_id
    ).filter(
        ENTPatient.hospital_id == current_user.hospital_id,
        Patient.is_deleted == False
    )
    total_surgeries = crud_all.e_n_t_surgery.count(db, ENTSurgery.hospital_id == current_user.hospital_id)
    total_audiometry = crud_all.audiometry_test.count(db, AudiometryTest.hospital_id == current_user.hospital_id)
    
    return {
        "total_patients": total_patients,
        "total_surgeries": total_surgeries,
        "total_audiometry_tests": total_audiometry,
        "active_cases": total_surgeries # Mock metric
    }
