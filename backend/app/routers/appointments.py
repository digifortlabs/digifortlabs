from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from ..database import get_db
from ..models import Appointment, Department, DoctorProfile, DoctorSchedule, User
from .auth import get_current_user

router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"],
    responses={404: {"description": "Not found"}},
)

# --- Schemas ---
class DepartmentResponse(BaseModel):
    department_id: int
    name: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

class DoctorResponse(BaseModel):
    user_id: int
    full_name: str
    department_id: int
    specialization: Optional[str] = None
    consultation_fee: float

class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    department_id: int
    appointment_date: datetime
    start_time: datetime
    end_time: datetime
    reason_for_visit: Optional[str] = None
    notes: Optional[str] = None

class AppointmentResponse(BaseModel):
    appointment_id: int
    patient_id: int
    doctor_id: int
    department_id: int
    appointment_date: datetime
    start_time: datetime
    end_time: datetime
    status: str
    reason_for_visit: Optional[str] = None
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True

# --- Endpoints ---

@router.get("/departments", response_model=List[DepartmentResponse])
async def get_departments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all departments in the current user's hospital."""
    departments = db.query(Department).filter(
        Department.hospital_id == current_user.hospital_id,
        Department.is_active == True
    ).all()
    return departments

@router.get("/doctors", response_model=List[DoctorResponse])
async def get_doctors(
    department_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get doctors, optionally filtered by department."""
    query = db.query(User, DoctorProfile).join(
        DoctorProfile, User.user_id == DoctorProfile.user_id
    ).filter(User.hospital_id == current_user.hospital_id)
    
    if department_id:
        query = query.filter(DoctorProfile.department_id == department_id)
        
    doctors = []
    for user, profile in query.all():
        doctors.append(DoctorResponse(
            user_id=user.user_id,
            full_name=user.full_name,
            department_id=profile.department_id,
            specialization=profile.specialization,
            consultation_fee=profile.consultation_fee
        ))
    return doctors

@router.post("/", response_model=AppointmentResponse)
async def create_appointment(
    payload: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new centralized appointment."""
    
    # Check doctor availability
    conflict = db.query(Appointment).filter(
        Appointment.doctor_id == payload.doctor_id,
        Appointment.status.in_(["Scheduled", "Arrived", "In-Consultation"]),
        Appointment.appointment_date == payload.appointment_date,
        or_(
            Appointment.start_time.between(payload.start_time, payload.end_time),
            Appointment.end_time.between(payload.start_time, payload.end_time)
        )
    ).first()
    
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor already has an appointment during this time."
        )

    new_appointment = Appointment(
        hospital_id=current_user.hospital_id,
        **payload.model_dump()
    )
    
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)
    
    return new_appointment

@router.get("/", response_model=List[AppointmentResponse])
async def get_appointments(
    date: Optional[str] = None, # YYYY-MM-DD
    doctor_id: Optional[int] = None,
    department_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get appointments with optional filters."""
    query = db.query(Appointment).filter(Appointment.hospital_id == current_user.hospital_id)
    
    if date:
        # Simple date casting approximation
        query = query.filter(func.date(Appointment.appointment_date) == date)
        
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
        
    if department_id:
        query = query.filter(Appointment.department_id == department_id)
        
    if status:
        query = query.filter(Appointment.status == status)
        
    return query.order_by(Appointment.start_time).all()

@router.put("/{appointment_id}/status")
async def update_appointment_status(
    appointment_id: int,
    status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    valid_statuses = ["Scheduled", "Arrived", "In-Consultation", "Completed", "Cancelled", "No-Show"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    appointment = db.query(Appointment).filter(
        Appointment.appointment_id == appointment_id,
        Appointment.hospital_id == current_user.hospital_id
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    appointment.status = status
    db.commit()
    return {"message": "Status updated successfully", "status": status}
