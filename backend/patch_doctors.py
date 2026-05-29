import sys

file_path = r"d:\Website\DIGIFORTLABS\backend\app\routers\doctors.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Schema
content = content.replace(
"""    role: UserRole = UserRole.DOCTOR_OPD # Defaults to OPD if account created

class DoctorUpdate(BaseModel):""",
"""    role: UserRole = UserRole.DOCTOR_OPD # Defaults to OPD if account created
    is_residential: bool = True

class DoctorUpdate(BaseModel):"""
)

# 2. Update creation merge logic
old_logic = """        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=400, detail="Email already registered for login")
            
        new_user = User(
            email=data.email,
            full_name=data.full_name,
            hashed_password=get_password_hash(password_to_use),
            role=data.role,
            hospital_id=current_user.hospital_id,
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
                logging.error(f"Failed to send welcome email to doctor: {e}")"""

new_logic = """        existing_user = db.query(User).filter(User.email == data.email).first()
        if existing_user:
            new_user_id = existing_user.user_id
        else:
            new_user = User(
                email=data.email,
                full_name=data.full_name,
                hashed_password=get_password_hash(password_to_use),
                role=data.role,
                hospital_id=current_user.hospital_id,
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
                    logging.error(f"Failed to send welcome email to doctor: {e}")"""

content = content.replace(old_logic, new_logic)

# 3. Add is_residential to profile creation
content = content.replace(
"""        department_id=data.department_id,
        specialization=data.specialization,
        consultation_fee=data.consultation_fee
    )""",
"""        department_id=data.department_id,
        specialization=data.specialization,
        consultation_fee=data.consultation_fee,
        is_residential=getattr(data, 'is_residential', True)
    )"""
)

# 4. Add setup endpoint
setup_endpoint = """
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
"""

content += setup_endpoint

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied successfully.")
