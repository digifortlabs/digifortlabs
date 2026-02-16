import sys
import os
sys.path.append(os.getcwd())
try:
    from app.core.config import settings
except ImportError:
    sys.path.append(os.path.join(os.getcwd(), '..'))
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    from app.core.config import settings

import boto3

def find_2026_files():
    print(f"Connecting to S3 bucket: {settings.AWS_BUCKET_NAME}")
    s3 = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    )
    
    prefix = "Dixit_Hospital/2026/"
    print(f"Listing objects with prefix: {prefix}")
    
    paginator = s3.get_paginator('list_objects_v2')
    count = 0
    
    for page in paginator.paginate(Bucket=settings.AWS_BUCKET_NAME, Prefix=prefix):
        if 'Contents' in page:
            for obj in page['Contents']:
                print(f"FOUND: {obj['Key']}")
                count += 1
                
    print(f"Total 2026 Files: {count}")

if __name__ == "__main__":
    find_2026_files()
