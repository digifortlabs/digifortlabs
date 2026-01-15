
from app.services.s3_handler import S3Manager
from app.core.config import settings

print(f"Checking S3 Configuration...")
print(f"Bucket: {settings.AWS_BUCKET_NAME}")
print(f"Region: {settings.AWS_REGION}")

s3 = S3Manager()
print(f"Mode: {s3.mode}")

if s3.mode == 's3':
    try:
        s3.s3_client.list_objects_v2(Bucket=s3.bucket_name, MaxKeys=1)
        print("✅ S3 Connection Successful (Live Storage)")
    except Exception as e:
        print(f"❌ S3 Connection Failed: {e}")
else:
    print("⚠️  Running in LOCAL STORAGE mode. (Keys missing or invalid)")
