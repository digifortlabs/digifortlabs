"""
S3 Draft Cleanup Script
Moves confirmed files from draft/ and draft_backup/ to final storage
and cleans up orphaned draft files.
"""

import boto3
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
import sys
from datetime import datetime

# Add parent directory to path to import app modules
script_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.join(script_dir, '..', '..')
sys.path.insert(0, app_dir)

from app.core.config import settings

# Database connection
DATABASE_URL = settings.DATABASE_URL
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# S3 connection
s3_client = boto3.client(
    's3',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)

BUCKET_NAME = settings.AWS_BUCKET_NAME

def get_all_confirmed_file_ids():
    """Get all file IDs that have been confirmed (not in drafts table)."""
    db = SessionLocal()
    try:
        # Get all file IDs from the main pdf_files table (confirmed files)
        result = db.execute(text("SELECT file_id, s3_key FROM pdf_files WHERE upload_status = 'confirmed'"))
        confirmed_files = {row[0]: row[1] for row in result.fetchall()}
        return confirmed_files
    finally:
        db.close()

def list_s3_objects(prefix):
    """List all objects in S3 with given prefix."""
    objects = []
    paginator = s3_client.get_paginator('list_objects_v2')
    
    for page in paginator.paginate(Bucket=BUCKET_NAME, Prefix=prefix):
        if 'Contents' in page:
            objects.extend(page['Contents'])
    
    return objects

def move_s3_object(source_key, dest_key):
    """Move an object from source to destination in S3."""
    try:
        # Copy object
        s3_client.copy_object(
            Bucket=BUCKET_NAME,
            CopySource={'Bucket': BUCKET_NAME, 'Key': source_key},
            Key=dest_key
        )
        # Delete original
        s3_client.delete_object(Bucket=BUCKET_NAME, Key=source_key)
        return True
    except Exception as e:
        print(f"❌ Error moving {source_key}: {e}")
        return False

def delete_s3_object(key):
    """Delete an object from S3."""
    try:
        s3_client.delete_object(Bucket=BUCKET_NAME, Key=key)
        return True
    except Exception as e:
        print(f"❌ Error deleting {key}: {e}")
        return False


from app.models import PDFFile
from app.services.storage_service import StorageService

def force_confirm_pending_drafts():
    """Found all files stuck in 'draft' status in DB and move them to final storage."""
    print("\\n🚀 FORCE CONFIRM: Checking for pending drafts in database...")
    db = SessionLocal()
    try:
        # Find all files marked as draft
        drafts = db.query(PDFFile).filter(PDFFile.upload_status == 'draft').all()
        print(f"📄 Found {len(drafts)} files in 'draft' status.")
        
        success_count = 0
        fail_count = 0
        
        for file in drafts:
            print(f"   🔄 Migrating File ID {file.file_id} (Key: {file.s3_key})...")
            
            # Use StorageService to migrate
            # We use migrate_s3_draft_to_final which handles S3 move + DB update
            success, msg = StorageService.migrate_s3_draft_to_final(db, file.file_id)
            
            if success:
                print(f"      ✅ Success: {msg}")
                success_count += 1
            else:
                print(f"      ❌ Failed: {msg}")
                # If it failed because "Not a draft file" but status is draft, 
                # check if it already exists in final location or handle gracefully
                fail_count += 1
                
        print(f"🏁 Force Confirm Complete: {success_count} migrated, {fail_count} failed.\\n")
        
    except Exception as e:
        print(f"❌ Error in force confirm: {e}")
    finally:
        db.close()

def cleanup_drafts():
    """Main cleanup function."""
    print("🔍 Starting S3 draft cleanup...")
    print(f"📦 Bucket: {BUCKET_NAME}")
    
    # 1. Force Confirm Pending Drafts
    force_confirm_pending_drafts()
    
    # Get confirmed files from database
    print("\\n📊 Fetching confirmed files from database...")
    confirmed_files = get_all_confirmed_file_ids()
    print(f"✅ Found {len(confirmed_files)} confirmed files in database")
    
    # Check draft folders (including nested variations)
    draft_folders = [
        'draft/',
        'draft_backup/',
        'drafts/',
        'drafts_backup/',
        'drafts_backup/drafts/'  # Nested structure found in actual bucket
    ]
    total_moved = 0
    total_deleted = 0
    total_size_freed = 0
    
    for folder in draft_folders:
        print(f"\\n🔍 Checking {folder}...")
        objects = list_s3_objects(folder)
        print(f"📁 Found {len(objects)} objects in {folder}")
        
    for folder in draft_folders:
        print(f"\n🔍 Checking {folder}...")
        objects = list_s3_objects(folder)
        print(f"📁 Found {len(objects)} objects in {folder}")
        
        for obj in objects:
            key = obj['Key']
            size = obj['Size']
            
            # Skip if it's just the folder itself
            if key.endswith('/'):
                continue
            
            # Extract file_id from the key (assuming format: draft/hospital_X/file_Y.ext)
            try:
                # Try to find if this file exists in confirmed files
                file_id_str = key.split('file_')[1].split('.')[0] if 'file_' in key else None
                
                if file_id_str and int(file_id_str) in confirmed_files:
                    # This file has been confirmed, should be in final storage
                    final_key = confirmed_files[int(file_id_str)]
                    
                    # Check if final file exists
                    try:
                        s3_client.head_object(Bucket=BUCKET_NAME, Key=final_key)
                        # Final file exists, safe to delete draft
                        print(f"🗑️  Deleting draft (exists in final): {key}")
                        if delete_s3_object(key):
                            total_deleted += 1
                            total_size_freed += size
                    except:
                        # Final file doesn't exist, move it
                        print(f"📦 Moving to final storage: {key} -> {final_key}")
                        if move_s3_object(key, final_key):
                            total_moved += 1
                            total_size_freed += size
                else:
                    # Orphaned draft file (no database record)
                    # RECOVER IT regardless of age
                    print(f"⚠️  Orphan found (No DB Record): {key}")
                    
                    # Attempt to extract Hospital Name to give it a home
                    # Keys are usually: drafts_backup/drafts/Hospital_Name/...
                    parts = key.split('/')
                    # [drafts_backup, drafts, Hospital_Name, file.enc]
                    
                    hospital_folder = "Recovered_Unknown"
                    filename = parts[-1]
                    
                    # Try to find the hospital part
                    for p in parts:
                        if "Hospital" in p or "hospital" in p or "Center" in p or "Clinic" in p:
                            hospital_folder = p
                            break
                    # If looking at typical structure: 
                    if len(parts) >= 3 and parts[-2] != "drafts" and parts[-2] != "draft":
                         hospital_folder = parts[-2]

                    # Construct Recovery Path
                    recovery_key = f"{hospital_folder}/Recovered_Drafts/{filename}"
                    
                    print(f"🚑 Recovering to: {recovery_key}")
                    if move_s3_object(key, recovery_key):
                         total_moved += 1
                         total_size_freed += size
                        
            except Exception as e:
                print(f"⚠️  Skipping {key}: {e}")
    
    # Summary
    print("\n" + "="*60)
    print("✅ CLEANUP & RECOVERY SUMMARY")
    print("="*60)
    print(f"📦 Files moved/recovered: {total_moved}")
    print(f"🗑️  Files deleted: {total_deleted}")
    print(f"💾 Space freed: {total_size_freed / (1024**3):.2f} GB")
    print("="*60)

if __name__ == "__main__":
    cleanup_drafts()
