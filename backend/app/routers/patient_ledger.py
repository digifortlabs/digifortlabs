from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy import func

from ..database import get_db
from ..crud import crud_all
from ..models import User, Patient, PatientLedgerTransaction, Hospital, IPDAdmission, OPDVisit
from .auth import get_current_user
from ..services.patient_billing_service import PatientBillingService

router = APIRouter(
    prefix="/patient-ledger",
    tags=["patient-ledger"]
)

class LedgerTransactionRequest(BaseModel):
    amount: float
    payment_method: str # CASH, CARD, UPI, NEFT
    reference_number: Optional[str] = None
    notes: Optional[str] = None

class IPDStatusResponse(BaseModel):
    patient_id: int
    patient_name: str
    mrd_number: str
    admission_date: Optional[datetime]
    bed_details: Optional[str] = None
    running_unbilled: float
    advance_deposit: float
    cashless_approved: float
    net_due: float

@router.get("/ipd-status", response_model=List[IPDStatusResponse])
def get_ipd_ledger_status(
    hospital_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns a comprehensive financial ledger status for all currently admitted IPD patients.
    """
    target_hospital = hospital_id if hospital_id else current_user.hospital_id
    
    # Get admitted patients (where discharge_date is null but admission is active)
    # We look at IPDAdmissions that don't have a discharge date
    active_admissions = db.query(IPDAdmission, Patient).join(Patient, IPDAdmission.patient_id == Patient.record_id)\
        .filter(IPDAdmission.hospital_id == target_hospital)\
        .filter(IPDAdmission.discharge_date == None)\
        .all()
        
    results = []
    
    for admission, patient in active_admissions:
        # Get unbilled items (running bill)
        try:
            unbilled_items = PatientBillingService.get_unbilled_records(db, target_hospital, patient.record_id)
            running_total = sum(float(item.get("total_price", 0)) for item in unbilled_items)
        except Exception as e:
            running_total = 0.0

        advance = patient.advance_balance or 0.0
        cashless = patient.cashless_approved_amount or 0.0
        net_due = max(0.0, running_total - advance - cashless)
        
        bed_str = f"Ward {admission.ward_id} - Bed {admission.bed_id}" if admission.ward_id else "Unassigned"

        results.append(IPDStatusResponse(
            patient_id=patient.record_id,
            patient_name=patient.full_name,
            mrd_number=patient.patient_u_id or patient.uhid,
            admission_date=admission.admission_date,
            bed_details=bed_str,
            running_unbilled=running_total,
            advance_deposit=advance,
            cashless_approved=cashless,
            net_due=net_due
        ))
        
    return results

@router.post("/{patient_id}/deposit")
def record_advance_deposit(
    patient_id: int,
    payload: LedgerTransactionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = crud_all.patient.get_first(db, Patient.record_id == patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # Record transaction
    transaction = PatientLedgerTransaction(
        patient_id=patient_id,
        hospital_id=current_user.hospital_id,
        transaction_type="ADVANCE_DEPOSIT",
        amount=payload.amount,
        payment_method=payload.payment_method,
        reference_number=payload.reference_number,
        notes=payload.notes
    )
    db.add(transaction)
    
    # Update global balances
    patient.advance_balance = (patient.advance_balance or 0.0) + payload.amount
    patient.total_paid = (patient.total_paid or 0.0) + payload.amount
    
    db.commit()
    return {"message": "Advance deposit recorded successfully", "new_balance": patient.advance_balance}

@router.post("/{patient_id}/cashless-approval")
def record_cashless_approval(
    patient_id: int,
    payload: LedgerTransactionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = crud_all.patient.get_first(db, Patient.record_id == patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    transaction = PatientLedgerTransaction(
        patient_id=patient_id,
        hospital_id=current_user.hospital_id,
        transaction_type="CASHLESS_APPROVAL",
        amount=payload.amount,
        reference_number=payload.reference_number, # TPA Approval ID
        notes=payload.notes
    )
    db.add(transaction)
    
    patient.cashless_approved_amount = (patient.cashless_approved_amount or 0.0) + payload.amount
    
    db.commit()
    return {"message": "Cashless approval recorded successfully", "new_approved_total": patient.cashless_approved_amount}

@router.get("/{patient_id}/history")
def get_ledger_history(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transactions = crud_all.patient_ledger_transaction.get_multi(db, 
        PatientLedgerTransaction.patient_id == patient_id,
        PatientLedgerTransaction.hospital_id == current_user.hospital_id
    ).order_by(PatientLedgerTransaction.timestamp.desc())
    
    return transactions
