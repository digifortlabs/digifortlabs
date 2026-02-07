import sys
import os
from datetime import datetime

# Add app directory to path
sys.path.append(os.path.join(os.getcwd(), "app"))

from app.database import SessionLocal
from app.models import User, Hospital, UserRole
from app.utils import get_password_hash

def create_initial_data():
    db = SessionLocal()
    try:
        # 1. Create Default Hospital
        hospital = db.query(Hospital).first()
        if not hospital:
            hospital = Hospital(
                legal_name="Digifort Labs Default",
                email="admin@digifortlabs.com",
                subscription_tier="Enterprise",
                is_active=True
            )
            db.add(hospital)
            db.commit()
            db.refresh(hospital)
            print(f"✅ Created Hospital: {hospital.legal_name}")
        else:
            print(f"ℹ️ Hospital already exists: {hospital.legal_name}")

        # 2. Create SuperAdmin User
        user = db.query(User).filter(User.email == "admin@digifortlabs.com").first()
        if not user:
            user = User(
                email="admin@digifortlabs.com",
                full_name="System Administrator",
                role=UserRole.SUPER_ADMIN,
                hashed_password=get_password_hash("Digif0rt2026"),
                hospital_id=None, # SuperAdmins might not need a hospital_id
                is_active=True,
                is_verified=True
            )
            db.add(user)
            db.commit()
            print(f"✅ Created SuperAdmin: {user.email}")
        else:
            print(f"ℹ️ User already exists: {user.email}")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_initial_data()
