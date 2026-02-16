import sys
import os
sys.path.append(os.getcwd())
try:
    from app.database import SessionLocal
    from app.models import PDFFile, Patient
except ImportError:
    sys.path.append(os.path.join(os.getcwd(), '..'))
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    from app.database import SessionLocal
    from app.models import PDFFile, Patient

def investigate():
    db = SessionLocal()
    missing_ids = [120, 115, 116, 117, 119, 121, 122, 123] 
    
    print("--- Investigating Missing Files ---")
    files = db.query(PDFFile).filter(PDFFile.file_id.in_(missing_ids)).all()
    
    for f in files:
        p = f.patient
        print(f"ID: {f.file_id} | File: {f.filename} | Hash: {os.path.basename(f.s3_key)}")
        print(f"   Patient: {p.full_name} | MRD: {p.patient_u_id} | Hosp: {p.hospital.legal_name}")
        print(f"   Upload Date: {f.upload_date} | Status: {f.upload_status}")
        print("-" * 30)
    
    db.close()

if __name__ == "__main__":
    investigate()
