from app.database import SessionLocal
from app.models import Patient
import sys

db = SessionLocal()
try:
    patients = db.query(Patient).limit(20).all()
    print(f"Total Patients Checked: {len(patients)}")
    for p in patients:
        print(f"ID: {p.patient_u_id}, Name: {p.full_name}, Cat: '{p.patient_category}', Hospital: {p.hospital_id}, Admission: {p.admission_date}, Discharge: {p.discharge_date}")
finally:
    db.close()
