import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv('backend/.env')
engine = create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    result = conn.execute(text("SELECT patient_category, COUNT(*) FROM patients GROUP BY patient_category;"))
    print("Patient categories in DB:")
    for row in result:
        print(f"  {row[0]}: {row[1]} patients")
