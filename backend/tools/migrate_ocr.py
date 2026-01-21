
import os
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import PDFFile
from app.services.ocr import classify_document, extract_text_from_pdf
from app.services.encryption import decrypt_data
# from app.services.storage_service import StorageService # Not needed if we use S3Manager directly

def migrate_ocr():
    db = SessionLocal()
    print("--- Starting OCR Migration ---")
    
    # 1. Find candidates (Confirmed uploads with no OCR text)
    files = db.query(PDFFile).filter(
        PDFFile.upload_status == 'confirmed',
        (PDFFile.ocr_text == None) | (PDFFile.ocr_text == "")
    ).all()
    
    print(f"Found {len(files)} files needing OCR.")
    
    try:
        from app.services.s3_handler import S3Manager
        s3_manager = S3Manager()
    except ImportError:
        s3_manager = None
        print("[WARN] S3Manager not found. S3 files will be skipped.")

    for f in files:
        print(f"Processing ID {f.file_id}: {f.filename}...")
        try:
            file_bytes = None
            local_path = os.path.join("d:\\Website\\DIGIFORTLABS\\backend\\uploads", f.filename)

            # OPTION 1: S3
            if f.s3_key and s3_manager and s3_manager.mode == 's3':
                print(f"  - Downloading from S3: {f.s3_key}")
                try:
                    # S3Manager usually has get_file_bytes
                    file_bytes = s3_manager.get_file_bytes(f.s3_key)
                except Exception as s3e:
                     print(f"    [WARN] S3 Download Failed: {s3e}")

            # OPTION 2: Local File (Fallback or Primary)
            if not file_bytes and os.path.exists(local_path):
                 print(f"  - Reading local file: {local_path}")
                 with open(local_path, "rb") as f_obj:
                     file_bytes = f_obj.read()
            
            if file_bytes:
                 # DECRYPT FIRST
                 try:
                     decrypted_bytes = decrypt_data(file_bytes)
                 except Exception as dec_err:
                     print(f"  - [WARN] Decryption failed (maybe not encrypted?): {dec_err}")
                     # Try processing as is if decryption fails (fallback for unencrypted legacy files)
                     decrypted_bytes = file_bytes

                 text = extract_text_from_pdf(decrypted_bytes)
                 f.ocr_text = text
                 
                 # Auto-tag
                 tags = classify_document(text)
                 f.tags = ",".join(tags) if tags else None
                 
                 print(f"  - [OK] Extracted {len(text)} chars. Tags: {f.tags}")
                 db.commit()
            else:
                 print(f"  - [SKIP] File content not found (S3 download failed or local file missing).")
                 
        except Exception as e:
            print(f"  - [ERROR] Failed: {e}")
            db.rollback()
            
    print("--- Migration Complete ---")
    db.close()

if __name__ == "__main__":
    migrate_ocr()
