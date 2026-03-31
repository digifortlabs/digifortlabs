from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel

from ..database import get_db
from ..models import User, LegalClient, LegalCase, CaseHearing, CaseDocument, LegalBilling
from .auth import get_current_user

router = APIRouter(prefix="/legal", tags=["Law Firm"])

# --- Pydantic Schemas ---

class ClientCreate(BaseModel):
    client_type: str  # Individual, Corporate
    full_name: str
    company_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    pan_number: Optional[str] = None
    gst_number: Optional[str] = None

class CaseCreate(BaseModel):
    client_id: int
    case_title: str
    case_type: str
    court_name: Optional[str] = None
    court_location: Optional[str] = None
    judge_name: Optional[str] = None
    petitioner: Optional[str] = None
    respondent: Optional[str] = None
    filing_date: Optional[date] = None
    priority: str = "medium"
    case_summary: Optional[str] = None
    legal_issues: Optional[str] = None

class HearingCreate(BaseModel):
    case_id: int
    hearing_date: datetime
    hearing_type: str
    court_room: Optional[str] = None
    judge_name: Optional[str] = None
    outcome: Optional[str] = None
    next_hearing_date: Optional[datetime] = None
    notes: Optional[str] = None

class BillingCreate(BaseModel):
    case_id: int
    client_id: int
    consultation_fee: float = 0.0
    court_fee: float = 0.0
    documentation_fee: float = 0.0
    other_charges: float = 0.0
    gst_rate: float = 18.0

# --- Endpoints ---

@router.post("/clients")
def create_client(
    client: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register new client"""
    # Generate client number
    count = db.query(LegalClient).filter(
        LegalClient.firm_id == current_user.hospital_id
    ).count()
    client_number = f"CLT{current_user.hospital_id:04d}{count+1:06d}"
    
    new_client = LegalClient(
        firm_id=current_user.hospital_id,
        client_number=client_number,
        client_type=client.client_type,
        full_name=client.full_name,
        company_name=client.company_name,
        phone=client.phone,
        email=client.email,
        address=client.address,
        pan_number=client.pan_number,
        gst_number=client.gst_number
    )
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client

@router.get("/clients")
def get_clients(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all clients"""
    query = db.query(LegalClient).filter(
        LegalClient.firm_id == current_user.hospital_id,
        LegalClient.is_active == True
    )
    
    if search:
        query = query.filter(
            func.lower(LegalClient.full_name).contains(func.lower(search))
        )
    
    return query.all()

@router.post("/cases")
def create_case(
    case: CaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new case"""
    # Generate case number
    count = db.query(LegalCase).filter(
        LegalCase.firm_id == current_user.hospital_id
    ).count()
    case_number = f"CASE{current_user.hospital_id:04d}{count+1:06d}"
    
    new_case = LegalCase(
        client_id=case.client_id,
        firm_id=current_user.hospital_id,
        case_number=case_number,
        case_title=case.case_title,
        case_type=case.case_type,
        court_name=case.court_name,
        court_location=case.court_location,
        judge_name=case.judge_name,
        petitioner=case.petitioner,
        respondent=case.respondent,
        filing_date=case.filing_date,
        status="Filed",
        priority=case.priority,
        primary_lawyer_id=current_user.user_id,
        case_summary=case.case_summary,
        legal_issues=case.legal_issues
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return new_case

@router.get("/cases")
def get_cases(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all cases"""
    query = db.query(LegalCase).filter(
        LegalCase.firm_id == current_user.hospital_id
    )
    
    if status:
        query = query.filter(LegalCase.status == status)
    
    return query.order_by(LegalCase.filing_date.desc()).all()

@router.get("/cases/{case_id}")
def get_case_detail(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get case details with hearings"""
    case = db.query(LegalCase).filter(
        LegalCase.case_id == case_id,
        LegalCase.firm_id == current_user.hospital_id
    ).first()
    
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    hearings = db.query(CaseHearing).filter(
        CaseHearing.case_id == case_id
    ).order_by(CaseHearing.hearing_date.desc()).all()
    
    documents = db.query(CaseDocument).filter(
        CaseDocument.case_id == case_id
    ).all()
    
    return {
        "case": case,
        "hearings": hearings,
        "documents": documents
    }

@router.post("/hearings")
def schedule_hearing(
    hearing: HearingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Schedule court hearing"""
    new_hearing = CaseHearing(
        case_id=hearing.case_id,
        hearing_date=hearing.hearing_date,
        hearing_type=hearing.hearing_type,
        court_room=hearing.court_room,
        judge_name=hearing.judge_name,
        outcome=hearing.outcome,
        next_hearing_date=hearing.next_hearing_date,
        notes=hearing.notes
    )
    db.add(new_hearing)
    db.commit()
    db.refresh(new_hearing)
    return new_hearing

@router.get("/hearings/upcoming")
def get_upcoming_hearings(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get upcoming hearings"""
    from datetime import timedelta
    cutoff = datetime.now() + timedelta(days=days)
    
    hearings = db.query(CaseHearing).join(LegalCase).filter(
        LegalCase.firm_id == current_user.hospital_id,
        CaseHearing.hearing_date >= datetime.now(),
        CaseHearing.hearing_date <= cutoff
    ).order_by(CaseHearing.hearing_date.asc()).all()
    
    result = []
    for h in hearings:
        case = db.query(LegalCase).filter(LegalCase.case_id == h.case_id).first()
        result.append({
            "hearing_id": h.hearing_id,
            "case_number": case.case_number,
            "case_title": case.case_title,
            "hearing_date": h.hearing_date,
            "hearing_type": h.hearing_type,
            "court_room": h.court_room
        })
    
    return result

@router.post("/billing")
def create_bill(
    billing: BillingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate legal fee bill"""
    subtotal = (billing.consultation_fee + billing.court_fee + 
                billing.documentation_fee + billing.other_charges)
    gst_amount = subtotal * (billing.gst_rate / 100)
    total = subtotal + gst_amount
    
    new_bill = LegalBilling(
        case_id=billing.case_id,
        client_id=billing.client_id,
        bill_date=date.today(),
        consultation_fee=billing.consultation_fee,
        court_fee=billing.court_fee,
        documentation_fee=billing.documentation_fee,
        other_charges=billing.other_charges,
        subtotal=subtotal,
        gst_amount=gst_amount,
        total_amount=total,
        balance=total
    )
    db.add(new_bill)
    db.commit()
    db.refresh(new_bill)
    return new_bill

@router.get("/stats")
def get_legal_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get law firm statistics"""
    total_clients = db.query(LegalClient).filter(
        LegalClient.firm_id == current_user.hospital_id,
        LegalClient.is_active == True
    ).count()
    
    total_cases = db.query(LegalCase).filter(
        LegalCase.firm_id == current_user.hospital_id
    ).count()
    
    active_cases = db.query(LegalCase).filter(
        LegalCase.firm_id == current_user.hospital_id,
        LegalCase.status.in_(["Filed", "Pending", "Hearing"])
    ).count()
    
    upcoming_hearings = db.query(CaseHearing).join(LegalCase).filter(
        LegalCase.firm_id == current_user.hospital_id,
        CaseHearing.hearing_date >= datetime.now()
    ).count()
    
    return {
        "total_clients": total_clients,
        "total_cases": total_cases,
        "active_cases": active_cases,
        "upcoming_hearings": upcoming_hearings
    }
