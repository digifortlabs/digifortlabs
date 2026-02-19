
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import shutil
import os
import re

from ..database import get_db
from ..models import DentalPatient, DentalAppointment, DentalTreatment, Dental3DScan, User, Patient
from .auth import get_current_user

router = APIRouter(
    responses={404: {"description": "Not found"}},
)

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

class TreatmentResponse(TreatmentBase):
    treatment_id: int
    patient_id: int

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
    
    # 2. Today's Appointments
    today = datetime.now().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    
    appointments_query = db.query(DentalAppointment).join(DentalPatient)
    if hospital_id:
        appointments_query = appointments_query.filter(DentalPatient.hospital_id == hospital_id)
    
    today_appointments = appointments_query.filter(
        DentalAppointment.start_time >= today_start,
        DentalAppointment.start_time <= today_end
    ).count()
    
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

    upload_dir = "local_storage/dental_scans"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = f"{upload_dir}/{patient_id}_{int(datetime.now().timestamp())}_{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_scan = Dental3DScan(
        patient_id=patient_id,
        scan_type=scan_type,
        file_path=file_path,
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
    return scans
