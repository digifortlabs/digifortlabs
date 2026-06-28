from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models import EmergencyVisit, Patient, User, UserRole, DoctorProfile
from app.routers.auth import get_current_user

router = APIRouter(prefix="/emergency", tags=["Emergency"])

# Schemas
class EmergencyVisitCreate(BaseModel):
    patient_id: int
    doctor_id: Optional[int] = None
    triage_level: str = "Yellow" # Red, Orange, Yellow, Green, Blue
    mode_of_arrival: Optional[str] = None
    is_medico_legal: bool = False
    police_station: Optional[str] = None
    ambulance_driver: Optional[str] = None
    chief_complaint: Optional[str] = None
    temperature: Optional[float] = None
    blood_pressure: Optional[str] = None
    pulse_rate: Optional[int] = None
    weight: Optional[float] = None
    is_mediclaim: bool = False
    mediclaim_details: Optional[str] = None

class EmergencyVisitUpdate(BaseModel):
    doctor_id: Optional[int] = None
    triage_level: Optional[str] = None
    status: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    notes: Optional[str] = None
    temperature: Optional[float] = None
    blood_pressure: Optional[str] = None
    pulse_rate: Optional[int] = None
    weight: Optional[float] = None
    is_mediclaim: Optional[bool] = None
    mediclaim_details: Optional[str] = None
    hpi: Optional[str] = None
    allergies: Optional[str] = None
    past_history: Optional[str] = None
    abcde_assessment: Optional[dict] = None
    stat_orders: Optional[str] = None
    mode_of_arrival: Optional[str] = None
    is_medico_legal: Optional[bool] = None
    police_station: Optional[str] = None
    ambulance_driver: Optional[str] = None
    chief_complaint: Optional[str] = None

class EmergencyVisitResponse(BaseModel):
    emergency_id: int
    patient_id: int
    hospital_id: int
    doctor_id: Optional[int] = None
    visit_date: datetime
    triage_level: str
    mode_of_arrival: Optional[str] = None
    is_medico_legal: bool
    police_station: Optional[str] = None
    ambulance_driver: Optional[str] = None
    chief_complaint: Optional[str] = None
    temperature: Optional[float] = None
    blood_pressure: Optional[str] = None
    pulse_rate: Optional[int] = None
    weight: Optional[float] = None
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    notes: Optional[str] = None
    hpi: Optional[str] = None
    allergies: Optional[str] = None
    past_history: Optional[str] = None
    abcde_assessment: Optional[dict] = None
    stat_orders: Optional[str] = None
    is_mediclaim: bool = False
    mediclaim_details: Optional[str] = None
    status: str
    
    # Nested fields for UI
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None

    class Config:
        from_attributes = True

@router.post("/", response_model=EmergencyVisitResponse)
def register_emergency(
    data: EmergencyVisitCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Verify patient
    patient = db.query(Patient).filter(
        Patient.record_id == data.patient_id, 
        Patient.hospital_id == current_user.hospital_id
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    new_visit = EmergencyVisit(
        patient_id=data.patient_id,
        hospital_id=current_user.hospital_id,
        doctor_id=data.doctor_id,
        triage_level=data.triage_level,
        mode_of_arrival=data.mode_of_arrival,
        is_medico_legal=data.is_medico_legal,
        police_station=data.police_station,
        ambulance_driver=data.ambulance_driver,
        chief_complaint=data.chief_complaint,
        temperature=data.temperature,
        blood_pressure=data.blood_pressure,
        pulse_rate=data.pulse_rate,
        weight=data.weight,
        is_mediclaim=data.is_mediclaim,
        mediclaim_details=data.mediclaim_details,
        status="Active"
    )
    db.add(new_visit)
    db.commit()
    db.refresh(new_visit)
    
    # Construct response with joined names
    response = EmergencyVisitResponse.model_validate(new_visit)
    response.patient_name = patient.full_name
    
    if new_visit.doctor_id:
        doc = db.query(DoctorProfile).filter(DoctorProfile.profile_id == new_visit.doctor_id).first()
        if doc:
            response.doctor_name = doc.full_name
            
    return response

@router.get("/", response_model=List[EmergencyVisitResponse])
def get_active_emergencies(
    status: Optional[str] = "Active",
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(EmergencyVisit, Patient).join(
        Patient, EmergencyVisit.patient_id == Patient.record_id
    ).filter(EmergencyVisit.hospital_id == current_user.hospital_id)
    
    if status:
        query = query.filter(EmergencyVisit.status == status)
        
    results = query.order_by(EmergencyVisit.visit_date.desc()).all()
    
    responses = []
    for visit, patient in results:
        resp = EmergencyVisitResponse.model_validate(visit)
        resp.patient_name = patient.full_name
        
        if visit.doctor_id:
            doc = db.query(DoctorProfile).filter(DoctorProfile.profile_id == visit.doctor_id).first()
            if doc:
                resp.doctor_name = doc.full_name
                
        responses.append(resp)
        
    return responses

@router.put("/{emergency_id}", response_model=EmergencyVisitResponse)
def update_emergency(
    emergency_id: int,
    data: EmergencyVisitUpdate,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    visit = db.query(EmergencyVisit).filter(
        EmergencyVisit.emergency_id == emergency_id,
        EmergencyVisit.hospital_id == current_user.hospital_id
    ).first()
    
    if not visit:
        raise HTTPException(status_code=404, detail="Emergency visit not found")
        
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(visit, key, value)
        
    db.commit()
    db.refresh(visit)
    
    patient = db.query(Patient).filter(Patient.record_id == visit.patient_id).first()
    
    response = EmergencyVisitResponse.model_validate(visit)
    if patient:
        response.patient_name = patient.full_name
        
    if visit.doctor_id:
        doc = db.query(DoctorProfile).filter(DoctorProfile.profile_id == visit.doctor_id).first()
        if doc:
            response.doctor_name = doc.full_name
            
    return response

@router.delete("/{emergency_id}")
def delete_emergency(
    emergency_id: int,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    visit = db.query(EmergencyVisit).filter(
        EmergencyVisit.emergency_id == emergency_id,
        EmergencyVisit.hospital_id == current_user.hospital_id
    ).first()
    
    if not visit:
        raise HTTPException(status_code=404, detail="Emergency visit not found")
        
    db.delete(visit)
    db.commit()
    
    return {"message": "Emergency visit deleted successfully"}
