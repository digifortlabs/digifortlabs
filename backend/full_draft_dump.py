from app.database import SessionLocal
from app.models import PDFFile, Patient

db = SessionLocal()

print("--- FULL DRAFT DUMP ---")
drafts = db.query(PDFFile).filter(PDFFile.upload_status == 'draft').order_by(PDFFile.file_id.desc()).all()

for f in drafts:
    p = f.patient
    p_name = p.full_name if p else "No Patient"
    p_id = f.record_id
    print(f"FileID: {f.file_id} | RecordID: {p_id} | Name: {p_name} | Date: {f.upload_date}")

db.close()
