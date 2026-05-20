import os
import sys
import boto3
import concurrent.futures
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

def download_file(session, bucket, key, local_path, size):
    try:
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        # Skip if already exists and same size
        if os.path.exists(local_path) and os.path.getsize(local_path) == size:
            return True, size
            
        s3 = session.client('s3')
        s3.download_file(bucket, key, local_path)
        return True, size
    except Exception as e:
        # print(f"  ERROR downloading {key}: {e}")
        return False, 0

def download_all_s3_to_e(target_drive="E:\\Digifort_S3_Latest_2026", max_workers=30):
    bucket_name = os.getenv('AWS_BUCKET_NAME')
    
    # Session is thread-safe, clients are not always
    session = boto3.Session(
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        region_name=os.getenv('AWS_REGION')
    )
    s3_client = session.client('s3')
    
    print(f"--- STEP 1: ROBUST MULTI-THREADED DOWNLOAD ({max_workers} workers) ---")
    sys.stdout.flush()
    
    all_keys = []
    paginator = s3_client.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=bucket_name):
        for obj in page.get('Contents', []):
            all_keys.append((obj['Key'], obj['Size']))
            
    print(f"Total files: {len(all_keys)}")
    sys.stdout.flush()
    
    total_files = 0
    total_size = 0
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_key = {
            executor.submit(
                download_file, 
                session, 
                bucket_name, 
                key, 
                os.path.join(target_drive, key),
                size
            ): key for key, size in all_keys
        }
        
        for i, future in enumerate(concurrent.futures.as_completed(future_to_key)):
            key = future_to_key[future]
            try:
                success, size = future.result(timeout=60) # 1 minute timeout per file
                if success:
                    total_files += 1
                    total_size += size
            except Exception:
                pass
                
            if (i + 1) % 50 == 0:
                print(f"  Progress: {i+1}/{len(all_keys)} processed...")
                sys.stdout.flush()
                    
    print("\n--- DOWNLOAD COMPLETE ---")
    print(f"Total Files: {total_files}")
    print(f"Total Volume: {total_size/1024/1024:.2f} MB")
    sys.stdout.flush()

if __name__ == "__main__":
    download_all_s3_to_e()
