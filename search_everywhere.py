import sys
import os
import glob

sys.path.append(os.getcwd())
try:
    from app.core.config import settings
except ImportError:
    sys.path.append(os.path.join(os.getcwd(), '..'))
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    from app.core.config import settings

import boto3

def search_everywhere():
    print("--- Searching Everywhere ---")
    
    # 1. Search S3 'drafts/'
    print(f"\n📡 S3 Bucket: {settings.AWS_BUCKET_NAME}")
    s3 = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    )
    
    prefix = "drafts/"
    print(f"Listing objects with prefix: {prefix}")
    
    paginator = s3.get_paginator('list_objects_v2')
    s3_count = 0
    
    try:
        for page in paginator.paginate(Bucket=settings.AWS_BUCKET_NAME, Prefix=prefix):
            if 'Contents' in page:
                for obj in page['Contents']:
                    key = obj['Key']
                    # Filter for our missing IDs/Hashes if possible, or just list 'Dixit'
                    if "Dixit" in key or "D76911" in key:
                         print(f"✅ FOUND IN S3 DRAFTS: {key}")
                         s3_count += 1
    except Exception as e:
        print(f"S3 Error: {e}")
        
    print(f"Found {s3_count} relevant files in S3 drafts.")

    # 2. Search Local Filesystem
    print("\n💻 Checking Local Filesystem...")
    search_paths = [
        "local_storage", 
        "drafts", 
        "backend/local_storage", 
        "../local_storage"
    ]
    
    local_count = 0
    for path in search_paths:
        if os.path.exists(path):
            print(f"Scanning {path}...")
            # Recursive walk
            for root, dirs, files in os.walk(path):
                for file in files:
                    if "enc" in file or "pdf" in file:
                         # Match basename against our missing target D76911
                         if "D76911" in file or "scan" in file:
                             full_path = os.path.join(root, file)
                             print(f"✅ FOUND LOCAL FILE: {full_path}")
                             local_count += 1
        else:
            print(f"Path not found: {path}")

    print(f"Found {local_count} relevant files locally.")

if __name__ == "__main__":
    search_everywhere()
