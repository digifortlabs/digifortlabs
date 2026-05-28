import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy import text
from app.database import SessionLocal

def run_migration():
    db = SessionLocal()
    try:
        print("Starting database migration...")
        
        # 1. Add new columns
        print("Adding ipd_number to patients...")
        db.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS ipd_number VARCHAR;"))
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_patients_ipd_number ON patients (ipd_number);"))
        
        print("Adding opd_number to appointments...")
        db.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS opd_number VARCHAR;"))
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_appointments_opd_number ON appointments (opd_number);"))
        
        # 2. Populate uhid where null using patient_u_id
        print("Populating uhid from patient_u_id where uhid is NULL...")
        db.execute(text("UPDATE patients SET uhid = patient_u_id WHERE uhid IS NULL;"))
        
        # 3. Alter columns
        print("Altering columns...")
        # Drop existing unique constraint on patient_u_id if it exists
        try:
            db.execute(text("ALTER TABLE patients DROP CONSTRAINT IF EXISTS uq_hospital_patient_mrd;"))
        except Exception as e:
            print(f"Warning: constraint drop error (might not exist): {e}")
            db.rollback()
            
        # Add new unique constraint on uhid
        try:
            db.execute(text("ALTER TABLE patients ADD CONSTRAINT uq_hospital_patient_uhid UNIQUE (hospital_id, uhid);"))
        except Exception as e:
            print(f"Warning: constraint add error (might already exist): {e}")
            db.rollback()

        # Alter nullability
        print("Changing nullability...")
        db.execute(text("ALTER TABLE patients ALTER COLUMN uhid SET NOT NULL;"))
        db.execute(text("ALTER TABLE patients ALTER COLUMN patient_u_id DROP NOT NULL;"))
        
        db.commit()
        print("Migration successful!")
    except Exception as e:
        db.rollback()
        print(f"Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
