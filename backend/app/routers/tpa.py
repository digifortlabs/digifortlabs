from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..models import User, MediclaimClaim, Patient, Hospital, OPDVisit, IPDAdmission, EmergencyVisit
from .auth import get_current_user

router = APIRouter(
    prefix="/tpa",
    tags=["tpa"]
)

class ClaimUpdate(BaseModel):
    status: str
    approved_amount: Optional[float] = None
    policy_details: Optional[str] = None

@router.get("/claims")
def get_claims(
    hospital_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_hospital = hospital_id if hospital_id else current_user.hospital_id
    
    query = db.query(MediclaimClaim, Patient).join(Patient, MediclaimClaim.patient_id == Patient.record_id)\
        .filter(MediclaimClaim.hospital_id == target_hospital)
        
    if status:
        query = query.filter(MediclaimClaim.status == status)
        
    claims = query.order_by(MediclaimClaim.created_at.desc()).all()
    
    result = []
    for claim, pat in claims:
        result.append({
            "claim_id": claim.claim_id,
            "patient_id": pat.record_id,
            "patient_name": pat.full_name,
            "mrd_number": pat.patient_u_id,
            "visit_type": claim.visit_type,
            "visit_id": claim.visit_id,
            "policy_details": claim.policy_details,
            "status": claim.status,
            "claimed_amount": claim.claimed_amount,
            "approved_amount": claim.approved_amount,
            "created_at": claim.created_at,
            "updated_at": claim.updated_at
        })
    return result

@router.put("/claims/{claim_id}")
def update_claim(
    claim_id: int,
    payload: ClaimUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    claim = db.query(MediclaimClaim).filter(MediclaimClaim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    claim.status = payload.status
    if payload.approved_amount is not None:
        claim.approved_amount = payload.approved_amount
    if payload.policy_details is not None:
        claim.policy_details = payload.policy_details
        
    db.commit()
    db.refresh(claim)
    return claim
