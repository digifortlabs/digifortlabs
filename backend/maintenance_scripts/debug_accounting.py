
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from app.models import Hospital, PDFFile, Patient, InvoiceItem
from app.database import Base

# Setup DB connection (assuming local sqlite or similar from env, but adapting to likely context)
# I will try to import get_db logic or just plain connection string if visible.
# Checking config/database.py first might be needed, but I'll guess the url or use the app's internal logic if I can run it via python.
# Actually, I can just use the existing app code context if I run this as a script in the backend dir.

import sys
import os

# Add backend to sys.path
sys.path.append(os.getcwd())

from app.database import SessionLocal

db = SessionLocal()

def analyze_hospital(name_part):
    hospital = db.query(Hospital).filter(Hospital.legal_name.ilike(f"%{name_part}%")).first()
    if not hospital:
        print(f"Hospital matching '{name_part}' not found.")
        return

    print(f"--- Analyzing Hospital: {hospital.legal_name} (ID: {hospital.hospital_id}) ---")

    # 1. Total Files linked to patients of this hospital
    total_files = db.query(PDFFile).join(Patient).filter(Patient.hospital_id == hospital.hospital_id).count()
    print(f"Total Files found: {total_files}")

    # 2. Breakdown by Processing Stage
    print("\n[Processing Stage Breakdown - ALL]")
    stages = db.query(PDFFile.processing_stage, func.count(PDFFile.file_id))\
        .join(Patient).filter(Patient.hospital_id == hospital.hospital_id)\
        .group_by(PDFFile.processing_stage).all()
    
    for stage, count in stages:
        print(f" - {stage}: {count}")

    # 3. Breakdown by Upload Status
    print("\n[Upload Status Breakdown - ALL]")
    statuses = db.query(PDFFile.upload_status, func.count(PDFFile.file_id))\
        .join(Patient).filter(Patient.hospital_id == hospital.hospital_id)\
        .group_by(PDFFile.upload_status).all()
        
    for status, count in statuses:
        print(f" - {status}: {count}")

    # 4. Check Billed Status
    billed_file_ids = db.query(InvoiceItem.file_id).filter(InvoiceItem.file_id.isnot(None)).subquery()
    
    billed_count = db.query(PDFFile).join(Patient).filter(
        Patient.hospital_id == hospital.hospital_id,
        PDFFile.file_id.in_(billed_file_ids)
    ).count()
    
    unbilled_count = db.query(PDFFile).join(Patient).filter(
        Patient.hospital_id == hospital.hospital_id,
        ~PDFFile.file_id.in_(billed_file_ids)
    ).count()

    print(f"\n[Billing Status]")
    print(f" - Already Billed (in Invoice Items): {billed_count}")
    print(f" - Unbilled (Potential): {unbilled_count}")

    # 5. The Query match (Unbilled + Completed)
    ready_to_bill = db.query(PDFFile).join(Patient).filter(
        Patient.hospital_id == hospital.hospital_id,
        PDFFile.processing_stage == 'completed',
        ~PDFFile.file_id.in_(billed_file_ids)
    ).count()
    
    print(f"\n[Ready to Bill (API Logic)]")
    print(f" - processing_stage='completed' AND not billed: {ready_to_bill}")

    # 6. Check Page Counts for 'analyzing'
    analyzing_files = db.query(PDFFile).join(Patient).filter(
        Patient.hospital_id == hospital.hospital_id,
        PDFFile.processing_stage == 'analyzing'
    ).all()
    
    zero_pages = sum(1 for f in analyzing_files if (f.page_count or 0) == 0)
    valid_pages = sum(1 for f in analyzing_files if (f.page_count or 0) > 0)
    
    print(f"\n[Analyzing Files Data Quality]")
    print(f" - Total Analyzing: {len(analyzing_files)}")
    print(f" - With Page Count > 0: {valid_pages}")
    print(f" - With Page Count = 0: {zero_pages}")

    print("\n--- Global Hospital File Counts ---")
    global_counts = db.query(Hospital.legal_name, func.count(PDFFile.file_id))\
        .join(Patient, Patient.hospital_id == Hospital.hospital_id)\
        .join(PDFFile, PDFFile.record_id == Patient.record_id)\
        .group_by(Hospital.legal_name).all()
        
    for name, count in global_counts:
        print(f" - {name}: {count}")
        
    # Check for Orphaned Files (No Patient or No Hospital)
    orphaned_files = db.query(PDFFile).filter(PDFFile.record_id == None).count()
    print(f"\n - Orphaned Files (No Patient Linked): {orphaned_files}")

    print("\n--- Patients Analysis ---")
    total_patients = db.query(Patient).filter(Patient.hospital_id == hospital.hospital_id).count()
    patients_with_files = db.query(Patient.record_id).join(PDFFile).filter(Patient.hospital_id == hospital.hospital_id).distinct().count()
    print(f"Total Patients: {total_patients}")
    print(f"Patients with Files: {patients_with_files}")
    print(f"Patients WITHOUT Files: {total_patients - patients_with_files}")

    print("\n--- Sample Patients WITHOUT Files (First 10) ---")
    # Subquery for patients with files
    patients_with_files_subquery = db.query(Patient.record_id).join(PDFFile).filter(Patient.hospital_id == hospital.hospital_id).subquery()
    
    missing_files_patients = db.query(Patient).filter(
        Patient.hospital_id == hospital.hospital_id,
        not_(Patient.record_id.in_(patients_with_files_subquery))
    ).limit(10).all()
    
    for p in missing_files_patients:
        print(f" - {p.full_name} (MRD: {p.patient_u_id})")

if __name__ == "__main__":
    analyze_hospital("Dixit")
