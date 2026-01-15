
import io
from app.services.s3_handler import S3Manager
from app.core.config import settings

print(f"Checking S3 Write Access...")
s3 = S3Manager()

if s3.mode == 's3':
    try:
        data = io.BytesIO(b"test data")
        success, loc = s3.upload_file(data, "test_connectivity.txt")
        if success:
            print(f"✅ S3 Upload Successful: {loc}")
        else:
            print(f"❌ S3 Upload Failed: {loc}")
            
    except Exception as e:
        print(f"❌ S3 Upload Exception: {e}")
else:
    print("⚠️  Running in LOCAL STORAGE mode.")
