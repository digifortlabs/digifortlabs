from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, date
import sys
import os

# Ensure we can import from app
sys.path.append(os.getcwd())

from app.database import Base
from app.models import Patient

SQLALCHEMY_DATABASE_URL = "sqlite:///./digifortlabs.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def calculate_age_string(dob):
    if not dob:
        return None
    
    today = date.today()
    # Handle datetime object
    if isinstance(dob, datetime):
        dob = dob.date()
        
    years = today.year - dob.year
    months = today.month - dob.month
    days = today.day - dob.day

    # Adjust for negative months
    if months < 0 or (months == 0 and days < 0):
        years -= 1
        months += 12
    
    if days < 0:
        months -= 1
        if months < 0:
            months += 12
            years -= 1

    # Logic
    if years >= 1:
        return f"{years} Years"
    else:
        final_months = max(0, months)
        if final_months == 0 and years == 0:
            final_months = 1 # Minimum 1 month for babies
        return f"{final_months} Months"

def fix_ages():
    print("Starting Age Repair...")
    db = SessionLocal()
    try:
        patients = db.query(Patient).all()
        count = 0
        for p in patients:
            if p.dob:
                new_age = calculate_age_string(p.dob)
                if new_age and new_age != p.age:
                    print(f"Fixing ID {p.record_id}: {p.age} -> {new_age}")
                    p.age = new_age
                    count += 1
            elif p.age and isinstance(p.age, int):
                 # Convert legacy int to string
                 p.age = f"{p.age} Years"
                 count += 1
        
        db.commit()
        print(f"Successfully updated {count} patient records.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_ages()
