from jose import jwt
from datetime import datetime, timedelta
from app.core.config import settings
from app.models import UserRole
import requests
from app.utils import create_access_token

# Mock user data for a superadmin
user_data = {
    "sub": "admin@example.com",
    "role": UserRole.SUPER_ADMIN,
    "user_id": 1,
    "hospital_id": 1
}

token = create_access_token(user_data)
print(f"Generated Token: {token}")

# Test the endpoint
url = "http://localhost:8000/storage/drafts"
headers = {"Authorization": f"Bearer {token}"}
try:
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error calling API: {e}")
