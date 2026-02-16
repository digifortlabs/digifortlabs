import os
import sys
from dotenv import load_dotenv

sys.path.append(os.getcwd())
# Explicitly load .env
env_path = os.path.join(os.getcwd(), '.env')
load_dotenv(env_path)

from app.models import PDFFile
from app.database import SessionLocal

def verify_fix():
    print("Connecting to DB...", flush=True)
    db = SessionLocal()
    
    count = db.query(PDFFile).filter(
        PDFFile.upload_status == 'confirmed',
        PDFFile.file_path.like('/tmp/%')
    ).count()
    
    print(f"📊 Remaining files with /tmp/ path: {count}", flush=True)

if __name__ == "__main__":
    verify_fix()
