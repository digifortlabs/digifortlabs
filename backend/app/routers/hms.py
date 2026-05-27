from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import datetime, date, timedelta
from pydantic import BaseModel

from ..database import get_db
from ..models import User, Patient, IPDAdmission, Ward, Bed, OperationTheater, MedicalEquipment, RFIDCard
from .auth import get_current_user

router = APIRouter(prefix="/hms", tags=["Hospital Management System"])

# --- Pydantic Schemas ---

class WardCreate(BaseModel):
    ward_name: str
    ward_type: str  # ICU, General, Private, Semi-Private
    total_beds: int
    floor_number: Optional[int] = 1

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

class DischargeUpdate(BaseModel):
    discharge_date: Optional[datetime] = None
    discharge_summary: Optional[str] = None
    discharge_notes: Optional[str] = None

class MedicationOrder(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    frequency_hours: Optional[int] = 12
    notes: Optional[str] = None

class MedicationLogRecord(BaseModel):
    order_id: str
    medicine_name: str
    notes: Optional[str] = None

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

class BedStatusUpdate(BaseModel):
    status: str

class WardUpdate(BaseModel):
    ward_name: Optional[str] = None
    ward_type: Optional[str] = None
    floor_number: Optional[int] = None

class VitalsRecord(BaseModel):
    temp: Optional[str] = None
    bp: Optional[str] = None
    pulse: Optional[str] = None
    spo2: Optional[str] = None
    respiratory_rate: Optional[str] = None
    notes: Optional[str] = None

class OTCreate(BaseModel):
    ot_name: str
    ot_type: str  # Cardiac, Neuro, Ortho, General

class OTAssign(BaseModel):
    patient_id: int
    doctor_id: int
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None

class EquipmentCreate(BaseModel):
    name: str
    equipment_type: str  # Ventilator, Monitor, Defibrillator, ECG

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
        total_beds=ward.total_beds,
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
    
    result = []
    for w in wards:
        # Get actual bed occupancy count
        occupied_count = db.query(Bed).filter(
            Bed.ward_id == w.ward_id,
            Bed.is_occupied == True
        ).count()
        
        # Keep DB counter in sync
        w.occupied_beds = occupied_count  # type: ignore
        db.commit()
        
        available_beds = w.total_beds - occupied_count
        result.append({
            "ward_id": w.ward_id,
            "ward_name": w.ward_name,
            "ward_type": w.ward_type,
            "total_beds": w.total_beds,
            "occupied_beds": occupied_count,
            "available_beds": max(0, available_beds),
            "floor_number": getattr(w, "floor_number", 1) or 1,
            "occupancy_rate": (occupied_count / w.total_beds * 100) if w.total_beds > 0 else 0
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
        IPDAdmission.status == "admitted"
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
        
    if bed.is_occupied:
        raise HTTPException(status_code=400, detail="Cannot change status of an occupied bed")
        
    status_val = status_update.status.upper()
    if status_val not in ["AVAILABLE", "MAINTENANCE"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    bed.status = status_val  # type: ignore
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
    
    # Dynamic Patient Registration on intake
    if not patient_id:
        if not admission.patient_name:
            raise HTTPException(status_code=400, detail="Either patient_id or patient_name is required")
        
        # Generate MRD
        import uuid
        mrd_code = f"MRD-{uuid.uuid4().hex[:6].upper()}"
        
        new_patient = Patient(
            hospital_id=current_user.hospital_id,
            patient_u_id=mrd_code,
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
        status="admitted",
        vitals_log=[]
    )
    db.add(new_admission)
    
    # Occupy bed
    bed.is_occupied = True  # type: ignore
    bed.status = "OCCUPIED"  # type: ignore
    
    # Update ward counter
    ward = db.query(Ward).filter(Ward.ward_id == admission.ward_id).first()
    if ward:
        ward.occupied_beds = db.query(Bed).filter(Bed.ward_id == ward.ward_id, Bed.is_occupied == True).count()  # type: ignore
        
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
            query = query.filter(IPDAdmission.status == "admitted")
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
            "status": "active" if adm.status == "admitted" else "discharged"
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
        IPDAdmission.status == "admitted"
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
            "bed_number": bed.bed_number if bed else None,
            "admission_date": adm.admission_date,
            "discharge_date": adm.discharge_date,
            "diagnosis": adm.diagnosis,
            "status": "active"
        })
    
    return result

@router.get("/admissions/alerts")
def get_medication_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch due or overdue medication alerts for all active admissions"""
    active_admissions = db.query(IPDAdmission).filter(
        IPDAdmission.hospital_id == current_user.hospital_id,
        IPDAdmission.status == "admitted"
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
    
    return {
        "admission": admission,
        "patient": patient,
        "ward": ward,
        "bed": bed
    }

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
    if not admission or admission.status != "admitted":
        raise HTTPException(status_code=404, detail="Active admission not found")
        
    new_bed = db.query(Bed).filter(Bed.bed_id == transfer.new_bed_id).first()
    if not new_bed or new_bed.is_occupied or new_bed.status != "AVAILABLE":
        raise HTTPException(status_code=400, detail="New bed is not available")
        
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
        "frequency": order.frequency,
        "frequency_hours": freq_hours,
        "notes": order.notes,
        "start_date": datetime.now().isoformat(),
        "next_due": next_due_dt.isoformat(),
        "prescribed_by": current_user.full_name
    }
    orders.append(new_order)
    admission.medication_orders = orders  # type: ignore
    db.commit()
    return new_order

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

@router.post("/admissions/{admission_id}/discharge")
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
    
    # Discharge patient
    admission.discharge_date = discharge.discharge_date or datetime.now()  # type: ignore
    admission.status = "discharged"  # type: ignore
    
    # Capture notes
    discharge_summary_notes = discharge.discharge_notes or discharge.discharge_summary
    if discharge_summary_notes:
        admission.treatment_plan = (admission.treatment_plan or "") + f"\nDischarge Notes: {discharge_summary_notes}"  # type: ignore
    
    # Free up bed
    bed = db.query(Bed).filter(Bed.bed_id == admission.bed_id).first()
    if bed:
        bed.is_occupied = False  # type: ignore
        bed.status = "AVAILABLE"  # type: ignore
    
    # Update ward occupancy
    ward = db.query(Ward).filter(Ward.ward_id == admission.ward_id).first()
    if ward:
        ward.occupied_beds = db.query(Bed).filter(Bed.ward_id == ward.ward_id, Bed.is_occupied == True).count()  # type: ignore
    
    db.commit()
    db.refresh(admission)
    return admission

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
            "scheduled_end": ot.scheduled_end
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
        
    ot.current_patient_id = assignment.patient_id  # type: ignore
    ot.current_doctor_id = assignment.doctor_id  # type: ignore
    ot.scheduled_start = assignment.scheduled_start or datetime.now()  # type: ignore
    ot.scheduled_end = assignment.scheduled_end  # type: ignore
    ot.status = "IN_USE"  # type: ignore
    db.commit()
    return ot

@router.post("/ots/{ot_id}/release")
def release_ot(
    ot_id: int,
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
        IPDAdmission.status == "admitted"
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
        "active_admission": admission_data
    }

# --- Core Stats Endpoint ---

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
        IPDAdmission.status == "admitted"
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
