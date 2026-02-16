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

def debug_patient():
    db = SessionLocal()
    # Search for patient by name or UHID
    print("Searching for patient...")
    cutoff_date = '2026-01-01'
    
    # Try by UHID from screenshot: D66365
    patient = db.query(Patient).filter(Patient.patient_u_id == 'D66365').first()
    
    if not patient:
        print("Patient not found by UHID. Trying name...")
        patient = db.query(Patient).filter(Patient.full_name.ilike('%Reena Lalit Yadav%')).first()
        
    if patient:
        print(f"Found Patient: {patient.full_name} (ID: {patient.patient_id})")
        print(f"UHID: {patient.patient_u_id} | MRD: {patient.mrd_number}")
        
        files = db.query(PDFFile).filter(PDFFile.patient_id == patient.patient_id).all()
        print(f"Found {len(files)} files:")
        for f in files:
            print(f"  FileID: {f.file_id}")
            print(f"  Filename: {f.filename}")
            print(f"  S3 Key: {f.s3_key}")
            print(f"  Status: {f.upload_status}")
            print(f"  Upload Date: {f.upload_date}")
            print("-" * 20)
    else:
        print("Patient not found.")
        
    db.close()

if __name__ == "__main__":
    debug_patient()
