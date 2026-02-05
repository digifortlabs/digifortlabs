from app.database import SessionLocal
from app.models import PDFFile, Patient

db = SessionLocal()

print("--- ANALYZING DRAFTS FOR HOSPITAL 1 ---")
# Join with Patient to be sure
drafts = db.query(PDFFile).join(Patient).filter(
    PDFFile.upload_status == 'draft',
    Patient.hospital_id == 1
).order_by(PDFFile.upload_date.desc()).all()

print(f"Total drafts found for Hosp 1: {len(drafts)}")
for d in drafts:
    print(f"FileID: {d.file_id} | Date: {d.upload_date} | Patient: {d.patient.full_name} ({d.record_id})")

db.close()
