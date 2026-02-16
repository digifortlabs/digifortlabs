import sys
import os
from sqlalchemy.orm import joinedload

# Setup path
sys.path.append(os.getcwd())
try:
    from app.database import SessionLocal
    from app.models import Patient, Hospital, PDFFile
except ImportError:
    sys.path.append(os.path.join(os.getcwd(), '..'))
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    from app.database import SessionLocal
    from app.models import Patient, Hospital, PDFFile

def list_candidates():
    db = SessionLocal()
    
    # 1. Find Dixit Hospital
    hospital = db.query(Hospital).filter(Hospital.legal_name.ilike("%Dixit%")).first()
    if not hospital:
        print("❌ Dixit Hospital not found")
        return

    print(f"🏥 Hospital: {hospital.legal_name} (ID: {hospital.hospital_id})")
    
    # 2. Query Candidates
    # Patients created or discharged in Jan 2026
    # AND having NO files
    
    start_date = "2026-01-01"
    
    # We want patients who DO NOT have any associated file in PDFFile
    # (since we deleted them)
    
    candidates = db.query(Patient).outerjoin(PDFFile).filter(
        Patient.hospital_id == hospital.hospital_id,
        PDFFile.file_id == None, # Left join + is null = no files
        # Filter by date range (broadly Jan 2026)
        (Patient.discharge_date >= start_date) | (Patient.created_at >= start_date)
    ).all()
    
    print("\n📋 POTENTIAL RE-UPLOAD LIST (Patients with no files since Jan 2026)")
    print(f"Found: {len(candidates)} patients")
    print("-" * 80)
    print(f"{'MRD No':<15} | {'Patient Name':<30} | {'Discharge Date':<15} | {'Admission Date':<15}")
    print("-" * 80)
    
    count = 0
    for p in candidates:
        d_date = p.discharge_date.strftime("%Y-%m-%d") if p.discharge_date else "N/A"
        a_date = p.admission_date.strftime("%Y-%m-%d") if p.admission_date else "N/A"
        print(f"{p.patient_u_id:<15} | {p.full_name[:28]:<30} | {d_date:<15} | {a_date:<15}")
        count += 1
        
    print("-" * 80)
    db.close()

if __name__ == "__main__":
    list_candidates()
