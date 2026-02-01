import sys
import os

# Ensure we can import 'app'
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models import User, UserRole
from app.utils import get_password_hash

def create_admin():
    db = SessionLocal()
    try:
        email = "admin@localhost"
        password = "admin123"
        
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"User {email} already exists.")
            return

        hashed = get_password_hash(password)
        
        user = User(
            email=email,
            hashed_password=hashed,
            plain_password=password,
            role=UserRole.SUPER_ADMIN,
            is_active=True
        )
        
        db.add(user)
        db.commit()
        print(f"Successfully created Super Admin user:")
        print(f"Email: {email}")
        print(f"Password: {password}")
        
    except Exception as e:
        print(f"Error creating user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
