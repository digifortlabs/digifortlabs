from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel

from ..database import get_db
from ..models import User, Patient, IPDAdmission, Ward, Bed
from .auth import get_current_user

router = APIRouter(prefix="/hms", tags=["Hospital Management System"])

# --- Pydantic Schemas ---

class WardCreate(BaseModel):
    ward_name: str
    ward_type: str  # ICU, General, Private, Semi-Private
    total_beds: int

class BedCreate(BaseModel):
    ward_id: int
    bed_number: str

class AdmissionCreate(BaseModel):
    patient_id: int
    ward_id: int
    bed_id: int
    admitting_doctor_id: Optional[int] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    admission_date: Optional[datetime] = None

class DischargeUpdate(BaseModel):
    discharge_date: datetime
    discharge_summary: Optional[str] = None

# --- Ward Management ---

@router.post("/wards")
def create_ward(
    ward: WardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new ward"""
    new_ward = Ward(
        hospital_id=current_user.hospital_id,
        ward_name=ward.ward_name,
        ward_type=ward.ward_type,
        total_beds=ward.total_beds,
        occupied_beds=0
    )
    db.add(new_ward)
    db.commit()
    db.refresh(new_ward)
    return new_ward

@router.get("/wards")
def get_wards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all wards"""
    wards = db.query(Ward).filter(
        Ward.hospital_id == current_user.hospital_id
    ).all()
    
    result = []
    for w in wards:
        available_beds = w.total_beds - w.occupied_beds
        result.append({
            "ward_id": w.ward_id,
            "ward_name": w.ward_name,
            "ward_type": w.ward_type,
            "total_beds": w.total_beds,
            "occupied_beds": w.occupied_beds,
            "available_beds": available_beds,
            "occupancy_rate": (w.occupied_beds / w.total_beds * 100) if w.total_beds > 0 else 0
        })
    
    return result

@router.get("/wards/{ward_id}")
def get_ward_detail(
    ward_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get ward details with beds"""
    ward = db.query(Ward).filter(
        Ward.ward_id == ward_id,
        Ward.hospital_id == current_user.hospital_id
    ).first()
    
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
    
    beds = db.query(Bed).filter(Bed.ward_id == ward_id).all()
    
    return {
        "ward": ward,
        "beds": beds
    }

# --- Bed Management ---

@router.post("/beds")
def create_bed(
    bed: BedCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add bed to ward"""
    ward = db.query(Ward).filter(
        Ward.ward_id == bed.ward_id,
        Ward.hospital_id == current_user.hospital_id
    ).first()
    
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
    
    new_bed = Bed(
        ward_id=bed.ward_id,
        bed_number=bed.bed_number,
        is_occupied=False
    )
    db.add(new_bed)
    db.commit()
    db.refresh(new_bed)
    return new_bed

@router.get("/beds/available")
def get_available_beds(
    ward_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available beds"""
    query = db.query(Bed).join(Ward).filter(
        Ward.hospital_id == current_user.hospital_id,
        Bed.is_occupied == False
    )
    
    if ward_id:
        query = query.filter(Bed.ward_id == ward_id)
    
    return query.all()

# --- IPD Admissions ---

@router.post("/admissions")
def admit_patient(
    admission: AdmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admit patient to IPD"""
    # Check if bed is available
    bed = db.query(Bed).filter(Bed.bed_id == admission.bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    
    if bed.is_occupied:
        raise HTTPException(status_code=400, detail="Bed is already occupied")
    
    # Create admission
    new_admission = IPDAdmission(
        patient_id=admission.patient_id,
        hospital_id=current_user.hospital_id,
        admission_date=admission.admission_date or datetime.now(),
        ward_id=admission.ward_id,
        bed_id=admission.bed_id,
        admitting_doctor_id=admission.admitting_doctor_id or current_user.user_id,
        diagnosis=admission.diagnosis,
        treatment_plan=admission.treatment_plan,
        status="admitted"
    )
    db.add(new_admission)
    
    # Update bed status
    bed.is_occupied = True
    
    # Update ward occupancy
    ward = db.query(Ward).filter(Ward.ward_id == admission.ward_id).first()
    if ward:
        ward.occupied_beds += 1
    
    db.commit()
    db.refresh(new_admission)
    return new_admission

@router.get("/admissions")
def get_admissions(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all admissions"""
    query = db.query(IPDAdmission).filter(
        IPDAdmission.hospital_id == current_user.hospital_id
    )
    
    if status:
        query = query.filter(IPDAdmission.status == status)
    
    admissions = query.order_by(IPDAdmission.admission_date.desc()).all()
    
    result = []
    for adm in admissions:
        patient = db.query(Patient).filter(Patient.record_id == adm.patient_id).first()
        ward = db.query(Ward).filter(Ward.ward_id == adm.ward_id).first()
        bed = db.query(Bed).filter(Bed.bed_id == adm.bed_id).first()
        
        result.append({
            "admission_id": adm.admission_id,
            "patient_id": adm.patient_id,
            "patient_name": patient.full_name if patient else "Unknown",
            "mrd_number": patient.mrd_number if patient else None,
            "ward_name": ward.ward_name if ward else None,
            "bed_number": bed.bed_number if bed else None,
            "admission_date": adm.admission_date,
            "discharge_date": adm.discharge_date,
            "diagnosis": adm.diagnosis,
            "status": adm.status
        })
    
    return result

@router.get("/admissions/{admission_id}")
def get_admission_detail(
    admission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get admission details"""
    admission = db.query(IPDAdmission).filter(
        IPDAdmission.admission_id == admission_id,
        IPDAdmission.hospital_id == current_user.hospital_id
    ).first()
    
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
    
    patient = db.query(Patient).filter(Patient.record_id == admission.patient_id).first()
    ward = db.query(Ward).filter(Ward.ward_id == admission.ward_id).first()
    bed = db.query(Bed).filter(Bed.bed_id == admission.bed_id).first()
    
    return {
        "admission": admission,
        "patient": patient,
        "ward": ward,
        "bed": bed
    }

@router.patch("/admissions/{admission_id}/discharge")
def discharge_patient(
    admission_id: int,
    discharge: DischargeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Discharge patient from IPD"""
    admission = db.query(IPDAdmission).filter(
        IPDAdmission.admission_id == admission_id,
        IPDAdmission.hospital_id == current_user.hospital_id
    ).first()
    
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
    
    if admission.status == "discharged":
        raise HTTPException(status_code=400, detail="Patient already discharged")
    
    # Update admission
    admission.discharge_date = discharge.discharge_date
    admission.status = "discharged"
    
    # Free up bed
    bed = db.query(Bed).filter(Bed.bed_id == admission.bed_id).first()
    if bed:
        bed.is_occupied = False
    
    # Update ward occupancy
    ward = db.query(Ward).filter(Ward.ward_id == admission.ward_id).first()
    if ward and ward.occupied_beds > 0:
        ward.occupied_beds -= 1
    
    db.commit()
    db.refresh(admission)
    return admission

@router.get("/stats")
def get_hms_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get HMS statistics"""
    total_wards = db.query(Ward).filter(
        Ward.hospital_id == current_user.hospital_id
    ).count()
    
    total_beds = db.query(func.sum(Ward.total_beds)).filter(
        Ward.hospital_id == current_user.hospital_id
    ).scalar() or 0
    
    occupied_beds = db.query(func.sum(Ward.occupied_beds)).filter(
        Ward.hospital_id == current_user.hospital_id
    ).scalar() or 0
    
    current_admissions = db.query(IPDAdmission).filter(
        IPDAdmission.hospital_id == current_user.hospital_id,
        IPDAdmission.status == "admitted"
    ).count()
    
    today_admissions = db.query(IPDAdmission).filter(
        IPDAdmission.hospital_id == current_user.hospital_id,
        func.date(IPDAdmission.admission_date) == date.today()
    ).count()
    
    today_discharges = db.query(IPDAdmission).filter(
        IPDAdmission.hospital_id == current_user.hospital_id,
        func.date(IPDAdmission.discharge_date) == date.today()
    ).count()
    
    occupancy_rate = (occupied_beds / total_beds * 100) if total_beds > 0 else 0
    
    return {
        "total_wards": total_wards,
        "total_beds": int(total_beds),
        "occupied_beds": int(occupied_beds),
        "available_beds": int(total_beds - occupied_beds),
        "occupancy_rate": round(occupancy_rate, 2),
        "current_admissions": current_admissions,
        "today_admissions": today_admissions,
        "today_discharges": today_discharges
    }
