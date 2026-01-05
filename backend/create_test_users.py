import sys
import os

# Ensure backend directory is in path
sys.path.append(os.getcwd())

from app.database import SessionLocal, engine, Base
from app.models import User, Hospital, UserRole
from app.utils import get_password_hash

def create_users():
    # Init DB
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Super Admin
        admin_email = "admin@digifortlabs.com"
        if not db.query(User).filter(User.email == admin_email).first():
            print(f"Creating Super Admin: {admin_email}")
            admin = User(
                email=admin_email,
                hashed_password=get_password_hash("Password@123"),
                role=UserRole.SUPER_ADMIN,
                plain_password="Password@123"
            )
            db.add(admin)
        else:
            print(f"Super Admin {admin_email} already exists.")

        # Hospital
        hospital = db.query(Hospital).filter(Hospital.legal_name == "General Hospital").first()
        if not hospital:
            print("Creating General Hospital...")
            hospital = Hospital(
                legal_name="General Hospital",
                email="contact@hospital.com",
                subscription_tier="Enterprise"
            )
            db.add(hospital)
            db.flush() # get ID
        else:
             print("General Hospital already exists.")
        
        # MRD Staff
        mrd_email = "mrd@hospital.com"
        if not db.query(User).filter(User.email == mrd_email).first():
            print(f"Creating MRD Staff: {mrd_email}")
            mrd = User(
                email=mrd_email,
                hashed_password=get_password_hash("Password@123"),
                role=UserRole.MRD_STAFF,
                hospital_id=hospital.hospital_id,
                plain_password="Password@123"
            )
            db.add(mrd)
        else:
             print(f"MRD Staff {mrd_email} already exists.")

        db.commit()
        print("Seeding Complete!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_users()
