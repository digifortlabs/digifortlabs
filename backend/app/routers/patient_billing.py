import logging
from datetime import datetime, date, timedelta
from typing import List, Optional, cast
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import (
    PatientInvoice, PatientInvoiceItem, Patient, Hospital, User,
    OPDVisit, DentalTreatment, IPDAdmission, UserRole
)
from .auth import get_current_user
from ..services.patient_billing_service import PatientBillingService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/patient-billing", tags=["Patient Billing"])

# --- Pydantic Schemas ---

class PatientInvoiceItemCreate(BaseModel):
    description: str
    qty: int = 1
    unit_price: float
    discount: float = 0.0
    charge_type: str
    reference_id: Optional[int] = None

class PatientInvoiceCreate(BaseModel):
    patient_id: int
    items: List[PatientInvoiceItemCreate]
    discount_amount: float = 0.0
    gst_rate: float = 18.0
    payment_method: str = "CASH"
    transaction_id: Optional[str] = None
    remarks: Optional[str] = None
    due_date: Optional[datetime] = None

class PatientInvoiceItemResponse(BaseModel):
    item_id: int
    description: str
    qty: int
    unit_price: float
    discount: float
    amount: float
    charge_type: str
    reference_id: Optional[int] = None

    class Config:
        from_attributes = True

class PatientInvoiceResponse(BaseModel):
    invoice_id: int
    invoice_number: str
    patient_id: int
    patient_name: str
    mrd_number: str
    bill_date: datetime
    due_date: Optional[datetime] = None
    subtotal: float
    discount_amount: float
    gst_rate: float
    tax_amount: float
    total_amount: float
    status: str
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    remarks: Optional[str] = None
    pdf_path: Optional[str] = None
    items: List[PatientInvoiceItemResponse] = []

    class Config:
        from_attributes = True


# --- Endpoints ---

@router.get("/unbilled/{patient_id}")
def get_unbilled_records(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Scans clinical tables for unbilled OPD Visits, Bed Stays, and Dental Treatments.
    Normalizes the records for the frontend invoice compiler.
    """
    # Verify patient exists and belongs to this hospital
    patient = db.query(Patient).filter(
        Patient.record_id == patient_id,
        Patient.hospital_id == current_user.hospital_id
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    unbilled = PatientBillingService.get_unbilled_records(db, cast(int, current_user.hospital_id), patient_id)
    
    items = []

    # Process OPD Visits
    for v in unbilled["opd_visits"]:
        visit_date_str = v.visit_date.strftime("%d-%b-%Y")
        items.append({
            "description": f"OPD Consultation - Visit Date: {visit_date_str}",
            "qty": 1,
            "unit_price": v.consultation_fee,
            "discount": 0.0,
            "charge_type": "OPD_VISIT",
            "reference_id": v.visit_id,
            "date": v.visit_date.isoformat()
        })

    # Process Dental Treatments
    for t in unbilled["dental_treatments"]:
        date_str = t.date_performed.strftime("%d-%b-%Y") if t.date_performed else ""
        desc = f"Dental Treatment: {t.treatment_type}"
        if t.tooth_number:
            desc += f" (Tooth {t.tooth_number})"
        if date_str:
            desc += f" on {date_str}"
            
        items.append({
            "description": desc,
            "qty": 1,
            "unit_price": t.cost,
            "discount": 0.0,
            "charge_type": "DENTAL_TREATMENT",
            "reference_id": t.treatment_id,
            "date": t.date_performed.isoformat() if t.date_performed else None
        })

    # Process IPD Admissions
    for adm in unbilled["ipd_admissions"]:
        # Calculate stay days dynamically
        end_date = adm.discharge_date or datetime.now()
        delta = end_date - adm.admission_date
        days = max(1, delta.days) # minimum 1 day charge
        
        # Default rate estimation based on ward type (ICU: 2000, General: 500, Private: 1500)
        rate = 500.0
        ward_type = adm.ward.ward_type.upper() if adm.ward else "GENERAL"
        if "ICU" in ward_type:
            rate = 2000.0
        elif "PRIVATE" in ward_type:
            rate = 1500.0
            
        ward_name = adm.ward.ward_name if adm.ward else "General Ward"
        bed_num = adm.bed.bed_number if adm.bed else "-"
        
        items.append({
            "description": f"IPD Stay - Ward: {ward_name}, Bed: {bed_num} ({days} days)",
            "qty": days,
            "unit_price": rate,
            "discount": 0.0,
            "charge_type": "IPD_ADMISSION",
            "reference_id": adm.admission_id,
            "date": adm.admission_date.isoformat()
        })

    return {
        "patient": {
            "name": patient.full_name,
            "mrd_number": patient.patient_u_id,
            "phone": patient.phone,
            "email": patient.email_id
        },
        "unbilled_items": items
    }


@router.post("/invoices", response_model=PatientInvoiceResponse)
def create_patient_invoice(
    req: PatientInvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new patient invoice manually.
    """
    items_data = [item.model_dump() for item in req.items]
    
    invoice = PatientBillingService.create_invoice(
        db=db,
        hospital_id=cast(int, current_user.hospital_id),
        patient_id=req.patient_id,
        items_data=items_data,
        discount_amount=req.discount_amount,
        gst_rate=req.gst_rate,
        payment_method=req.payment_method,
        transaction_id=req.transaction_id,  # type: ignore
        remarks=req.remarks,  # type: ignore
        created_by=cast(int, current_user.user_id),  # type: ignore
        due_date=req.due_date  # type: ignore
    )
    
    # Map to response format
    res = PatientInvoiceResponse.model_validate(invoice)
    res.patient_name = invoice.patient.full_name
    res.mrd_number = invoice.patient.patient_u_id
    return res


@router.get("/invoices", response_model=List[PatientInvoiceResponse])
def list_patient_invoices(
    patient_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all patient invoices for the logged-in hospital.
    """
    query = db.query(PatientInvoice).filter(PatientInvoice.hospital_id == current_user.hospital_id)
    
    if patient_id:
        query = query.filter(PatientInvoice.patient_id == patient_id)
    if status:
        query = query.filter(PatientInvoice.status == status)
        
    invoices = query.order_by(PatientInvoice.bill_date.desc()).all()
    
    results = []
    for inv in invoices:
        res = PatientInvoiceResponse.model_validate(inv)
        res.patient_name = inv.patient.full_name
        res.mrd_number = inv.patient.patient_u_id
        results.append(res)
        
    return results


@router.get("/invoices/{invoice_id}", response_model=PatientInvoiceResponse)
def get_patient_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed patient invoice.
    """
    invoice = db.query(PatientInvoice).filter(
        PatientInvoice.invoice_id == invoice_id,
        PatientInvoice.hospital_id == current_user.hospital_id
    ).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    res = PatientInvoiceResponse.model_validate(invoice)
    res.patient_name = invoice.patient.full_name
    res.mrd_number = invoice.patient.patient_u_id
    return res


@router.post("/invoices/{invoice_id}/send-email")
def send_email_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Email the invoice PDF statement directly to the patient.
    """
    success = PatientBillingService.send_email_notification(db, invoice_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to dispatch invoice email.")
    return {"message": "Email dispatched successfully."}


@router.post("/invoices/{invoice_id}/send-whatsapp")
def send_whatsapp_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a WhatsApp notification containing the invoice PDF link to the patient.
    """
    success = PatientBillingService.send_whatsapp_notification(db, invoice_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to dispatch WhatsApp notification.")
    return {"message": "WhatsApp notification dispatched successfully."}


@router.get("/daily-report")
def get_daily_billing_report(
    target_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Compiles daily collections report: totals, payment distribution, GST amounts, etc.
    """
    query_date = target_date or date.today()
    start_dt = datetime.combine(query_date, datetime.min.time())
    end_dt = datetime.combine(query_date, datetime.max.time())

    invoices = db.query(PatientInvoice).filter(
        PatientInvoice.hospital_id == current_user.hospital_id,
        PatientInvoice.bill_date.between(start_dt, end_dt)
    ).all()

    total_billed = sum(inv.total_amount for inv in invoices)
    total_gst = sum(inv.tax_amount for inv in invoices)
    total_discount = sum(inv.discount_amount for inv in invoices)
    total_subtotal = sum(inv.subtotal for inv in invoices)

    # Calculate collections distribution by payment method
    collections = {
        "CASH": 0.0,
        "CARD": 0.0,
        "QR_CODE": 0.0,
        "VOUCHER": 0.0,
        "GOVT_SCHEME": 0.0
    }
    
    for inv in invoices:
        if inv.status == "PAID" and inv.payment_method in collections:
            collections[inv.payment_method] += inv.total_amount

    # Invoices generated details
    invoice_details = []
    for inv in invoices:
        invoice_details.append({
            "invoice_id": inv.invoice_id,
            "invoice_number": inv.invoice_number,
            "patient_name": inv.patient.full_name,
            "mrd_number": inv.patient.patient_u_id,
            "total_amount": inv.total_amount,
            "status": inv.status,
            "payment_method": inv.payment_method
        })

    return {
        "date": query_date.isoformat(),
        "invoice_count": len(invoices),
        "total_billed": total_billed,
        "total_subtotal": total_subtotal,
        "total_gst": total_gst,
        "total_discount": total_discount,
        "collections": collections,
        "invoices": invoice_details
    }
