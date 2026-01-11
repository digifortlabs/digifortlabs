from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ICD11ProcedureCode, Patient, PatientProcedure, User
from ..routers.auth import get_current_user

router = APIRouter()

# --- Pydantic Models ---

class ProcedureResponse(BaseModel):
    code: str
    description: str

    class Config:
        from_attributes = True

class PatientProcedureCreate(BaseModel):
    code: str
    notes: Optional[str] = None
    performed_at: Optional[datetime] = None

class PatientProcedureResponse(BaseModel):
    procedure_id: int
    code: str
    description: str
    notes: Optional[str]
    performed_at: datetime
    performed_by_name: str

    class Config:
        from_attributes = True

# --- Endpoints ---

@router.get("/search", response_model=List[ProcedureResponse])
def search_procedures(q: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Search for ICD-11 Procedures by code or description."""
    if len(q) < 2:
        return []
    
    results = db.query(ICD11ProcedureCode).filter(
        or_(
            ICD11ProcedureCode.code.ilike(f"%{q}%"),
            ICD11ProcedureCode.description.ilike(f"%{q}%")
        )
    ).limit(20).all()
    
    return results

@router.post("/patients/{patient_id}/procedures", response_model=PatientProcedureResponse)
def add_patient_procedure(
    patient_id: int, 
    proc: PatientProcedureCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Add a procedure to a patient record."""
    
    # 1. Verify Patient
    patient = db.query(Patient).filter(Patient.record_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # 2. Verify Procedure Code
    code_exists = db.query(ICD11ProcedureCode).filter(ICD11ProcedureCode.code == proc.code).first()
    if not code_exists:
        raise HTTPException(status_code=400, detail="Invalid Procedure Code")

    # 3. Create Record
    new_proc = PatientProcedure(
        record_id=patient_id,
        code=proc.code,
        notes=proc.notes,
        performed_at=proc.performed_at or datetime.now(),
        performed_by=current_user.user_id
    )
    
    db.add(new_proc)
    db.commit()
    db.refresh(new_proc)
    
    return PatientProcedureResponse(
        procedure_id=new_proc.procedure_id,
        code=new_proc.code,
        description=code_exists.description,
        notes=new_proc.notes,
        performed_at=new_proc.performed_at,
        performed_by_name=current_user.full_name
    )

@router.get("/patients/{patient_id}/procedures", response_model=List[PatientProcedureResponse])
def get_patient_procedures(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all procedures for a patient."""
    
    procs = db.query(PatientProcedure).filter(PatientProcedure.record_id == patient_id).order_by(PatientProcedure.performed_at.desc()).all()
    
    results = []
    for p in procs:
        # Join explicitly if needed, but lazy load works for simple access if relationship set
        # But we need doctor name and description
        desc = p.procedure_code.description if p.procedure_code else "Unknown"
        doc_name = p.doctor.full_name if p.doctor else "Unknown"
        
        results.append(PatientProcedureResponse(
            procedure_id=p.procedure_id,
            code=p.code,
            description=desc,
            notes=p.notes,
            performed_at=p.performed_at,
            performed_by_name=doc_name
        ))
        
    return results

@router.delete("/patients/{patient_id}/procedures/{proc_id}")
def delete_patient_procedure(patient_id: int, proc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete a procedure record."""
    
    proc = db.query(PatientProcedure).filter(
        PatientProcedure.procedure_id == proc_id,
        PatientProcedure.record_id == patient_id
    ).first()
    
    if not proc:
        raise HTTPException(status_code=404, detail="Procedure not found")
        
    db.delete(proc)
    db.commit()
    
    return {"status": "success", "message": "Procedure deleted"}
