
import requests
import sys

BASE_URL = "http://localhost:8000"

def verify():
    # 1. Login
    print("🔐 Logging in as admin...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/token", data={
            "username": "admin@digifortlabs.com",
            "password": "admin123"
        })
        if resp.status_code != 200:
            print(f"❌ Login Failed: {resp.status_code} - {resp.text}")
            sys.exit(1)
            
        token = resp.json()["access_token"]
        print("✅ Login Successful")
        
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        sys.exit(1)

    # 2. Check Accounting Endpoint
    print("\n🧾 Checking Accounting Invoice List...")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        resp = requests.get(f"{BASE_URL}/accounting/", headers=headers)
        if resp.status_code == 200:
            count = len(resp.json())
            print(f"✅ Accounting API Success! Found {count} invoices.")
            print(resp.json())
        else:
            print(f"❌ Accounting API Failed: {resp.status_code}")
            print(resp.text)
            
    except Exception as e:
        print(f"❌ Request Error: {e}")

if __name__ == "__main__":
    verify()
