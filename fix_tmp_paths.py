import os
import sys
from dotenv import load_dotenv

sys.path.append(os.getcwd())
# Explicitly load .env
env_path = os.path.join(os.getcwd(), '.env')
load_dotenv(env_path)

from app.models import PDFFile
from app.database import SessionLocal

def fix_tmp_paths():
    print("Connecting to DB...", flush=True)
    db = SessionLocal()
    
    # query for confirmed files with /tmp path
    files = db.query(PDFFile).filter(
        PDFFile.upload_status == 'confirmed',
        PDFFile.file_path.like('/tmp/%')
    ).all()
    
    count = len(files)
    print(f"🔧 Found {count} files to fix.", flush=True)
    
    if count == 0:
        return

    updated_count = 0
    for f in files:
        if f.s3_key:
            old_path = f.file_path
            f.file_path = f.s3_key
            updated_count += 1
            # print(f"Fixed ID {f.file_id}: {old_path} -> {f.file_path}", flush=True)
        else:
            print(f"⚠️ Skipping ID {f.file_id}: No S3 Key found!", flush=True)
            
    try:
        db.commit()
        print(f"✅ Successfully updated {updated_count} records.", flush=True)
    except Exception as e:
        print(f"❌ Commit Failed: {e}", flush=True)
        db.rollback()

if __name__ == "__main__":
    fix_tmp_paths()
