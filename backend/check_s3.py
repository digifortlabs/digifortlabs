import boto3
import os

try:
    s3 = boto3.client(
        's3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID', 'DUMMY'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY', 'DUMMY'),
        region_name='ap-south-1'
    )
    bucket = 'digifort-labs-files'
    
    print("Listing files in Dixit_Hospital/2026/")
    response = s3.list_objects_v2(Bucket=bucket, Prefix='Dixit')
    
    if 'Contents' in response:
        # Sort by last modified descending
        files = sorted(response['Contents'], key=lambda x: x['LastModified'], reverse=True)
        for obj in files[:10]:
            print(f"- {obj['Key']} ({obj['Size'] / (1024*1024):.2f} MB) - {obj['LastModified']}")
    else:
        print("No files found.")
        
except Exception as e:
    print(f"Error: {e}")
