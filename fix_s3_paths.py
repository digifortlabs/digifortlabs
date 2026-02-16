import sys
import os
import boto3

# Ensure we can import from app
sys.path.append(os.getcwd())
try:
    from app.database import SessionLocal
    from app.models import PDFFile
    from app.core.config import settings
except ImportError:
    sys.path.append(os.path.join(os.getcwd(), '..'))
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    from app.database import SessionLocal
    from app.models import PDFFile
    from app.core.config import settings

def fix_paths():
    print("🚀 Starting S3 Path Fixer...")
    db = SessionLocal()
    
    # 1. Get Candidate Broken Files
    # Logic: Status is 'confirmed' BUT key starts with 'drafts/'
    candidates = db.query(PDFFile).filter(
        PDFFile.upload_status == 'confirmed',
        PDFFile.s3_key.like('drafts/%')
    ).all()
    
    print(f"📋 Found {len(candidates)} candidate files with stale 'drafts/' paths.")
    
    if not candidates:
        print("✅ No fixes needed.")
        return

    # 2. Build S3 Index (Map filename -> full_key)
    print("📡 Scanning S3 Bucket for actual locations...")
    s3 = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    )
    
    s3_map = {}
    paginator = s3.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=settings.AWS_BUCKET_NAME)
    
    count = 0
    for page in pages:
        if 'Contents' in page:
            for obj in page['Contents']:
                key = obj['Key']
                # We only care if it's NOT in drafts (the destination)
                if not key.startswith('drafts/') and not key.startswith('draft/'):
                    basename = os.path.basename(key)
                    s3_map[basename] = key
                    count += 1
    
    print(f"indexed {count} files from permanent storage.")

    # 3. Match and Update
    updated_count = 0
    not_found_count = 0
    
    for f in candidates:
        basename = os.path.basename(f.s3_key)
        
        if basename in s3_map:
            new_key = s3_map[basename]
            print(f"✅ FIXING ID {f.file_id}:")
            print(f"   OLD: {f.s3_key}")
            print(f"   NEW: {new_key}")
            
            f.s3_key = new_key
            updated_count += 1
        else:
            print(f"❌ COULD NOT FIND ACTUAL FILE FOR ID {f.file_id} ({basename})")
            not_found_count += 1

    # 4. Commit
    if updated_count > 0:
        confirm = input(f"\n💡 About to update {updated_count} records. Type 'yes' to commit: ")
        if confirm.lower() == 'yes':
            db.commit()
            print("💾 Database Updated Successfully!")
        else:
            print("🚫 Operation Cancelled.")
    else:
        print("⚠️ No matches found to update.")

    db.close()

if __name__ == "__main__":
    fix_paths()
