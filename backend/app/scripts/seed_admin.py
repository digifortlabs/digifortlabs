from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

from app.core.config import settings
from app.models import User, UserRole, Hospital
from app.utils import get_password_hash

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def seed():
    # Check if admin exists
    email = "admin@digifortlabs.com"
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print(f"User {email} already exists.")
        return

    # Create Hospital for Super Admin (usually null or platform hospital)
    # But usually Super Admin doesn't need one. However, the model might require it.
    
    admin = User(
        email=email,
        full_name="Platform Administrator",
        role=UserRole.SUPER_ADMIN,
        hashed_password=get_password_hash("Kev@l2902"),
        is_active=True,
        is_verified=True
    )
    db.add(admin)
    db.commit()
    print(f"Super Admin {email} created successfully.")

if __name__ == "__main__":
    seed()
    db.close()
