import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv('backend/.env')
engine = create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    result = conn.execute(text("SELECT patient_category FROM patients WHERE hospital_id = 14;"))
    row = result.fetchone()
    print(f"Hospital 14 patient category: {row[0]}")
