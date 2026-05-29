import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv('backend/.env')
engine = create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    result = conn.execute(text("SELECT MAX(admission_date), MIN(admission_date) FROM patients;"))
    row = result.fetchone()
    print(f"Max admission_date: {row[0]}")
    print(f"Min admission_date: {row[1]}")
