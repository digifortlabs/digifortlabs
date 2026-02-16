import sys
import os

# Ensure we can import from app
sys.path.append(os.path.join(os.getcwd(), '..')) # Adjust if run from backend/ or just use standard python path tricks

# Try to setup path to import app
current = os.getcwd()
if current.endswith('backend'):
    sys.path.append(current)
else:
    sys.path.append(os.path.join(current, 'backend'))

try:
    from app.core.config import settings
except ImportError:
    # If that fails, try appending current directory
    sys.path.append(os.getcwd())
    from app.core.config import settings

import boto3

def find_files():
    print(f"Connecting to S3 bucket: {settings.AWS_BUCKET_NAME}")
    
    s3 = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    )
    
    print("Searching for objects containing 'Dixit'...")
    count = 0
    paginator = s3.get_paginator('list_objects_v2')
    
    try:
        for page in paginator.paginate(Bucket=settings.AWS_BUCKET_NAME):
            if 'Contents' in page:
                for obj in page['Contents']:
                    key = obj['Key']
                    if 'Dixit' in key or 'scan.pdf' in key: # Broader search
                        print(f"MATCH: {key}")
                        count += 1
    except Exception as e:
        print(f"Error listing objects: {e}")

    print(f"Total Matches: {count}")

if __name__ == "__main__":
    find_files()
