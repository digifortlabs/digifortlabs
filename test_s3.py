import os
import sys
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.getcwd())

# Explicitly load .env
load_dotenv()

from app.core.config import settings

def test_s3_connection():
    print("🧪 Testing S3 Connection (with explicit load_dotenv)...")
    print(f"Region: {settings.AWS_REGION}")
    print(f"Bucket: {settings.AWS_BUCKET_NAME}")
    
    # Debug: Print first few chars of key to verify load
    key = os.getenv("AWS_ACCESS_KEY_ID", "NOT_FOUND")
    print(f"Key loaded from env: {key[:4]}***")

    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        
        # List buckets
        response = s3.list_buckets()
        print("✅ Connection Successful! Buckets:")
        for bucket in response['Buckets']:
            print(f" - {bucket['Name']}")
            
        # Check specific bucket
        s3.head_bucket(Bucket=settings.AWS_BUCKET_NAME)
        print(f"✅ Access to bucket '{settings.AWS_BUCKET_NAME}' confirmed.")
        
    except ClientError as e:
        print(f"❌ AWS Client Error: {e}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    test_s3_connection()
