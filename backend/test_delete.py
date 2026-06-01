import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Patient
from sqlalchemy import text

db = SessionLocal()
try:
    patient = db.query(Patient).filter(Patient.full_name == 'Anita').first()
    if not patient:
        print("Patient Anita not found")
        sys.exit(0)
    patient_id = patient.record_id
    print(f"Attempting to delete patient {patient_id}...")
    
    # Simulate the manual cascade
    tables_to_nullify = {
        "operation_theaters": "current_patient_id",
        "medical_equipments": "current_patient_id",
        "rfid_cards": "patient_id"
    }
    for t, col in tables_to_nullify.items():
        db.execute(text(f"UPDATE {t} SET {col} = NULL WHERE {col} = :pid"), {"pid": patient_id})
        
    tables_to_delete = {
        "pdf_files": "record_id",
        "patient_diagnoses": "record_id",
        "patient_procedures": "record_id",
        "dental_patients": "main_patient_id",
        "dental_appointments": "patient_id",
        "dental_3d_scans": "patient_id",
        "dental_treatment_plans": "patient_id",
        "periodontal_exams": "patient_id",
        "ortho_records": "patient_id",
        "communication_logs": "patient_id",
        "ent_patients": "patient_id",
        "audiometry_tests": "patient_id",
        "ent_examinations": "patient_id",
        "ent_surgeries": "patient_id",
        "opd_patients": "patient_id",
        "opd_visits": "patient_id",
        "appointments": "patient_id",
        "insurance_claims": "patient_id",
        "dental_lab_orders": "patient_id",
        "ipd_admissions": "patient_id",
        "dental_treatments": "patient_id",
        "patient_invoices": "patient_id",
        "patient_doctor_assignments": "patient_id",
        "qa_issues": "record_id",
        "emergency_visits": "patient_id"
    }
    for t, col in tables_to_delete.items():
        print(f"Deleting from {t}...")
        db.execute(text(f"DELETE FROM {t} WHERE {col} = :pid"), {"pid": patient_id})
        
    patient = db.query(Patient).filter(Patient.record_id == patient_id).first()
    if patient:
        print("Deleting patient...")
        db.delete(patient)
    db.commit()
    print("Delete successful!")
except Exception as e:
    db.rollback()
    import traceback
    print("DELETE FAILED:")
    print(e)
finally:
    db.close()
