from app.database import SessionLocal
from app.models import PDFFile, Patient

db = SessionLocal()

drafts = db.query(PDFFile).filter(PDFFile.upload_status == 'draft').all()
print(f"Total Drafts: {len(drafts)}")
print("ID | Filename | RecordID | Patient Name | Hospital ID")
print("-" * 60)
for f in drafts:
    p_name = f.patient.full_name if f.patient else "No Patient"
    p_id = f.record_id
    h_id = f.patient.hospital_id if f.patient else "N/A"
    print(f"{f.file_id:3} | {f.filename:12} | {p_id:8} | {p_name:25} | {h_id}")

db.close()
