"""
S3 Orphaned File Cleanup Script
Scans the S3 bucket and deletes files that do not have a corresponding record in the database.
"""

import boto3
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
import sys
import argparse

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

def get_valid_s3_keys():
    """Fetch all valid S3 keys from the database."""
    db = SessionLocal()
    try:
        print("📊 Fetching valid file records from database...")
        # Get all s3_key values from pdf_files table
        result = db.execute(text("SELECT s3_key FROM pdf_files WHERE s3_key IS NOT NULL"))
        valid_keys = {row[0] for row in result.fetchall()}
        return valid_keys
    finally:
        db.close()

def list_all_s3_objects():
    """List all objects in the S3 bucket."""
    print(f"☁️  Listing objects in S3 Bucket: {BUCKET_NAME}...")
    objects = []
    paginator = s3_client.get_paginator('list_objects_v2')
    
    for page in paginator.paginate(Bucket=BUCKET_NAME):
        if 'Contents' in page:
            objects.extend(page['Contents'])
    
    return objects

def cleanup_orphans(dry_run=True):
    print("="*60)
    print("🧹 S3 ORPHANED FILE CLEANUP")
    print("="*60)
    
    if dry_run:
        print("⚠️  DRY RUN MODE: No files will be deleted.")
    else:
        print("🚨 LIVE MODE: Orphaned files WILL BE PERMANENTLY DELETED.")
    print("-" * 60)

    # 1. Get Valid Keys
    valid_keys = get_valid_s3_keys()
    print(f"✅ Found {len(valid_keys)} valid files in database.")

    # 2. Get All S3 Objects
    s3_objects = list_all_s3_objects()
    print(f"📦 Found {len(s3_objects)} total objects in S3.")

    orphans = []
    total_orphan_size = 0
    
    # 3. Compare
    print("\n🔍 Scanning for orphans...")
    for obj in s3_objects:
        key = obj['Key']
        
        # Skip folders
        if key.endswith('/'):
            continue
            
        if key not in valid_keys:
            # It's an orphan!
            orphans.append(key)
            total_orphan_size += obj['Size']
            if dry_run:
                print(f"   [ORPHAN] {key} ({obj['Size'] / 1024:.2f} KB)")

    print("-" * 60)
    print(f"found {len(orphans)} orphaned files.")
    print(f"Total cleanup size: {total_orphan_size / (1024*1024):.2f} MB")
    
    if len(orphans) == 0:
        print("\n✨ System is clean. No orphans found.")
        return

    if dry_run:
        print("\n⚠️  Run with --delete to perform actual deletion.")
    else:
        print(f"\n🗑️  Deleting {len(orphans)} orphaned files...")
        deleted_count = 0
        for key in orphans:
            try:
                s3_client.delete_object(Bucket=BUCKET_NAME, Key=key)
                print(f"   Deleted: {key}")
                deleted_count += 1
            except Exception as e:
                print(f"   ❌ Error deleting {key}: {e}")
        
        print(f"\n✅ Cleanup Complete. Deleted {deleted_count} files.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Clean up orphaned S3 files.")
    parser.add_argument("--delete", action="store_true", help="Perform actual deletion (default is dry-run)")
    args = parser.parse_args()
    
    cleanup_orphans(dry_run=not args.delete)
