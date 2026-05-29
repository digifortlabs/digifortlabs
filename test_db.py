import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load env to get DATABASE_URL
load_dotenv('backend/.env')

DATABASE_URL = os.getenv('DATABASE_URL')
print(f"Connecting to {DATABASE_URL}")

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    result = conn.execute(text("SELECT COUNT(*) FROM patients;"))
    print(f"Total patients in DB: {result.scalar()}")

    result2 = conn.execute(text("SELECT hospital_id, COUNT(*) FROM patients GROUP BY hospital_id;"))
    print("Patients per hospital:")
    for row in result2:
        print(f"  Hospital {row[0]}: {row[1]} patients")
