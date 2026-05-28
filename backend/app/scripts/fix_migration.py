import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy import text
from app.database import SessionLocal

def run_migration():
    db = SessionLocal()
    
    # 1. Add ipd_number to patients
    try:
        db.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS ipd_number VARCHAR;"))
        db.commit()
        print("Added ipd_number to patients.")
    except Exception as e:
        db.rollback()
        print(f"Failed to add ipd_number: {e}")

    # 2. Add opd_number to appointments
    try:
        db.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS opd_number VARCHAR;"))
        db.commit()
        print("Added opd_number to appointments.")
    except Exception as e:
        db.rollback()
        print(f"Failed to add opd_number: {e}")

    # 3. Change nullability of uhid
    try:
        db.execute(text("ALTER TABLE patients ALTER COLUMN uhid SET NOT NULL;"))
        db.commit()
        print("Set uhid to NOT NULL.")
    except Exception as e:
        db.rollback()
        print(f"Failed to set uhid NOT NULL: {e}")

    # 4. Change nullability of patient_u_id
    try:
        db.execute(text("ALTER TABLE patients ALTER COLUMN patient_u_id DROP NOT NULL;"))
        db.commit()
        print("Dropped NOT NULL from patient_u_id.")
    except Exception as e:
        db.rollback()
        print(f"Failed to drop NOT NULL from patient_u_id: {e}")

    db.close()

if __name__ == "__main__":
    run_migration()
