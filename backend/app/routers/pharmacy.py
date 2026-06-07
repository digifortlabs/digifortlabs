from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..models import User, Prescription, Patient, OPDVisit, InventoryItem, PharmacyDispense
from .auth import get_current_user

router = APIRouter(
    prefix="/pharmacy",
    tags=["pharmacy"]
)

class DispenseRequest(BaseModel):
    prescription_id: int
    quantity: int
    unit_price: float
    total_price: float
    payment_method: Optional[str] = "Cash"

class IPDDispenseRequest(BaseModel):
    admission_id: int
    order_id: str
    quantity: int
    unit_price: float
    total_price: float

@router.get("/pending-prescriptions")
def get_pending_prescriptions(
    hospital_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_hospital = hospital_id if hospital_id else current_user.hospital_id
    
    # Get all prescriptions that haven't been fully dispensed
    # (Simple logic: if not in PharmacyDispense, it's pending)
    dispensed_subquery = db.query(PharmacyDispense.prescription_id).subquery()
    
    pending_rx = db.query(Prescription, OPDVisit, Patient).join(OPDVisit, Prescription.visit_id == OPDVisit.visit_id)\
        .join(Patient, OPDVisit.patient_id == Patient.record_id)\
        .filter(OPDVisit.hospital_id == target_hospital)\
        .filter(~Prescription.prescription_id.in_(dispensed_subquery))\
        .order_by(Prescription.prescription_id.desc())\
        .all()
        
    result = []
    for rx, visit, pat in pending_rx:
        result.append({
            "prescription_id": rx.prescription_id,
            "patient_name": pat.full_name,
            "mrd_number": pat.patient_u_id,
            "medicine_name": rx.medicine_name,
            "dosage": rx.dosage,
            "frequency": rx.frequency,
            "duration": rx.duration,
            "instructions": rx.instructions,
            "visit_date": visit.visit_date
        })
    return result

@router.post("/dispense")
def dispense_prescription(
    payload: DispenseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rx = db.query(Prescription).filter(Prescription.prescription_id == payload.prescription_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
        
    visit = db.query(OPDVisit).filter(OPDVisit.visit_id == rx.visit_id).first()
    
    # Try to find medicine in inventory to deduct stock
    inventory_item = db.query(InventoryItem).filter(
        InventoryItem.hospital_id == visit.hospital_id,
        InventoryItem.name.ilike(rx.medicine_name)
    ).first()
    
    if inventory_item:
        if inventory_item.current_stock < payload.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock in pharmacy")
        inventory_item.current_stock -= payload.quantity
    
    dispense = PharmacyDispense(
        prescription_id=rx.prescription_id,
        patient_id=visit.patient_id,
        hospital_id=visit.hospital_id,
        pharmacist_id=current_user.user_id,
        quantity_dispensed=payload.quantity,
        unit_price=payload.unit_price,
        total_price=payload.total_price,
        is_paid=True,
        payment_method=payload.payment_method
    )
    db.add(dispense)
    db.commit()
    db.refresh(dispense)
    
    return {"message": "Dispensed successfully", "dispense_id": dispense.dispense_id}

@router.get("/medicines/search")
def search_medicines(
    query: str,
    hospital_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_hospital = hospital_id if hospital_id else current_user.hospital_id
    
    medicines = db.query(InventoryItem).filter(
        InventoryItem.hospital_id == target_hospital,
        InventoryItem.category == "Medicine",
        InventoryItem.name.ilike(f"%{query}%")
    ).all()
    
    return [{"id": m.item_id, "name": m.name, "stock": m.current_stock, "price": m.unit_price} for m in medicines]

@router.post("/medicines/auto-add")
def auto_add_medicine(
    name: str,
    hospital_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_hospital = hospital_id if hospital_id else current_user.hospital_id
    
    # Check if exists
    existing = db.query(InventoryItem).filter(
        InventoryItem.hospital_id == target_hospital,
        InventoryItem.name.ilike(name)
    ).first()
    
    if existing:
        return {"id": existing.item_id, "name": existing.name}
        
    # Auto-add
    new_med = InventoryItem(
        hospital_id=target_hospital,
        name=name,
        category="Medicine",
        unit_price=0.0,
        current_stock=0
    )
    db.add(new_med)
    db.commit()
    db.refresh(new_med)
    return {"id": new_med.item_id, "name": new_med.name}

@router.get("/ipd-pending")
def get_ipd_pending_prescriptions(
    hospital_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from ..models import IPDAdmission, Patient, Ward, Bed
    
    target_hospital = hospital_id if hospital_id else current_user.hospital_id
    
    admissions = db.query(IPDAdmission, Patient, Ward, Bed).join(
        Patient, IPDAdmission.patient_id == Patient.record_id
    ).join(
        Ward, IPDAdmission.ward_id == Ward.ward_id
    ).join(
        Bed, IPDAdmission.bed_id == Bed.bed_id
    ).filter(
        IPDAdmission.hospital_id == target_hospital,
        IPDAdmission.status.in_(["admitted", "recovery"])
    ).all()
    
    result = []
    for adm, pat, ward, bed in admissions:
        orders = adm.medication_orders or []
        for order in orders:
            if not order.get("purchased") and not order.get("dispensed"):
                result.append({
                    "admission_id": adm.admission_id,
                    "order_id": order.get("id"),
                    "patient_name": pat.full_name,
                    "mrd_number": pat.patient_u_id,
                    "ward_name": ward.ward_name,
                    "bed_number": bed.bed_number,
                    "medicine_name": order.get("medicine_name"),
                    "dosage": order.get("dosage"),
                    "dosage_unit": order.get("dosage_unit"),
                    "route": order.get("route"),
                    "frequency": order.get("frequency"),
                    "duration_days": order.get("duration_days"),
                    "qty": order.get("qty"),
                    "instructions": order.get("special_instructions") or order.get("notes"),
                    "prescribed_date": order.get("start_date")
                })
    return result

@router.post("/ipd-dispense")
def dispense_ipd_prescription(
    payload: IPDDispenseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from ..models import IPDAdmission, InventoryItem, PatientInvoice, PatientInvoiceItem
    
    adm = db.query(IPDAdmission).filter(IPDAdmission.admission_id == payload.admission_id).first()
    if not adm:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    orders = adm.medication_orders or []
    target_order = None
    for order in orders:
        if order.get("id") == payload.order_id:
            target_order = order
            break
            
    if not target_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if target_order.get("dispensed"):
        raise HTTPException(status_code=400, detail="Order already dispensed")
        
    # Deduct stock if inventory exists
    inventory_item = db.query(InventoryItem).filter(
        InventoryItem.hospital_id == adm.hospital_id,
        InventoryItem.name.ilike(target_order.get("medicine_name"))
    ).first()
    
    if inventory_item:
        if inventory_item.current_stock < payload.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock in pharmacy")
        inventory_item.current_stock -= payload.quantity
        
    # Mark as dispensed
    target_order["dispensed"] = True
    target_order["dispensed_at"] = datetime.now().isoformat()
    target_order["dispensed_by"] = current_user.full_name
    
    # SQLAlchemy requires re-assignment for JSON changes
    adm.medication_orders = list(orders)
    
    # Add cost to IPD Running Bill
    if adm.patient_invoice_id:
        invoice_item = PatientInvoiceItem(
            invoice_id=adm.patient_invoice_id,
            description=f"Pharmacy Dispense: {target_order.get('medicine_name')} ({payload.quantity} units)",
            qty=payload.quantity,
            unit_price=payload.unit_price,
            amount=payload.total_price,
            charge_type="MEDICINE"
        )
        db.add(invoice_item)
        
        invoice = db.query(PatientInvoice).filter(PatientInvoice.invoice_id == adm.patient_invoice_id).first()
        if invoice:
            invoice.subtotal = float(invoice.subtotal or 0) + payload.total_price
            invoice.total_amount = float(invoice.total_amount or 0) + payload.total_price
            
    db.commit()
    return {"message": "IPD Medicine Dispensed Successfully"}
