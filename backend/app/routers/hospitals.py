from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..audit import log_audit
from ..database import get_db
from ..models import Hospital, Patient, PDFFile, User, UserRole
from ..utils import get_password_hash
from .auth import get_current_user
from ..services.email_service import EmailService

router = APIRouter()

class HospitalCreate(BaseModel):
    legal_name: str
    subscription_tier: str = "Starter"
    hospital_type: str = "Private"
    email: EmailStr
    director_name: Optional[str] = None
    registration_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    
    # Billing Config (INR)
    price_per_file: float = 100.0
    included_pages: int = 20
    price_per_extra_page: float = 1.0

class HospitalResponse(BaseModel):
    hospital_id: int
    legal_name: str
    subscription_tier: str
    hospital_type: Optional[str] = None
    email: EmailStr
    director_name: Optional[str] = None
    registration_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    
    price_per_file: float
    included_pages: int
    price_per_extra_page: float
    is_active: bool = True
    pending_updates: Optional[str] = None # JSON String

    class Config:
        from_attributes = True

class HospitalUpdate(BaseModel):
    director_name: Optional[str] = None
    registration_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    
    # Super Admin Only Fields
    legal_name: Optional[str] = None
    subscription_tier: Optional[str] = None
    hospital_type: Optional[str] = None
    is_active: Optional[bool] = None

    price_per_file: Optional[float] = None
    included_pages: Optional[int] = None
    price_per_extra_page: Optional[float] = None

class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    legal_name: str # For convenience, to confirm context

@router.get("/stats/platform")
def get_platform_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    total_hospitals = db.query(Hospital).count()
    active_hospitals = db.query(Hospital).filter(Hospital.is_active == True).count()
    
    # Active Users (Live in last 5 minutes)
    from datetime import datetime, timedelta
    five_mins_ago = datetime.utcnow() - timedelta(minutes=5)
    live_active_users = db.query(User).filter(User.last_active_at >= five_mins_ago).count()
    
    # Check for pending approvals
    pending_approvals = db.query(Hospital).filter(Hospital.pending_updates != None).count()
    
    # Tier Distribution
    tiers = {
        "Enterprise": db.query(Hospital).filter(Hospital.subscription_tier == "Enterprise").count(),
        "Professional": db.query(Hospital).filter(Hospital.subscription_tier == "Professional").count(),
        "Standard": db.query(Hospital).filter(Hospital.subscription_tier == "Standard").count(),
        "Starter": db.query(Hospital).filter(Hospital.subscription_tier == "Starter").count(),
    }
    
    # Storage & Bandwidth Insights
    # Only count confirmed uploads
    total_files = db.query(PDFFile).filter(PDFFile.upload_status == 'confirmed').count()
    # file_size is in bytes. Sum it up, then divide by 1024*1024*1024 for GB
    total_bytes = db.query(func.sum(PDFFile.file_size)).filter(PDFFile.upload_status == 'confirmed').scalar() or 0
    total_bytes_val = total_bytes or 0
    total_gigabytes = total_bytes_val / (1024 * 1024 * 1024)
    
    # Top Consuming Hospitals
    from sqlalchemy import desc
    top_hospitals = db.query(
        Hospital.legal_name,
        func.sum(PDFFile.file_size).label("total_usage")
    ).select_from(Hospital).join(Patient).join(PDFFile).filter(PDFFile.upload_status == 'confirmed').group_by(Hospital.hospital_id).order_by(desc("total_usage")).limit(5).all()
    
    usage_list = [{"name": h[0], "usage_mb": round((h[1] or 0) / (1024*1024), 2)} for h in top_hospitals]

    # Revenue Estimation (Mock)
    revenue = (tiers["Enterprise"] * 500) + (tiers["Professional"] * 399) + (tiers["Standard"] * 199) + (tiers["Starter"] * 99)

    return {
        "total_hospitals": total_hospitals,
        "active_hospitals": active_hospitals,
        "total_users": live_active_users,
        "pending_approvals": pending_approvals,
        "system_status": "Operational",
        "tier_distribution": tiers,
        "total_files": total_files,
        "total_gb": round(total_gigabytes, 2),
        "top_consumers": usage_list,
        "projected_revenue": revenue
    }

@router.post("/", response_model=HospitalResponse)
def create_hospital(hospital: HospitalCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Auth Check
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admins can onboard hospitals")

    # Check for duplicate email
    if db.query(Hospital).filter(Hospital.email == hospital.email).first():
        raise HTTPException(status_code=400, detail="Hospital with this email already exists")

    db_hospital = Hospital(
        legal_name=hospital.legal_name, 
        subscription_tier=hospital.subscription_tier,
        hospital_type=hospital.hospital_type,
        email=hospital.email,
        director_name=hospital.director_name,
        registration_number=hospital.registration_number,
        address=hospital.address,
        city=hospital.city,
        state=hospital.state,
        pincode=hospital.pincode,
        phone=hospital.phone,
        price_per_file=hospital.price_per_file,
        included_pages=hospital.included_pages,
        price_per_extra_page=hospital.price_per_extra_page
    )
    db.add(db_hospital)
    db.flush() # Generate ID without committing transaction

    # Auto-Create Hospital Admin User
    # Atomic Transaction: If this fails, the hospital is not created either.
    if not db.query(User).filter(User.email == hospital.email).first():
        new_admin = User(
            email=hospital.email,
            hashed_password=get_password_hash("Hospital@123"),
            plain_password="Hospital@123",
            role=UserRole.HOSPITAL_ADMIN,
            hospital_id=db_hospital.hospital_id, # ID is available after flush
            is_active=True,
            force_password_change=True
        )
        db.add(new_admin)
        log_audit(db, current_user.user_id, "ADMIN_CREATED", f"Auto-created admin for {hospital.legal_name}")
        
        # Send Welcome Email
        EmailService.send_welcome_email(
            email=hospital.email,
            name=hospital.director_name or "Hospital Admin",
            password="Hospital@123" # One-Time Password
        )

    log_audit(db, current_user.user_id, "HOSPITAL_ONBOARDED", f"Hospital {hospital.legal_name} added to platform.")
    
    db.commit() # Commit everything (Hospital + User + Audit Logs)
    db.refresh(db_hospital)
    
    return db_hospital

@router.get("/", response_model=List[HospitalResponse])
def list_hospitals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        # If not super admin or staff, forbid listing ALL.
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(Hospital).all()

@router.post("/{hospital_id}/admin")
def create_hospital_admin(hospital_id: int, admin_data: AdminCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
         raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if hospital exists
    hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    # Check if email exists
    if db.query(User).filter(User.email == admin_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Create Admin
    new_admin = User(
        email=admin_data.email,
        hashed_password=get_password_hash(admin_data.password),
        plain_password=admin_data.password,
        role=UserRole.HOSPITAL_ADMIN,
        hospital_id=hospital_id,
        force_password_change=True
    )
    db.add(new_admin)
    db.commit()
    
    # Send Welcome Email
    EmailService.send_welcome_email(
        email=admin_data.email,
        name=admin_data.legal_name,
        password=admin_data.password
    )
    
    return {"message": f"Admin created for {hospital.legal_name}", "email": admin_data.email}

@router.patch("/{hospital_id}", response_model=HospitalResponse)
def update_hospital(hospital_id: int, hospital_update: HospitalUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Fetch Hospital
    db_hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
    if not db_hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    # 2. Auth Check
    is_super = current_user.role == UserRole.SUPER_ADMIN
    is_owner = current_user.role == UserRole.HOSPITAL_ADMIN and (current_user.hospital_id == hospital_id)
    
    if not (is_super or is_owner):
        raise HTTPException(status_code=403, detail="Not authorized to edit this hospital")

    update_data = hospital_update.dict(exclude_unset=True)

    # 3. Apply Logic
    if is_super:
        # Super Admin: Apply Immediately
        for key, value in update_data.items():
            setattr(db_hospital, key, value)
        # Also clear pending updates if any, as super overrides
        db_hospital.pending_updates = None
    else:
        # Hospital Admin: Save to Pending
        import json
        db_hospital.pending_updates = json.dumps(update_data)

    db.commit()
    db.refresh(db_hospital)
    return db_hospital

@router.post("/{hospital_id}/approve")
def approve_update(hospital_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can approve")
    
    db_hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
    if not db_hospital or not db_hospital.pending_updates:
        raise HTTPException(status_code=404, detail="No pending updates found")

    import json
    updates = json.loads(db_hospital.pending_updates)
    
    for key, value in updates.items():
        if hasattr(db_hospital, key):
            setattr(db_hospital, key, value)
    
    db_hospital.pending_updates = None
    db.commit()
    
    log_audit(db, current_user.user_id, "UPDATE_APPROVED", f"Approved changes for {db_hospital.legal_name}")
    
    return {"message": "Updates approved and applied"}

@router.post("/{hospital_id}/reject")
def reject_update(hospital_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can reject")
    
    db_hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
    if not db_hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
        
    db_hospital.pending_updates = None
    db.commit()
    
    log_audit(db, current_user.user_id, "UPDATE_REJECTED", f"Rejected changes for {db_hospital.legal_name}")
    
    return {"message": "Updates rejected"}

@router.get("/{hospital_id}", response_model=HospitalResponse)
def read_hospital(hospital_id: int, db: Session = Depends(get_db)):
    db_hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
    if db_hospital is None:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return db_hospital

@router.get("/{hospital_id}/stats/space")
def get_space_savings(hospital_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Validate access
    if current_user.hospital_id != hospital_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 1. Count Total Digital Files (Confirmed Only)
    total_files = db.query(func.count(PDFFile.file_id)).join(Patient).filter(
        Patient.hospital_id == hospital_id,
        PDFFile.upload_status == 'confirmed'
    ).scalar()
    
    # 2. Convert to "Physical Boxes Saved" logic
    # Assumption: 1 Standard Box holds ~2,000 pages (~100 files)
    # Assumption: 1 Box takes ~1.5 sq ft of space (including aisles)
    estimated_boxes = total_files / 100
    sq_ft_saved = estimated_boxes * 1.5
    
    # 3. Calculate "Cost Saved"
    # Assumption: Real Estate cost $50/sq ft/year + Staff handling cost
    yearly_savings = sq_ft_saved * 50
    
    return {
        "files_digitized": total_files,
        "estimated_boxes_removed": round(estimated_boxes, 1),
        "sq_ft_recovered": round(sq_ft_saved, 2),
        "yearly_cost_savings": round(yearly_savings, 2)
    }

@router.get("/{hospital_id}/stats/usage")
def get_hospital_usage(hospital_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Auth: Super Admin or limits to own info
    if current_user.role != UserRole.SUPER_ADMIN and current_user.hospital_id != hospital_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # 2. Calculate Total Usage from Files
    total_bytes = db.query(func.sum(PDFFile.file_size)).join(Patient).filter(
        Patient.hospital_id == hospital_id,
        PDFFile.upload_status == 'confirmed'
    ).scalar() or 0
    
    used_mb = total_bytes / (1024 * 1024)
    used_gb = total_bytes / (1024 * 1024 * 1024)
    
    return {
        "used_bytes": total_bytes,
        "used_mb": round(used_mb, 2),
        "used_gb": round(used_gb, 2),
        "uptime_sla": 99.9 # This remains static for now as it's a platform promise
    }

@router.delete("/{hospital_id}")
def delete_hospital(hospital_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can delete hospitals")
    
    db_hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
    if not db_hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    # Optional: Check for active data or force delete
    # For now, we will attempt delete. If foreign keys prevent it, it will raise 500 error, 
    # which is generic but valid for V1.
    try:
        # Manual cleanup of users to avoid constraint errors if CASCADE is not set
        db.query(User).filter(User.hospital_id == hospital_id).delete()
        
        db.delete(db_hospital)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Cannot delete hospital. Ensure all patients/data are removed first. Error: {str(e)}")
    
    return {"message": f"Hospital {db_hospital.legal_name} deleted successfully"}
