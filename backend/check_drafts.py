from app.database import SessionLocal
from app.models import PDFFile, Patient

db = SessionLocal()
drafts = db.query(PDFFile).filter(PDFFile.upload_status == 'draft').all()
print(f"Total drafts found: {len(drafts)}")
for d in drafts:
    print(f"File ID: {d.file_id}, Filename: {d.filename}, Patient ID: {d.record_id}, Status: {d.upload_status}")
    if d.patient:
        print(f"  Patient: {d.patient.full_name}, Hospital ID: {d.patient.hospital_id}")
    else:
        print("  Patient NOT FOUND")

all_statuses = db.query(PDFFile.upload_status).distinct().all()
print(f"All available statuses: {all_statuses}")

db.close()
