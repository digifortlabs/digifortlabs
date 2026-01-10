from passlib.context import CryptContext

from app.database import SessionLocal
from app.models import Hospital, User, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

import uuid


def restore_user():
    db = SessionLocal()
    try:
        # 1. Create Default Hospital if not exists
        hospital = db.query(Hospital).first()
        if not hospital:
            print("Creating Default Hospital...")
            hospital = Hospital(
                legal_name="Dixit Hospital",
                city="Vavat",
                state="MH",
                pincode="416312",
                email="admin@dixithospital.com" # Required field
            )
            db.add(hospital)
            db.commit()
            db.refresh(hospital)
        
        email = "admin@dixithospital.com"
        password = "P@ssw0rd"
        hashed = pwd_context.hash(password)
        
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"Updating existing user: {email} to HOSPITAL ADMIN")
            user.hashed_password = hashed
            user.plain_password = password
            user.role = UserRole.HOSPITAL_ADMIN
            user.hospital_id = hospital.hospital_id
            user.force_password_change = True
            user.is_active = True
            
            # SESSION INVALIDATION
            user.current_session_id = str(uuid.uuid4())
            
            db.commit()
            print("✅ User Reset to HOSPITAL ADMIN Successfully (Sessions Invalidated)")
            return

        print(f"Restoring User: {email} as HOSPITAL ADMIN")
        new_user = User(
            email=email,
            hashed_password=hashed,
            plain_password=password,
            role=UserRole.HOSPITAL_ADMIN, 
            hospital_id=hospital.hospital_id,
            is_active=True,
            force_password_change=True,
            current_session_id=str(uuid.uuid4())
        )
        db.add(new_user)
        db.commit()
        print("✅ User Restored Successfully")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    restore_user()
