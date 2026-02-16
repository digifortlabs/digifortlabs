import sys
import os

# Ensure we can import from app
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models import PDFFile, Patient
from app.services.s3_handler import S3Manager

def audit():
    db = SessionLocal()
    s3 = S3Manager()
    
    print("\n" + "="*50)
    print("🔍 AUDITING DATABASE vs S3")
    print("="*50)
    
    files = db.query(PDFFile).all()
    print(f"📂 Total DB Records: {len(files)}")
    
    missing_count = 0
    found_count = 0
    
    # Specific check for ID 120
    target_120 = None

    for f in files:
        if f.file_id == 120:
            target_120 = f

        if not f.s3_key:
            print(f"⚠️  [NO KEY] ID: {f.file_id} | Name: {f.filename} | Status: {f.upload_status}")
            continue
            
        # Check S3
        # S3Manager might not have a simple 'exists' boolean method exposed in all versions, 
        # so we use get_object_info which returns None if missing.
        info = s3.get_object_info(f.s3_key)
        
        if not info:
             print(f"❌ [MISSING] ID: {f.file_id} | Key: {f.s3_key} | Name: {f.filename}")
             missing_count += 1
        else:
             found_count += 1
             # Optional: verify size match?
             # s3_size = info.get('ContentLength', 0)
             # if s3_size < 100: print(f"   [WARN] Tiny file size: {s3_size} bytes")

    print("-" * 50)
    print(f"✅ Found in S3: {found_count}")
    print(f"❌ Missing in S3: {missing_count}")
    
    if target_120:
        print("\n🔎 FILE 120 DETAILS:")
        print(f"   - Filename: {target_120.filename}")
        print(f"   - S3 Key: {target_120.s3_key}")
        print(f"   - DB Status: {target_120.upload_status}")
        info = s3.get_object_info(target_120.s3_key)
        if info:
            print(f"   - S3 Status: FOUND ✅ ")
            print(f"   - S3 Info: {info}")
        else:
            print(f"   - S3 Status: NOT FOUND ❌")
            # Try to guess where it might be (e.g. drafts/ folder mismatch)
            # Common issue: key is 'drafts/Hospital/...' but physical is 'draft/Hospital/...'
            alternatives = [
                target_120.s3_key.replace("drafts/", "draft/"),
                "draft/" + target_120.s3_key,
                "drafts/" + target_120.filename # if simple path
            ]
            for alt in alternatives:
                if s3.get_object_info(alt):
                     print(f"   - 💡 FOUND AT ALTERNATIVE PATH: {alt}")
    else:
        print("\n🔎 FILE 120 NOT FOUND IN DATABASE ❌")

    print("="*50 + "\n")
    db.close()

if __name__ == "__main__":
    audit()
