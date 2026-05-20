import boto3
import os
from dotenv import load_dotenv

load_dotenv()
s3 = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION')
)
bucket = os.getenv('AWS_BUCKET_NAME')

count = 0
size = 0
paginator = s3.get_paginator('list_objects_v2')
for page in paginator.paginate(Bucket=bucket):
    objs = page.get('Contents', [])
    count += len(objs)
    size += sum(obj['Size'] for obj in objs)

print(f"S3 TOTALS: {count} files, {size/1024/1024/1024:.2f} GB")
