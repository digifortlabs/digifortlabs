import os
import sys

# Ensure we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import func

from app.database import SessionLocal
from app.models import Patient, User


def check_counts():
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        print(f"Total Users in DB: {user_count}")

        total_patients = db.query(Patient).count()
        print(f"Total Patients in DB: {total_patients}")
        
        # Group by hospital
        by_hospital = db.query(Patient.hospital_id, func.count(Patient.record_id)).group_by(Patient.hospital_id).all()
        print("Patients per Hospital ID:")
        for hosp_id, count in by_hospital:
            print(f"  Hospital {hosp_id}: {count}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_counts()
