import requests

url = "https://digifortlabs.com/api/auth/token"
data = {"username": "demo@hospital.com", "password": "password@123"}
response = requests.post(url, data=data)
if response.status_code == 200:
    token = response.json()["access_token"]
    print("Login successful!")
    
    # Try to upload a dummy image to the patient extract endpoint
    headers = {"Authorization": f"Bearer {token}"}
    files = {"file": ("dummy.jpg", b"fake image content", "image/jpeg")}
    
    extract_url = "https://digifortlabs.com/api/patients/extract"
    extract_response = requests.post(extract_url, headers=headers, files=files)
    print("Extract Response Code:", extract_response.status_code)
    try:
        print("Extract Response JSON:", extract_response.json())
    except:
        print("Extract Response Text:", extract_response.text)
else:
    print("Login failed:", response.status_code, response.text)
