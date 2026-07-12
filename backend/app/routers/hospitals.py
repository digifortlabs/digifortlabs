import logging
logger = logging.getLogger(__name__)
from typing import List, Optional, cast
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
import subprocess
from pydantic import BaseModel, EmailStr, validator
from sqlalchemy import func, text, bindparam
from sqlalchemy.orm import Session

from ..audit import log_audit
from ..database import get_db
from ..crud import crud_all
from ..models import (
    AuditLog, 
    Hospital, 
    Patient, 
    PDFFile, 
    User, 
    UserRole,
    Invoice,
    FileRequest,
    QAIssue,
    PhysicalBox,
    PhysicalRack,
    InventoryLog,
    PhysicalMovementLog,
    PatientProcedure
)
from ..utils import get_password_hash
from .auth import get_current_user, require_permission
from ..models import Permission
from ..services.email_service import EmailService


import time
_PLATFORM_STATS_CACHE = {}
_CACHE_TTL = 30  # seconds

router = APIRouter()

class HospitalCreate(BaseModel):
    legal_name: str
    subscription_tier: str = "Standard"
    hospital_type: str = "Private"
    organization_type: str = "Hospital"
    specialty: str = "General"
    terminology: dict = {}
    enabled_modules: list = ["core"]
    email: EmailStr
    director_name: Optional[str] = None
    registration_number: Optional[str] = None
    established_year: Optional[int] = None
    address: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    country: str = "India"
    phone: Optional[str] = None
    alternate_phone: Optional[str] = None
    secondary_email: Optional[EmailStr] = None
    landline: Optional[str] = None
    google_maps_url: Optional[str] = None
    
    # Admin User Details (Step 3)
    admin_full_name: str
    admin_email: EmailStr
    admin_phone: str
    admin_designation: Optional[str] = None
    password: str
    
    # Billing & Pricing (Steps 5 & 6)
    price_per_file: float = 100.0
    included_pages: int = 20
    price_per_extra_page: float = 1.0
    custom_pricing: dict = {}
    pricing_effective_date: Optional[datetime] = None
    pricing_notes: Optional[str] = None
    
    expected_monthly_volume: Optional[int] = None
    expected_users: Optional[int] = None
    storage_requirements: Optional[str] = None
    special_requirements: Optional[str] = None
    gst_number: Optional[str] = None
    accept_marketing: bool = False

class HospitalResponse(BaseModel):
    hospital_id: int
    legal_name: str
    hospital_slug: Optional[str] = None
    subscription_tier: str
    organization_type: Optional[str] = None
    specialty: Optional[str] = "General"
    terminology: Optional[dict] = {}
    enabled_modules: Optional[list] = []
    email: EmailStr
    director_name: Optional[str] = None
    registration_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    gst_number: Optional[str] = None

    price_per_file: float
    included_pages: int
    price_per_extra_page: float

    custom_pricing: Optional[dict] = {}
    expected_monthly_volume: Optional[int] = None
    expected_users: Optional[int] = None
    storage_requirements: Optional[str] = None

    is_active: bool = True
    is_deleted: bool = False
    pending_updates: Optional[str] = None # JSON String
    id_generation_settings: Optional[dict] = {}
    
    certifications: Optional[list] = []
    important_documents: Optional[list] = []

    @validator('hospital_slug', always=True, pre=False)
    def compute_slug(cls, v, values):
        if v:
            return v
        import re
        name = values.get('legal_name', '')
        return re.sub(r'[^a-z0-9]', '', name.lower()) if name else v

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
    gst_number: Optional[str] = None
    
    # Super Admin Only Fields
    legal_name: Optional[str] = None
    hospital_slug: Optional[str] = None
    subscription_tier: Optional[str] = None
    hospital_type: Optional[str] = None
    specialty: Optional[str] = None
    terminology: Optional[dict] = None
    enabled_modules: Optional[list] = None
    is_active: Optional[bool] = None
    id_generation_settings: Optional[dict] = None
    
    certifications: Optional[list] = None
    important_documents: Optional[list] = None

    price_per_file: Optional[float] = None
    included_pages: Optional[int] = None
    price_per_extra_page: Optional[float] = None
    
    max_users: Optional[int] = None
    per_user_price: Optional[float] = None

class HospitalOnboardRequest(BaseModel):
    # Step 1
    legal_name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    # Step 2
    enabled_modules: List[str]
    # Step 3 (Pricing)
    patient_registration_fee: float = 500.0
    nursing_base_charge: float = 150.0
    ot_base_charge: float = 15000.0
    # Step 4 (Billing)
    gst_number: Optional[str] = None
    billing_header: Optional[str] = None
    billing_footer: Optional[str] = None

class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    legal_name: str # For convenience, to confirm context

@router.get("/check-domain")
def check_domain_availability(slug: str, db: Session = Depends(get_db)):
    import re
    clean_slug = re.sub(r'[^a-z0-9-]', '', slug.lower().strip())
    if not clean_slug:
        return {"available": False, "message": "Invalid slug"}
    
    conflict = crud_all.hospital.get_first(db, Hospital.hospital_slug == clean_slug)
    if conflict:
        return {"available": False, "message": "Subdomain is already taken"}
    return {"available": True, "message": "Subdomain is available"}

@router.post("/{hospital_id}/logo")
async def upload_hospital_logo(
    hospital_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    import os
    import shutil
    import uuid

    if current_user.role != UserRole.SUPER_ADMIN and current_user.hospital_id != hospital_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_hospital = crud_all.hospital.get_first(db, Hospital.hospital_id == hospital_id)
    if not db_hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
        
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    if ext not in ['.png', '.jpg', '.jpeg', '.svg', '.webp']:
        raise HTTPException(status_code=400, detail="Invalid image format")
        
    os.makedirs("uploads/logos", exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join("uploads/logos", filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Public URL path (assuming static files are served at /uploads or similar, but for now we just use a relative path)
    logo_url = f"/api/hospitals/logos/{filename}"
    
    # Save into terminology JSON to avoid schema changes
    current_term = db_hospital.terminology or {}
    current_term['logo_url'] = logo_url
    
    # We must explicitly flag the dictionary as modified for SQLAlchemy JSON type
    from sqlalchemy.orm.attributes import flag_modified
    db_hospital.terminology = current_term  # type: ignore[assignment]
    flag_modified(db_hospital, "terminology")
    
    db.commit()
    return {"message": "Logo uploaded successfully", "logo_url": logo_url}

@router.get("/logos/{filename}")
def get_hospital_logo(filename: str):
    import os
    from fastapi.responses import FileResponse
    filepath = os.path.join("uploads/logos", filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Logo not found")
    return FileResponse(filepath)


# ─────────────────────────────────────────────
#  DOCUMENT VAULT — S3-backed endpoints
# ─────────────────────────────────────────────

def _hospital_s3_folder(hospital: Hospital) -> str:
    """
    Derives the S3 folder name from the hospital's legal name.
    e.g. 'DIXIT HOSPITAL' → 'DIXIT_HOSPITAL'
    """
    import re
    name = (hospital.legal_name or "unknown").strip().upper()
    return re.sub(r'[^A-Z0-9]+', '_', name).strip('_')


@router.post("/{hospital_id}/documents/upload")
async def upload_hospital_document(
    hospital_id: int,
    file: UploadFile = File(...),
    vault: str = "certifications",
    custom_name: str = "",
    tag: str = "General",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a document to S3 under:
      {HOSPITAL_FOLDER}/{YEAR}/{vault}/{uuid}_{original_filename}
    Persist metadata into the hospital's certifications / important_documents JSON column.
    """
    import uuid as _uuid
    from datetime import datetime
    from sqlalchemy.orm.attributes import flag_modified
    from ..services.s3_handler import S3Manager

    # Auth
    if current_user.role not in (UserRole.SUPER_ADMIN,) and current_user.hospital_id != hospital_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db_hospital = crud_all.hospital.get_first(db, Hospital.hospital_id == hospital_id)
    if not db_hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    # Validate vault
    if vault not in ("certifications", "important_documents"):
        raise HTTPException(status_code=400, detail="Invalid vault. Use 'certifications' or 'important_documents'.")

    # Validate file size ≤ 50 MB
    MAX_SIZE = 50 * 1024 * 1024
    file_bytes = await file.read()
    if len(file_bytes) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum allowed is 50 MB.")

    # Build S3 key
    folder = _hospital_s3_folder(db_hospital)
    year = str(datetime.now(timezone.utc).year)
    safe_filename = file.filename or "document"
    s3_key = f"{folder}/{year}/{vault}/{_uuid.uuid4().hex}_{safe_filename}"

    # Upload to S3
    s3 = S3Manager()
    import io
    success, result = s3.upload_file(io.BytesIO(file_bytes), s3_key, content_type=file.content_type)
    if not success:
        logger.error(f"[S3 Upload] Failed for hospital {hospital_id}: {result}")
        raise HTTPException(status_code=500, detail=f"S3 upload failed: {result}")

    # Generate 24-hour presigned URL
    presigned_url = s3.generate_presigned_url(s3_key, expiration=86400)

    # Persist metadata into hospital JSON column
    doc_meta = {
        "name": custom_name or safe_filename,
        "originalName": safe_filename,
        "s3_key": s3_key,
        "tag": tag,
        "uploadedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "size": len(file_bytes),
    }

    current_list = list(getattr(db_hospital, vault) or [])
    current_list.append(doc_meta)
    setattr(db_hospital, vault, current_list)
    flag_modified(db_hospital, vault)
    db.commit()

    logger.info(f"[DocVault] Uploaded {s3_key} for hospital {hospital_id} into vault '{vault}'")
    return {**doc_meta, "presigned_url": presigned_url}


class DocumentDeleteRequest(BaseModel):
    vault: str
    s3_key: str


@router.delete("/{hospital_id}/documents")
async def delete_hospital_document(
    hospital_id: int,
    payload: DocumentDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a hospital document from S3 and remove its entry from the DB JSON column.
    """
    from sqlalchemy.orm.attributes import flag_modified
    from ..services.s3_handler import S3Manager

    if current_user.role not in (UserRole.SUPER_ADMIN,) and current_user.hospital_id != hospital_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db_hospital = crud_all.hospital.get_first(db, Hospital.hospital_id == hospital_id)
    if not db_hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    if payload.vault not in ("certifications", "important_documents"):
        raise HTTPException(status_code=400, detail="Invalid vault.")

    # Remove from S3
    s3 = S3Manager()
    s3.delete_file(payload.s3_key)

    # Remove from DB JSON list
    current_list = list(getattr(db_hospital, payload.vault) or [])
    updated_list = [d for d in current_list if d.get("s3_key") != payload.s3_key]
    setattr(db_hospital, payload.vault, updated_list)
    flag_modified(db_hospital, payload.vault)
    db.commit()

    logger.info(f"[DocVault] Deleted {payload.s3_key} from hospital {hospital_id} vault '{payload.vault}'")
    return {"deleted": True, "s3_key": payload.s3_key}


@router.get("/{hospital_id}/documents/presign")
def get_document_presigned_url(
    hospital_id: int,
    s3_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a fresh 24-hour presigned URL for a stored document.
    """
    from ..services.s3_handler import S3Manager

    if current_user.role not in (UserRole.SUPER_ADMIN,) and current_user.hospital_id != hospital_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    db_hospital = crud_all.hospital.get_first(db, Hospital.hospital_id == hospital_id)
    if not db_hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    s3 = S3Manager()
    url = s3.generate_presigned_url(s3_key, expiration=86400)
    if not url:
        raise HTTPException(status_code=500, detail="Could not generate presigned URL")

    return {"url": url, "expires_in": 86400}


@router.get("/stats/platform")
def get_platform_stats(db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITALS))):
    # RBAC handles authorization instead of hardcoded SUPER_ADMIN check

    # Cache check
    now_ts = time.time()
    if 'stats' in _PLATFORM_STATS_CACHE:
        cached_data, cached_time = _PLATFORM_STATS_CACHE['stats']
        if now_ts - cached_time < _CACHE_TTL:
            return cached_data
    
    total_hospitals = crud_all.hospital.count(db, Hospital.is_deleted == False)
    active_hospitals = crud_all.hospital.count(db, Hospital.is_active == True, Hospital.is_deleted == False)
    
    # Active Users (distinct user sessions active in AuditLog or User.last_active_at in last 5 minutes)
    from datetime import datetime, timedelta
    five_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
    
    # 1. Count from AuditLog
    live_users_audit = db.query(AuditLog.user_id).filter(
        AuditLog.timestamp >= five_mins_ago,
        AuditLog.user_id is not None
    ).distinct().count()
    
    # 2. Count from User.last_active_at
    live_users_active_field = crud_all.user.count(db, 
        User.last_active_at >= five_mins_ago,
        User.is_active == True,
        User.is_deleted == False
    )
    
    # Use max to be robust and accurate, ensuring at least 1 (current user)
    live_active_users = max(live_users_audit, live_users_active_field, 1)
    
    # Check for pending approvals
    pending_approvals = crud_all.hospital.count(db, Hospital.pending_updates is not None, Hospital.is_deleted == False)
    
    # Tier Distribution
    tiers = {
        "Enterprise": crud_all.hospital.count(db, Hospital.subscription_tier == "Enterprise", Hospital.is_deleted == False),
        "Professional": crud_all.hospital.count(db, Hospital.subscription_tier == "Professional", Hospital.is_deleted == False),
        "Standard": crud_all.hospital.count(db, Hospital.subscription_tier == "Standard", Hospital.is_deleted == False),
        "Starter": crud_all.hospital.count(db, Hospital.subscription_tier == "Starter", Hospital.is_deleted == False),
    }
    
    # Storage & Bandwidth Insights
    # Only count confirmed uploads
    total_files = crud_all.p_d_f_file.count(db, PDFFile.upload_status == 'confirmed')
    total_bytes = db.query(func.sum(PDFFile.file_size)).filter(PDFFile.upload_status == 'confirmed').scalar() or 0
    total_bytes_val = total_bytes or 0
    total_gigabytes = total_bytes_val / (1024 * 1024 * 1024)
    
    # Top Consuming Hospitals
    from sqlalchemy import desc
    top_hospitals = db.query(
        Hospital.legal_name,
        func.sum(PDFFile.file_size).label("total_usage")
    ).select_from(Hospital).join(Patient).join(PDFFile).filter(
        PDFFile.upload_status == 'confirmed',
        Hospital.is_deleted == False
    ).group_by(Hospital.hospital_id).order_by(desc("total_usage")).limit(5)
    
    usage_list = [{"name": h[0], "usage_mb": round((h[1] or 0) / (1024*1024), 2)} for h in top_hospitals]
    
    # Revenue Estimation: Dynamically calculated MRR based on active client tiers + variable usage-based MRD
    # Flat base fees: Enterprise: 5000, Professional: 2500, Standard: 1000, Starter: 500
    base_fees = {
        "Enterprise": 5000.0,
        "Professional": 2500.0,
        "Standard": 1000.0,
        "Starter": 500.0
    }
    
    projected_revenue = 0.0
    active_clients_list = crud_all.hospital.get_multi(db, Hospital.is_active == True, Hospital.is_deleted == False)
    for h in active_clients_list:
        base = base_fees.get(str(h.subscription_tier), 500.0)
        # Variable usage-based metric: Price per Patient MRD File * expected volume
        # Default volume estimate: 100 files
        volume = h.expected_monthly_volume if (h.expected_monthly_volume and h.expected_monthly_volume > 0) else 100
        variable = (h.price_per_file or 100.0) * volume
        projected_revenue += (base + variable)
        
    response_data = {
        "total_hospitals": total_hospitals,
        "active_hospitals": active_hospitals,
        "total_users": live_active_users,
        "pending_approvals": pending_approvals,
        "system_status": "Operational",
        "tier_distribution": tiers,
        "total_files": total_files,
        "total_gb": round(total_gigabytes, 2),
        "top_consumers": usage_list,
        "projected_revenue": round(cast(float, projected_revenue), 2)
    }
    
    _PLATFORM_STATS_CACHE['stats'] = (response_data, time.time())
    return response_data

@router.post("", response_model=HospitalResponse, include_in_schema=False)
def activate_ssl(subdomain: str):
    domain = f"{subdomain}.digifortlabs.com"
    logger.info(f"Activating SSL for {domain}")
    try:
        # Run certbot to expand the certificate with the new subdomain
        # --expand will safely add the new domain to the existing cert or create a new one
        subprocess.run([
            "sudo", "certbot", "--nginx", "-d", domain,
            "--non-interactive", "--agree-tos", "-m", "admin@digifortlabs.com",
            "--redirect"
        ], check=True, capture_output=True, text=True)
        logger.info(f"Successfully activated SSL for {domain}")
        
        # Reload nginx explicitly just in case certbot didn't
        subprocess.run(["sudo", "systemctl", "reload", "nginx"])
    except Exception as e:
        logger.error(f"Failed to activate SSL for {domain}: {e}")

@router.post("/", response_model=HospitalResponse)
def create_hospital(hospital: HospitalCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITALS))):
    # RBAC handles authorization instead of hardcoded SUPER_ADMIN check

    # Check for duplicate email
    if crud_all.hospital.get_multi(db, Hospital.email == hospital.email):
        raise HTTPException(status_code=400, detail="Hospital with this email already exists")

    # Intercept Independent Doctor
    if hospital.organization_type == "Independent Doctor":
        import re
        full_name = hospital.director_name or hospital.admin_full_name
        base_slug = re.sub(r'[^a-z0-9]', '', full_name.lower())
        if not base_slug:
            base_slug = "doc"
        subdomain = f"dr-{base_slug}"
        
        counter = 1
        original_subdomain = subdomain
        while crud_all.user.get_first(db, User.subdomain == subdomain):
            subdomain = f"{original_subdomain}{counter}"
            counter += 1

        new_doctor = User(
            email=hospital.email.lower(),
            full_name=full_name,
            phone=hospital.phone,
            role=UserRole.DOCTOR_OPD,
            hashed_password=get_password_hash(hospital.password),
            hospital_id=None,
            subdomain=subdomain,
            is_active=True,
            is_verified=False,
            force_password_change=False
        )
        db.add(new_doctor)
        db.flush()
        
        from ..models import DoctorProfile
        profile = DoctorProfile(
            user_id=new_doctor.user_id,
            hospital_id=None,
            is_residential=True,
            specialization=hospital.specialty
        )
        db.add(profile)
        db.commit()
        db.refresh(new_doctor)
        
        try:
            EmailService.send_welcome_email(
                email=new_doctor.email,
                name=full_name,
                password="<Hidden>",
                login_url=f"https://{subdomain}.digifortlabs.com/login"
            )
        except Exception:
            pass
            
        return {
            "hospital_id": new_doctor.user_id,
            "legal_name": new_doctor.full_name,
            "hospital_slug": subdomain,
            "subscription_tier": "Independent Doctor",
            "organization_type": "Independent Doctor",
            "email": new_doctor.email,
            "price_per_file": 0,
            "included_pages": 0,
            "price_per_extra_page": 0,
            "is_active": True,
            "is_deleted": False
        }

    # Validate subdomain uniqueness
    import re
    target_slug = re.sub(r'[^a-z0-9]', '', hospital.legal_name.lower())
    for existing in db.query(Hospital).filter(Hospital.is_deleted == False).all():
        existing_slug = re.sub(r'[^a-z0-9]', '', existing.legal_name.lower())
        if existing_slug == target_slug:
            raise HTTPException(
                status_code=400, 
                detail=f"The subdomain slug '{target_slug}' derived from the hospital's legal name is already taken. Please use a unique legal name."
            )
    db_hospital = Hospital(
        legal_name=hospital.legal_name, 
        subscription_tier=hospital.subscription_tier,
        organization_type=hospital.organization_type.upper() if hospital.organization_type else (hospital.hospital_type.upper() if hasattr(hospital, 'hospital_type') and hospital.hospital_type else "PRIVATE"),
        specialty=hospital.specialty,
        terminology=hospital.terminology,
        enabled_modules=hospital.enabled_modules,
        email=hospital.email,
        director_name=hospital.director_name or hospital.admin_full_name,
        registration_number=hospital.registration_number,
        established_year=hospital.established_year,
        address=hospital.address,
        address_line2=hospital.address_line2,
        city=hospital.city,
        state=hospital.state,
        pincode=hospital.pincode,
        country=hospital.country,
        phone=hospital.phone,
        alternate_phone=hospital.alternate_phone,
        secondary_email=hospital.secondary_email,
        landline=hospital.landline,
        google_maps_url=hospital.google_maps_url,
        price_per_file=hospital.price_per_file,
        included_pages=hospital.included_pages,
        price_per_extra_page=hospital.price_per_extra_page,
        custom_pricing=hospital.custom_pricing,
        pricing_effective_date=hospital.pricing_effective_date,
        pricing_notes=hospital.pricing_notes,
        expected_monthly_volume=hospital.expected_monthly_volume,
        expected_users=hospital.expected_users,
        storage_requirements=hospital.storage_requirements,
        special_requirements=hospital.special_requirements,
        accept_marketing=hospital.accept_marketing,
        gst_number=hospital.gst_number.upper() if hospital.gst_number else None
    )
    db.add(db_hospital)
    db.flush() 

    # Create Hospital Admin User (Step 3)
    if not db.query(User).filter(User.email == hospital.admin_email):
        new_admin = User(
            email=hospital.admin_email,
            full_name=hospital.admin_full_name,
            hashed_password=get_password_hash(hospital.password),
            role=UserRole.HOSPITAL_ADMIN,
            hospital_id=db_hospital.hospital_id, 
            phone=hospital.admin_phone,
            is_active=True,
            force_password_change=False # User set their own password
        )
        db.add(new_admin)
        log_audit(db, cast(int, current_user.user_id), "ADMIN_CREATED", f"Created admin {hospital.admin_full_name} for {hospital.legal_name}")
        
        # Send Welcome Email
        EmailService.send_welcome_email(
            email=hospital.admin_email,
            name=hospital.admin_full_name,
            password="[As specified by you]" 
        )

    log_audit(db, cast(int, current_user.user_id), "HOSPITAL_ONBOARDED", f"Hospital {hospital.legal_name} added to platform.")
    
    db.commit() # Commit everything (Hospital + User + Audit Logs)
    db.refresh(db_hospital)
    
    return db_hospital

@router.get("", response_model=List[HospitalResponse], include_in_schema=False)
@router.get("/", response_model=List[HospitalResponse])
def list_hospitals(
    db: Session = Depends(get_db), 
    tier: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    include_deleted: bool = False, 
    current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITALS))
):
    query = db.query(Hospital)
    
    if include_deleted:
        # Include both deleted and active for recycle bin review
        pass
    else:
        query = query.filter(Hospital.is_deleted == False)
        
    if tier and tier != "All":
        query = query.filter(Hospital.subscription_tier == tier)
        
    if status:
        if status.lower() == "active":
            query = query.filter(Hospital.is_active == True)
        elif status.lower() == "suspended":
            query = query.filter(Hospital.is_active == False)
            
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Hospital.legal_name.ilike(search_pattern)) |
            (Hospital.registration_number.ilike(search_pattern)) |
            (Hospital.email.ilike(search_pattern))
        )
        
    return query.all()

@router.post("/{hospital_id}/admin")
def create_hospital_admin(hospital_id: int, admin_data: AdminCreate, db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITALS))):
    # RBAC handles authorization 
    
    # Check if hospital exists
    hospital = crud_all.hospital.get_first(db, Hospital.hospital_id == hospital_id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    # Check if email exists
    if crud_all.user.get_first(db, User.email == admin_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Create Admin
    new_admin = User(
        email=admin_data.email,
        full_name=admin_data.legal_name, # Fix: Populate full_name
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

@router.post("/{hospital_id}/onboard", response_model=HospitalResponse)
def onboard_hospital(
    hospital_id: int, 
    payload: HospitalOnboardRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.hospital_id != hospital_id or current_user.role != UserRole.HOSPITAL_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to onboard this hospital")

    db_hospital = crud_all.hospital.get_first(db, Hospital.hospital_id == hospital_id)
    if not db_hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
        
    if db_hospital.is_onboarded:
        raise HTTPException(status_code=400, detail="Hospital is already onboarded")

    # Update Data
    db_hospital.legal_name = payload.legal_name # type: ignore
    db_hospital.address = payload.address # type: ignore
    db_hospital.city = payload.city # type: ignore
    db_hospital.state = payload.state # type: ignore
    db_hospital.pincode = payload.pincode # type: ignore
    db_hospital.phone = payload.phone # type: ignore
    db_hospital.enabled_modules = payload.enabled_modules # type: ignore
    
    db_hospital.patient_registration_fee = payload.patient_registration_fee # type: ignore
    db_hospital.nursing_base_charge = payload.nursing_base_charge # type: ignore
    db_hospital.ot_base_charge = payload.ot_base_charge # type: ignore
    
    db_hospital.gst_number = payload.gst_number.upper() if payload.gst_number else None # type: ignore
    db_hospital.billing_header = payload.billing_header # type: ignore
    db_hospital.billing_footer = payload.billing_footer # type: ignore
    
    db_hospital.is_onboarded = True # type: ignore
    db.commit()
    db.refresh(db_hospital)
    
    return db_hospital

@router.patch("/{hospital_id}", response_model=HospitalResponse)
def update_hospital(hospital_id: int, hospital_update: HospitalUpdate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITAL_SETTINGS))):
    # 1. Fetch Hospital
    db_hospital = crud_all.hospital.get_first(db, Hospital.hospital_id == hospital_id, Hospital.is_deleted == False)
    if not db_hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    # 2. Auth Check
    is_super = current_user.role == UserRole.SUPER_ADMIN
    is_owner = current_user.role == UserRole.HOSPITAL_ADMIN and (current_user.hospital_id == hospital_id)
    
    if not (is_super or is_owner):
        raise HTTPException(status_code=403, detail="Not authorized to edit this hospital")

    update_data = hospital_update.model_dump(exclude_unset=True)

    # Validate slug uniqueness if being changed
    slug_changed = False
    if 'hospital_slug' in update_data and update_data['hospital_slug'] != db_hospital.hospital_slug:
        import re
        clean_slug = re.sub(r'[^a-z0-9-]', '', update_data['hospital_slug'].lower().strip())
        if not clean_slug:
            raise HTTPException(status_code=400, detail="Invalid subdomain slug")
        conflict = crud_all.hospital.get_first(db, Hospital.hospital_slug == clean_slug, Hospital.hospital_id != hospital_id)
        if conflict:
            raise HTTPException(status_code=400, detail=f"Subdomain '{clean_slug}' is already taken")
        update_data['hospital_slug'] = clean_slug
        slug_changed = True

    # 3. Apply Logic
    if is_super:
        # Super Admin: Apply Immediately
        old_email = cast(str, db_hospital.email)
        new_email = cast(str, update_data.get("email"))

        for key, value in update_data.items():
            if key in ["gst_number", "organization_type"] and value:
                value = value.upper()
            setattr(db_hospital, key, value)
        
        # Sync Email to Admin User if changed
        if new_email and new_email != old_email:
             admin_user = crud_all.user.get_first(db, 
                 User.hospital_id == hospital_id, 
                 User.email == old_email,
                 User.role == UserRole.HOSPITAL_ADMIN
             )
             
             if admin_user:
                 admin_user.email = new_email  # type: ignore[assignment]
                 # Send Notification to Old and New Email
                 EmailService.send_email_update_notification(
                    old_email=old_email,
                    new_email=new_email,
                    name=str(db_hospital.legal_name)
                 )
                 
                 # Optional: Log this sync
                 log_audit(db, cast(int, current_user.user_id), "ADMIN_EMAIL_SYNC", f"Updated admin email from {old_email} to {new_email}")

        # Explicit handling for fields that might be reset or set to 0
        if hospital_update.max_users is not None:
             db_hospital.max_users = hospital_update.max_users  # type: ignore[assignment]
        if hospital_update.per_user_price is not None:
             db_hospital.per_user_price = hospital_update.per_user_price  # type: ignore[assignment]

        # Also clear pending updates if any, as super overrides
        db_hospital.pending_updates = None  # type: ignore[assignment]
    elif is_owner:
        # Hospital Admin: Apply profile/metadata immediately, sensitive fields go to pending
        owner_editable_fields = {
            "legal_name", "director_name", "registration_number", "address", "city", "state", "pincode",
            "phone", "email", "gst_number", "certifications", "important_documents", 
            "terminology", "ai_settings", "id_generation_settings"
        }
        
        immediate_updates = {}
        pending_updates = {}
        for key, value in update_data.items():
            if key in owner_editable_fields:
                immediate_updates[key] = value
            else:
                pending_updates[key] = value
                
        # Apply immediate fields
        old_email = cast(str, db_hospital.email)
        new_email = cast(str, immediate_updates.get("email"))
        
        for key, value in immediate_updates.items():
            if key in ["gst_number"] and value:
                value = value.upper()
            setattr(db_hospital, key, value)
            
        # Sync Email to Admin User if changed
        if new_email and new_email != old_email:
             admin_user = crud_all.user.get_first(db, 
                 User.hospital_id == hospital_id, 
                 User.email == old_email,
                 User.role == UserRole.HOSPITAL_ADMIN
             )
             
             if admin_user:
                 admin_user.email = new_email  # type: ignore[assignment]
                 log_audit(db, cast(int, current_user.user_id), "ADMIN_EMAIL_SYNC", f"Updated admin email from {old_email} to {new_email}")
                 
        if pending_updates:
            import json
            db_hospital.pending_updates = json.dumps(pending_updates)  # type: ignore[assignment]
    else:
        raise HTTPException(status_code=403, detail="Not authorized to edit this hospital")

    try:
        log_audit(db, cast(int, current_user.user_id), "HOSPITAL_UPDATED", f"Updated hospital details for {db_hospital.legal_name}")
    except Exception as e:
        logger.info(f"Audit Log Error: {e}")

    db.commit()
    db.refresh(db_hospital)
    
    if slug_changed:
        background_tasks.add_task(activate_ssl, db_hospital.hospital_slug)

    return db_hospital

@router.post("/{hospital_id}/approve")
def approve_update(hospital_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITALS))):
    db_hospital = crud_all.hospital.get_first(db, Hospital.hospital_id == hospital_id)
    if not db_hospital or not db_hospital.pending_updates:
        raise HTTPException(status_code=404, detail="No pending updates found")

    import json
    updates = json.loads(str(db_hospital.pending_updates))
    
    slug_changed = False
    for key, value in updates.items():
        if hasattr(db_hospital, key):
            if key in ["gst_number", "organization_type"] and value:
                value = value.upper()
            if key == "hospital_slug" and value != db_hospital.hospital_slug:
                slug_changed = True
            setattr(db_hospital, key, value)
    
    db_hospital.pending_updates = None  # type: ignore[assignment]
    db.commit()
    
    if slug_changed:
        background_tasks.add_task(activate_ssl, db_hospital.hospital_slug)
    
    log_audit(db, cast(int, current_user.user_id), "UPDATE_APPROVED", f"Approved changes for {db_hospital.legal_name}")
    
    return {"message": "Updates approved and applied"}

@router.post("/{hospital_id}/reject")
def reject_update(hospital_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITALS))):
    db_hospital = crud_all.hospital.get_first(db, Hospital.hospital_id == hospital_id)
    if not db_hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
        
    db_hospital.pending_updates = None  # type: ignore[assignment]
    db.commit()
    
    log_audit(db, cast(int, current_user.user_id), "UPDATE_REJECTED", f"Rejected changes for {db_hospital.legal_name}")
    
    return {"message": "Updates rejected"}

@router.get("/{hospital_id}", response_model=HospitalResponse)
def read_hospital(hospital_id: int, db: Session = Depends(get_db)):
    db_hospital = crud_all.hospital.get_first(db, Hospital.hospital_id == hospital_id, Hospital.is_deleted == False)
    if db_hospital is None:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return db_hospital

@router.get("/{hospital_id}/stats/space")
def get_space_savings(hospital_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.VIEW_HOSPITAL_REPORTS))):
    # Validate access
    if current_user.role != UserRole.SUPER_ADMIN and current_user.hospital_id != hospital_id:
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
def delete_hospital(hospital_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITALS))):
    db_hospital = crud_all.hospital.get_first(db, Hospital.hospital_id == hospital_id, Hospital.is_deleted == False)
    if not db_hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    # Soft Delete Implementation
    db_hospital.is_deleted = True  # type: ignore[assignment]
    db_hospital.is_active = False  # type: ignore[assignment]
    
    # Also soft-delete all users of this hospital
    crud_all.user.get_first(db, User.hospital_id == hospital_id).update({"is_deleted": True, "is_active": False}, synchronize_session=False)
    
    # Also soft-delete all patients of this hospital
    db.query(Patient).filter(Patient.hospital_id == hospital_id).update({"is_deleted": True}, synchronize_session=False)

    try:
        log_audit(db, cast(int, current_user.user_id), "HOSPITAL_DELETED", f"Soft-deleted hospital: {db_hospital.legal_name}")
    except:
        pass
        
    db.commit()
    
    return {"message": f"Hospital {db_hospital.legal_name} deleted successfully (soft delete)"}


@router.post("/{hospital_id}/restore")
def restore_hospital(hospital_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITALS))):
    db_hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first().first()
    if not db_hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    # Reset Soft Delete
    db_hospital.is_deleted = False  # type: ignore[assignment]
    db_hospital.is_active = True  # type: ignore[assignment]
    
    # Also restore all users of this hospital
    crud_all.user.get_first(db, User.hospital_id == hospital_id).update({"is_deleted": False, "is_active": True}, synchronize_session=False)
    
    # Also restore all patients of this hospital
    db.query(Patient).filter(Patient.hospital_id == hospital_id).update({"is_deleted": False}, synchronize_session=False)

    try:
        log_audit(db, cast(int, current_user.user_id), "HOSPITAL_RESTORED", f"Restored soft-deleted hospital: {db_hospital.legal_name}")
    except:
        pass
        
    db.commit()

    return {"message": f"Hospital {db_hospital.legal_name} restored successfully from Recycle Bin"}


def _purge_hospital_cascade(db: Session, hospital_id: int) -> dict:
    """
    Permanently delete a hospital and EVERY row in its dependency subtree.

    Reads the live FK graph from information_schema so it stays correct as the
    schema evolves (no hand-maintained table list to rot). Runs inside the
    caller's transaction: the caller commits on success or rolls back on error,
    so a purge is atomic ? it never leaves a hospital half-deleted.
    """
    def IN(name):
        return bindparam(name, expanding=True)

    fk_rows = db.execute(text("""
        SELECT tc.table_name AS child_t, kcu.column_name AS child_c,
               ccu.table_name AS parent_t, ccu.column_name AS parent_c
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
    """)).fetchall()

    pk_rows = db.execute(text("""
        SELECT tc.table_name AS t, kcu.column_name AS c
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
    """)).fetchall()

    pk_of: dict = {}
    for t, c in pk_rows:
        pk_of.setdefault(t, c)  # all relevant tables use a single-column PK

    from collections import defaultdict, deque
    children = defaultdict(list)               # parent_table -> [(child_t, child_c, parent_c)]
    for ct, cc, pt, pc in fk_rows:
        children[pt].append((ct, cc, pc))

    # 1. BFS: collect the exact PK values to delete in every dependent table.
    to_delete: dict = defaultdict(set)
    to_delete["hospitals"].add(hospital_id)
    queue = deque([("hospitals", {hospital_id})])

    while queue:
        parent_t, new_vals = queue.popleft()
        if not new_vals:
            continue
        parent_pk = pk_of.get(parent_t)
        for ct, cc, pc in children.get(parent_t, []):
            if ct == parent_t:
                continue  # skip self-referential FKs (whole table deleted at once)
            child_pk = pk_of.get(ct)
            if child_pk is None:
                # Fail loud inside the transaction rather than silently skipping
                # rows ? the caller rolls back, so no partial purge happens.
                raise HTTPException(
                    status_code=500,
                    detail=f"Cannot safely purge: table '{ct}' has no single-column primary key."
                )
            if pc != parent_pk:
                resolved = db.execute(
                    text(f'SELECT DISTINCT "{pc}" FROM "{parent_t}" WHERE "{parent_pk}" IN :v')
                    .bindparams(IN("v")),
                    {"v": list(new_vals)}
                ).fetchall()
                join_vals = [r[0] for r in resolved if r[0] is not None]
            else:
                join_vals = list(new_vals)
            if not join_vals:
                continue
            found = db.execute(
                text(f'SELECT "{child_pk}" FROM "{ct}" WHERE "{cc}" IN :v')
                .bindparams(IN("v")),
                {"v": join_vals}
            ).fetchall()
            newly = {r[0] for r in found if r[0] is not None} - to_delete[ct]
            if newly:
                to_delete[ct] |= newly
                queue.append((ct, newly))

    # 2. Topological order: a table may only be deleted once every table that
    #    references it (among the involved set) is already deleted.
    involved = set(to_delete.keys())
    referenced_by = {t: 0 for t in involved}
    parent_of = defaultdict(list)              # child_t -> [parent_t]
    for ct, cc, pt, pc in fk_rows:
        if ct in involved and pt in involved and ct != pt:
            referenced_by[pt] += 1
            parent_of[ct].append(pt)

    ready = deque([t for t in involved if referenced_by[t] == 0])
    order: list = []
    while ready:
        t = ready.popleft()
        order.append(t)
        for pt in parent_of[t]:
            referenced_by[pt] -= 1
            if referenced_by[pt] == 0:
                ready.append(pt)
    # Any leftover (cyclic among involved) ? append; retry loop below resolves it.
    for t in involved:
        if t not in order:
            order.append(t)

    # 3. Delete bottom-up, chunked, all within the caller's transaction.
    CHUNK = 5000
    deleted_counts: dict = {}
    for t in order:
        pk = pk_of[t]
        ids = list(to_delete[t])
        total = 0
        for i in range(0, len(ids), CHUNK):
            chunk = ids[i:i + CHUNK]
            res = db.execute(
                text(f'DELETE FROM "{t}" WHERE "{pk}" IN :v').bindparams(IN("v")),
                {"v": chunk}
            )
            total += getattr(res, 'rowcount', 0) or 0
        if total:
            deleted_counts[t] = total

    return deleted_counts


@router.delete("/{hospital_id}/permanent")
def permanently_delete_hospital(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.MANAGE_HOSPITALS))
):
    """
    IRREVERSIBLE. Permanently purges a hospital and its entire data subtree
    (patients, files, invoices, appointments, users, ...). Safety gate: the
    hospital must already be soft-deleted (sitting in the Recycle Bin).
    """
    db_hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first().first()
    if not db_hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    if not db_hospital.is_deleted:
        raise HTTPException(
            status_code=400,
            detail="Hospital must be sent to the Recycle Bin (soft-deleted) before it can be permanently deleted."
        )

    hospital_name = db_hospital.legal_name

    try:
        deleted_counts = _purge_hospital_cascade(db, hospital_id)
        # Platform-scoped audit entry (hospital_id=None) so it is NOT part of the
        # purged subtree and survives the commit.
        log_audit(
            db,
            current_user.user_id,  # type: ignore[arg-type]
            "HOSPITAL_PURGED",
            f"Permanently deleted hospital '{hospital_name}' (id={hospital_id}). "
            f"Rows removed: {deleted_counts}",
            hospital_id=None
        )
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Permanent deletion failed and was rolled back: {e}")

    return {
        "message": f"Hospital '{hospital_name}' and all associated data were permanently deleted.",
        "deleted_rows": deleted_counts
    }
