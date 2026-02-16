import os
import sys
from dotenv import load_dotenv

sys.path.append(os.getcwd())
load_dotenv()

from app.models import PDFFile, Patient
from app.database import SessionLocal

def check_files():
    db = SessionLocal()
    ids = [434, 514]
    print(f"🔍 Checking Files: {ids}")
    
    files = db.query(PDFFile).filter(PDFFile.file_id.in_(ids)).all()
    for f in files:
        print(f"--- File {f.file_id} ---")
        print(f"Filename: {f.filename}")
        print(f"Status: {f.upload_status}")
        print(f"S3 Key: {f.s3_key}")
        print(f"Storage Path: {f.storage_path}")
        print(f"Upload Date: {f.upload_date}")
        print(f"Patient: {f.patient.full_name if f.patient else 'None'}")
        print(f"Deletion Pending? {f.is_deletion_pending}")

if __name__ == "__main__":
    check_files()
