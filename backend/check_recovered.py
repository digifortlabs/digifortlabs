import boto3
import os
import sys

# Add parent directory to path to import app modules
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

from app.core.config import settings

s3_client = boto3.client(
    's3',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)
BUCKET_NAME = settings.AWS_BUCKET_NAME

paginator = s3_client.get_paginator('list_objects_v2')
print("Checking for recovered files in bucket:", BUCKET_NAME)
found_any = False

for page in paginator.paginate(Bucket=BUCKET_NAME):
    if 'Contents' in page:
        for obj in page['Contents']:
            key = obj['Key']
            if 'Recovered' in key:
                print(f"Found: {key}")
                found_any = True

if not found_any:
    print("No recovered files found in the bucket.")
