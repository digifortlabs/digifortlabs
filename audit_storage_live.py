import os
import sys
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.getcwd())

# Explicitly load .env BEFORE importing app modules
load_dotenv()

from sqlalchemy.orm import sessionmaker
from app.models import PDFFile, Patient
from app.services.s3_handler import S3Manager
from app.database import SessionLocal

def audit_storage():
    print("🔍 Starting Storage Audit using S3Manager...")
    
    db = SessionLocal()
    s3_manager = S3Manager()
    
    if s3_manager.mode != "s3":
        print(f"⚠️ App is not configured for S3 mode. Current mode: {s3_manager.mode}")
        return

    print(f"✅ Connected to S3 Bucket: {s3_manager.bucket_name}")

    # 1. Fetch all files from DB
    files = db.query(PDFFile).all()
    print(f"📊 Total Files in DB: {len(files)}")
    
    missing_files = []
    misplaced_files = []
    
    for f in files:
        if not f.s3_key:
            if f.upload_status == 'confirmed':
                print(f"⚠️  Confirmed File {f.file_id} has no S3 key! (Path: {f.storage_path})")
            continue
            
        # Check S3 existence
        info = s3_manager.get_object_info(f.s3_key)
        if not info:
             print(f"❌ MISSING IN S3: File {f.file_id} ({f.filename}) - Key: {f.s3_key}")
             missing_files.append(f)
        else:
            # Optional: Check if file is in correct path structure
            pass
             
    print(f"\n📢 Audit Complete. Total Missing: {len(missing_files)}")
    for mf in missing_files:
        print(f" - ID: {mf.file_id}, Patient: {mf.patient.full_name if mf.patient else 'Unknown'}, Key: {mf.s3_key}")

if __name__ == "__main__":
    audit_storage()
