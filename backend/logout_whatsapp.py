import requests

api_url = 'http://127.0.0.1:8080'
headers = {'apikey': 'DIGIFORT_SECURE_KEY_123'}

print("Fetching instances...")
try:
    instances = requests.get(f'{api_url}/instance/fetchInstances', headers=headers).json()
    for i in instances:
        name = i.get('name')
        if name:
            # First try to logout gracefully
            requests.delete(f'{api_url}/instance/logout/{name}', headers=headers)
            # Then delete the instance to completely wipe the session
            res = requests.delete(f'{api_url}/instance/delete/{name}', headers=headers)
            print(f"Deleted {name}: {res.status_code}")
except Exception as e:
    print(f"Error: {e}")
