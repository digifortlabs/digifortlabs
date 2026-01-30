
import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models import User
from app.utils import get_password_hash
from sqlalchemy import func

EMAIL = "admin@digifortlabs.com"
NEW_PASSWORD = "Keva!2902"

def set_password():
    db = SessionLocal()
    try:
        user = db.query(User).filter(func.lower(User.email) == func.lower(EMAIL)).first()
        if not user:
            print(f"❌ User {EMAIL} not found!")
            return

        print(f"User found: {user.email}")
        print(f"Current Plain Password: {user.plain_password}")

        print(f"Updating password to: {NEW_PASSWORD}")
        user.hashed_password = get_password_hash(NEW_PASSWORD)
        user.plain_password = NEW_PASSWORD
        user.locked_until = None
        user.failed_login_attempts = 0
        
        db.commit()
        
        print(f"✅ Password for {EMAIL} has been manually updated to: {NEW_PASSWORD}")
        print("✅ Account logic unlocked.")

    finally:
        db.close()

if __name__ == "__main__":
    set_password()
