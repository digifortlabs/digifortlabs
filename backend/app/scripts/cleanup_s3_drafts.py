"""
S3 Draft Cleanup Script
Moves confirmed files from draft/ and draft_backup/ to final storage
and cleans up orphaned draft files.
"""

import boto3
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from datetime import datetime

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# S3 connection
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "ap-south-1")
)

BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

def get_all_confirmed_file_ids():
    """Get all file IDs that have been confirmed (not in drafts table)."""
    db = SessionLocal()
    try:
        # Get all file IDs from the main files table (confirmed files)
        result = db.execute(text("SELECT file_id, s3_key FROM files"))
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

def cleanup_drafts():
    """Main cleanup function."""
    print("🔍 Starting S3 draft cleanup...")
    print(f"📦 Bucket: {BUCKET_NAME}")
    
    # Get confirmed files from database
    print("\n📊 Fetching confirmed files from database...")
    confirmed_files = get_all_confirmed_file_ids()
    print(f"✅ Found {len(confirmed_files)} confirmed files in database")
    
    # Check draft folders
    draft_folders = ['draft/', 'draft_backup/']
    total_moved = 0
    total_deleted = 0
    total_size_freed = 0
    
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
                    # Check if older than 7 days
                    last_modified = obj['LastModified']
                    age_days = (datetime.now(last_modified.tzinfo) - last_modified).days
                    
                    if age_days > 7:
                        print(f"🗑️  Deleting orphaned draft (>{age_days} days old): {key}")
                        if delete_s3_object(key):
                            total_deleted += 1
                            total_size_freed += size
                    else:
                        print(f"⏳ Keeping recent draft ({age_days} days old): {key}")
                        
            except Exception as e:
                print(f"⚠️  Skipping {key}: {e}")
    
    # Summary
    print("\n" + "="*60)
    print("✅ CLEANUP SUMMARY")
    print("="*60)
    print(f"📦 Files moved to final storage: {total_moved}")
    print(f"🗑️  Files deleted: {total_deleted}")
    print(f"💾 Space freed: {total_size_freed / (1024**3):.2f} GB")
    print("="*60)

if __name__ == "__main__":
    cleanup_drafts()
