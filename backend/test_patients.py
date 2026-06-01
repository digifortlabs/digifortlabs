import os, psycopg2
from dotenv import load_dotenv
load_dotenv(override=True)
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute("SELECT current_session_id FROM users WHERE email='29keval@gmail.com'")
session_id = cur.fetchone()[0]

from jose import jwt
from app.core.config import settings
import requests

token_data = {
    'sub': '29keval@gmail.com',
    'role': 'doctor_ipd',
    'hospital_id': 14,
    'session_id': session_id
}
token = jwt.encode(token_data, settings.SECRET_KEY.get_secret_value(), algorithm=settings.ALGORITHM)

headers = {'Authorization': f'Bearer {token}'}
res = requests.get('http://127.0.0.1:8000/patients/?hospital_id=14', headers=headers)
print('STATUS:', res.status_code)
print('BODY:', res.text)
