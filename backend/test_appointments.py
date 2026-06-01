import requests
import json
from datetime import datetime, timezone

# 1. Login to get token
login_data = {
    "username": "29keval@gmail.com",
    "password": "password"
}
login_res = requests.post('http://127.0.0.1:8000/auth/token', data=login_data)
if login_res.status_code != 200:
    print("Login failed:", login_res.text)
    exit(1)

token = login_res.json()["access_token"]

# 2. Create Appointment
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

payload = {
    "patient_id": 940,
    "doctor_id": 1,
    "department_id": 1,
    "appointment_date": "2026-06-01T00:00:00.000Z",
    "start_time": "2026-06-01T10:00:00.000Z",
    "end_time": "2026-06-01T10:15:00.000Z",
    "reason_for_visit": "Test",
    "notes": "Test",
    "visit_type": "OPD",
    "is_follow_up": False
}

print("Sending POST request to /appointments/")
res = requests.post('http://127.0.0.1:8000/appointments/', headers=headers, json=payload)
print(res.status_code, res.text)
