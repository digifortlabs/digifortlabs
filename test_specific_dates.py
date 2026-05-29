import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv('backend/.env')
engine = create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    result = conn.execute(text("SELECT hospital_id, admission_date FROM patients WHERE hospital_id IN (14, 17, 19);"))
    for row in result:
        print(f"Hospital {row[0]}: {row[1]}")
