import os
import sys
from dotenv import load_dotenv

sys.path.append(os.getcwd())

# Explicitly load .env from current directory
env_path = os.path.join(os.getcwd(), '.env')
print(f"Loading .env from: {env_path}", flush=True)
load_dotenv(env_path)

from app.models import PDFFile
from app.database import SessionLocal

def fix_pending_files():
    print("Connecting to DB...", flush=True)
    db = SessionLocal()
    ids_to_fix = [434, 514]
    
    print(f"🔧 Attempting to fix files: {ids_to_fix}", flush=True)
    
    files = db.query(PDFFile).filter(PDFFile.file_id.in_(ids_to_fix)).all()
    
    if not files:
        print("✅ No pending files found with these IDs.", flush=True)
        return

    for f in files:
        print(f"🗑️  Deleting Corrupt Record -> ID: {f.file_id}, Name: {f.filename}, Status: {f.upload_status}, Key: {f.s3_key}", flush=True)
        db.delete(f)
    
    try:
        db.commit()
        print("✅ Commit Successful. Records deleted.", flush=True)
    except Exception as e:
        print(f"❌ Commit Failed: {e}", flush=True)
        db.rollback()

if __name__ == "__main__":
    fix_pending_files()
