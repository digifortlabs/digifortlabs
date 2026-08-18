from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import uuid

from ..database import get_db
from ..crud import crud_all
from ..models import User, UserRole, DoctorProfile, Department, Permission, DoctorSchedule
from ..routers.auth import get_current_user, require_permission
from ..utils import get_password_hash

router = APIRouter(
    prefix="/doctors",
    tags=["Doctors"],
    responses={404: {"description": "Not found"}},
)

class DoctorCreate(BaseModel):
    full_name: str
    department_id: int
    hospital_id: Optional[int] = None
    specialization: Optional[str] = None
    consultation_fee: float = 0.0
    ipd_charge: float = 0.0
    ipd_charge_type: str = "PER_DAY"
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    create_login_account: bool = False
    password: Optional[str] = None
    role: UserRole = UserRole.DOCTOR_OPD # Defaults to OPD if account created
    is_residential: bool = True

class DoctorUpdate(BaseModel):
    full_name: Optional[str] = None
    department_id: Optional[int] = None
    specialization: Optional[str] = None
    consultation_fee: Optional[float] = None
    ipd_charge: Optional[float] = None
    ipd_charge_type: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    is_residential: Optional[bool] = None

class DoctorProfileResponse(BaseModel):
    profile_id: int
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    department_id: int
    specialization: Optional[str] = None
    consultation_fee: float
    ipd_charge: float = 0.0
    ipd_charge_type: str = "PER_DAY"
    is_active: bool
    is_residential: Optional[bool] = True
    user_id: Optional[int] = None
    hospital_id: Optional[int] = None
    hospital_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class ScheduleBlockCreate(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str
    session_type: str = "OPD"
    is_active: bool = True

class ScheduleBlockResponse(ScheduleBlockCreate):
    schedule_id: int
    doctor_id: int
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[DoctorProfileResponse])
def get_doctors(
    hospital_id: Optional[int] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Get all doctors in the current hospital."""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF, UserRole.HOSPITAL_ADMIN, UserRole.RECEPTION_STAFF, UserRole.HOSPITAL_STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized to view doctors")
        
    target_hospital_id = current_user.hospital_id
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF] and hospital_id:
        target_hospital_id = hospital_id

    query = db.query(DoctorProfile).filter(DoctorProfile.is_active == True)
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF] or target_hospital_id is not None:
        query = query.filter(DoctorProfile.hospital_id == target_hospital_id)
        
    doctors = query.all()
    
    result = []
    for doc in doctors:
        doc_dict = {
            "profile_id": doc.profile_id,
            "full_name": doc.full_name,
            "email": doc.email,
            "phone": doc.phone,
            "department_id": doc.department_id,
            "specialization": doc.specialization,
            "consultation_fee": doc.consultation_fee,
            "ipd_charge": getattr(doc, "ipd_charge", 0.0),
            "is_active": doc.is_active,
            "user_id": doc.user_id,
            "hospital_id": doc.hospital_id,
            "hospital_name": doc.hospital.legal_name if doc.hospital else "Unknown Hospital"
        }
        result.append(DoctorProfileResponse(**doc_dict))
    
    return result

@router.post("/", response_model=DoctorProfileResponse)
def create_doctor(
    data: DoctorCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITAL_USERS))
):
    """Create a new doctor profile, optionally with a User account."""
    target_hospital_id = current_user.hospital_id
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF] and data.hospital_id:
        target_hospital_id = data.hospital_id

    if not target_hospital_id:
        raise HTTPException(status_code=400, detail="Hospital ID is required")

    # 1. Check department
    dept = crud_all.department.get_first(db, 
        Department.department_id == data.department_id,
        Department.hospital_id == target_hospital_id
    )
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    new_user_id = None
    if data.create_login_account:
        if not data.email:
            raise HTTPException(status_code=400, detail="Email is required to create a login account")
            
        import secrets
        import string
        from ..services.email_service import EmailService
        
        password_to_use = data.password
        is_auto_generated = False
        if not password_to_use:
            alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
            password_to_use = ''.join(secrets.choice(alphabet) for i in range(12))
            is_auto_generated = True

        existing_user = crud_all.user.get_first(db, User.email == data.email)
        if existing_user:
            new_user_id = existing_user.user_id
        else:
            new_user = User(
                email=data.email,
                full_name=data.full_name,
                hashed_password=get_password_hash(password_to_use),
                role=data.role,
                hospital_id=target_hospital_id,
                force_password_change=is_auto_generated
            )
            db.add(new_user)
            db.flush() # get user_id
            new_user_id = new_user.user_id
            
            if is_auto_generated:
                try:
                    EmailService.send_welcome_email(
                        email=data.email,
                        name=data.full_name,
                        password=password_to_use,
                        login_url="https://digifortlabs.com/login"
                    )
                except Exception as e:
                    import logging
                    logging.error(f"Failed to send welcome email to doctor: {e}")

    # 2. Create DoctorProfile
    profile = DoctorProfile(
        hospital_id=target_hospital_id,
        user_id=new_user_id,
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        department_id=data.department_id,
        specialization=data.specialization,
        consultation_fee=data.consultation_fee,
        ipd_charge=data.ipd_charge,
        ipd_charge_type=data.ipd_charge_type,
        is_residential=getattr(data, 'is_residential', True)
    )
    db.add(profile)
    
    try:
        from ..audit import log_audit
        log_audit(db, current_user.user_id, "DOCTOR_CREATED", f"Created doctor profile: {data.full_name}", hospital_id=target_hospital_id)
    except:
        pass
        
    db.commit()
    db.refresh(profile)
    return profile

@router.patch("/{profile_id}", response_model=DoctorProfileResponse)
def update_doctor(
    profile_id: int, 
    data: DoctorUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITAL_USERS))
):
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        profile = crud_all.doctor_profile.get_first(db, DoctorProfile.profile_id == profile_id)
    else:
        profile = crud_all.doctor_profile.get_first(db, 
            DoctorProfile.profile_id == profile_id, 
            DoctorProfile.hospital_id == current_user.hospital_id
        )

    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
        
    if data.full_name is not None:
        profile.full_name = data.full_name
        # Optionally update linked User if one exists
        if profile.user_id:
            profile.user.full_name = data.full_name
            
    if data.email is not None:
        profile.email = data.email
    if data.phone is not None:
        profile.phone = data.phone
    if data.is_active is not None:
        profile.is_active = data.is_active
        if profile.user_id:
            profile.user.is_active = data.is_active
    if data.is_residential is not None:
        profile.is_residential = data.is_residential
        
    if data.department_id is not None:
        dept = crud_all.department.get_first(db, Department.department_id == data.department_id, Department.hospital_id == profile.hospital_id)
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found")
        profile.department_id = data.department_id
    if data.specialization is not None:
        profile.specialization = data.specialization
    if data.consultation_fee is not None:
        profile.consultation_fee = data.consultation_fee
    if data.ipd_charge is not None:
        profile.ipd_charge = data.ipd_charge
    if data.ipd_charge_type is not None:
        profile.ipd_charge_type = data.ipd_charge_type

    db.commit()
    db.refresh(profile)
    return profile

@router.delete("/{profile_id}")
def delete_doctor(
    profile_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITAL_USERS))
):
    profile = crud_all.doctor_profile.get_first(db, 
        DoctorProfile.profile_id == profile_id, 
        DoctorProfile.hospital_id == current_user.hospital_id
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    # Soft Delete
    profile.is_active = False
    if profile.user_id:
        profile.user.is_active = False
        profile.user.is_deleted = True
    
    try:
        from ..audit import log_audit
        log_audit(db, current_user.user_id, "DOCTOR_DELETED", f"Deactivated doctor profile: {profile.full_name}", hospital_id=current_user.hospital_id)
    except:
        pass

    db.commit()
    return {"message": "Doctor deleted"}

@router.get("/me/schedule", response_model=List[ScheduleBlockResponse])
async def get_my_schedule(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the current doctor's weekly schedule."""
    profile = crud_all.doctor_profile.get_first(db, DoctorProfile.user_id == current_user.user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
        
    schedules = crud_all.doctor_schedule.get_first(db, 
        DoctorSchedule.doctor_id == profile.profile_id
    )
    return schedules

@router.post("/me/schedule", response_model=List[ScheduleBlockResponse])
async def update_my_schedule(
    blocks: List[ScheduleBlockCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the current doctor's weekly schedule."""
    profile = crud_all.doctor_profile.get_first(db, DoctorProfile.user_id == current_user.user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
        
    crud_all.doctor_schedule.get_first(db, DoctorSchedule.doctor_id == profile.profile_id).delete()
    
    new_schedules = []
    for block in blocks:
        sched = DoctorSchedule(
            doctor_id=profile.profile_id,
            day_of_week=block.day_of_week,
            start_time=block.start_time,
            end_time=block.end_time,
            session_type=block.session_type,
            is_active=block.is_active
        )
        db.add(sched)
        new_schedules.append(sched)
        
    db.commit()
    for s in new_schedules:
        db.refresh(s)
    return new_schedules

@router.get("/{doctor_id}/schedule", response_model=List[ScheduleBlockResponse])
async def get_doctor_schedule_full(
    doctor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the full weekly schedule for a doctor."""
    schedules = db.query(DoctorSchedule).filter(
        DoctorSchedule.doctor_id == doctor_id
    )
    return schedules

@router.post("/{doctor_id}/schedule", response_model=List[ScheduleBlockResponse])
async def update_doctor_schedule(
    doctor_id: int,
    blocks: List[ScheduleBlockCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Replace the doctor's weekly schedule with the new blocks."""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Delete old schedule
    db.query(DoctorSchedule).filter(DoctorSchedule.doctor_id == doctor_id).delete()
    
    # Insert new blocks
    new_schedules = []
    for block in blocks:
        sched = DoctorSchedule(
            doctor_id=doctor_id,
            day_of_week=block.day_of_week,
            start_time=block.start_time,
            end_time=block.end_time,
            session_type=block.session_type,
            is_active=block.is_active
        )
        db.add(sched)
        new_schedules.append(sched)
        
    db.commit()
    
    for s in new_schedules:
        db.refresh(s)
        
    return new_schedules

class SubdomainSetupRequest(BaseModel):
    subdomain: str

@router.post("/setup-subdomain")
def setup_doctor_subdomain(
    data: SubdomainSetupRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if not current_user.role.startswith("doctor"):
        raise HTTPException(status_code=403, detail="Only doctors can setup a personal subdomain")
        
    if current_user.subdomain:
        raise HTTPException(status_code=400, detail="Subdomain is already set up")
        
    existing = db.query(User).filter(User.subdomain == data.subdomain).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subdomain is already taken")
        
    import re
    if not re.match(r"^dr-[a-z0-9-]+$", data.subdomain):
        raise HTTPException(status_code=400, detail="Subdomain must start with 'dr-' and contain only lowercase letters, numbers, and hyphens")
        
    current_user.subdomain = data.subdomain
    current_user.hospital_id = None 
    db.commit()
    
    return {"message": "Subdomain successfully registered!", "subdomain": data.subdomain}
