
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import shutil
import os
import re

from ..database import get_db
from ..models import (
    DentalPatient, Appointment, Department, DentalTreatment, Dental3DScan, User, Patient, TreatmentPlan, TreatmentPhase,
    InsuranceProvider, InsuranceClaim, DentalLab, DentalLabOrder, OrthoRecord, CommunicationLog, DentalInventoryItem
)
from .auth import get_current_user
from ..services.s3_handler import S3Manager
from ..models import Hospital

router = APIRouter(
    responses={404: {"description": "Not found"}},
)

def sanitize_name(name):
    return re.sub(r'[^\w\s-]', '', name).replace(' ', '_')

# --- Schemas ---

class DentalPatientBase(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    
    # Identifiers
    uhid: Optional[str] = None
    opd_number: Optional[str] = None
    registration_date: Optional[datetime] = None
    
    clinical_data: Optional[dict] = {}
    habits: Optional[dict] = {}
    chief_complaint: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None
    prescriptions: Optional[List[dict]] = []

class DentalPatientCreate(DentalPatientBase):
    full_name: str

class DentalPatientUpdate(DentalPatientBase):
    pass

class DentalPatientResponse(DentalPatientBase):
    patient_id: int
    hospital_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AppointmentBase(BaseModel):
    doctor_name: Optional[str] = None
    start_time: datetime
    end_time: datetime
    purpose: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = "scheduled"

class AppointmentCreate(AppointmentBase):
    patient_id: int

class AppointmentResponse(AppointmentBase):
    appointment_id: int
    patient_id: int
    patient: Optional[DentalPatientResponse] = None

    class Config:
        from_attributes = True

class TreatmentBase(BaseModel):
    tooth_number: Optional[int] = None
    treatment_type: str
    description: Optional[str] = None
    cost: Optional[float] = 0.0
    status: Optional[str] = "planned"
    date_performed: Optional[datetime] = None

class TreatmentCreate(TreatmentBase):
    patient_id: int
    phase_id: Optional[int] = None

class TreatmentResponse(TreatmentBase):
    treatment_id: int
    patient_id: int
    phase_id: Optional[int] = None

    class Config:
        from_attributes = True

# --- New Treatment Planning Schemas ---

class TreatmentPhaseBase(BaseModel):
    name: str
    phase_order: Optional[int] = 1
    status: Optional[str] = "pending"
    estimated_duration_days: Optional[int] = None

class TreatmentPhaseCreate(TreatmentPhaseBase):
    pass

class TreatmentPhaseUpdate(BaseModel):
    name: Optional[str] = None
    phase_order: Optional[int] = None
    status: Optional[str] = None
    estimated_duration_days: Optional[int] = None

class TreatmentPhaseResponse(TreatmentPhaseBase):
    phase_id: int
    plan_id: int
    treatments: List[TreatmentResponse] = []

    class Config:
        from_attributes = True

class TreatmentPlanBase(BaseModel):
    name: str
    status: Optional[str] = "proposed"
    priority: Optional[str] = "normal"
    estimated_cost: Optional[float] = 0.0
    notes: Optional[str] = None

class TreatmentPlanCreate(TreatmentPlanBase):
    pass

class TreatmentPlanUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    estimated_cost: Optional[float] = None
    notes: Optional[str] = None

class TreatmentPlanResponse(TreatmentPlanBase):
    plan_id: int
    patient_id: int
    phases: List[TreatmentPhaseResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ScanResponse(BaseModel):
    scan_id: int
    patient_id: int
    scan_type: Optional[str] = None
    file_path: str
    file_name: str
    uploaded_at: datetime
    notes: Optional[str] = None
    presigned_url: Optional[str] = None

    class Config:
        from_attributes = True

# --- Periodontal Charting Schemas ---

class PeriodontalMeasurementBase(BaseModel):
    tooth_number: int
    pd_db: int = 0
    pd_b: int = 0
    pd_mb: int = 0
    pd_dl: int = 0
    pd_l: int = 0
    pd_ml: int = 0
    gm_db: int = 0
    gm_b: int = 0
    gm_mb: int = 0
    gm_dl: int = 0
    gm_l: int = 0
    gm_ml: int = 0
    bop_db: bool = False
    bop_b: bool = False
    bop_mb: bool = False
    bop_dl: bool = False
    bop_l: bool = False
    bop_ml: bool = False

class PeriodontalMeasurementCreate(PeriodontalMeasurementBase):
    pass

class PeriodontalMeasurementResponse(PeriodontalMeasurementBase):
    measurement_id: int
    exam_id: int

    class Config:
        from_attributes = True

class PeriodontalExamBase(BaseModel):
    notes: Optional[str] = None
    overall_plaque_score: Optional[float] = None
    overall_bleeding_score: Optional[float] = None

class PeriodontalExamCreate(PeriodontalExamBase):
    measurements: List[PeriodontalMeasurementCreate] = []

class PeriodontalExamResponse(PeriodontalExamBase):
    exam_id: int
    patient_id: int
    exam_date: datetime
    measurements: List[PeriodontalMeasurementResponse] = []

    class Config:
        from_attributes = True

# --- Additional Dental Feature Schemas ---

class InsuranceProviderBase(BaseModel):
    name: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    portal_url: Optional[str] = None

class InsuranceProviderCreate(InsuranceProviderBase):
    pass

class InsuranceProviderResponse(InsuranceProviderBase):
    provider_id: int
    hospital_id: int
    class Config:
        from_attributes = True

class InsuranceClaimBase(BaseModel):
    policy_number: str
    claim_amount: float
    approved_amount: Optional[float] = None
    status: Optional[str] = "pending"
    notes: Optional[str] = None

class InsuranceClaimCreate(InsuranceClaimBase):
    provider_id: int

class InsuranceClaimResponse(InsuranceClaimBase):
    claim_id: int
    patient_id: int
    provider_id: int
    submitted_date: datetime
    resolved_date: Optional[datetime] = None
    class Config:
        from_attributes = True

class DentalLabBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class DentalLabCreate(DentalLabBase):
    pass

class DentalLabResponse(DentalLabBase):
    lab_id: int
    hospital_id: int
    class Config:
        from_attributes = True

class DentalLabOrderBase(BaseModel):
    appliance_type: str
    tooth_number: Optional[str] = None
    shade: Optional[str] = None
    instructions: Optional[str] = None
    status: Optional[str] = "sent"
    due_date: Optional[datetime] = None

class DentalLabOrderCreate(DentalLabOrderBase):
    lab_id: int

class DentalLabOrderResponse(DentalLabOrderBase):
    order_id: int
    patient_id: int
    lab_id: int
    dentist_id: int
    sent_date: datetime
    received_date: Optional[datetime] = None
    class Config:
        from_attributes = True

class OrthoRecordBase(BaseModel):
    appliance_type: str
    upper_wire: Optional[str] = None
    lower_wire: Optional[str] = None
    elastics: Optional[str] = None
    notes: Optional[str] = None
    next_visit_tasks: Optional[str] = None

class OrthoRecordCreate(OrthoRecordBase):
    pass

class OrthoRecordResponse(OrthoRecordBase):
    record_id: int
    patient_id: int
    dentist_id: int
    visit_date: datetime
    class Config:
        from_attributes = True

class CommunicationLogBase(BaseModel):
    comm_type: str
    category: str
    message_content: str
    status: Optional[str] = "sent"

class CommunicationLogCreate(CommunicationLogBase):
    pass

class CommunicationLogResponse(CommunicationLogBase):
    log_id: int
    patient_id: int
    sent_at: datetime
    class Config:
        from_attributes = True

class DentalInventoryItemBase(BaseModel):
    name: str
    category: Optional[str] = "Consumables"
    sku_code: Optional[str] = None
    current_stock: Optional[int] = 0
    reorder_point: Optional[int] = 5
    unit_of_measure: Optional[str] = "boxes"
    expiry_date: Optional[datetime] = None

class DentalInventoryItemCreate(DentalInventoryItemBase):
    pass

class DentalInventoryItemResponse(DentalInventoryItemBase):
    item_id: int
    hospital_id: int
    last_restocked: Optional[datetime] = None
    class Config:
        from_attributes = True

# --- Endpoints ---

# Patients
@router.get("/stats")
def get_dental_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    hospital_id = current_user.hospital_id
    
    # 1. Total Patients
    total_patients_query = db.query(DentalPatient)
    if hospital_id:
        total_patients_query = total_patients_query.filter(DentalPatient.hospital_id == hospital_id)
    total_patients = total_patients_query.count()
    
    # 2. Today's Appointments (using Global Appointments filtered by Dental Dept)
    today = datetime.now().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    
    # Try to find the dental department ID dynamically
    dental_dept = db.query(Department).filter(
        Department.hospital_id == hospital_id,
        Department.name.ilike('%Dental%')
    ).first()
    
    # Fallback to older queries temporarily during refactoring 
    if dental_dept:
        appointments_query = db.query(Appointment).filter(
            Appointment.hospital_id == hospital_id,
            Appointment.department_id == dental_dept.department_id
        )
        today_appointments = appointments_query.filter(
            Appointment.start_time >= today_start,
            Appointment.start_time <= today_end
        ).count()
    else:
        today_appointments = 0

    
    # 3. New Cases (Last 7 Days)
    week_ago = datetime.now() - timedelta(days=7)
    new_cases_query = db.query(DentalPatient)
    if hospital_id:
        new_cases_query = new_cases_query.filter(DentalPatient.hospital_id == hospital_id)
    
    new_cases = new_cases_query.filter(DentalPatient.created_at >= week_ago).count()
    
    # 4. Pending Plans (Treatments with status 'planned')
    pending_plans_query = db.query(DentalTreatment).join(DentalPatient)
    if hospital_id:
        pending_plans_query = pending_plans_query.filter(DentalPatient.hospital_id == hospital_id)
    
    pending_plans = pending_plans_query.filter(DentalTreatment.status == "planned").count()
    
    return {
        "total_patients": total_patients,
        "today_appointments": today_appointments,
        "new_cases_week": new_cases,
        "pending_plans": pending_plans
    }

@router.get("/next-ids")
def get_next_dental_ids(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    hospital_id = current_user.hospital_id
    if not hospital_id:
        raise HTTPException(status_code=400, detail="Hospital context required")

    # Fetch latest patient for this hospital
    latest_patient = db.query(DentalPatient).filter(
        DentalPatient.hospital_id == hospital_id
    ).order_by(DentalPatient.patient_id.desc()).first()

    current_year = datetime.now().year
    
    next_uhid_num = 10001
    next_opd_num = 1

    if latest_patient:
        # Extract UHID number
        if latest_patient.uhid:
            uhid_match = re.search(r'(\d+)$', latest_patient.uhid)
            if uhid_match:
                next_uhid_num = int(uhid_match.group(1)) + 1
        
        # Extract OPD number
        if latest_patient.opd_number:
            opd_match = re.search(r'(\d+)$', latest_patient.opd_number)
            if opd_match:
                next_opd_num = int(opd_match.group(1)) + 1

    next_uhid = f"UHID-{next_uhid_num}"
    next_opd = f"OPD-{current_year}-{str(next_opd_num).zfill(3)}"

    return {
        "next_uhid": next_uhid,
        "next_opd": next_opd
    }

@router.get("/check/uhid/{uhid_no}")
def check_uhid_exists(uhid_no: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Check if a UHID exists and return the patient details if found.
    Searches DentalPatient first, then Patient (General).
    """
    uhid_no = uhid_no.upper().strip()
    
    # 1. Check Dental Patients first
    dental_patient = db.query(DentalPatient).filter(DentalPatient.uhid == uhid_no).order_by(DentalPatient.created_at.desc()).first()
    
    if dental_patient:
        return {
            "exists": True,
            "source": "dental",
            "patient": {
                "full_name": dental_patient.full_name,
                "phone": dental_patient.phone,
                "email": dental_patient.email,
                "gender": dental_patient.gender,
                "date_of_birth": dental_patient.date_of_birth,
                "address": dental_patient.address
            }
        }
        
    # 2. Check General Patients
    general_patient = db.query(Patient).filter(Patient.uhid == uhid_no).order_by(Patient.created_at.desc()).first()
    
    if general_patient:
        # Map fields (General uses contact_number vs Dental phone)
        return {
            "exists": True,
            "source": "general",
            "patient": {
                "full_name": general_patient.full_name,
                "phone": general_patient.contact_number,
                "email": general_patient.email_id,
                "gender": general_patient.gender,
                "date_of_birth": general_patient.dob,
                "address": general_patient.address
            }
        }
        
    return {"exists": False}

@router.get("/patients", response_model=List[DentalPatientResponse])
def get_patients(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(DentalPatient)
    # Filter by hospital
    if current_user.hospital_id:
        query = query.filter(DentalPatient.hospital_id == current_user.hospital_id)
    
    patients = query.offset(skip).limit(limit).all()
    return patients

@router.post("/patients", response_model=DentalPatientResponse)
def create_patient(
    patient: DentalPatientCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    hospital_id = current_user.hospital_id
    if not hospital_id:
        raise HTTPException(status_code=400, detail="User must be associated with a hospital to create patients")

    # Duplicate Checks
    if patient.phone:
        existing = db.query(DentalPatient).filter(DentalPatient.hospital_id == hospital_id, DentalPatient.phone == patient.phone).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Patient with phone number {patient.phone} already exists.")
            
    if patient.uhid:
        existing = db.query(DentalPatient).filter(DentalPatient.hospital_id == hospital_id, DentalPatient.uhid == patient.uhid).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Patient with UHID {patient.uhid} already exists.")

    if patient.opd_number:
        existing = db.query(DentalPatient).filter(DentalPatient.hospital_id == hospital_id, DentalPatient.opd_number == patient.opd_number).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Patient with OPD number {patient.opd_number} already exists.")
        
    db_patient = DentalPatient(**patient.dict(), hospital_id=hospital_id)
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.get("/patients/{patient_id}", response_model=DentalPatientResponse)
def get_patient(
    patient_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(DentalPatient).filter(DentalPatient.patient_id == patient_id)
    if current_user.hospital_id:
        query = query.filter(DentalPatient.hospital_id == current_user.hospital_id)
        
    patient = query.first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found or access denied")
    return patient

@router.put("/patients/{patient_id}", response_model=DentalPatientResponse)
def update_patient(
    patient_id: int, 
    patient_update: DentalPatientUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_patient = db.query(DentalPatient).filter(DentalPatient.patient_id == patient_id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    hospital_id = current_user.hospital_id
    if hospital_id and db_patient.hospital_id != hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Duplicate Checks (excluding current patient)
    if patient_update.phone:
        existing = db.query(DentalPatient).filter(
            DentalPatient.hospital_id == db_patient.hospital_id, 
            DentalPatient.phone == patient_update.phone,
            DentalPatient.patient_id != patient_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Another patient with phone {patient_update.phone} already exists.")

    if patient_update.uhid:
        existing = db.query(DentalPatient).filter(
            DentalPatient.hospital_id == db_patient.hospital_id, 
            DentalPatient.uhid == patient_update.uhid,
            DentalPatient.patient_id != patient_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Another patient with UHID {patient_update.uhid} already exists.")

    if patient_update.opd_number:
        existing = db.query(DentalPatient).filter(
            DentalPatient.hospital_id == db_patient.hospital_id, 
            DentalPatient.opd_number == patient_update.opd_number,
            DentalPatient.patient_id != patient_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Another patient with OPD number {patient_update.opd_number} already exists.")
    
    for key, value in patient_update.dict(exclude_unset=True).items():
        setattr(db_patient, key, value)
    
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.delete("/patients/{patient_id}")
def delete_patient(
    patient_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_patient = db.query(DentalPatient).filter(DentalPatient.patient_id == patient_id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check permissions
    if current_user.hospital_id and db_patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db.delete(db_patient)
    db.commit()
    return {"detail": "Patient deleted successfully"}

# Appointments
@router.get("/appointments", response_model=List[AppointmentResponse])
def get_appointments(
    start_date: Optional[datetime] = None, 
    end_date: Optional[datetime] = None, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(DentalAppointment).join(DentalPatient)
    
    if current_user.hospital_id:
        query = query.filter(DentalPatient.hospital_id == current_user.hospital_id)
        
    if start_date:
        query = query.filter(DentalAppointment.start_time >= start_date)
    if end_date:
        query = query.filter(DentalAppointment.end_time <= end_date)
        
    appointments = query.all()
    return appointments

@router.post("/appointments", response_model=AppointmentResponse)
def create_appointment(
    appointment: AppointmentCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify patient belongs to user's hospital
    patient = db.query(DentalPatient).filter(DentalPatient.patient_id == appointment.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    if current_user.hospital_id and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    db_appointment = DentalAppointment(**appointment.dict())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

# Treatments
@router.get("/treatments/{patient_id}", response_model=List[TreatmentResponse])
def get_treatments(
    patient_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(DentalPatient).filter(DentalPatient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    if current_user.hospital_id and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    treatments = db.query(DentalTreatment).filter(DentalTreatment.patient_id == patient_id).all()
    return treatments

@router.post("/treatments", response_model=TreatmentResponse)
def create_treatment(
    treatment: TreatmentCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(DentalPatient).filter(DentalPatient.patient_id == treatment.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    if current_user.hospital_id and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    db_treatment = DentalTreatment(**treatment.dict())
    db.add(db_treatment)
    db.commit()
    db.refresh(db_treatment)
    return db_treatment

# --- Treatment Plan Endpoints ---

@router.post("/patients/{patient_id}/treatment-plans", response_model=TreatmentPlanResponse)
def create_treatment_plan(
    patient_id: int, 
    plan: TreatmentPlanCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    patient = db.query(DentalPatient).filter(DentalPatient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    if current_user.hospital_id and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    db_plan = TreatmentPlan(**plan.dict(), patient_id=patient_id)
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.get("/patients/{patient_id}/treatment-plans", response_model=List[TreatmentPlanResponse])
def get_treatment_plans(
    patient_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    patient = db.query(DentalPatient).filter(DentalPatient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    if current_user.hospital_id and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    return db.query(TreatmentPlan).filter(TreatmentPlan.patient_id == patient_id).all()

@router.patch("/treatment-plans/{plan_id}", response_model=TreatmentPlanResponse)
def update_treatment_plan(
    plan_id: int, 
    plan_update: TreatmentPlanUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    db_plan = db.query(TreatmentPlan).filter(TreatmentPlan.plan_id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
        
    # Check access via patient
    patient = db.query(DentalPatient).filter(DentalPatient.patient_id == db_plan.patient_id).first()
    if current_user.hospital_id and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    update_data = plan_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_plan, key, value)
        
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.post("/treatment-plans/{plan_id}/phases", response_model=TreatmentPhaseResponse)
def create_treatment_phase(
    plan_id: int, 
    phase: TreatmentPhaseCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    db_plan = db.query(TreatmentPlan).filter(TreatmentPlan.plan_id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
        
    # Check access via patient
    patient = db.query(DentalPatient).filter(DentalPatient.patient_id == db_plan.patient_id).first()
    if current_user.hospital_id and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    db_phase = TreatmentPhase(**phase.dict(), plan_id=plan_id)
    db.add(db_phase)
    db.commit()
    db.refresh(db_phase)
    return db_phase

@router.patch("/treatment-phases/{phase_id}", response_model=TreatmentPhaseResponse)
def update_treatment_phase(
    phase_id: int, 
    phase_update: TreatmentPhaseUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    db_phase = db.query(TreatmentPhase).filter(TreatmentPhase.phase_id == phase_id).first()
    if not db_phase:
        raise HTTPException(status_code=404, detail="Treatment phase not found")
        
    # Check access via plan -> patient
    db_plan = db.query(TreatmentPlan).filter(TreatmentPlan.plan_id == db_phase.plan_id).first()
    patient = db.query(DentalPatient).filter(DentalPatient.patient_id == db_plan.patient_id).first()
    if current_user.hospital_id and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    update_data = phase_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_phase, key, value)
        
    db.commit()
    db.refresh(db_phase)
    return db_phase

# --- Periodontal Charting Endpoints ---

@router.post("/patients/{patient_id}/periodontal-exams", response_model=PeriodontalExamResponse)
def create_periodontal_exam(
    patient_id: int, 
    exam: PeriodontalExamCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    patient = db.query(DentalPatient).filter(DentalPatient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    if current_user.hospital_id and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    db_exam = PeriodontalExam(
        patient_id=patient_id,
        dentist_id=current_user.user_id,
        notes=exam.notes,
        overall_plaque_score=exam.overall_plaque_score,
        overall_bleeding_score=exam.overall_bleeding_score
    )
    db.add(db_exam)
    db.flush() # Get exam_id
    
    for m in exam.measurements:
        db_m = PeriodontalMeasurement(**m.dict(), exam_id=db_exam.exam_id)
        db.add(db_m)
        
    db.commit()
    db.refresh(db_exam)
    return db_exam

@router.get("/patients/{patient_id}/periodontal-exams", response_model=List[PeriodontalExamResponse])
def get_periodontal_exams(
    patient_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    patient = db.query(DentalPatient).filter(DentalPatient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    if current_user.hospital_id and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    return db.query(PeriodontalExam).filter(PeriodontalExam.patient_id == patient_id).order_by(PeriodontalExam.exam_date.desc()).all()

@router.get("/periodontal-exams/{exam_id}", response_model=PeriodontalExamResponse)
def get_periodontal_exam(
    exam_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    db_exam = db.query(PeriodontalExam).filter(PeriodontalExam.exam_id == exam_id).first()
    if not db_exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    # Check access via patient
    patient = db.query(DentalPatient).filter(DentalPatient.patient_id == db_exam.patient_id).first()
    if current_user.hospital_id and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    return db_exam

# 3D Scans
@router.post("/scans/{patient_id}", response_model=ScanResponse)
async def upload_scan(
    patient_id: int, 
    file: UploadFile = File(...), 
    scan_type: str = "Intraoral",
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(DentalPatient).filter(DentalPatient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    if current_user.hospital_id and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    s3_manager = S3Manager()
    
    # Generate S3 key: Hospital/DentalScans/Year/Month/PatientUHID_UUID.ext
    hospital_name = sanitize_name(patient.hospital.legal_name) if patient.hospital else "DefaultHospital"
    now = datetime.now()
    year = now.strftime("%Y")
    month = now.strftime("%m")
    
    unique_id = str(int(now.timestamp()))
    # Simple sanitization of filename
    ext = os.path.splitext(file.filename)[1]
    patient_identifier = sanitize_name(patient.uhid) if patient.uhid else f"Patient_{patient.patient_id}"
    
    s3_key = f"{hospital_name}/DentalScans/{year}/{month}/{patient_identifier}_{unique_id}{ext}"
    
    # Read file content
    from ..utils import validate_magic_bytes
    contents = await file.read()
    
    if not validate_magic_bytes(contents[:100], ext):
        raise HTTPException(status_code=400, detail=f"File content does not match extension '{ext}' (Spoofing detected)")
    
    import io
    # Upload to S3 (Use io.BytesIO to provide a file-like object)
    success, storage_path = s3_manager.upload_file(io.BytesIO(contents), s3_key, file.content_type)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to upload to S3")
        
    db_scan = Dental3DScan(
        patient_id=patient_id,
        scan_type=scan_type,
        file_path=s3_key, # Store S3 key for later retrieval
        file_name=file.filename,
        notes=notes
    )
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)
    return db_scan

@router.get("/scans/patient/{patient_id}", response_model=List[ScanResponse])
def get_patient_scans(
    patient_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(DentalPatient).filter(DentalPatient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    if current_user.hospital_id and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    scans = db.query(Dental3DScan).filter(Dental3DScan.patient_id == patient_id).all()
    
    s3_manager = S3Manager()
    for scan in scans:
        if scan.file_path and not scan.file_path.startswith("local_storage"):
            # If it's an S3 key, generate a presigned URL
            scan.presigned_url = s3_manager.generate_presigned_url(scan.file_path)
        else:
            # For local files, the frontend handles it or we can provide a local URL
            pass
            
    return scans
@router.delete("/scans/patient/{patient_id}")
def delete_all_patient_scans(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(DentalPatient).filter(DentalPatient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    if current_user.hospital_id and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    scans = db.query(Dental3DScan).filter(Dental3DScan.patient_id == patient_id).all()
    
    s3_manager = S3Manager()
    delete_count = 0
    
    for scan in scans:
        if scan.file_path:
            # Delete from S3 or Local
            s3_manager.delete_file(scan.file_path)
        
        db.delete(scan)
        delete_count += 1
        
    db.commit()
    return {"message": f"Successfully deleted {delete_count} scans", "count": delete_count}

# --- Revenue Analytics ---

class RevenueAnalyticsResponse(BaseModel):
    total_realized: float
    pipeline_revenue: float
    total_planned: float
    completion_rate: float
    revenue_by_type: list[dict]
    monthly_trend: list[dict]

@router.get("/analytics/revenue", response_model=RevenueAnalyticsResponse)
def get_revenue_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Base query filters by hospital if user is not superadmin
    treatment_query = db.query(DentalTreatment).join(DentalPatient)
    plan_query = db.query(TreatmentPlan).join(DentalPatient)
    
    if current_user.hospital_id:
        treatment_query = treatment_query.filter(DentalPatient.hospital_id == current_user.hospital_id)
        plan_query = plan_query.filter(DentalPatient.hospital_id == current_user.hospital_id)

    # 1. Total Realized (Completed Treatments)
    realized_result = treatment_query.filter(DentalTreatment.status == "completed").with_entities(func.sum(DentalTreatment.cost)).scalar()
    total_realized = float(realized_result or 0.0)

    # 2. Pipeline Revenue (In-progress phases/treatments)
    # Since cost is at the treatment level, pipeline = non-completed but planned/in-progress
    pipeline_result = treatment_query.filter(DentalTreatment.status.in_(["planned", "in-progress"])).with_entities(func.sum(DentalTreatment.cost)).scalar()
    pipeline_revenue = float(pipeline_result or 0.0)

    # 3. Total Planned (From Treatment Plans)
    planned_result = plan_query.filter(TreatmentPlan.status.in_(["proposed", "accepted"])).with_entities(func.sum(TreatmentPlan.estimated_cost)).scalar()
    total_planned = float(planned_result or 0.0)
    
    # 4. Completion Rate (Completed Treatments / Total Treatments)
    total_treatments = treatment_query.count()
    completed_treatments = treatment_query.filter(DentalTreatment.status == "completed").count()
    completion_rate = round((completed_treatments / total_treatments * 100), 1) if total_treatments > 0 else 0.0

    # 5. Revenue by Type (Completed)
    by_type = treatment_query.filter(DentalTreatment.status == "completed") \
        .with_entities(DentalTreatment.treatment_type, func.sum(DentalTreatment.cost).label('total_cost')) \
        .group_by(DentalTreatment.treatment_type) \
        .order_by(func.sum(DentalTreatment.cost).desc()) \
        .limit(5).all()
        
    revenue_by_type = [{"name": row[0], "value": float(row[1] or 0.0)} for row in by_type]

    # 6. Monthly Trend (Last 6 months placeholder - SQLite compatible extraction)
    # Note: SQLite date manipulation is tricky in SQLAlchemy, using Python for simplicity if db is small
    # For production PostgreSQL: .group_by(func.date_trunc('month', date))
    
    # Simple Python-side grouping for SQLite compatibility in this demo
    completed_all = treatment_query.filter(DentalTreatment.status == "completed", DentalTreatment.date_performed != None).all()
    
    trend_dict = {}
    for t in completed_all:
        month_label = t.date_performed.strftime("%b %Y")
        if month_label not in trend_dict:
            trend_dict[month_label] = 0
        trend_dict[month_label] += float(t.cost or 0)
        
    monthly_trend = [{"month": k, "revenue": v} for k, v in list(trend_dict.items())[-6:]] # Get last 6 active months
    
    # Fill with empty if no data
    if not monthly_trend:
        now = datetime.now()
        monthly_trend = [{"month": now.strftime("%b %Y"), "revenue": 0.0}]

    return RevenueAnalyticsResponse(
        total_realized=total_realized,
        pipeline_revenue=pipeline_revenue,
        total_planned=total_planned,
        completion_rate=completion_rate,
        revenue_by_type=revenue_by_type,
        monthly_trend=monthly_trend
    )

# --- Insurance ---

@router.get("/insurance/providers", response_model=List[InsuranceProviderResponse])
def get_insurance_providers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.hospital_id:
        return []
    return db.query(InsuranceProvider).filter(InsuranceProvider.hospital_id == current_user.hospital_id).all()

@router.post("/insurance/providers", response_model=InsuranceProviderResponse)
def create_insurance_provider(
    provider: InsuranceProviderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Hospital ID required")
    db_prov = InsuranceProvider(**provider.dict(), hospital_id=current_user.hospital_id)
    db.add(db_prov)
    db.commit()
    db.refresh(db_prov)
    return db_prov

@router.get("/patients/{patient_id}/insurance/claims", response_model=List[InsuranceClaimResponse])
def get_patient_claims(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(InsuranceClaim).filter(InsuranceClaim.patient_id == patient_id).all()

@router.post("/patients/{patient_id}/insurance/claims", response_model=InsuranceClaimResponse)
def create_patient_claim(patient_id: int, claim: InsuranceClaimCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_claim = InsuranceClaim(**claim.dict(), patient_id=patient_id)
    db.add(db_claim)
    db.commit()
    db.refresh(db_claim)
    return db_claim

# --- Dental Labs ---

@router.get("/labs", response_model=List[DentalLabResponse])
def get_dental_labs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.hospital_id: return []
    return db.query(DentalLab).filter(DentalLab.hospital_id == current_user.hospital_id).all()

@router.post("/labs", response_model=DentalLabResponse)
def create_dental_lab(lab: DentalLabCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.hospital_id: raise HTTPException(status_code=403, detail="Hospital ID required")
    db_lab = DentalLab(**lab.dict(), hospital_id=current_user.hospital_id)
    db.add(db_lab)
    db.commit()
    db.refresh(db_lab)
    return db_lab

@router.get("/patients/{patient_id}/lab-orders", response_model=List[DentalLabOrderResponse])
def get_patient_lab_orders(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(DentalLabOrder).filter(DentalLabOrder.patient_id == patient_id).all()

@router.post("/patients/{patient_id}/lab-orders", response_model=DentalLabOrderResponse)
def create_patient_lab_order(patient_id: int, order: DentalLabOrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_order = DentalLabOrder(**order.dict(), patient_id=patient_id, dentist_id=current_user.user_id)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

# --- Ortho Records ---

@router.get("/patients/{patient_id}/ortho", response_model=List[OrthoRecordResponse])
def get_patient_ortho_records(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(OrthoRecord).filter(OrthoRecord.patient_id == patient_id).order_by(OrthoRecord.visit_date.desc()).all()

@router.post("/patients/{patient_id}/ortho", response_model=OrthoRecordResponse)
def create_patient_ortho_record(patient_id: int, rec: OrthoRecordCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_rec = OrthoRecord(**rec.dict(), patient_id=patient_id, dentist_id=current_user.user_id)
    db.add(db_rec)
    db.commit()
    db.refresh(db_rec)
    return db_rec

# --- Communications ---

@router.get("/patients/{patient_id}/communications", response_model=List[CommunicationLogResponse])
def get_patient_communications(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(CommunicationLog).filter(CommunicationLog.patient_id == patient_id).order_by(CommunicationLog.sent_at.desc()).all()

@router.post("/patients/{patient_id}/communications", response_model=CommunicationLogResponse)
def create_patient_communication(patient_id: int, comm: CommunicationLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_comm = CommunicationLog(**comm.dict(), patient_id=patient_id)
    db.add(db_comm)
    db.commit()
    db.refresh(db_comm)
    return db_comm

# --- Inventory ---

@router.get("/inventory", response_model=List[DentalInventoryItemResponse])
def get_dental_inventory(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.hospital_id:
        return []
    return db.query(DentalInventoryItem).filter(DentalInventoryItem.hospital_id == current_user.hospital_id).all()

@router.post("/inventory", response_model=DentalInventoryItemResponse)
def create_dental_inventory_item(item: DentalInventoryItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.hospital_id: raise HTTPException(status_code=403, detail="Hospital ID required")
    db_item = DentalInventoryItem(**item.dict(), hospital_id=current_user.hospital_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# --- 3D Scans ---

s3 = S3Manager()

@router.post("/scans/{patient_id}", response_model=ScanResponse)
async def upload_dental_scan(
    patient_id: int,
    file: UploadFile = File(...),
    scan_type: str = "Intraoral",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a 3D scan file (.stl, .ply, .glb, .obj, .jpg, .png) for a dental patient."""
    patient = db.query(DentalPatient).filter(DentalPatient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if current_user.hospital_id and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Validate file extension
    allowed_ext = {'.stl', '.ply', '.glb', '.obj', '.jpg', '.jpeg', '.png'}
    file_ext = os.path.splitext(file.filename or '')[1].lower()
    if file_ext not in allowed_ext:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_ext}. Allowed: {', '.join(allowed_ext)}")

    # Build S3 object key
    safe_name = sanitize_name(os.path.splitext(file.filename or 'scan')[0])
    object_key = f"dental_scans/hospital_{current_user.hospital_id}/patient_{patient_id}/{safe_name}_{int(datetime.now().timestamp())}{file_ext}"

    # Upload to S3 / local storage
    content_type = file.content_type or "application/octet-stream"
    success, result = s3.upload_file(file.file, object_key, content_type=content_type)
    if not success:
        raise HTTPException(status_code=500, detail=f"Upload failed: {result}")

    # Generate presigned URL for immediate use
    presigned_url = s3.generate_presigned_url(object_key, expiration=3600)

    # Save record to DB
    db_scan = Dental3DScan(
        patient_id=patient_id,
        scan_type=scan_type,
        file_path=object_key,
        file_name=file.filename or "scan" + file_ext,
        uploaded_at=datetime.utcnow()
    )
    db.add(db_scan)
    db.commit()
    db.refresh(db_scan)

    return ScanResponse(
        scan_id=db_scan.scan_id,
        patient_id=db_scan.patient_id,
        scan_type=db_scan.scan_type,
        file_path=db_scan.file_path,
        file_name=db_scan.file_name,
        uploaded_at=db_scan.uploaded_at,
        notes=db_scan.notes,
        presigned_url=presigned_url
    )


@router.get("/scans/patient/{patient_id}", response_model=List[ScanResponse])
def get_patient_scans(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all scans for a patient with fresh presigned URLs."""
    patient = db.query(DentalPatient).filter(DentalPatient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if current_user.hospital_id and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    scans = db.query(Dental3DScan).filter(
        Dental3DScan.patient_id == patient_id
    ).order_by(Dental3DScan.uploaded_at.desc()).all()

    result = []
    for scan in scans:
        presigned_url = s3.generate_presigned_url(scan.file_path, expiration=3600)
        result.append(ScanResponse(
            scan_id=scan.scan_id,
            patient_id=scan.patient_id,
            scan_type=scan.scan_type,
            file_path=scan.file_path,
            file_name=scan.file_name,
            uploaded_at=scan.uploaded_at,
            notes=scan.notes,
            presigned_url=presigned_url
        ))
    return result


@router.delete("/scans/{scan_id}")
def delete_dental_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a single scan from S3 and the database."""
    scan = db.query(Dental3DScan).filter(Dental3DScan.scan_id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    patient = db.query(DentalPatient).filter(DentalPatient.patient_id == scan.patient_id).first()
    if current_user.hospital_id and patient and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    s3.delete_file(scan.file_path)
    db.delete(scan)
    db.commit()
    return {"detail": "Scan deleted successfully"}


@router.delete("/scans/patient/{patient_id}")
def delete_all_patient_scans(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete ALL scans for a patient from S3 and the database."""
    patient = db.query(DentalPatient).filter(DentalPatient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if current_user.hospital_id and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    scans = db.query(Dental3DScan).filter(Dental3DScan.patient_id == patient_id).all()
    for scan in scans:
        s3.delete_file(scan.file_path)
        db.delete(scan)

    db.commit()
    return None  # 204 No Content
