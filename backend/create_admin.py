from app.database import SessionLocal
from app.models import Hospital, User, UserRole
from app.utils import get_password_hash

db = SessionLocal()

# Find Hospital
hospital = db.query(Hospital).filter(Hospital.email == "ADMIN@dixithospital.com").first()

if hospital:
    # Check if user exists
    user = db.query(User).filter(User.email == hospital.email).first()
    if not user:
        print(f"Creating user for {hospital.email}...")
        new_user = User(
            email=hospital.email,
            hashed_password=get_password_hash("Hospital@123"),
            plain_password="Hospital@123",
            role=UserRole.HOSPITAL_ADMIN,
            hospital_id=hospital.hospital_id
        )
        db.add(new_user)
        db.commit()
        print("User Created Successfully!")
    else:
        print("User already exists.")
else:
    print("Hospital not found.")

db.close()
