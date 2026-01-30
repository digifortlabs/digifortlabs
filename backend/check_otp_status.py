
import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models import PasswordResetOTP
from sqlalchemy import func, desc
from datetime import datetime

EMAIL = "admin@digifortlabs.com"

def check_otp():
    db = SessionLocal()
    try:
        print(f"Checking OTPs for {EMAIL}...")
        print(f"Current UTC Time: {datetime.utcnow()}")
        
        otps = db.query(PasswordResetOTP).filter(
            func.lower(PasswordResetOTP.email) == func.lower(EMAIL)
        ).order_by(desc(PasswordResetOTP.created_at)).limit(5).all()

        if not otps:
            print("❌ No OTPs found for this email.")
            return

        for otp in otps:
            status = []
            if otp.is_used: status.append("USED")
            
            # Helper to make naive if aware
            exp = otp.expires_at
            if exp.tzinfo:
                exp = exp.replace(tzinfo=None)
            
            if exp < datetime.utcnow(): status.append("EXPIRED")
            if not status: status.append("VALID")
            
            print(f"ID: {otp.otp_id} | Code: {otp.otp_code} | Created: {otp.created_at} | Expires: {otp.expires_at} | Used: {otp.is_used} | Status: {', '.join(status)}")

    finally:
        db.close()

if __name__ == "__main__":
    check_otp()
