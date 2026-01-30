
import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models import User
from sqlalchemy import func

EMAIL = "admin@digifortlabs.com"

def unlock_user():
    db = SessionLocal()
    try:
        user = db.query(User).filter(func.lower(User.email) == func.lower(EMAIL)).first()
        if not user:
            print(f"❌ User {EMAIL} not found!")
            return

        print(f"User found: {user.email}")
        print(f"Current Status - Locked Until: {user.locked_until}, Failed Attempts: {user.failed_login_attempts}")

        user.locked_until = None
        user.failed_login_attempts = 0
        db.commit()
        
        print(f"✅ User {EMAIL} has been successfully UNLOCKED.")

    finally:
        db.close()

if __name__ == "__main__":
    unlock_user()
