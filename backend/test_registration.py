import requests

url = "http://localhost:8000/hospitals/"

payload = {
    "legal_name": "Test Hospital",
    "organization_type": "Hospital",
    "registration_number": "123",
    "established_year": 2024,
    "email": "test@test.com",
    "secondary_email": "",
    "phone": "9999999999",
    "alternate_phone": "",
    "landline": "",
    "address": "123 Test St",
    "address_line2": "",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India",
    "google_maps_url": "",
    "gst_number": "",
    "admin_full_name": "Admin Name",
    "admin_email": "admin@test.com",
    "admin_phone": "9999999999",
    "admin_designation": "Admin",
    "password": "password123",
    "specialty": "Healthcare",
    "enabled_modules": ["core"],
    "custom_pricing": {},
    "expected_monthly_volume": 100,
    "expected_users": 10,
    "storage_requirements": "Medium",
    "special_requirements": ""
}

# The backend requires a valid access token in cookies... wait!
# I can just log in as the super admin to get the cookie.
session = requests.Session()
login_res = session.post("http://localhost:8000/auth/login", data={"username": "admin@digifortlabs.com", "password": "password"})
print("Login status:", login_res.status_code)

res = session.post(url, json=payload)
print("Registration status:", res.status_code)
print(res.text)
