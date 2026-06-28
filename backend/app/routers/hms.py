from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import datetime, date, timedelta
from pydantic import BaseModel

from ..database import get_db
from ..models import User, Patient, IPDAdmission, Ward, Bed, OperationTheater, MedicalEquipment, RFIDCard, Hospital, PatientInvoice, PatientInvoiceItem, EmergencyVisit, WhatsAppMessageQueue, Surgery
from .auth import get_current_user

router = APIRouter(prefix="/hms", tags=["Hospital Management System"])

# --- Pydantic Schemas ---

class WardCreate(BaseModel):
    ward_name: str
    ward_type: str  # ICU, General, Private, Semi-Private
    total_beds: int
    daily_charge: float = 500.0
    doctor_charge: float = 0.0
    nursing_charge: float = 0.0
    bio_medical_wastage_charge: float = 0.0
    floor_number: Optional[str] = "1"

class BedCreate(BaseModel):
    ward_id: int
    bed_number: str
    status: Optional[str] = "AVAILABLE"

class AdmissionCreate(BaseModel):
    patient_id: Optional[int] = None
    
    # Inpatient registration details (auto-creates patient if patient_id is not provided)
    patient_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    contact_phone: Optional[str] = None
    doctor_name: Optional[str] = None
    notes: Optional[str] = None
    
    ward_id: int
    bed_id: int
    admitting_doctor_id: Optional[int] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    admission_date: Optional[datetime] = None
    is_mediclaim: bool = False
    mediclaim_details: Optional[str] = None

class DischargeUpdate(BaseModel):
    discharge_date: Optional[datetime] = None
    history: Optional[str] = None
    final_diagnosis: Optional[str] = None
    operative_note: Optional[str] = None
    advice_on_discharge: Optional[str] = None
    general_advice: Optional[str] = None
    follow_up_plan: Optional[str] = None
    include_investigations: Optional[bool] = False
    discharge_summary: Optional[str] = None
    discharge_notes: Optional[str] = None

class OTStatusUpdate(BaseModel):
    ot_required: bool


class MedicationOrder(BaseModel):
    medicine_name: str
    dosage: str
    qty: Optional[str] = None
    frequency: str
    frequency_hours: Optional[int] = 12
    notes: Optional[str] = None
    route: Optional[str] = None
    dosage_unit: Optional[str] = None
    duration_days: Optional[int] = None
    special_instructions: Optional[str] = None

class MedicationLogRecord(BaseModel):
    order_id: str
    medicine_name: str
    notes: Optional[str] = None

class WhatsAppPrescriptionRequest(BaseModel):
    order_ids: List[str]



class DoctorNote(BaseModel):
    note_type: str
    content: str

def check_doctor_role(user: User):
    allowed = ["superadmin", "superadmin_staff", "website_admin", "doctor_ipd", "doctor_both", "hospital_admin"]
    if user.role not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only Doctors or Admins can perform this action."
        )

def check_nurse_or_doctor_role(user: User):
    allowed = ["superadmin", "superadmin_staff", "website_admin", "doctor_ipd", "doctor_both", "nurse_ipd", "hospital_staff", "hospital_admin"]
    if user.role not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only Nurses, Doctors or Admins can perform this action."
        )

class BedTransfer(BaseModel):
    new_bed_id: int
    reason: Optional[str] = None

class DietOrderCreate(BaseModel):
    diet_type: str
    instructions: Optional[str] = None

class ClearanceUpdate(BaseModel):
    medical_cleared: Optional[bool] = None
    pharmacy_cleared: Optional[bool] = None
    billing_cleared: Optional[bool] = None

class BedStatusUpdate(BaseModel):
    status: str
    is_occupied: Optional[bool] = None

class BedNameUpdate(BaseModel):
    bed_number: str

class WardUpdate(BaseModel):
    ward_name: Optional[str] = None
    ward_type: Optional[str] = None
    floor_number: Optional[str] = None
    total_beds: Optional[int] = None
    daily_charge: Optional[float] = None
    doctor_charge: Optional[float] = None
    nursing_charge: Optional[float] = None
    bio_medical_wastage_charge: Optional[float] = None

class VitalsRecord(BaseModel):
    temp: Optional[str] = None
    bp: Optional[str] = None
    pulse: Optional[str] = None
    spo2: Optional[str] = None
    respiratory_rate: Optional[str] = None
    notes: Optional[str] = None

class FluidBalanceRecord(BaseModel):
    fluid_type: str
    amount_ml: int
    type: str # 'intake' or 'output'
    notes: Optional[str] = None

class OTCreate(BaseModel):
    ot_name: str
    ot_type: str  # Cardiac, Neuro, Ortho, General

class OperationTheaterStatusUpdate(BaseModel):
    status: str
    current_patient_id: Optional[int] = None
    current_surgery_name: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    
class SurgeryCreate(BaseModel):
    admission_id: int
    surgery_name: str
    doctor_id: Optional[int] = None
    anesthesiologist_id: Optional[int] = None
    status: Optional[str] = "Requested"

class SurgeryAssessmentUpdate(BaseModel):
    pre_op_assessment: Optional[dict] = None
    post_op_assessment: Optional[dict] = None
    status: Optional[str] = None
    current_surgery_name: Optional[str] = None
    current_anesthesia_type: Optional[str] = None
    anesthesiologist_id: Optional[int] = None
    current_diagnosis: Optional[str] = None
    special_requirements: Optional[str] = None
    ot_id: Optional[int] = None
    
    # OT Tracking
    timestamps: Optional[dict] = None
    implant_register: Optional[dict] = None
    narcotics_log: Optional[dict] = None
    intra_op_logs: Optional[dict] = None

class OTAssign(BaseModel):
    surgery_id: Optional[int] = None
    patient_id: int
    doctor_id: int
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    current_surgery_name: Optional[str] = None
    current_anesthesia_type: Optional[str] = None
    anesthesiologist_id: Optional[int] = None
    current_diagnosis: Optional[str] = None
    special_requirements: Optional[str] = None

class OTRelease(BaseModel):
    surgery_fee: Optional[float] = None
    anesthesia_fee: Optional[float] = None
    post_surgery_status: Optional[str] = "recovery"

class PreOpAssessmentUpdate(BaseModel):
    bp: Optional[str] = None
    pulse: Optional[int] = None
    temp: Optional[float] = None
    weight: Optional[float] = None
    allergies: Optional[str] = None
    comorbidities: Optional[str] = None
    fitness_status: Optional[str] = None
    notes: Optional[str] = None
    consent_signed: Optional[bool] = False

class PostOpAssessmentUpdate(BaseModel):
    bp: Optional[str] = None
    pulse: Optional[int] = None
    temp: Optional[float] = None
    recovery_status: Optional[str] = None
    notes: Optional[str] = None

class EquipmentCreate(BaseModel):
    name: str
    equipment_type: str  # Ventilator, Monitor, Defibrillator, ECG

class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    equipment_type: Optional[str] = None

class EquipmentStatusUpdate(BaseModel):
    status: str

class EquipmentDeploy(BaseModel):
    ward_id: Optional[int] = None
    bed_id: Optional[int] = None
    ot_id: Optional[int] = None
    patient_id: Optional[int] = None

class RFIDRegister(BaseModel):
    card_number: str

class RFIDAssign(BaseModel):
    card_number: str
    patient_id: int

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
        floor_number=ward.floor_number,
        total_beds=ward.total_beds,
        daily_charge=ward.daily_charge,
        doctor_charge=ward.doctor_charge,
        nursing_charge=ward.nursing_charge,
        bio_medical_wastage_charge=ward.bio_medical_wastage_charge,
        occupied_beds=0
    )
    db.add(new_ward)
    db.commit()
    db.refresh(new_ward)
    
    # Auto-generate beds based on capacity
    for i in range(1, ward.total_beds + 1):
        bed_num = f"{ward.ward_name[:3].upper()}-{100 + i}"
        new_bed = Bed(
            ward_id=new_ward.ward_id,
            bed_number=bed_num,
            is_occupied=False,
            status="AVAILABLE"
        )
        db.add(new_bed)
    db.commit()
    
    return new_ward

@router.get("/wards")
def get_wards(
    hospital_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all hospital wards"""
    effective_h_id = hospital_id or current_user.hospital_id
    wards = db.query(Ward).filter(
        Ward.hospital_id == effective_h_id
    ).all()
    
    # Get bed counts efficiently
    bed_counts = db.query(Bed.ward_id, func.count(Bed.bed_id)).filter(
        Bed.is_occupied == True,
        Bed.ward_id.in_([w.ward_id for w in wards])
    ).group_by(Bed.ward_id).all()
    
    occupied_map = {ward_id: count for ward_id, count in bed_counts}
    
    result = []
    for w in wards:
        occupied_count = occupied_map.get(w.ward_id, 0)
        
        # Keep DB counter in sync
        w.occupied_beds = occupied_count  # type: ignore
        
        available_beds = w.total_beds - occupied_count
        result.append({
            "ward_id": w.ward_id,
            "ward_name": w.ward_name,
            "ward_type": w.ward_type,
            "total_beds": w.total_beds,
            "occupied_beds": occupied_count,
            "available_beds": max(0, available_beds),
            "daily_charge": getattr(w, "daily_charge", 500.0),
            "doctor_charge": getattr(w, "doctor_charge", 0.0),
            "nursing_charge": getattr(w, "nursing_charge", 0.0),
            "bio_medical_wastage_charge": getattr(w, "bio_medical_wastage_charge", 0.0),
            "floor_number": getattr(w, "floor_number", 1) or 1,
            "occupancy_rate": (occupied_count / w.total_beds * 100) if w.total_beds > 0 else 0
        })
    
    db.commit()
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

@router.put("/wards/{ward_id}")
def update_ward(
    ward_id: int,
    ward_update: WardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update ward details"""
    ward = db.query(Ward).filter(Ward.ward_id == ward_id, Ward.hospital_id == current_user.hospital_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
        
    if ward_update.ward_name is not None:
        ward.ward_name = ward_update.ward_name  # type: ignore
    if ward_update.ward_type is not None:
        ward.ward_type = ward_update.ward_type  # type: ignore
    if ward_update.floor_number is not None:
        ward.floor_number = ward_update.floor_number  # type: ignore
    if ward_update.daily_charge is not None:
        ward.daily_charge = ward_update.daily_charge  # type: ignore
    if ward_update.doctor_charge is not None:
        ward.doctor_charge = ward_update.doctor_charge  # type: ignore
    if ward_update.nursing_charge is not None:
        ward.nursing_charge = ward_update.nursing_charge  # type: ignore
    if ward_update.bio_medical_wastage_charge is not None:
        ward.bio_medical_wastage_charge = ward_update.bio_medical_wastage_charge  # type: ignore
    if ward_update.total_beds is not None and ward_update.total_beds != ward.total_beds:
        if ward_update.total_beds > ward.total_beds:
            # Add new beds
            for i in range(ward.total_beds + 1, ward_update.total_beds + 1):
                bed_num = f"{ward.ward_name[:3].upper()}-{100 + i}"
                new_bed = Bed(
                    ward_id=ward.ward_id,
                    bed_number=bed_num,
                    is_occupied=False,
                    status="AVAILABLE"
                )
                db.add(new_bed)
        else:
            # Remove excess unoccupied beds
            excess = ward.total_beds - ward_update.total_beds
            available_beds = db.query(Bed).filter(
                Bed.ward_id == ward.ward_id,
                Bed.is_occupied == False
            ).order_by(Bed.bed_id.desc()).limit(excess).all()
            
            if len(available_beds) < excess:
                raise HTTPException(status_code=400, detail="Cannot reduce total beds. Too many beds are currently occupied.")
                
            for b in available_beds:
                db.delete(b)
                
        ward.total_beds = ward_update.total_beds  # type: ignore
        
    db.commit()
    db.refresh(ward)
    return ward

@router.delete("/wards/{ward_id}")
def delete_ward(
    ward_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete ward if empty"""
    ward = db.query(Ward).filter(Ward.ward_id == ward_id, Ward.hospital_id == current_user.hospital_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
        
    # Check if any beds are occupied
    occupied = db.query(Bed).filter(Bed.ward_id == ward_id, Bed.is_occupied == True).count()
    if occupied > 0:
        raise HTTPException(status_code=400, detail="Cannot delete ward with occupied beds")
        
    # Delete beds first
    db.query(Bed).filter(Bed.ward_id == ward_id).delete()
    db.delete(ward)
    db.commit()
    return {"message": "Ward deleted"}

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
        is_occupied=False,
        status="AVAILABLE"
    )
    db.add(new_bed)
    db.commit()
    db.refresh(new_bed)
    return new_bed

@router.get("/beds")
def get_beds(
    ward_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all beds with normalized status and currently admitted patient details"""
    query = db.query(Bed).join(Ward).filter(Ward.hospital_id == current_user.hospital_id)
    if ward_id:
        query = query.filter(Bed.ward_id == ward_id)
    
    beds = query.all()
    
    # Active IPD admissions
    active_admissions = db.query(IPDAdmission).filter(
        IPDAdmission.hospital_id == current_user.hospital_id,
        IPDAdmission.status.in_(["admitted", "recovery"])
    ).all()
    
    admission_map = {adm.bed_id: adm for adm in active_admissions}
    
    result = []
    for b in beds:
        status_val = b.status.lower() if b.status else "available"
        patient_name = None
        patient_id = None
        admission_id = None
        
        adm = admission_map.get(b.bed_id)
        if adm:
            status_val = "occupied"
            patient = db.query(Patient).filter(Patient.record_id == adm.patient_id).first()
            if patient:
                patient_name = patient.full_name
                patient_id = patient.record_id
            admission_id = adm.admission_id
        elif b.is_occupied:
            status_val = "occupied"
            
        result.append({
            "bed_id": b.bed_id,
            "ward_id": b.ward_id,
            "bed_number": b.bed_number,
            "status": status_val,
            "patient_name": patient_name,
            "patient_id": patient_id,
            "admission_id": admission_id
        })
    return result

@router.put("/beds/{bed_id}/status")
def update_bed_status(
    bed_id: int,
    status_update: BedStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark bed as MAINTENANCE or AVAILABLE"""
    bed = db.query(Bed).join(Ward).filter(
        Bed.bed_id == bed_id,
        Ward.hospital_id == current_user.hospital_id
    ).first()
    
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
        
    if bed.is_occupied and status_update.is_occupied is not False:
        raise HTTPException(status_code=400, detail="Cannot change status of an occupied bed without resetting occupation flag")
        
    status_val = status_update.status.upper()
    if status_val not in ["AVAILABLE", "MAINTENANCE"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    bed.status = status_val  # type: ignore
    if status_update.is_occupied is not None:
        bed.is_occupied = status_update.is_occupied
        
    db.commit()
    db.refresh(bed)
    return bed

@router.put("/beds/{bed_id}/name")
def update_bed_name(
    bed_id: int,
    name_update: BedNameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update bed name or number"""
    bed = db.query(Bed).join(Ward).filter(
        Bed.bed_id == bed_id,
        Ward.hospital_id == current_user.hospital_id
    ).first()
    
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
        
    # Check for duplicate bed number in the same ward
    existing_bed = db.query(Bed).filter(
        Bed.ward_id == bed.ward_id,
        Bed.bed_number == name_update.bed_number,
        Bed.bed_id != bed_id
    ).first()
    
    if existing_bed:
        raise HTTPException(status_code=400, detail=f"Bed name/number '{name_update.bed_number}' already exists in this ward.")
        
    bed.bed_number = name_update.bed_number  # type: ignore
    db.commit()
    db.refresh(bed)
    return bed

@router.get("/beds/available")
def get_available_beds(
    ward_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available beds"""
    query = db.query(Bed).join(Ward).filter(
        Ward.hospital_id == current_user.hospital_id,
        Bed.is_occupied == False,
        Bed.status == "AVAILABLE"
    )
    
    if ward_id:
        query = query.filter(Bed.ward_id == ward_id)
    
    beds = query.all()
    result = []
    for b in beds:
        result.append({
            "bed_id": b.bed_id,
            "ward_id": b.ward_id,
            "bed_number": b.bed_number,
            "status": "available"
        })
    return result

# --- IPD Admissions & Vitals ---

@router.post("/admissions")
def admit_patient(
    admission: AdmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admit patient to IPD"""
    bed = db.query(Bed).filter(Bed.bed_id == admission.bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    
    if bed.is_occupied or bed.status == "OCCUPIED":
        raise HTTPException(status_code=400, detail="Bed is already occupied")
    
    patient_id = admission.patient_id
    
    # Gender validation against Ward
    patient_gender = None
    if patient_id:
        patient = db.query(Patient).filter(Patient.record_id == patient_id).first()
        if patient: patient_gender = patient.gender
    else:
        patient_gender = admission.gender
        
    if patient_gender:
        ward = db.query(Ward).filter(Ward.ward_id == bed.ward_id).first()
        if ward and ward.ward_name:
            ward_name_lower = ward.ward_name.lower()
            patient_gender_lower = patient_gender.lower()
            
            is_female_ward = "female" in ward_name_lower
            is_male_ward = "male" in ward_name_lower and not is_female_ward
            
            if is_female_ward and patient_gender_lower == "male":
                raise HTTPException(status_code=400, detail="Male patients cannot be admitted to a Female ward.")
            if is_male_ward and patient_gender_lower == "female":
                raise HTTPException(status_code=400, detail="Female patients cannot be admitted to a Male ward.")
    
    hospital = db.query(Hospital).filter(Hospital.hospital_id == current_user.hospital_id).first()
    id_settings = hospital.id_generation_settings or {} if hospital else {}
    
    import re
    
    # IPD Generation
    ipd_prefix = id_settings.get("ipd_prefix", "IPD-")
    ipd_postfix = id_settings.get("ipd_postfix", "")
    ipd_padding = int(id_settings.get("ipd_padding", 4))
    
    patients_with_ipd = db.query(Patient.ipd_number).filter(Patient.hospital_id == current_user.hospital_id).all()
    max_ipd = 0
    for p in patients_with_ipd:
        if not p.ipd_number: continue
        numbers = re.findall(r'\d+', p.ipd_number)
        if numbers:
            max_ipd = max(max_ipd, int(numbers[-1]))
    generated_ipd = f"{ipd_prefix}{str(max_ipd + 1).zfill(ipd_padding)}{ipd_postfix}"

    if not patient_id:
        if not admission.patient_name:
            raise HTTPException(status_code=400, detail="Either patient_id or patient_name is required")
        
        # We also need a UHID for new patients
        uhid_prefix = id_settings.get("uhid_prefix", "DF-")
        uhid_postfix = id_settings.get("uhid_postfix", "")
        uhid_padding = int(id_settings.get("uhid_padding", 4))
        
        patients_with_uhid = db.query(Patient.uhid).filter(Patient.hospital_id == current_user.hospital_id).all()
        max_uhid = 0
        for p in patients_with_uhid:
            if not p.uhid: continue
            numbers = re.findall(r'\d+', p.uhid)
            if numbers:
                max_uhid = max(max_uhid, int(numbers[-1]))
        uhid_code = f"{uhid_prefix}{str(max_uhid + 1).zfill(uhid_padding)}{uhid_postfix}"
        
        # MRD Generation
        mrd_prefix = id_settings.get("mrd_prefix", "MRD-")
        mrd_postfix = id_settings.get("mrd_postfix", "")
        mrd_padding = int(id_settings.get("mrd_padding", 4))
        
        patients_with_mrd = db.query(Patient.patient_u_id).filter(Patient.hospital_id == current_user.hospital_id).all()
        max_mrd = 0
        for p in patients_with_mrd:
            if not p.patient_u_id: continue
            numbers = re.findall(r'\d+', p.patient_u_id)
            if numbers:
                max_mrd = max(max_mrd, int(numbers[-1]))
        mrd_code = f"{mrd_prefix}{str(max_mrd + 1).zfill(mrd_padding)}{mrd_postfix}"
        
        new_patient = Patient(
            hospital_id=current_user.hospital_id,
            uhid=uhid_code,
            patient_u_id=mrd_code,
            ipd_number=generated_ipd,
            full_name=admission.patient_name,
            gender=admission.gender or "Other",
            age=str(admission.age) if admission.age is not None else None,
            phone=admission.contact_phone,
            doctor_name=admission.doctor_name,
            diagnosis=admission.diagnosis,
            remarks=admission.notes,
            admission_date=admission.admission_date or datetime.now()
        )
        db.add(new_patient)
        db.flush()  # populate new_patient.record_id
        patient_id = new_patient.record_id
    else:
        # Update existing patient with IPD and conditionally MRD
        existing_patient = db.query(Patient).filter(Patient.record_id == patient_id).first()
        if existing_patient:
            existing_patient.ipd_number = generated_ipd
            if not existing_patient.patient_u_id:
                mrd_prefix = id_settings.get("mrd_prefix", "MRD-")
                mrd_postfix = id_settings.get("mrd_postfix", "")
                mrd_padding = int(id_settings.get("mrd_padding", 4))
                
                patients_with_mrd = db.query(Patient.patient_u_id).filter(Patient.hospital_id == current_user.hospital_id).all()
                max_mrd = 0
                for p in patients_with_mrd:
                    if not p.patient_u_id: continue
                    numbers = re.findall(r'\d+', p.patient_u_id)
                    if numbers:
                        max_mrd = max(max_mrd, int(numbers[-1]))
                existing_patient.patient_u_id = f"{mrd_prefix}{str(max_mrd + 1).zfill(mrd_padding)}{mrd_postfix}"
            db.add(existing_patient)
            db.flush()
    
    # Create IPD admission
    new_admission = IPDAdmission(
        patient_id=patient_id,
        hospital_id=current_user.hospital_id,
        admission_date=admission.admission_date or datetime.now(),
        ward_id=admission.ward_id,
        bed_id=admission.bed_id,
        admitting_doctor_id=admission.admitting_doctor_id or current_user.user_id,
        diagnosis=admission.diagnosis,
        treatment_plan=admission.treatment_plan,
        is_mediclaim=admission.is_mediclaim,
        mediclaim_details=admission.mediclaim_details,
        status="admitted",
        vitals_log=[]
    )
    db.add(new_admission)
    db.flush()
    
    # Create Draft IPD Running Bill
    import time
    invoice_number = f"INV-IPD-{current_user.hospital_id}-{int(time.time())}"
    new_invoice = PatientInvoice(
        hospital_id=current_user.hospital_id,
        patient_id=patient_id,
        invoice_number=invoice_number,
        subtotal=0.0,
        total_amount=0.0,
        status="PENDING",
        remarks="IPD Running Bill",
        created_by=current_user.user_id
    )
    db.add(new_invoice)
    db.flush()
    
    new_admission.patient_invoice_id = new_invoice.invoice_id
    
    # Occupy bed
    bed.is_occupied = True  # type: ignore
    bed.status = "OCCUPIED"  # type: ignore
    
    # Update ward counter
    ward = db.query(Ward).filter(Ward.ward_id == admission.ward_id).first()
    if ward:
        ward.occupied_beds = db.query(Bed).filter(Bed.ward_id == ward.ward_id, Bed.is_occupied == True).count()  # type: ignore
        
    # Auto-close any active Emergency Visits for this patient
    active_er_visits = db.query(EmergencyVisit).filter(
        EmergencyVisit.patient_id == patient_id,
        EmergencyVisit.hospital_id == current_user.hospital_id,
        EmergencyVisit.status == "Active"
    ).all()
    for er_visit in active_er_visits:
        er_visit.status = "Admitted"
        
    db.commit()
    db.refresh(new_admission)
    return new_admission

@router.get("/admissions")
def get_admissions(
    status: Optional[str] = None,
    hospital_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all admissions"""
    effective_h_id = hospital_id or current_user.hospital_id
    query = db.query(IPDAdmission).filter(
        IPDAdmission.hospital_id == effective_h_id
    )
    
    if status:
        if status == "active":
            query = query.filter(IPDAdmission.status.in_(["admitted", "recovery"]))
        else:
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
            "mrd_number": patient.patient_u_id if patient else None,
            "ward_name": ward.ward_name if ward else None,
            "bed_number": bed.bed_number if bed else None,
            "admission_date": adm.admission_date,
            "discharge_date": adm.discharge_date,
            "diagnosis": adm.diagnosis,
            "doctor_name": patient.doctor_name if patient else None,
            "status": "active" if adm.status in ["admitted", "recovery"] else "discharged"
        })
    
    return result

@router.get("/admissions/active")
def get_active_admissions(
    hospital_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get active admissions"""
    effective_h_id = hospital_id or current_user.hospital_id
    admissions = db.query(IPDAdmission).filter(
        IPDAdmission.hospital_id == effective_h_id,
        IPDAdmission.status.in_(["admitted", "recovery"])
    ).all()
    
    result = []
    for adm in admissions:
        patient = db.query(Patient).filter(Patient.record_id == adm.patient_id).first()
        ward = db.query(Ward).filter(Ward.ward_id == adm.ward_id).first()
        bed = db.query(Bed).filter(Bed.bed_id == adm.bed_id).first()
        
        result.append({
            "admission_id": adm.admission_id,
            "patient_id": adm.patient_id,
            "patient_name": patient.full_name if patient else "Unknown",
            "mrd_number": patient.patient_u_id if patient else None,
            "ward_id": adm.ward_id,
            "ward_name": ward.ward_name if ward else None,
            "bed_id": adm.bed_id,
            "bed_number": bed.bed_number if bed else None,
            "admission_date": adm.admission_date,
            "discharge_date": adm.discharge_date,
            "diagnosis": adm.diagnosis,
            "status": adm.status,
            "pre_op_assessment": adm.pre_op_assessment,
            "post_op_assessment": adm.post_op_assessment
        })
    
    return result

@router.patch("/admissions/{admission_id}/ot-status")
def update_ot_status(
    admission_id: int,
    payload: OTStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update OT required status for an admission"""
    admission = db.query(IPDAdmission).filter(
        IPDAdmission.admission_id == admission_id,
        IPDAdmission.hospital_id == current_user.hospital_id
    ).first()
    
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    admission.ot_required = payload.ot_required
    db.commit()
    return {"message": "OT Status updated successfully", "ot_required": admission.ot_required}

@router.post("/admissions/{admission_id}/discharge")
def discharge_patient(
    admission_id: int,
    discharge_data: DischargeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Discharge patient and generate preliminary IPD bill"""
    admission = db.query(IPDAdmission).filter(
        IPDAdmission.admission_id == admission_id,
        IPDAdmission.hospital_id == current_user.hospital_id
    ).first()
    
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    if admission.status == "discharged":
        raise HTTPException(status_code=400, detail="Patient is already discharged")
        
    # Set discharge time
    discharge_date = discharge_data.discharge_date or datetime.now()
    
    # Ensure both datetimes are timezone-aware or both timezone-naive
    if admission.admission_date.tzinfo is not None and discharge_date.tzinfo is None:
        from datetime import timezone
        discharge_date = discharge_date.replace(tzinfo=timezone.utc)
    elif admission.admission_date.tzinfo is None and discharge_date.tzinfo is not None:
        discharge_date = discharge_date.replace(tzinfo=None)
    
    time_diff = discharge_date - admission.admission_date
    fallback_days = max(1, time_diff.days + (1 if time_diff.seconds > 0 else 0))
    
    # Calculate bed charges using bed_history if available
    room_total = 0.0
    items_to_add = []
    days_admitted = 0
    ward = db.query(Ward).filter(Ward.ward_id == admission.ward_id).first()
    
    if admission.bed_history:
        all_wards = {w.ward_id: w for w in db.query(Ward).all()}
        
        current_date = admission.admission_date.date()
        end_date_only = discharge_date.date()
        
        history = list(admission.bed_history)
        history.append({
            "ward_id": admission.ward_id,
            "start_date": history[-1].get("end_date") if history else admission.admission_date.isoformat(),
            "end_date": discharge_date.isoformat()
        })
        
        while current_date <= end_date_only:
            day_wards = []
            for h in history:
                if not h.get("start_date") or not h.get("end_date"):
                    continue
                h_start = datetime.fromisoformat(h["start_date"].replace('Z', '+00:00')).date()
                h_end = datetime.fromisoformat(h["end_date"].replace('Z', '+00:00')).date()
                if h_start <= current_date <= h_end:
                    day_wards.append(h["ward_id"])
            
            if not day_wards:
                day_wards = [admission.ward_id]
                
            max_charge = 0.0
            for wid in day_wards:
                w = all_wards.get(wid)
                charge = w.daily_charge if w and getattr(w, "daily_charge", None) else 500.0
                if charge > max_charge:
                    max_charge = charge
            
            if max_charge == 0.0:
                max_charge = 500.0
                
            room_total += max_charge
            days_admitted += 1
            current_date += timedelta(days=1)
            
        items_to_add.append({
            "description": f"IPD Room Charge ({days_admitted} days with ward transfers)",
            "qty": 1,
            "unit_price": room_total,
            "amount": room_total,
            "charge_type": "IPD_ADMISSION",
            "reference_id": admission.admission_id
        })
    else:
        days_admitted = fallback_days
        daily_charge = ward.daily_charge if ward and getattr(ward, "daily_charge", None) else 500.0
        room_total = days_admitted * daily_charge
        items_to_add.append({
            "description": f"IPD Room Charge ({days_admitted} days @ ₹{daily_charge})",
            "qty": 1,
            "unit_price": room_total,
            "amount": room_total,
            "charge_type": "IPD_ADMISSION",
            "reference_id": admission.admission_id
        })
    
    # Resolve discharge notes (frontend sends discharge_notes, but schema supports discharge_summary as well)
    discharge_notes_text = discharge_data.discharge_summary or discharge_data.discharge_notes
    
    # Finalize Invoice (Using Existing Running Bill or Create New if missing)
    if admission.patient_invoice_id:
        invoice = db.query(PatientInvoice).filter(PatientInvoice.invoice_id == admission.patient_invoice_id).first()
    else:
        invoice = None
        
    old_invoice_total = invoice.total_amount if invoice else 0.0
    
    doctor_charge = ward.doctor_charge if ward and getattr(ward, "doctor_charge", None) else 0.0
    if doctor_charge > 0:
        doc_total = days_admitted * doctor_charge
        items_to_add.append({
            "description": f"Doctor Charge ({days_admitted} days @ ₹{doctor_charge})",
            "qty": 1,
            "unit_price": doc_total,
            "amount": doc_total,
            "charge_type": "IPD_ADMISSION",
            "reference_id": admission.admission_id
        })
        
    nursing_charge = ward.nursing_charge if ward and getattr(ward, "nursing_charge", None) else 0.0
    if nursing_charge > 0:
        nurse_total = days_admitted * nursing_charge
        items_to_add.append({
            "description": f"Nursing Charge ({days_admitted} days @ ₹{nursing_charge})",
            "qty": 1,
            "unit_price": nurse_total,
            "amount": nurse_total,
            "charge_type": "IPD_ADMISSION",
            "reference_id": admission.admission_id
        })
        
    bio_medical_wastage_charge = ward.bio_medical_wastage_charge if ward and getattr(ward, "bio_medical_wastage_charge", None) else 0.0
    if bio_medical_wastage_charge > 0:
        bio_total = days_admitted * bio_medical_wastage_charge
        items_to_add.append({
            "description": f"BIO Medical Wastage Charge ({days_admitted} days @ ₹{bio_medical_wastage_charge})",
            "qty": 1,
            "unit_price": bio_total,
            "amount": bio_total,
            "charge_type": "IPD_ADMISSION",
            "reference_id": admission.admission_id
        })

    # Admitting Doctor Charge (if PER_DAY)
    if admission.doctor and getattr(admission.doctor, "ipd_charge_type", "PER_DAY") == "PER_DAY":
        doc_charge = getattr(admission.doctor, "ipd_charge", 0.0)
        if doc_charge > 0:
            doc_total = days_admitted * doc_charge
            items_to_add.append({
                "description": f"Consulting Doctor Charge - {admission.doctor.full_name} ({days_admitted} days @ ₹{doc_charge})",
                "qty": 1,
                "unit_price": doc_total,
                "amount": doc_total,
                "charge_type": "DOCTOR_CHARGE",
                "reference_id": admission.admission_id
            })
            
    # Manual Doctor Visits (PER_VISIT)
    if hasattr(admission, "doctor_visits") and admission.doctor_visits:
        for visit in admission.doctor_visits:
            doc_name = visit.doctor.full_name if visit.doctor else "Unknown Doctor"
            visit_desc = f"Doctor Visit - {doc_name}"
            if visit.notes:
                visit_desc += f" ({visit.notes})"
            visit_amount = float(visit.charge_amount)
            items_to_add.append({
                "description": visit_desc,
                "qty": 1,
                "unit_price": visit_amount,
                "amount": visit_amount,
                "charge_type": "DOCTOR_VISIT",
                "reference_id": visit.visit_id
            })
    
    # 2. Registration Fee (First-Time)
    invoice_count = db.query(PatientInvoice).filter(PatientInvoice.patient_id == admission.patient_id).count()
    if invoice_count == 0:
        hospital = admission.patient.hospital if admission.patient else None
        raw_reg_fee = getattr(hospital, "patient_registration_fee", 500.0) if hospital else 500.0
        reg_fee = float(raw_reg_fee or 500.0)
        items_to_add.append({
            "description": "Patient Registration Fee (First-Time)",
            "qty": 1,
            "unit_price": reg_fee,
            "amount": reg_fee,
            "charge_type": "REGISTRATION_FEE",
            "reference_id": admission.patient_id
        })
        
    # 3. OT Charge
    if getattr(admission, "ot_required", False):
        hospital = admission.patient.hospital if admission.patient else None
        raw_ot_charge = getattr(hospital, "ot_base_charge", 15000.0) if hospital else 15000.0
        ot_charge = float(raw_ot_charge or 15000.0)
        items_to_add.append({
            "description": "Operation Theatre (OT) Base Charge",
            "qty": 1,
            "unit_price": ot_charge,
            "amount": ot_charge,
            "charge_type": "OT_CHARGE",
            "reference_id": admission.admission_id
        })
        
    # 4. Medication administrations (nursing charge)
    nursing_charge_rate = 150.0
    hospital = admission.patient.hospital if admission.patient else None
    if hospital and getattr(hospital, "nursing_base_charge", None) is not None:
        nursing_charge_rate = float(hospital.nursing_base_charge)
        
    med_logs = admission.medication_log or []
    for log in med_logs:
        med_name = log.get("medicine_name", "Unknown Medicine")
        notes = log.get("notes")
        desc = f"Medication Administered: {med_name}"
        if notes:
            desc += f" ({notes})"
        items_to_add.append({
            "description": desc,
            "qty": 1,
            "unit_price": nursing_charge_rate,
            "amount": nursing_charge_rate,
            "charge_type": "MEDICINE",
            "reference_id": admission.admission_id
        })
        
    # 5. Doctor IPD visits (from doctor notes)
    from ..models import DoctorProfile
    doctor_notes = admission.doctor_notes or []
    for dnote in doctor_notes:
        d_user_id = dnote.get("doctor_id")
        doc_profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == d_user_id).first() if d_user_id else None
        ipd_charge = getattr(doc_profile, "ipd_charge", 0.0) if doc_profile else 0.0
        if ipd_charge is None:
            ipd_charge = 0.0
        if ipd_charge > 0:
            desc = f"Doctor IPD Visit: {dnote.get('doctor_name', 'Unknown')}"
            if dnote.get("note_type"):
                desc += f" ({dnote.get('note_type')})"
            items_to_add.append({
                "description": desc,
                "qty": 1,
                "unit_price": float(ipd_charge),
                "amount": float(ipd_charge),
                "charge_type": "IPD_DOCTOR_VISIT",
                "reference_id": admission.admission_id
            })

    # Calculate GST rate
    hospital = db.query(Hospital).filter(Hospital.hospital_id == current_user.hospital_id).first()
    gst_rate = 18.0 if hospital and hospital.gst_number else 0.0

    if invoice:
        # Add new items to existing invoice
        for item in items_to_add:
            inv_item = PatientInvoiceItem(
                invoice_id=invoice.invoice_id,
                description=item["description"],
                qty=item["qty"],
                unit_price=item["unit_price"],
                amount=item["amount"],
                charge_type=item["charge_type"],
                reference_id=item["reference_id"]
            )
            db.add(inv_item)
        db.flush()
        
        # Recalculate totals
        all_items = db.query(PatientInvoiceItem).filter(PatientInvoiceItem.invoice_id == invoice.invoice_id).all()
        new_subtotal = sum(i.amount for i in all_items)
        invoice.subtotal = new_subtotal
        invoice.gst_rate = gst_rate
        invoice.tax_amount = round((new_subtotal * gst_rate) / 100.0, 2)
        invoice.total_amount = max(0.0, float(round(new_subtotal + invoice.tax_amount - (invoice.discount_amount or 0.0))))
        if discharge_notes_text:
            invoice.remarks = (invoice.remarks or "") + "\n\nDischarge Summary:\n" + discharge_notes_text
    else:
        import time
        invoice_number = f"INV-IPD-{current_user.hospital_id}-{int(time.time())}"
        
        new_subtotal = sum(item["amount"] for item in items_to_add)
        tax_amount = round((new_subtotal * gst_rate) / 100.0, 2)
        total_amount = max(0.0, float(round(new_subtotal + tax_amount)))
        
        invoice = PatientInvoice(
            hospital_id=current_user.hospital_id,
            patient_id=admission.patient_id,
            invoice_number=invoice_number,
            subtotal=new_subtotal,
            discount_amount=0.0,
            gst_rate=gst_rate,
            tax_amount=tax_amount,
            total_amount=total_amount,
            status="PENDING",
            remarks=discharge_notes_text or "IPD Discharge Bill",
            created_by=current_user.user_id
        )
        db.add(invoice)
        db.flush()
        
        for item in items_to_add:
            inv_item = PatientInvoiceItem(
                invoice_id=invoice.invoice_id,
                description=item["description"],
                qty=item["qty"],
                unit_price=item["unit_price"],
                amount=item["amount"],
                charge_type=item["charge_type"],
                reference_id=item["reference_id"]
            )
            db.add(inv_item)
        db.flush()

    # Update admission status
    admission.status = "discharged"
    admission.discharge_date = discharge_date
    admission.patient_invoice_id = invoice.invoice_id
    
    # Update patient total bill & discharge date
    patient = db.query(Patient).filter(Patient.record_id == admission.patient_id).first()
    if patient:
        invoice_diff = invoice.total_amount - old_invoice_total
        patient.total_bill_amount = (patient.total_bill_amount or 0.0) + invoice_diff
        patient.discharge_date = discharge_date

    # Generate PDF statement asynchronously/locally
    try:
        from ..services.patient_billing_service import PatientBillingService
        PatientBillingService.generate_pdf_file(invoice, db)
    except Exception as pdf_err:
        logger.error(f"Failed to auto-generate PDF for IPD invoice {invoice.invoice_number}: {pdf_err}")
    
    # Add structured notes for discharge summary if provided
    notes = admission.doctor_notes or []
    
    if discharge_notes_text:
        notes.append({
            "timestamp": discharge_date.isoformat(),
            "doctor_id": current_user.user_id,
            "doctor_name": current_user.full_name,
            "note_type": "Discharge Summary",
            "content": discharge_notes_text
        })

    structured_fields = {
        "Discharge_History": discharge_data.history,
        "Discharge_Final_Diagnosis": discharge_data.final_diagnosis,
        "Discharge_Operative_Note": discharge_data.operative_note,
        "Discharge_Advice": discharge_data.advice_on_discharge,
        "Discharge_General_Advice": discharge_data.general_advice,
        "Discharge_Follow_Up_Plan": discharge_data.follow_up_plan,
        "Discharge_Include_Investigations": str(discharge_data.include_investigations) if discharge_data.include_investigations else "False"
    }
    
    for note_type, content in structured_fields.items():
        if content and content != "False":
            notes.append({
                "timestamp": discharge_date.isoformat(),
                "doctor_id": current_user.user_id,
                "doctor_name": current_user.full_name,
                "note_type": note_type,
                "content": content
            })
            
    admission.doctor_notes = list(notes)
    
    # Free up bed
    bed = db.query(Bed).filter(Bed.bed_id == admission.bed_id).first()
    if bed:
        bed.is_occupied = False  # type: ignore
        bed.status = "AVAILABLE"  # type: ignore
        
        # Update ward counter
        if ward:
            ward.occupied_beds = db.query(Bed).filter(Bed.ward_id == ward.ward_id, Bed.is_occupied == True).count()  # type: ignore
            
    db.commit()
    db.refresh(admission)
    return {"message": "Patient discharged successfully", "invoice_id": invoice.invoice_id, "admission_id": admission.admission_id}

@router.get("/admissions/alerts")
def get_medication_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch due or overdue medication alerts for all active admissions"""
    active_admissions = db.query(IPDAdmission).filter(
        IPDAdmission.hospital_id == current_user.hospital_id,
        IPDAdmission.status.in_(["admitted", "recovery"])
    ).all()
    
    alerts = []
    from datetime import datetime
    now = datetime.now()
    
    for adm in active_admissions:
        patient = db.query(Patient).filter(Patient.record_id == adm.patient_id).first()
        ward = db.query(Ward).filter(Ward.ward_id == adm.ward_id).first()
        bed = db.query(Bed).filter(Bed.bed_id == adm.bed_id).first()
        
        for order in (adm.medication_orders or []):
            next_due_str = order.get("next_due")
            if next_due_str:
                try:
                    next_due_dt = datetime.fromisoformat(next_due_str)
                    # Alert if next_due is in the past, or due within next 1 hour
                    time_diff = next_due_dt - now
                    is_due = next_due_dt <= now or time_diff.total_seconds() <= 3600
                    
                    if is_due:
                        alerts.append({
                            "type": "medication",
                            "admission_id": adm.admission_id,
                            "patient_name": patient.full_name if patient else "Unknown",
                            "ward_name": ward.ward_name if ward else "Unknown",
                            "bed_number": bed.bed_number if bed else "Unknown",
                            "order_id": order.get("id"),
                            "medicine_name": order.get("medicine_name"),
                            "dosage": order.get("dosage"),
                            "frequency": order.get("frequency"),
                            "next_due": next_due_str,
                            "overdue_seconds": max(0, int((now - next_due_dt).total_seconds()))
                        })
                except Exception:
                    pass

        # Check for abnormal vitals in the latest reading
        if adm.vitals_log and len(adm.vitals_log) > 0:
            latest_vitals = adm.vitals_log[-1]
            abnormal_flags = []
            
            try:
                temp = float(latest_vitals.get("temp", 0)) if latest_vitals.get("temp") else None
                if temp and (temp > 99.5 or temp < 97.0): abnormal_flags.append(f"Temp: {temp}")
            except: pass
            
            try:
                pulse = float(latest_vitals.get("pulse", 0)) if latest_vitals.get("pulse") else None
                if pulse and (pulse > 100 or pulse < 60): abnormal_flags.append(f"Pulse: {pulse}")
            except: pass
            
            try:
                spo2 = float(latest_vitals.get("spo2", 0)) if latest_vitals.get("spo2") else None
                if spo2 and spo2 < 95: abnormal_flags.append(f"SpO2: {spo2}%")
            except: pass
            
            try:
                bp = latest_vitals.get("bp", "")
                if bp and "/" in bp:
                    sys, dia = map(float, bp.split("/"))
                    if sys > 140 or sys < 90 or dia > 90 or dia < 60:
                        abnormal_flags.append(f"BP: {bp}")
            except: pass

            if abnormal_flags:
                alerts.append({
                    "type": "vitals",
                    "admission_id": adm.admission_id,
                    "patient_name": patient.full_name if patient else "Unknown",
                    "ward_name": ward.ward_name if ward else "Unknown",
                    "bed_number": bed.bed_number if bed else "Unknown",
                    "abnormal_flags": abnormal_flags,
                    "recorded_at": latest_vitals.get("timestamp")
                })

    return alerts

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
    from ..models import Surgery
    surgeries = db.query(Surgery).filter(
        Surgery.admission_id == admission_id,
        Surgery.hospital_id == current_user.hospital_id
    ).all()
    
    return {
        "admission": admission,
        "patient": patient,
        "ward": ward,
        "bed": bed,
        "surgeries": surgeries
    }

@router.get("/admissions/{admission_id}/lab-results")
def get_ipd_lab_results(
    admission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all lab results for an IPD admission"""
    from ..models import LabOrder, LabResult, LabTestCatalog
    
    admission = db.query(IPDAdmission).filter(
        IPDAdmission.admission_id == admission_id,
        IPDAdmission.hospital_id == current_user.hospital_id
    ).first()
    
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    orders = db.query(LabOrder, LabResult, LabTestCatalog)\
        .join(LabResult, LabOrder.order_id == LabResult.order_id)\
        .join(LabTestCatalog, LabResult.test_id == LabTestCatalog.test_id)\
        .filter(LabOrder.visit_type == "IPD")\
        .filter(LabOrder.visit_id == admission_id)\
        .order_by(LabOrder.ordered_at.desc())\
        .all()
        
    result = []
    for order, res, test in orders:
        result.append({
            "order_id": order.order_id,
            "test_name": test.test_name,
            "test_id": test.test_id,
            "status": order.status,
            "ordered_at": order.ordered_at,
            "result_value": res.result_value,
            "reference_range": res.reference_range,
            "remarks": res.remarks,
            "completed_at": res.completed_at
        })
    return result

@router.post("/admissions/{admission_id}/transfer")
def transfer_patient(
    admission_id: int,
    transfer: BedTransfer,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Transfer patient to a new bed"""
    admission = db.query(IPDAdmission).filter(
        IPDAdmission.admission_id == admission_id,
        IPDAdmission.hospital_id == current_user.hospital_id
    ).first()
    if not admission or admission.status not in ["admitted", "recovery"]:
        raise HTTPException(status_code=404, detail="Active admission not found")
        
    new_bed = db.query(Bed).filter(Bed.bed_id == transfer.new_bed_id).first()
    if not new_bed or new_bed.is_occupied or new_bed.status != "AVAILABLE":
        raise HTTPException(status_code=400, detail="New bed is not available")
        
    # Gender validation against new Ward
    patient = db.query(Patient).filter(Patient.record_id == admission.patient_id).first()
    if patient and patient.gender:
        ward = db.query(Ward).filter(Ward.ward_id == new_bed.ward_id).first()
        if ward and ward.ward_name:
            ward_name_lower = ward.ward_name.lower()
            patient_gender_lower = patient.gender.lower()
            
            is_female_ward = "female" in ward_name_lower
            is_male_ward = "male" in ward_name_lower and not is_female_ward
            
            if is_female_ward and patient_gender_lower == "male":
                raise HTTPException(status_code=400, detail="Male patients cannot be transferred to a Female ward.")
            if is_male_ward and patient_gender_lower == "female":
                raise HTTPException(status_code=400, detail="Female patients cannot be transferred to a Male ward.")
        
    old_bed = db.query(Bed).filter(Bed.bed_id == admission.bed_id).first()
    
    # Detach from old bed
    if old_bed:
        old_bed.is_occupied = False  # type: ignore
        old_bed.status = "AVAILABLE"  # type: ignore
        
        old_ward = db.query(Ward).filter(Ward.ward_id == old_bed.ward_id).first()
        if old_ward:
            old_ward.occupied_beds = db.query(Bed).filter(Bed.ward_id == old_ward.ward_id, Bed.is_occupied == True).count()  # type: ignore
    
    # Attach to new bed
    new_bed.is_occupied = True  # type: ignore
    new_bed.status = "OCCUPIED"  # type: ignore
    
    new_ward = db.query(Ward).filter(Ward.ward_id == new_bed.ward_id).first()
    if new_ward:
        new_ward.occupied_beds = db.query(Bed).filter(Bed.ward_id == new_ward.ward_id, Bed.is_occupied == True).count()  # type: ignore
        
    # Record bed history
    history = list(admission.bed_history) if admission.bed_history else []
    now = datetime.utcnow().isoformat()
    start_date = admission.admission_date.isoformat() if not history else history[-1].get("end_date")
    
    history.append({
        "ward_id": admission.ward_id,
        "bed_id": admission.bed_id,
        "start_date": start_date,
        "end_date": now,
        "transfer_reason": transfer.reason
    })
    
    admission.bed_history = history # type: ignore
    
    admission.bed_id = new_bed.bed_id  # type: ignore
    admission.ward_id = new_bed.ward_id  # type: ignore
    
    # Move equipment if attached to bed
    if old_bed:
        equipments = db.query(MedicalEquipment).filter(MedicalEquipment.current_bed_id == old_bed.bed_id).all()
        for eq in equipments:
            eq.current_bed_id = new_bed.bed_id  # type: ignore
            eq.current_ward_id = new_bed.ward_id  # type: ignore
    
    db.commit()
    db.refresh(admission)
    return admission

@router.post("/admissions/{admission_id}/clearance")
def update_clearance(
    admission_id: int,
    update: ClearanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    admission = db.query(IPDAdmission).filter(
        IPDAdmission.admission_id == admission_id,
        IPDAdmission.hospital_id == current_user.hospital_id
    ).first()
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    if update.medical_cleared is not None:
        admission.medical_cleared = update.medical_cleared
    if update.pharmacy_cleared is not None:
        admission.pharmacy_cleared = update.pharmacy_cleared
    if update.billing_cleared is not None:
        admission.billing_cleared = update.billing_cleared
        
    db.commit()
    db.refresh(admission)
    return admission

@router.post("/admissions/{admission_id}/diet")
def add_diet_order(
    admission_id: int,
    order: DietOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    admission = db.query(IPDAdmission).filter(
        IPDAdmission.admission_id == admission_id,
        IPDAdmission.hospital_id == current_user.hospital_id
    ).first()
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    import uuid
    diet_orders = list(admission.diet_orders) if admission.diet_orders else []
    
    new_order = {
        "id": uuid.uuid4().hex[:8],
        "diet_type": order.diet_type,
        "instructions": order.instructions,
        "prescribed_by": current_user.full_name,
        "timestamp": datetime.utcnow().isoformat(),
        "status": "active"
    }
    
    diet_orders.append(new_order)
    admission.diet_orders = diet_orders # type: ignore
    
    db.commit()
    db.refresh(admission)
    return admission

@router.post("/admissions/{admission_id}/orders")
def add_doctor_order(
    admission_id: int,
    order: MedicationOrder,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a medication order (Doctor)"""
    check_doctor_role(current_user)
    admission = db.query(IPDAdmission).filter(
        IPDAdmission.admission_id == admission_id,
        IPDAdmission.hospital_id == current_user.hospital_id
    ).first()
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    import uuid
    raw_orders = admission.medication_orders
    orders = list(raw_orders) if isinstance(raw_orders, list) else []
    
    freq_hours = order.frequency_hours if order.frequency_hours is not None else 12
    next_due_dt = datetime.now() + timedelta(hours=freq_hours)
    
    new_order = {
        "id": uuid.uuid4().hex[:8],
        "medicine_name": order.medicine_name,
        "dosage": order.dosage,
        "qty": order.qty,
        "frequency": order.frequency,
        "frequency_hours": freq_hours,
        "notes": order.notes,
        "route": order.route,
        "dosage_unit": order.dosage_unit,
        "duration_days": order.duration_days,
        "special_instructions": order.special_instructions,
        "purchased": False,
        "purchased_at": None,
        "status": "active",
        "start_date": datetime.now().isoformat(),
        "next_due": next_due_dt.isoformat(),
        "prescribed_by": current_user.full_name,
        "history": [{
            "action": "created",
            "timestamp": datetime.now().isoformat(),
            "actor": current_user.full_name,
            "details": f"Prescribed {order.medicine_name} {order.dosage} {order.frequency}"
        }]
    }
    orders.append(new_order)
    admission.medication_orders = orders  # type: ignore
    db.commit()
    return new_order

@router.put("/admissions/{admission_id}/orders/{order_id}")
def update_doctor_order(
    admission_id: int,
    order_id: str,
    order: MedicationOrder,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Edit a medication order (Doctor)"""
    check_doctor_role(current_user)
    admission = db.query(IPDAdmission).filter(
        IPDAdmission.admission_id == admission_id,
        IPDAdmission.hospital_id == current_user.hospital_id
    ).first()
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    raw_orders = admission.medication_orders
    orders = list(raw_orders) if isinstance(raw_orders, list) else []
    
    order_found = False
    for o in orders:
        if o.get("id") == order_id:
            old_dosage = o.get("dosage")
            old_qty = o.get("qty")
            old_freq = o.get("frequency")
            o["medicine_name"] = order.medicine_name
            o["dosage"] = order.dosage
            o["qty"] = order.qty
            o["frequency"] = order.frequency
            o["frequency_hours"] = order.frequency_hours if order.frequency_hours is not None else 12
            o["notes"] = order.notes
            o["route"] = order.route
            o["dosage_unit"] = order.dosage_unit
            o["duration_days"] = order.duration_days
            o["special_instructions"] = order.special_instructions
            
            if "history" not in o:
                o["history"] = []
                
            o["history"].append({
                "action": "edited",
                "timestamp": datetime.now().isoformat(),
                "actor": current_user.full_name,
                "details": f"Edited: {old_dosage} {old_freq} -> {order.dosage} {order.frequency}"
            })
            order_found = True
            break
            
    if not order_found:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Reassign to trigger JSON update in SQLAlchemy
    admission.medication_orders = list(orders)
    db.commit()
    return {"message": "Order updated"}

@router.delete("/admissions/{admission_id}/orders/{order_id}")
def delete_doctor_order(
    admission_id: int,
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete (stop) a medication order (Doctor)"""
    check_doctor_role(current_user)
    admission = db.query(IPDAdmission).filter(
        IPDAdmission.admission_id == admission_id,
        IPDAdmission.hospital_id == current_user.hospital_id
    ).first()
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    raw_orders = admission.medication_orders
    orders = list(raw_orders) if isinstance(raw_orders, list) else []
    
    order_found = False
    for o in orders:
        if o.get("id") == order_id:
            o["status"] = "deleted"
            if "history" not in o:
                o["history"] = []
            o["history"].append({
                "action": "deleted",
                "timestamp": datetime.now().isoformat(),
                "actor": current_user.full_name,
                "details": "Order stopped/deleted"
            })
            order_found = True
            break
            
    if not order_found:
        raise HTTPException(status_code=404, detail="Order not found")
        
    admission.medication_orders = list(orders)
    db.commit()
    return {"message": "Order deleted"}

@router.post("/admissions/{admission_id}/orders/{order_id}/purchase")
def mark_order_purchased(
    admission_id: int,
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a medication order as sent to pharmacy/purchased"""
    admission = db.query(IPDAdmission).filter(
        IPDAdmission.admission_id == admission_id,
        IPDAdmission.hospital_id == current_user.hospital_id
    ).first()
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    raw_orders = admission.medication_orders
    orders = list(raw_orders) if isinstance(raw_orders, list) else []
    
    order_found = False
    for o in orders:
        if o.get("id") == order_id:
            o["purchased"] = True
            o["purchased_at"] = datetime.now().isoformat()
            if "history" not in o:
                o["history"] = []
            o["history"].append({
                "action": "purchased",
                "timestamp": datetime.now().isoformat(),
                "actor": current_user.full_name,
                "details": "Marked as purchased / sent to pharmacy"
            })
            order_found = True
            break
            
    if not order_found:
        raise HTTPException(status_code=404, detail="Order not found")
        
    admission.medication_orders = list(orders)
    db.commit()
    return {"message": "Order marked as purchased"}

@router.post("/admissions/{admission_id}/orders/whatsapp")
def send_prescriptions_whatsapp(
    admission_id: int,
    req: WhatsAppPrescriptionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send selected active prescriptions to the patient's WhatsApp"""
    admission = db.query(IPDAdmission).filter(
        IPDAdmission.admission_id == admission_id,
        IPDAdmission.hospital_id == current_user.hospital_id
    ).first()
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    patient = db.query(Patient).filter(Patient.record_id == admission.patient_id).first()
    if not patient or not patient.contact_phone:
        raise HTTPException(status_code=400, detail="Patient does not have a contact phone number")

    raw_orders = admission.medication_orders
    orders = list(raw_orders) if isinstance(raw_orders, list) else []
    
    # Filter for requested orders that are not deleted
    target_orders = [o for o in orders if o.get("id") in req.order_ids and o.get("status") != "deleted"]
    
    if not target_orders:
        raise HTTPException(status_code=400, detail="No valid active orders found for the given IDs")

    # Build message
    hospital_name = current_user.hospital.name if current_user.hospital else "Hospital"
    msg_lines = [f"*Prescription Details from {hospital_name}*", ""]
    msg_lines.append(f"Patient Name: {patient.first_name} {patient.last_name}")
    msg_lines.append(f"Doctor: {admission.admitting_doctor_id or 'Assigned Doctor'}")
    msg_lines.append("")
    msg_lines.append("*Medications:*")
    
    for o in target_orders:
        msg_lines.append(f"• {o.get('medicine_name')} - {o.get('dosage')}")
        msg_lines.append(f"  Frequency: {o.get('frequency')}")
        if o.get('notes'):
            msg_lines.append(f"  Instructions: {o.get('notes')}")
        msg_lines.append("")
        
    msg_lines.append("Please ensure timely administration of the medications. Get well soon!")
    
    # Queue WhatsApp Message
    new_message = WhatsAppMessageQueue(
        hospital_id=current_user.hospital_id,
        phone_number=patient.contact_phone,
        message_text="\n".join(msg_lines),
        status="pending"
    )
    db.add(new_message)
    
    # Update orders to mark as sent
    for o in orders:
        if o.get("id") in req.order_ids:
            o["whatsapp_sent"] = True
            o["whatsapp_sent_at"] = datetime.now().isoformat()
            
    admission.medication_orders = list(orders)
    db.commit()
    
    # Attempt to send immediately if evolution API is running (optional logic, but we can just leave it to queue or we can use requests like in whatsapp.py)
    # We will just rely on the queue worker or similar for now.
    
    return {"message": f"WhatsApp prescription sent for {len(target_orders)} medications"}

@router.post("/admissions/{admission_id}/medication")
def administer_medication(
    admission_id: int,
    med_log: MedicationLogRecord,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Log administered medication (Nurse)"""
    check_nurse_or_doctor_role(current_user)
    admission = db.query(IPDAdmission).filter(
        IPDAdmission.admission_id == admission_id,
        IPDAdmission.hospital_id == current_user.hospital_id
    ).first()
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    # Advance next_due in medication_orders type-safely
    raw_orders = admission.medication_orders
    orders = list(raw_orders) if isinstance(raw_orders, list) else []
    order_found = False
    freq_hours = 12
    for o in orders:
        if isinstance(o, dict) and o.get("id") == med_log.order_id:
            order_found = True
            freq_hours = o.get("frequency_hours", 12)
            o["next_due"] = (datetime.now() + timedelta(hours=freq_hours)).isoformat()
            break
            
    if order_found:
        admission.medication_orders = orders  # type: ignore
        
    raw_log = admission.medication_log
    log = list(raw_log) if isinstance(raw_log, list) else []
    new_log = {
        "timestamp": datetime.now().isoformat(),
        "order_id": med_log.order_id,
        "medicine_name": med_log.medicine_name,
        "notes": med_log.notes,
        "administered_by": current_user.full_name
    }
    log.append(new_log)
    admission.medication_log = log  # type: ignore
    
    # Billing Hook: If patient already has a linked PatientInvoice, add medication fee directly
    if admission.patient_invoice_id:
        from ..models import PatientInvoiceItem, PatientInvoice
        item_desc = f"Medication Administered: {med_log.medicine_name}"
        unit_price = 150.0
        new_inv_item = PatientInvoiceItem(
            invoice_id=admission.patient_invoice_id,
            description=item_desc,
            qty=1,
            unit_price=unit_price,
            discount=0.0,
            amount=unit_price,
            charge_type="MEDICINE",
            reference_id=admission.admission_id
        )
        db.add(new_inv_item)
        
        invoice = db.query(PatientInvoice).filter(PatientInvoice.invoice_id == admission.patient_invoice_id).first()
        if invoice:
            subtotal_val = float(invoice.subtotal) if invoice.subtotal is not None else 0.0  # type: ignore
            gst_rate_val = float(invoice.gst_rate) if invoice.gst_rate is not None else 18.0  # type: ignore
            discount_val = float(invoice.discount_amount) if invoice.discount_amount is not None else 0.0  # type: ignore
            
            new_subtotal = subtotal_val + unit_price
            new_tax = round((new_subtotal * gst_rate_val) / 100.0, 2)
            
            invoice.subtotal = new_subtotal  # type: ignore
            invoice.tax_amount = new_tax  # type: ignore
            invoice.total_amount = round(new_subtotal - discount_val + new_tax)  # type: ignore
            
    db.commit()
    return new_log



@router.post("/admissions/{admission_id}/notes")
def add_doctor_note(
    admission_id: int,
    note: DoctorNote,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a ward round note (Doctor)"""
    check_doctor_role(current_user)
    admission = db.query(IPDAdmission).filter(
        IPDAdmission.admission_id == admission_id,
        IPDAdmission.hospital_id == current_user.hospital_id
    ).first()
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    notes_list = list(admission.doctor_notes or [])  # type: ignore
    new_note = {
        "timestamp": datetime.now().isoformat(),
        "doctor_id": current_user.user_id,
        "doctor_name": current_user.full_name,
        "note_type": note.note_type,
        "content": note.content
    }
    notes_list.append(new_note)
    admission.doctor_notes = notes_list  # type: ignore
    db.commit()
    return new_note

@router.post("/admissions/{admission_id}/vitals")
def record_vitals(
    admission_id: int,
    vitals: VitalsRecord,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Log daily vitals for admitted patient"""
    check_nurse_or_doctor_role(current_user)
    admission = db.query(IPDAdmission).filter(
        IPDAdmission.admission_id == admission_id,
        IPDAdmission.hospital_id == current_user.hospital_id
    ).first()
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    log = list(admission.vitals_log or [])  # type: ignore
    log.append({
        "timestamp": datetime.now().isoformat(),
        "temp": vitals.temp,
        "bp": vitals.bp,
        "pulse": vitals.pulse,
        "spo2": vitals.spo2,
        "respiratory_rate": vitals.respiratory_rate,
        "notes": vitals.notes,
        "recorded_by": current_user.full_name
    })
    
    admission.vitals_log = log  # type: ignore
    db.commit()
    return {"message": "Vitals logged", "vitals_log": log}

@router.post("/admissions/{admission_id}/fluid-balance")
def record_fluid_balance(
    admission_id: int,
    fluid: FluidBalanceRecord,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Log fluid balance intake/output"""
    check_nurse_or_doctor_role(current_user)
    admission = db.query(IPDAdmission).filter(
        IPDAdmission.admission_id == admission_id,
        IPDAdmission.hospital_id == current_user.hospital_id
    ).first()
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    log = list(admission.fluid_balance_log or [])  # type: ignore
    log.append({
        "timestamp": datetime.now().isoformat(),
        "type": fluid.type,
        "fluid_type": fluid.fluid_type,
        "amount_ml": fluid.amount_ml,
        "notes": fluid.notes,
        "recorded_by": current_user.full_name
    })
    
    admission.fluid_balance_log = log  # type: ignore
    db.commit()
    return {"message": "Fluid balance logged", "fluid_balance_log": log}



# --- Operation Theater (OT) Management ---

@router.post("/ots")
def create_ot(
    ot: OTCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register new Operation Theater Room"""
    new_ot = OperationTheater(
        hospital_id=current_user.hospital_id,
        ot_name=ot.ot_name,
        ot_type=ot.ot_type,
        status="AVAILABLE"
    )
    db.add(new_ot)
    db.commit()
    db.refresh(new_ot)
    return new_ot

@router.patch("/ots/{ot_id}")
def update_ot(
    ot_id: int,
    payload: OTCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing Operation Theater Room"""
    ot = db.query(OperationTheater).filter(
        OperationTheater.ot_id == ot_id,
        OperationTheater.hospital_id == current_user.hospital_id
    ).first()
    
    if not ot:
        raise HTTPException(status_code=404, detail="OT Room not found")
        
    ot.ot_name = payload.ot_name
    ot.ot_type = payload.ot_type
    db.commit()
    db.refresh(ot)
    return ot

@router.get("/ots")
def get_ots(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all OTs and schedules"""
    ots = db.query(OperationTheater).filter(
        OperationTheater.hospital_id == current_user.hospital_id
    ).all()
    
    result = []
    for ot in ots:
        patient_name = None
        doctor_name = None
        
        if ot.current_patient_id:
            patient = db.query(Patient).filter(Patient.record_id == ot.current_patient_id).first()
            patient_name = patient.full_name if patient else None
            
        if ot.current_doctor_id:
            doc = db.query(User).filter(User.user_id == ot.current_doctor_id).first()
            doctor_name = doc.full_name if doc else None
            
        anesthesia_doctor_name = None
        if ot.anesthesiologist_id:
            anes_doc = db.query(User).filter(User.user_id == ot.anesthesiologist_id).first()
            if not anes_doc:
                # Fallback to DoctorProfile
                anes_doc_prof = db.query(DoctorProfile).filter(DoctorProfile.profile_id == ot.anesthesiologist_id).first()
                if anes_doc_prof:
                    anesthesia_doctor_name = anes_doc_prof.user.full_name if anes_doc_prof.user else "Doctor"
            else:
                anesthesia_doctor_name = anes_doc.full_name

        result.append({
            "ot_id": ot.ot_id,
            "ot_name": ot.ot_name,
            "ot_type": ot.ot_type,
            "status": ot.status.lower(), # available, in_use, maintenance
            "patient_id": ot.current_patient_id,
            "patient_name": patient_name,
            "doctor_id": ot.current_doctor_id,
            "doctor_name": doctor_name,
            "scheduled_start": ot.scheduled_start,
            "scheduled_end": ot.scheduled_end,
            "current_surgery_name": ot.current_surgery_name,
            "current_anesthesia_type": ot.current_anesthesia_type,
            "anesthesiologist_id": ot.anesthesiologist_id,
            "anesthesia_doctor_name": anesthesia_doctor_name,
            "current_diagnosis": ot.current_diagnosis,
            "special_requirements": ot.special_requirements
        })
    return result

@router.post("/ots/{ot_id}/assign")
def assign_ot(
    ot_id: int,
    assignment: OTAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign patient & surgeon to Operation Theater"""
    ot = db.query(OperationTheater).filter(
        OperationTheater.ot_id == ot_id,
        OperationTheater.hospital_id == current_user.hospital_id
    ).first()
    if not ot:
        raise HTTPException(status_code=404, detail="Operation Theater not found")
        
    # Scheduling conflict check
    conflict = db.query(OperationTheater).filter(
        OperationTheater.current_doctor_id == assignment.doctor_id,
        OperationTheater.status == "IN_USE",
        OperationTheater.ot_id != ot_id,
        OperationTheater.hospital_id == current_user.hospital_id
    ).first()
    if conflict:
        raise HTTPException(status_code=400, detail=f"Surgeon is already assigned to active OT: {conflict.ot_name}")
        
    ot.current_patient_id = assignment.patient_id  # type: ignore
    ot.current_doctor_id = assignment.doctor_id  # type: ignore
    ot.scheduled_start = assignment.scheduled_start or datetime.now()  # type: ignore
    ot.scheduled_end = assignment.scheduled_end  # type: ignore
    ot.current_surgery_name = assignment.current_surgery_name  # type: ignore
    ot.current_anesthesia_type = assignment.current_anesthesia_type  # type: ignore
    ot.anesthesiologist_id = assignment.anesthesiologist_id # type: ignore
    ot.current_diagnosis = assignment.current_diagnosis  # type: ignore
    ot.special_requirements = assignment.special_requirements  # type: ignore
    ot.status = "IN_USE"  # type: ignore
    
    # Update Surgery if linked
    if assignment.surgery_id:
        surgery = db.query(Surgery).filter(Surgery.surgery_id == assignment.surgery_id).first()
        if surgery:
            surgery.status = "Scheduled"
            if assignment.doctor_id:
                surgery.doctor_id = assignment.doctor_id
            if assignment.anesthesiologist_id:
                surgery.anesthesiologist_id = assignment.anesthesiologist_id
            
    db.commit()
    return ot

@router.post("/admissions/{admission_id}/pre-op")
def update_pre_op_assessment(
    admission_id: int,
    assessment: PreOpAssessmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update Pre-Op Assessment for an IPD Admission"""
    admission = db.query(IPDAdmission).filter(
        IPDAdmission.admission_id == admission_id,
        IPDAdmission.hospital_id == current_user.hospital_id
    ).first()
    
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    data = assessment.dict()
    data['assessed_by'] = current_user.full_name
    data['timestamp'] = datetime.now().isoformat()
    
    admission.pre_op_assessment = data # type: ignore
    db.commit()
    return {"message": "Pre-Op Assessment updated successfully", "assessment": data}

@router.post("/admissions/{admission_id}/post-op")
def update_post_op_assessment(
    admission_id: int,
    assessment: PostOpAssessmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update Post-Op Assessment for an IPD Admission"""
    admission = db.query(IPDAdmission).filter(
        IPDAdmission.admission_id == admission_id,
        IPDAdmission.hospital_id == current_user.hospital_id
    ).first()
    
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    data = assessment.dict()
    data['assessed_by'] = current_user.full_name
    data['timestamp'] = datetime.now().isoformat()
    
    admission.post_op_assessment = data # type: ignore
    db.commit()
    return {"message": "Post-Op Assessment updated successfully", "assessment": data}

@router.post("/ots/{ot_id}/release")
def release_ot(
    ot_id: int,
    payload: OTRelease,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Complete surgery, release Operation Theater"""
    ot = db.query(OperationTheater).filter(
        OperationTheater.ot_id == ot_id,
        OperationTheater.hospital_id == current_user.hospital_id
    ).first()
    if not ot:
        raise HTTPException(status_code=404, detail="Operation Theater not found")
        
    if ot.current_patient_id:
        # Update IPD Admission Status & Billing
        adm = db.query(IPDAdmission).filter(
            IPDAdmission.patient_id == ot.current_patient_id,
            IPDAdmission.status.in_(["admitted", "recovery"])
        ).first()
        
        if adm:
            # Update recovery state
            adm.status = payload.post_surgery_status or "recovery"
            
            # Add Billing Integration
            if adm.patient_invoice_id:
                if payload.surgery_fee:
                    item1 = PatientInvoiceItem(
                        invoice_id=adm.patient_invoice_id,
                        description=f"Surgeon Fee - {ot.ot_name}",
                        qty=1,
                        unit_price=payload.surgery_fee,
                        amount=payload.surgery_fee,
                        charge_type="SURGERY_OT"
                    )
                    db.add(item1)
                
                if payload.anesthesia_fee:
                    item2 = PatientInvoiceItem(
                        invoice_id=adm.patient_invoice_id,
                        description=f"Anesthesia Fee - {ot.ot_name}",
                        qty=1,
                        unit_price=payload.anesthesia_fee,
                        amount=payload.anesthesia_fee,
                        charge_type="SURGERY_OT"
                    )
                    db.add(item2)
                
                # Room usage fee ($1000/hr)
                if ot.scheduled_start:
                    end_time = ot.scheduled_end or datetime.now()
                    if end_time < ot.scheduled_start:
                        end_time = datetime.now()
                    
                    duration_hours = (end_time - ot.scheduled_start).total_seconds() / 3600.0
                    room_fee = round(duration_hours * 1000.0, 2)
                    if room_fee > 0:
                        item3 = PatientInvoiceItem(
                            invoice_id=adm.patient_invoice_id,
                            description=f"OT Room Usage ({round(duration_hours, 1)} hrs) - {ot.ot_name}",
                            qty=1,
                            unit_price=room_fee,
                            amount=room_fee,
                            charge_type="SURGERY_OT"
                        )
                        db.add(item3)
                
                # Recalculate invoice totals
                db.flush()
                inv = db.query(PatientInvoice).filter(PatientInvoice.invoice_id == adm.patient_invoice_id).first()
                if inv:
                    subtotal = sum(i.amount for i in inv.items if getattr(i, 'amount', None) is not None)
                    inv.subtotal_amount = subtotal
                    tax = inv.tax_amount or 0.0
                    discount = inv.discount_amount or 0.0
                    inv.total_amount = subtotal + tax - discount

    ot.current_patient_id = None  # type: ignore
    ot.current_doctor_id = None  # type: ignore
    ot.scheduled_start = None  # type: ignore
    ot.scheduled_end = None  # type: ignore
    ot.status = "AVAILABLE"  # type: ignore
    db.commit()
    return ot

# --- Medical Equipment Tracker ---

@router.post("/equipment")
def create_equipment(
    eq: EquipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register new hospital medical device"""
    new_eq = MedicalEquipment(
        hospital_id=current_user.hospital_id,
        name=eq.name,
        equipment_type=eq.equipment_type,
        status="AVAILABLE"
    )
    db.add(new_eq)
    db.commit()
    db.refresh(new_eq)
    return new_eq

@router.get("/equipment")
def get_equipment(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all medical equipments and locations"""
    eqs = db.query(MedicalEquipment).filter(
        MedicalEquipment.hospital_id == current_user.hospital_id
    ).all()
    
    result = []
    for eq in eqs:
        location = "Warehouse"
        patient_name = None
        
        if eq.current_ot_id:
            ot = db.query(OperationTheater).filter(OperationTheater.ot_id == eq.current_ot_id).first()
            location = f"OT: {ot.ot_name}" if ot else "OT"
        elif eq.current_bed_id:
            bed = db.query(Bed).filter(Bed.bed_id == eq.current_bed_id).first()
            ward = db.query(Ward).filter(Ward.ward_id == eq.current_ward_id).first()
            location = f"{ward.ward_name} - Bed {bed.bed_number}" if ward and bed else "Bed"
        elif eq.current_ward_id:
            ward = db.query(Ward).filter(Ward.ward_id == eq.current_ward_id).first()
            location = ward.ward_name if ward else "Ward"
            
        if eq.current_patient_id:
            patient = db.query(Patient).filter(Patient.record_id == eq.current_patient_id).first()
            patient_name = patient.full_name if patient else None
            
        result.append({
            "equipment_id": eq.equipment_id,
            "name": eq.name,
            "equipment_type": eq.equipment_type,
            "status": eq.status.lower(),  # available, in_use, maintenance
            "location": location,
            "patient_name": patient_name,
            "ward_id": eq.current_ward_id,
            "bed_id": eq.current_bed_id,
            "ot_id": eq.current_ot_id,
            "patient_id": eq.current_patient_id
        })
    return result

@router.post("/equipment/{equipment_id}/deploy")
def deploy_equipment(
    equipment_id: int,
    deploy: EquipmentDeploy,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deploy device to Ward, Bed, Patient or Operation Theater"""
    eq = db.query(MedicalEquipment).filter(
        MedicalEquipment.equipment_id == equipment_id,
        MedicalEquipment.hospital_id == current_user.hospital_id
    ).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Medical device not found")
        
    eq.current_ward_id = deploy.ward_id  # type: ignore
    eq.current_bed_id = deploy.bed_id  # type: ignore
    eq.current_ot_id = deploy.ot_id  # type: ignore
    eq.current_patient_id = deploy.patient_id  # type: ignore
    eq.status = "IN_USE"  # type: ignore
    db.commit()
    return eq

@router.post("/equipment/{equipment_id}/retrieve")
def retrieve_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve device back to warehouse"""
    eq = db.query(MedicalEquipment).filter(
        MedicalEquipment.equipment_id == equipment_id,
        MedicalEquipment.hospital_id == current_user.hospital_id
    ).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Medical device not found")
        
    eq.current_ward_id = None  # type: ignore
    eq.current_bed_id = None  # type: ignore
    eq.current_ot_id = None  # type: ignore
    eq.current_patient_id = None  # type: ignore
    eq.status = "AVAILABLE"  # type: ignore
    db.commit()
    return eq

@router.put("/equipment/{equipment_id}")
def update_equipment(
    equipment_id: int,
    eq_update: EquipmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update medical device details"""
    eq = db.query(MedicalEquipment).filter(
        MedicalEquipment.equipment_id == equipment_id,
        MedicalEquipment.hospital_id == current_user.hospital_id
    ).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Medical device not found")
    
    if eq_update.name is not None:
        eq.name = eq_update.name
    if eq_update.equipment_type is not None:
        eq.equipment_type = eq_update.equipment_type
    
    db.commit()
    db.refresh(eq)
    return eq

@router.delete("/equipment/{equipment_id}")
def delete_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete medical device"""
    eq = db.query(MedicalEquipment).filter(
        MedicalEquipment.equipment_id == equipment_id,
        MedicalEquipment.hospital_id == current_user.hospital_id
    ).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Medical device not found")
    
    if eq.status == "IN_USE":
        raise HTTPException(status_code=400, detail="Cannot delete device currently in use. Retrieve it first.")
        
    db.delete(eq)
    db.commit()
    return {"message": "Device deleted successfully"}

@router.patch("/equipment/{equipment_id}/status")
def update_equipment_status(
    equipment_id: int,
    status_update: EquipmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark device as available or maintenance"""
    eq = db.query(MedicalEquipment).filter(
        MedicalEquipment.equipment_id == equipment_id,
        MedicalEquipment.hospital_id == current_user.hospital_id
    ).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Medical device not found")
    
    status = status_update.status.upper()
    if status not in ["AVAILABLE", "MAINTENANCE"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be AVAILABLE or MAINTENANCE")
        
    if eq.status == "IN_USE" and status == "MAINTENANCE":
        raise HTTPException(status_code=400, detail="Cannot mark device in use for maintenance. Retrieve it first.")
        
    eq.status = status # type: ignore
    db.commit()
    return eq

# --- RFID Cards & Paperless Flow ---

@router.post("/rfid/register")
def register_rfid(
    card: RFIDRegister,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register blank RFID Card"""
    existing = db.query(RFIDCard).filter(RFIDCard.card_number == card.card_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Card number already registered")
        
    new_card = RFIDCard(
        hospital_id=current_user.hospital_id,
        card_number=card.card_number,
        status="ACTIVE"
    )
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    return new_card

@router.get("/rfid")
def get_rfids(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all hospital RFID Cards"""
    cards = db.query(RFIDCard).filter(
        RFIDCard.hospital_id == current_user.hospital_id
    ).all()
    
    result = []
    for c in cards:
        patient_name = None
        mrd_number = None
        
        if c.patient_id:
            patient = db.query(Patient).filter(Patient.record_id == c.patient_id).first()
            if patient:
                patient_name = patient.full_name
                mrd_number = patient.patient_u_id
                
        result.append({
            "rfid_id": c.rfid_id,
            "card_number": c.card_number,
            "status": c.status.lower(),
            "patient_id": c.patient_id,
            "patient_name": patient_name,
            "mrd_number": mrd_number,
            "issued_at": c.issued_at,
            "last_scanned_at": c.last_scanned_at
        })
    return result

@router.post("/rfid/assign")
def assign_rfid(
    assignment: RFIDAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Link card to admitted patient"""
    card = db.query(RFIDCard).filter(
        RFIDCard.card_number == assignment.card_number,
        RFIDCard.hospital_id == current_user.hospital_id
    ).first()
    if not card:
        raise HTTPException(status_code=404, detail="RFID Card not found")
        
    patient = db.query(Patient).filter(
        Patient.record_id == assignment.patient_id,
        Patient.hospital_id == current_user.hospital_id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # Unlink any card currently assigned to this patient
    db.query(RFIDCard).filter(
        RFIDCard.patient_id == assignment.patient_id,
        RFIDCard.hospital_id == current_user.hospital_id
    ).update({RFIDCard.patient_id: None})
    
    card.patient_id = assignment.patient_id  # type: ignore
    db.commit()
    return card

@router.get("/rfid/scan/{card_number}")
def scan_rfid(
    card_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Instant RFID Card Scan for paperless patient lookup"""
    card = db.query(RFIDCard).filter(
        RFIDCard.card_number == card_number,
        RFIDCard.hospital_id == current_user.hospital_id
    ).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="RFID Card not recognized")
        
    if not card.patient_id:
        raise HTTPException(status_code=400, detail="This RFID Card is active but not linked to any patient.")
        
    # Update scanned time
    card.last_scanned_at = datetime.now()  # type: ignore
    db.commit()
    
    patient = db.query(Patient).filter(Patient.record_id == card.patient_id).first()
    if not patient:
         raise HTTPException(status_code=404, detail="Linked Patient record not found")
         
    # Active IPD admissions if any
    adm = db.query(IPDAdmission).filter(
        IPDAdmission.patient_id == patient.record_id,
        IPDAdmission.status.in_(["admitted", "recovery"])
    ).first()
    
    admission_data = None
    if adm:
        ward = db.query(Ward).filter(Ward.ward_id == adm.ward_id).first()
        bed = db.query(Bed).filter(Bed.bed_id == adm.bed_id).first()
        
        admission_data = {
            "admission_id": adm.admission_id,
            "admission_date": adm.admission_date,
            "diagnosis": adm.diagnosis,
            "ward_name": ward.ward_name if ward else None,
            "bed_number": bed.bed_number if bed else None,
            "vitals_log": adm.vitals_log or []
        }
        
    ot_assignment = db.query(OperationTheater).filter(
        OperationTheater.current_patient_id == patient.record_id,
        OperationTheater.hospital_id == current_user.hospital_id,
        OperationTheater.status == "IN_USE"
    ).first()
    ot_alert = f"Patient is currently scheduled/active in OT: {ot_assignment.ot_name}" if ot_assignment else None
        
    return {
        "status": "success",
        "card_number": card.card_number,
        "scanned_at": card.last_scanned_at,
        "patient": {
            "record_id": patient.record_id,
            "patient_u_id": patient.patient_u_id,
            "full_name": patient.full_name,
            "age": patient.age,
            "gender": patient.gender,
            "phone": patient.phone,
            "chief_complaint": patient.chief_complaint or patient.diagnosis or "N/A",
            "doctor_name": patient.doctor_name
        },
        "active_admission": admission_data,
        "ot_alert": ot_alert
    }

# --- Surgeries API Endpoints ---

@router.get("/surgeries")
def get_surgeries(
    status: Optional[str] = None,
    admission_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of surgeries for the hospital"""
    from sqlalchemy.orm import joinedload
    query = db.query(Surgery).filter(Surgery.hospital_id == current_user.hospital_id)
    
    if status:
        query = query.filter(Surgery.status == status)
    if admission_id:
        query = query.filter(Surgery.admission_id == admission_id)
        
    # We join patient to easily get the patient name
    surgeries = query.options(joinedload(Surgery.patient), joinedload(Surgery.admission)).all()
    
    result = []
    for s in surgeries:
        result.append({
            "surgery_id": s.surgery_id,
            "admission_id": s.admission_id,
            "patient_id": s.patient_id,
            "patient_name": s.patient.full_name if s.patient else None,
            "mrd_number": s.patient.patient_u_id if s.patient else None,
            "surgery_name": s.surgery_name,
            "status": s.status,
            "pre_op_assessment": s.pre_op_assessment,
            "post_op_assessment": s.post_op_assessment,
            "doctor_id": s.doctor_id,
            "anesthesiologist_id": s.anesthesiologist_id,
            "ot_id": s.ot_id,
            "created_at": s.created_at
        })
    return result

@router.post("/surgeries")
def create_surgery(
    surgery_data: SurgeryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    admission = db.query(IPDAdmission).filter(IPDAdmission.admission_id == surgery_data.admission_id).first()
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    new_surgery = Surgery(
        hospital_id=current_user.hospital_id,
        admission_id=admission.admission_id,
        patient_id=admission.patient_id,
        surgery_name=surgery_data.surgery_name,
        doctor_id=surgery_data.doctor_id,
        anesthesiologist_id=surgery_data.anesthesiologist_id,
        status=surgery_data.status or "Requested"
    )
    db.add(new_surgery)
    db.commit()
    db.refresh(new_surgery)
    return new_surgery

@router.patch("/surgeries/{surgery_id}")
def update_surgery_assessment(
    surgery_id: int,
    assessment_data: SurgeryAssessmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    surgery = db.query(Surgery).filter(
        Surgery.surgery_id == surgery_id,
        Surgery.hospital_id == current_user.hospital_id
    ).first()
    
    if not surgery:
        raise HTTPException(status_code=404, detail="Surgery not found")
        
    if assessment_data.pre_op_assessment is not None:
        surgery.pre_op_assessment = assessment_data.pre_op_assessment
    if assessment_data.post_op_assessment is not None:
        surgery.post_op_assessment = assessment_data.post_op_assessment
    if assessment_data.status is not None:
        surgery.status = assessment_data.status
    if assessment_data.ot_id is not None:
        surgery.ot_id = assessment_data.ot_id
    if assessment_data.timestamps is not None:
        surgery.timestamps = assessment_data.timestamps
    if assessment_data.implant_register is not None:
        surgery.implant_register = assessment_data.implant_register
    if assessment_data.narcotics_log is not None:
        surgery.narcotics_log = assessment_data.narcotics_log
    if assessment_data.intra_op_logs is not None:
        surgery.intra_op_logs = assessment_data.intra_op_logs
        
    db.commit()
    db.refresh(surgery)
    return surgery


# --- IPD Doctor Visits (PER_VISIT Billing) ---

class LogDoctorVisit(BaseModel):
    doctor_id: int
    visit_date: Optional[datetime] = None
    charge_amount: Optional[float] = None # Defaults to doctor's ipd_charge if None
    notes: Optional[str] = None

@router.post("/admissions/{admission_id}/doctor-visits")
def log_doctor_visit(
    admission_id: int,
    data: LogDoctorVisit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    admission = db.query(IPDAdmission).filter(IPDAdmission.admission_id == admission_id).first()
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    doctor = db.query(DoctorProfile).filter(DoctorProfile.profile_id == data.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    visit_charge = data.charge_amount if data.charge_amount is not None else doctor.ipd_charge
    
    new_visit = IPDDoctorVisit(
        admission_id=admission.admission_id,
        doctor_id=doctor.profile_id,
        visit_date=data.visit_date or datetime.now(),
        charge_amount=visit_charge,
        notes=data.notes
    )
    db.add(new_visit)
    db.commit()
    return {"message": "Doctor visit logged successfully", "visit_id": new_visit.visit_id}


@router.get("/stats")
def get_hms_stats(
    hospital_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get hospital-wide HMS statistics"""
    effective_h_id = hospital_id or current_user.hospital_id
    
    total_wards = db.query(Ward).filter(
        Ward.hospital_id == effective_h_id
    ).count()
    
    total_beds = db.query(func.sum(Ward.total_beds)).filter(
        Ward.hospital_id == effective_h_id
    ).scalar() or 0
    
    # Calculate occupied beds from Wards or Beds directly
    occupied_beds = db.query(Bed).join(Ward).filter(
        Ward.hospital_id == effective_h_id,
        Bed.is_occupied == True
    ).count()
    
    current_admissions = db.query(IPDAdmission).filter(
        IPDAdmission.hospital_id == effective_h_id,
        IPDAdmission.status.in_(["admitted", "recovery"])
    ).count()
    
    today_admissions = db.query(IPDAdmission).filter(
        IPDAdmission.hospital_id == effective_h_id,
        func.date(IPDAdmission.admission_date) == date.today()
    ).count()
    
    today_discharges = db.query(IPDAdmission).filter(
        IPDAdmission.hospital_id == effective_h_id,
        func.date(IPDAdmission.discharge_date) == date.today()
    ).count()
    
    occupancy_rate = (occupied_beds / total_beds * 100) if total_beds > 0 else 0
    
    return {
        "total_wards": total_wards,
        "total_beds": int(total_beds),
        "occupied_beds": occupied_beds,
        "available_beds": max(0, total_beds - occupied_beds),
        "occupancy_rate": round(occupancy_rate, 2),
        "current_admissions": current_admissions,
        "today_admissions": today_admissions,
        "today_discharges": today_discharges
    }
