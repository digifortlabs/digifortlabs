import sys
import os

backend_path = os.path.join(os.getcwd(), 'backend')
if os.path.exists(backend_path):
    sys.path.append(backend_path)
else:
    sys.path.append(os.getcwd())

try:
    from app.database import SessionLocal, engine
    from app.models import Patient
    from sqlalchemy.orm import joinedload
except ImportError:
    raise

def debug():
    try:
        db = SessionLocal()
        print(f"Connected to: {engine.url}")
        print("--- Searching for 'Krishna' ---")
        
        patients = db.query(Patient).filter(Patient.full_name.ilike('%Krishna%')).all()
        
        if not patients:
            print("No patients found with name 'Krishna'")
        
        for p in patients:
            print(f"Found Patient: {p.full_name}")
            print(f"  Record ID: {p.record_id}")
            print(f"  MRD (patient_u_id): {p.patient_u_id}")
            print(f"  UHID: {p.uhid}")
            print(f"  Files Count: {len(p.files)}")
            for f in p.files:
                print(f"    - {f.filename} [{f.upload_status}]")
            print("-" * 20)

        db.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug()
