from pydantic import BaseModel
from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import random
import string

from ..models import Hospital, User, UserRole, BandwidthUsage
from ..utils import get_password_hash
from ..services.email_service import EmailService

IST = timezone(timedelta(hours=5, minutes=30))

class DemoRegistrationRequest(BaseModel):
    full_name: str
    email: str
    phone: str
    organization_name: str

def register_demo_account(data: DemoRegistrationRequest, db: Session):
    # Check if email exists
    existing = db.query(User).filter(User.email == data.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate random password
    password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
    
    # Create demo hospital with limits
    hospital = Hospital(
        legal_name=data.organization_name,
        email=data.email.lower(),
        subscription_tier="Demo",
        specialty="General",
        enabled_modules=["core", "mrd"],
        max_users=2,
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
    
    # Send credentials email
    EmailService.send_demo_credentials_email(data.email, password)
    
    return {"message": "Demo account created successfully"}
