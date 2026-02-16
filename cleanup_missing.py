import sys
import os
sys.path.append(os.getcwd())
try:
    from app.database import SessionLocal
    from app.models import PDFFile
    from app.services.s3_handler import S3Manager
except ImportError:
    sys.path.append(os.path.join(os.getcwd(), '..'))
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    from app.database import SessionLocal
    from app.models import PDFFile
    from app.services.s3_handler import S3Manager

def cleanup():
    db = SessionLocal()
    s3 = S3Manager()
    
    # IDs from audit_s3.py output
    missing_ids = [
        109, 110, 111, 112, 113, 114, 
        115, 116, 117, 119, 120, 121, 122, 123, 226, 227, 228, 229, 230, 231, 
        233, 234, 235, 236, 237, 238, 240, 241, 242, 243, 244, 245, 246, 247, 
        248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259
    ]
    
    deleted_count = 0
    
    print(f"🧹 Scanning for {len(missing_ids)} ID candidates...")
    
    for fid in missing_ids:
        # Check if record exists
        f = db.query(PDFFile).filter(PDFFile.file_id == fid).first()
        if f:
            # DOUBLE CHECK: Does it exist in S3? (Safety Check)
            if f.s3_key:
                info = s3.get_object_info(f.s3_key)
                if info:
                    print(f"⚠️ SKIPPING DELETION for ID {fid}: File actually exists in S3! Key: {f.s3_key}")
                    continue
            
            # File is missing -> confirm deletion
            print(f"DEL: ID {fid} | {f.filename} | Status: {f.upload_status}")
            db.delete(f)
            deleted_count += 1
    
    if deleted_count > 0:
        db.commit()
        print(f"✅ Successfully deleted {deleted_count} missing file records.")
    else:
        print("ℹ️ No records deleted.")

    db.close()

if __name__ == "__main__":
    cleanup()
