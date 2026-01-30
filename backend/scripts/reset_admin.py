
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

load_dotenv()

from app.models import User
from app.utils import get_password_hash

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def reset_password():
    email = "admin@digifortlabs.com"
    new_pass = "admin123"
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        print(f"❌ User {email} not found!")
        return

    print(f"Found user: {user.email} (ID: {user.user_id})")
    hashed = get_password_hash(new_pass)
    user.hashed_password = hashed
    user.failed_login_attempts = 0 # Reset lock too if any
    user.locked_until = None
    
    db.commit()
    print(f"✅ Password reset to '{new_pass}' successfully.")

if __name__ == "__main__":
    reset_password()
