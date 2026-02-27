import sys
import os
from datetime import datetime

# Add app directory to path
sys.path.append(os.path.join(os.getcwd(), "app"))

from app.database import SessionLocal
from app.models import User, UserRole
from app.utils import get_password_hash

def seed_specific_user():
    db = SessionLocal()
    try:
        email = "admin@digifortlabs.com"
        password = "Kev@l2902"
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                full_name="System Administrator",
                role=UserRole.SUPER_ADMIN,
                hashed_password=get_password_hash(password),
                is_active=True,
                is_verified=True
            )
            db.add(user)
            db.commit()
            print(f"✅ Created SuperAdmin: {user.email}")
        else:
            print(f"ℹ️ User already exists. Updating password...")
            user.hashed_password = get_password_hash(password)
            db.commit()
            print(f"✅ Updated password for: {user.email}")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_specific_user()
