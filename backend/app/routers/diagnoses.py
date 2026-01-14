

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ICD11Code, Patient, PatientDiagnosis, User
from .auth import get_current_user
from ..services.icd11_service import icd_service

router = APIRouter()

# --- Schemas ---
class ICD11Response(BaseModel):
    code: str
    description: str
    chapter: Optional[str] = None
    
    class Config:
        from_attributes = True

class DiagnosisCreate(BaseModel):
    code: str
    notes: Optional[str] = None

class DiagnosisResponse(BaseModel):
    diagnosis_id: int
    record_id: int
    code: str
    description: str
    notes: Optional[str]
    diagnosed_at: str # Use string format for simplicity or datetime
    diagnosed_by_name: Optional[str]

# --- Endpoints ---

@router.get("/search", response_model=List[ICD11Response])
def search_diagnoses(q: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Search locally and fallback/supplement with WHO ICD-11 live API."""
    if len(q) < 2:
        return []
    
    try:
        # 1. Local Search
        local_results = db.query(ICD11Code).filter(
            or_(
                ICD11Code.code.ilike(f"%{q}%"),
                ICD11Code.description.ilike(f"%{q}%")
            )
        ).limit(10).all()
        
        # 2. WHO Live Search
        live_results = []
        try:
            live_results = icd_service.search_codes(q)
        except Exception as e:
            print(f"⚠️ WHO Search Failed: {e}")
        
        # Merge Results
        seen_codes = {r.code for r in local_results}
        # Use model_validate for Pydantic v2
        merged = [ICD11Response.model_validate(r) for r in local_results]
        
        for r in live_results:
            if r["code"] not in seen_codes:
                try:
                    merged.append(ICD11Response(**r))
                    seen_codes.add(r["code"])
                except Exception as ve:
                    print(f"⚠️ Validation error for {r}: {ve}")
                
        return merged[:20]
    except Exception as ge:
        print(f"❌ Global Search Error: {ge}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(ge)}")

@router.get("/patients/{patient_id}/diagnoses", response_model=List[DiagnosisResponse])
def get_patient_diagnoses(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all diagnoses for a patient."""
    # Check access (simple check for now)
    patient = db.query(Patient).filter(Patient.record_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    diagnoses = db.query(PatientDiagnosis).filter(PatientDiagnosis.record_id == patient_id).all()
    
    # Transform to include description and doctor name
    response = []
    for d in diagnoses:
        response.append({
            "diagnosis_id": d.diagnosis_id,
            "record_id": d.record_id,
            "code": d.code,
            "description": d.icd_code.description if d.icd_code else "Unknown",
            "notes": d.notes,
            "diagnosed_at": d.diagnosed_at.isoformat() if d.diagnosed_at else "",
            "diagnosed_by_name": d.doctor.email if d.doctor else "System" # Using email as name for now
        })
    
    return response

@router.post("/patients/{patient_id}/diagnoses")
def add_patient_diagnosis(
    patient_id: int, 
    diagnosis: DiagnosisCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Add a diagnosis to a patient."""
    patient = db.query(Patient).filter(Patient.record_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Validate code
    icd_code = db.query(ICD11Code).filter(ICD11Code.code == diagnosis.code).first()
    if not icd_code:
        # Check if we can find it in live API before failing
        # This allows "on-the-fly" registration of official codes
        live_res = icd_service.search_codes(diagnosis.code) # Precise search if possible
        found_live = next((item for item in live_res if item["code"] == diagnosis.code), None)
        
        if found_live:
            # Auto-Register the code locally
            icd_code = ICD11Code(
                code=found_live["code"],
                description=found_live["description"],
                chapter="WHO-AUTO"
            )
            db.add(icd_code)
            db.commit()
        else:
            raise HTTPException(status_code=400, detail="Invalid or unregistered ICD-11 Code")

    new_diagnosis = PatientDiagnosis(
        record_id=patient_id,
        code=diagnosis.code,
        notes=diagnosis.notes,
        diagnosed_by=current_user.user_id
    )
    
    db.add(new_diagnosis)
    db.commit()
    db.refresh(new_diagnosis)
    
    return {"message": "Diagnosis added successfully", "diagnosis_id": new_diagnosis.diagnosis_id}

@router.delete("/patients/{patient_id}/diagnoses/{diagnosis_id}")
def delete_patient_diagnosis(
    patient_id: int,
    diagnosis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a diagnosis."""
    # Only allow Admin or Doctors (checking role string for simplicity)
    # Assuming 'website_admin', 'hospital_admin' can delete. 
    # Or purely whoever created it? Let's allow admins for now.
    
    diag = db.query(PatientDiagnosis).filter(
        PatientDiagnosis.diagnosis_id == diagnosis_id,
        PatientDiagnosis.record_id == patient_id
    ).first()
    
    if not diag:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
        
    db.delete(diag)
    db.commit()
    
    return {"message": "Diagnosis removed"}
