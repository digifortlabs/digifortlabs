from pydantic import BaseModel
from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import random
import string
import re
import uuid

from ..models import Hospital, User, UserRole, BandwidthUsage
from ..utils import get_password_hash
from ..services.email_service import EmailService

IST = timezone(timedelta(hours=5, minutes=30))

class DemoRegistrationRequest(BaseModel):
    full_name: str
    email: str
    phone: str
    organization_name: str
    target_module: str = "mrd"

def register_demo_account(data: DemoRegistrationRequest, db: Session):
    # Check if email exists
    existing = db.query(User).filter(User.email == data.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate random password
    password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
    
    # Determine enabled modules and specialty based on selection
    enabled = ["core"]
    specialty = "General"
    
    mod = data.target_module.lower() if data.target_module else "all"
    
    if mod == "all":
        enabled.extend(["mrd", "hms", "dental", "ent", "pharma", "clinic", "accounting"])
        specialty = "Multi-Specialty Hospital"
    elif mod and mod not in ["mrd", "core"]:
        enabled.append(mod)
        if mod == "dental": specialty = "Dental"
        elif mod == "ent": specialty = "ENT"
        elif mod == "pharma": specialty = "Pharmacy"
        elif mod == "clinic": specialty = "Clinic"
        elif mod == "hms": specialty = "Hospital"
        
    try:
        # Generate URL-safe subdomain slug
        base_slug = re.sub(r'[^a-z0-9]', '', data.organization_name.lower()) + "-demo"
        slug = base_slug
        while db.query(Hospital).filter(Hospital.hospital_slug == slug).first():
            slug = f"{base_slug}-{uuid.uuid4().hex[:4]}"
            
        trial_end = datetime.now(IST) + timedelta(days=30)
            
        # Create demo hospital with limits
        hospital = Hospital(
            legal_name=data.organization_name,
            hospital_slug=slug,
            email=data.email.lower(),
            subscription_tier="Demo",
            specialty=specialty,
            enabled_modules=enabled,
            max_users=2,
            trial_ends_at=trial_end,
            custom_pricing={"max_patients": 50, "max_records": 50},
            is_active=True
        )
        db.add(hospital)
        db.flush()
        
        # Set bandwidth limit (100MB)
        bandwidth = BandwidthUsage(
            hospital_id=hospital.hospital_id,
            month_year=datetime.now(IST).strftime("%Y-%m"),
            used_mb=0.0,
            quota_limit_mb=100.0
        )
        db.add(bandwidth)
        
        # Create admin user
        user = User(
            email=data.email.lower(),
            full_name=data.full_name,
            phone=data.phone,
            role=UserRole.HOSPITAL_ADMIN,
            hashed_password=get_password_hash(password),
            hospital_id=hospital.hospital_id,
            is_active=True,
            is_verified=True
        )
        db.add(user)
        db.commit()
        
        # Send credentials email - NOTE: the EmailService needs to be updated to accept and send the slug. For now we will just pass the slug if it supports it, or we'll update the email service next.
        try:
            EmailService.send_demo_credentials_email(data.email, password, slug)
        except TypeError:
            # Fallback if send_demo_credentials_email doesn't support slug yet
            EmailService.send_demo_credentials_email(data.email, password)
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create demo account: {str(e)}")
    
    return {"message": "Demo account created successfully"}
