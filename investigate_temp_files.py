import os
import sys
from dotenv import load_dotenv

sys.path.append(os.getcwd())
# Explicitly load .env
env_path = os.path.join(os.getcwd(), '.env')
load_dotenv(env_path)

from app.models import PDFFile
from app.database import SessionLocal

def investigate_temp_paths():
    print("Connecting to DB...", flush=True)
    db = SessionLocal()
    
    # 1. Check Bad Files
    print("🔍 Searching for BAD files with '/tmp/' in file_path...", flush=True)
    bad_files = db.query(PDFFile).filter(
        PDFFile.upload_status == 'confirmed',
        PDFFile.file_path.like('/tmp/%')
    ).limit(5).all()
    
    print(f"📊 Found BAD files: {len(bad_files)} (showing up to 5)", flush=True)
    for f in bad_files:
        print(f"[BAD] ID: {f.file_id}, Path: {f.file_path}, Storage: {f.storage_path}, Key: {f.s3_key}", flush=True)

    # 2. Check Good Files
    print("\n🔍 Searching for GOOD files (NOT '/tmp/')...", flush=True)
    good_files = db.query(PDFFile).filter(
        PDFFile.upload_status == 'confirmed',
        ~PDFFile.file_path.like('/tmp/%')
    ).limit(5).all()
    
    print(f"📊 Found GOOD files: {len(good_files)} (showing up to 5)", flush=True)
    for f in good_files:
        print(f"[GOOD] ID: {f.file_id}, Path: {f.file_path}, Storage: {f.storage_path}, Key: {f.s3_key}", flush=True)

if __name__ == "__main__":
    investigate_temp_paths()
