
from app.database import SessionLocal
from app.models import PDFFile, Patient

db = SessionLocal()
files = db.query(PDFFile).order_by(PDFFile.file_id.desc()).limit(10).all()

print(f"{'ID':<5} {'Filename':<30} {'Size':<10} {'Status':<12} {'PatientID':<10}")
print("-" * 75)
for f in files:
    print(f"{f.file_id:<5} {f.filename[:28]:<30} {f.file_size:<10} {f.upload_status:<12} {f.record_id:<10}")

db.close()
