import sys
import os
import requests
import time

# Ensure we can import 'app'
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models import PasswordResetOTP, User
from sqlalchemy import func, desc

BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/auth/token"
RESET_URL = f"{BASE_URL}/auth/request-password-reset"
CONFIRM_RESET_URL = f"{BASE_URL}/auth/reset-password"

# Update with a valid user email available in your local DB
TEST_EMAIL = "admin@localhost" 
TEST_PASSWORD = "wrongpassword"

def get_latest_otp(email):
    db = SessionLocal()
    try:
        otp = db.query(PasswordResetOTP).filter(
            func.lower(PasswordResetOTP.email) == func.lower(email)
        ).order_by(desc(PasswordResetOTP.created_at)).first()
        return otp.otp_code if otp else None
    finally:
        db.close()

def test_lockout():
    print("--- Testing Lockout Logic ---")
    for i in range(1, 8):
        response = requests.post(LOGIN_URL, data={"username": TEST_EMAIL, "password": TEST_PASSWORD})
        print(f"Attempt {i}: Status {response.status_code}, Response: {response.json()}")
        
        if response.status_code == 403:
            if "Account locked" in response.json()['detail']:
                print("✅ Lockout triggered successfully.")
            else:
                 print("❌ 403 received but unexpected message.")
            break
        elif i == 6:
             print("❌ Failed to trigger lockout on 6th attempt.")

def test_reset_flow():
    print("\n--- Testing OTP & Reset Logic ---")
    
    # 1. Request OTP
    print(f"Requesting OTP for {TEST_EMAIL}...")
    resp = requests.post(RESET_URL, json={"email": TEST_EMAIL})
    print(f"Request Reset: {resp.status_code}, {resp.json()}")

    # 2. Get OTP from DB
    otp_code = get_latest_otp(TEST_EMAIL)
    if not otp_code:
        print("❌ Could not retrieve OTP from DB. OTP generation might have failed.")
        return
    print(f"✅ Retrieved OTP from DB: {otp_code}")

    # 3. Reset Password
    new_password = "newsecurepassword123"
    print(f"Resetting password to: {new_password}")
    resp = requests.post(CONFIRM_RESET_URL, json={
        "email": TEST_EMAIL,
        "otp": otp_code,
        "new_password": new_password
    })
    print(f"Reset Password: {resp.status_code}, {resp.json()}")

    if resp.status_code == 200:
        print("✅ Password reset successful.")
        
        # 4. Verify Login with New Password
        print("Verifying login with new password...")
        resp = requests.post(LOGIN_URL, data={"username": TEST_EMAIL, "password": new_password})
        if resp.status_code == 200:
             print("✅ Login successful with new password! Lockout cleared.")
        else:
             print(f"❌ Login failed with new password: {resp.status_code}, {resp.json()}")
    else:
        print("❌ Password reset failed.")

if __name__ == "__main__":
    test_lockout()
    test_reset_flow()
