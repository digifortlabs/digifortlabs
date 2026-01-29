import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import User
from sqlalchemy import func

def unlock_user(email):
    db = SessionLocal()
    try:
        user = db.query(User).filter(func.lower(User.email) == func.lower(email)).first()
        if not user:
            print(f"User {email} not found!")
            return

        print(f"Unlocking user: {user.email}")
        print(f"Current Failed Attempts: {user.failed_login_attempts}")
        print(f"Current Locked Until: {user.locked_until}")

        user.failed_login_attempts = 0
        user.locked_until = None
        
        db.commit()
        print("✅ User unlocked successfully.")
        
    except Exception as e:
        print(f"Error unlocking user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    unlock_user("admin@digifortlabs.com")
