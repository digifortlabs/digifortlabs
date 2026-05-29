from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from datetime import datetime, time, timezone, timedelta, date
from pydantic import BaseModel

from ..database import get_db
from ..models import Appointment, Department, DoctorProfile, DoctorSchedule, User, Hospital
from .auth import get_current_user

router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"],
    responses={404: {"description": "Not found"}},
)

# --- Schemas ---
class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class DepartmentResponse(DepartmentBase):
    department_id: int
    
    class Config:
        from_attributes = True

class DoctorResponse(BaseModel):
    profile_id: int
    full_name: str
    department_id: int
    specialization: Optional[str] = None
    consultation_fee: float

class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    department_id: int
    appointment_date: Optional[datetime] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    reason_for_visit: Optional[str] = None
    notes: Optional[str] = None
    visit_type: Optional[str] = 'OPD'
    is_follow_up: Optional[bool] = False

class AppointmentUpdate(BaseModel):
    doctor_id: Optional[int] = None
    department_id: Optional[int] = None
    appointment_date: Optional[datetime] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    reason_for_visit: Optional[str] = None
    notes: Optional[str] = None
    visit_type: Optional[str] = None
    is_follow_up: Optional[bool] = None
    status: Optional[str] = None

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
    visit_type: str
    is_follow_up: bool
    opd_number: Optional[str] = None
    
    class Config:
        from_attributes = True

class NextSlotResponse(BaseModel):
    doctor_id: int
    date: str
    start_time: datetime
    end_time: datetime
    available: bool
    message: Optional[str] = None

class PreviewSlotRequest(BaseModel):
    doctor_id: int
    appointment_date: date
    visit_type: str = "OPD"
    preferred_time: Optional[time] = None

class DoctorScheduleBlockResponse(BaseModel):
    start_time: str
    end_time: str
    session_type: str

def get_next_available_slot(
    db: Session, doctor_id: int, target_date: date, hospital_id: int, 
    visit_type: str = "OPD", preferred_time: Optional[time] = None
) -> tuple[datetime, datetime, Optional[str]]:
    day_of_week = target_date.weekday() # 0 = Monday, 6 = Sunday
    
    all_schedules = db.query(DoctorSchedule).filter(
        DoctorSchedule.doctor_id == doctor_id,
        DoctorSchedule.day_of_week == day_of_week,
        DoctorSchedule.is_active == True
    ).order_by(DoctorSchedule.start_time).all()
    
    valid_blocks = [s for s in all_schedules if s.session_type == visit_type]
    
    if not valid_blocks:
        if all_schedules:
            raise ValueError(f"Doctor is not available for {visit_type} on this day.")
        else:
            raise ValueError("Doctor has no schedule on this day.")

    now = datetime.now()
    if target_date < now.date():
        raise ValueError("Cannot book appointments in the past.")

    appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.hospital_id == hospital_id,
        Appointment.appointment_date >= datetime.combine(target_date, time.min),
        Appointment.appointment_date <= datetime.combine(target_date, time.max),
        Appointment.status.in_(["Scheduled", "Arrived", "In-Consultation"])
    ).order_by(Appointment.end_time.asc()).all()

    search_start = now if target_date == now.date() else datetime.combine(target_date, time.min)
    if preferred_time:
        pref_dt = datetime.combine(target_date, preferred_time)
        search_start = max(search_start, pref_dt)

    message = None
    if preferred_time:
        pref_str = preferred_time.strftime("%H:%M")
        for s in all_schedules:
            if s.session_type != visit_type and s.start_time <= pref_str < s.end_time:
                message = f"Doctor is in {s.session_type} at {pref_str}. Suggesting nearest available {visit_type} time."

    for block in valid_blocks:
        try:
            sh, sm = map(int, block.start_time.split(":"))
            eh, em = map(int, block.end_time.split(":"))
        except:
            continue
            
        block_start = datetime.combine(target_date, time(sh, sm))
        block_end = datetime.combine(target_date, time(eh, em))
        
        if block_end <= search_start:
            continue
            
        current_time = max(block_start, search_start)
        
        while current_time + timedelta(minutes=7) <= block_end:
            slot_end = current_time + timedelta(minutes=7)
            
            conflict = False
            for appt in appointments:
                if not (slot_end <= appt.start_time or current_time >= appt.end_time):
                    conflict = True
                    current_time = appt.end_time
                    break
            
            if not conflict:
                sample = db.query(Appointment).filter(Appointment.hospital_id == hospital_id).first()
                use_tz = timezone.utc if (sample and sample.end_time and sample.end_time.tzinfo) else None
                if use_tz:
                    current_time = current_time.replace(tzinfo=use_tz)
                    slot_end = slot_end.replace(tzinfo=use_tz)
                return current_time, slot_end, message
                
    raise ValueError(f"No available {visit_type} slots remaining on this date.")

# --- Endpoints ---

@router.get("/departments", response_model=List[DepartmentResponse])
@router.get("/departments/", response_model=List[DepartmentResponse], include_in_schema=False)
async def get_departments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all active departments in the current user's hospital."""
    departments = db.query(Department).filter(
        Department.hospital_id == current_user.hospital_id,
        Department.is_active == True
    ).all()
    return departments

@router.post("/departments", response_model=DepartmentResponse)
async def create_department(
    dept_in: DepartmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new department."""
    if current_user.role not in ['superadmin', 'hospital_admin', 'website_admin']:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    new_dept = Department(
        hospital_id=current_user.hospital_id,
        name=dept_in.name,
        description=dept_in.description,
        is_active=dept_in.is_active
    )
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept

@router.put("/departments/{department_id}", response_model=DepartmentResponse)
async def update_department(
    department_id: int,
    dept_in: DepartmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing department."""
    if current_user.role not in ['superadmin', 'hospital_admin', 'website_admin']:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    dept = db.query(Department).filter(
        Department.department_id == department_id,
        Department.hospital_id == current_user.hospital_id
    ).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    if dept_in.name is not None:
        dept.name = dept_in.name
    if dept_in.description is not None:
        dept.description = dept_in.description
    if dept_in.is_active is not None:
        dept.is_active = dept_in.is_active
        
    db.commit()
    db.refresh(dept)
    return dept

@router.delete("/departments/{department_id}")
async def delete_department(
    department_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a department if no doctors are assigned to it."""
    if current_user.role not in ['superadmin', 'hospital_admin', 'website_admin']:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    dept = db.query(Department).filter(
        Department.department_id == department_id,
        Department.hospital_id == current_user.hospital_id
    ).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    # Check if doctors are assigned
    active_doctors = db.query(DoctorProfile).filter(
        DoctorProfile.department_id == department_id
    ).count()
    
    if active_doctors > 0:
        raise HTTPException(status_code=400, detail="Cannot delete department. There are doctors assigned to it.")
        
    db.delete(dept)
    db.commit()
    return {"message": "Department deleted successfully"}


@router.get("/doctors", response_model=List[DoctorResponse])
@router.get("/doctors/", response_model=List[DoctorResponse], include_in_schema=False)
async def get_doctors(
    department_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get doctors, optionally filtered by department."""
    query = db.query(DoctorProfile).filter(
        DoctorProfile.hospital_id == current_user.hospital_id,
        DoctorProfile.is_active == True
    )
    
    if department_id:
        query = query.filter(DoctorProfile.department_id == department_id)
        
    doctors = []
    for profile in query.all():
        doctors.append(DoctorResponse(
            profile_id=profile.profile_id,
            full_name=profile.full_name,
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
    """Create a new centralized appointment with dynamic queueing."""
    from datetime import datetime, timedelta, timezone
    now = datetime.now()
    
    if not payload.start_time or not payload.end_time:
        # Auto-assign date and times if not provided
        if not payload.appointment_date:
            payload.appointment_date = datetime.combine(now.date(), datetime.min.time())
            
        start_t, end_t, _ = get_next_available_slot(
            db, payload.doctor_id, payload.appointment_date.date(), 
            current_user.hospital_id, payload.visit_type
        )
        payload.start_time = start_t
        payload.end_time = end_t
    
    # Check doctor availability (only if times were manually provided, auto-queue avoids conflicts)
    else:
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

    hospital = db.query(Hospital).filter(Hospital.hospital_id == current_user.hospital_id).first()
    id_settings = hospital.id_generation_settings or {} if hospital else {}
    conf_prefix = id_settings.get("opd_prefix", "OPD-")
    conf_postfix = id_settings.get("opd_postfix", "")
    conf_padding = int(id_settings.get("opd_padding", 4))
    
    appts = db.query(Appointment.opd_number).filter(Appointment.hospital_id == current_user.hospital_id).all()
    max_val = 0
    import re
    for a in appts:
        if not a.opd_number: continue
        numbers = re.findall(r'\d+', a.opd_number)
        if numbers:
            num_part = int(numbers[-1])
            if num_part > max_val:
                max_val = num_part
                
    next_val = max_val + 1
    generated_opd = f"{conf_prefix}{str(next_val).zfill(conf_padding)}{conf_postfix}"

    new_appointment = Appointment(
        hospital_id=current_user.hospital_id,
        opd_number=generated_opd,
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
    is_follow_up: Optional[bool] = None,
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
        
    if is_follow_up is not None:
        query = query.filter(Appointment.is_follow_up == is_follow_up)
        
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
        
    if status == "Completed" and appointment.status != "Completed":
        from datetime import datetime, timedelta, timezone
        now = datetime.now(timezone.utc) if appointment.end_time.tzinfo else datetime.now()
        
        # If the consultation went overtime, shift the queue
        if now > appointment.end_time:
            delay = now - appointment.end_time
            
            subsequent_appts = db.query(Appointment).filter(
                Appointment.doctor_id == appointment.doctor_id,
                Appointment.appointment_date == appointment.appointment_date,
                Appointment.start_time > appointment.start_time,
                Appointment.status.in_(["Scheduled", "Arrived"])
            ).all()
            
            for appt in subsequent_appts:
                appt.start_time += delay
                appt.end_time += delay
                
        # Optional: if they finish early, we COULD pull appointments forward, but 
        # that might confuse patients who were told a specific time. Typically, we only delay.
        
        appointment.end_time = now # Record actual completion time
        
    setattr(appointment, "status", status)
    db.commit()
    return {"message": "Status updated successfully", "status": status}

@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: int,
    payload: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update centralized appointment details with conflict checking."""
    appointment = db.query(Appointment).filter(
        Appointment.appointment_id == appointment_id,
        Appointment.hospital_id == current_user.hospital_id
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    # If updating times, check doctor conflicts (excluding current appointment)
    if payload.start_time or payload.end_time or payload.doctor_id:
        doc_id = payload.doctor_id or appointment.doctor_id
        start_t = payload.start_time or appointment.start_time
        end_t = payload.end_time or appointment.end_time
        appt_date = payload.appointment_date or appointment.appointment_date
        
        conflict = db.query(Appointment).filter(
            Appointment.doctor_id == doc_id,
            Appointment.appointment_id != appointment_id,
            Appointment.status.in_(["Scheduled", "Arrived", "In-Consultation"]),
            Appointment.appointment_date == appt_date,
            or_(
                Appointment.start_time.between(start_t, end_t),
                Appointment.end_time.between(start_t, end_t)
            )
        ).first()
        
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Doctor already has an appointment during this time."
            )
            
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(appointment, key, value)
        
    db.commit()
    db.refresh(appointment)
    return appointment

@router.delete("/{appointment_id}")
async def delete_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a centralized appointment."""
    appointment = db.query(Appointment).filter(
        Appointment.appointment_id == appointment_id,
        Appointment.hospital_id == current_user.hospital_id
    ).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    db.delete(appointment)
    db.commit()
    return {"message": "Appointment cancelled successfully"}

@router.post("/preview-slot", response_model=NextSlotResponse)
async def preview_slot(
    request: PreviewSlotRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Calculate and preview the exact time slot the system will assign."""
    try:
        start_t, end_t, message = get_next_available_slot(
            db, request.doctor_id, request.appointment_date, 
            current_user.hospital_id, request.visit_type, request.preferred_time
        )
        return NextSlotResponse(
            doctor_id=request.doctor_id,
            date=request.appointment_date.isoformat(),
            start_time=start_t,
            end_time=end_t,
            available=True,
            message=message
        )
    except ValueError as e:
        # Cannot find any slot
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/doctor-schedule/{doctor_id}", response_model=List[DoctorScheduleBlockResponse])
async def get_doctor_day_schedule(
    doctor_id: int,
    date: str, # YYYY-MM-DD
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the specific schedule blocks (OPD, IPD, OT) for a doctor on a specific date."""
    target_date = datetime.strptime(date, "%Y-%m-%d").date()
    day_of_week = target_date.weekday()
    
    schedules = db.query(DoctorSchedule).filter(
        DoctorSchedule.doctor_id == doctor_id,
        DoctorSchedule.day_of_week == day_of_week,
        DoctorSchedule.is_active == True
    ).order_by(DoctorSchedule.start_time).all()
    
    return [
        DoctorScheduleBlockResponse(
            start_time=s.start_time,
            end_time=s.end_time,
            session_type=s.session_type
        )
        for s in schedules
    ]

@router.get("/next-slot", response_model=NextSlotResponse)
def get_next_slot(
    doctor_id: int,
    date: str, # YYYY-MM-DD
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Calculate the next available 7-minute appointment slot for a doctor on a specific date."""
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
        
    # Check if doctor exists and belongs to the same hospital
    doctor = db.query(DoctorProfile).filter(
        DoctorProfile.profile_id == doctor_id,
        DoctorProfile.hospital_id == current_user.hospital_id
    ).first()
    
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    start_time, end_time = get_next_available_slot(db, doctor_id, target_date, current_user.hospital_id)
    
    # Check if the slot fits in the schedule
    day_of_week = target_date.weekday()
    schedule = db.query(DoctorSchedule).filter(
        DoctorSchedule.doctor_id == doctor_id,
        DoctorSchedule.day_of_week == day_of_week,
        DoctorSchedule.is_active == True
    ).first()
    
    available = True
    message = "Slot available"
    
    if schedule:
        try:
            eh, em = map(int, schedule.end_time.split(":"))
            end_limit = datetime.combine(target_date, time(eh, em))
            # If start time is past the end of the shift, doctor is fully booked
            if start_time >= end_limit:
                available = False
                message = "Doctor is fully booked on this date"
        except Exception:
            pass
            
    return NextSlotResponse(
        doctor_id=doctor_id,
        date=date,
        start_time=start_time,
        end_time=end_time,
        available=available,
        message=message
    )

