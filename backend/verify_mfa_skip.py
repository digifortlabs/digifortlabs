import requests
import sys

BASE_URL = "http://localhost:8000" # Adjusted to common local port, change if needed

def test_mfa_flow():
    email = "admin@example.com"
    password = "password123"
    
    print("--- Phase 1: Initial Login (Expect MFA) ---")
    session = requests.Session()
    login_payload = {
        "username": email,
        "password": password
    }
    
    try:
        response = session.post(f"{BASE_URL}/auth/token", data=login_payload)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 202:
            data = response.json()
            if data.get("mfa_required"):
                print("✅ MFA Triggered as expected.")
                device_id = data.get("device_id")
                
                print("\n--- Phase 2: Verify Device with OTP ---")
                # Note: In a real test, we'd need to get the OTP from DB or mock it.
                # Since I can't easily get the OTP here without DB access in the script,
                # this is a structural test.
                print("Manual Step required: Provide a valid OTP for verification if running against live DB.")
                
            else:
                print("❌ MFA should have been required.")
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            print(f"Detail: {response.text}")
            
    except Exception as e:
        print(f"Error during test: {e}")

if __name__ == "__main__":
    test_mfa_flow()
