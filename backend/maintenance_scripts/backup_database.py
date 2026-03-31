import os
import boto3
import subprocess
from datetime import datetime, timedelta
import sys

# Append the parent directory to sys.path to allow importing from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def backup_to_s3():
    print(f"[{datetime.now()}] Starting Database Backup to S3...")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"digifortlabs_backup_{timestamp}.sql"
    
    try:
        # Create dump using pg_dump
        pg_dump_cmd = [
            "pg_dump", 
            "-h", settings.POSTGRES_SERVER, 
            "-U", settings.POSTGRES_USER, 
            "-d", settings.POSTGRES_DB, 
            "-F", "c", 
            "-f", backup_file
        ]
        print(f"Running: {' '.join(pg_dump_cmd).replace(settings.POSTGRES_USER, '******')}")
        
        env = os.environ.copy()
        env["PGPASSWORD"] = settings.POSTGRES_PASSWORD
        subprocess.run(pg_dump_cmd, env=env, check=True)
        print("✅ Database dumped locally.")
        
        # Upload to S3
        s3 = boto3.client(
            's3', 
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        
        s3_key = f"backups/database/{backup_file}"
        print(f"Uploading {backup_file} to s3://{settings.AWS_BUCKET_NAME}/{s3_key}...")
        s3.upload_file(backup_file, settings.AWS_BUCKET_NAME, s3_key)
        print("✅ Uploaded to S3 successfully.")
        
        # Clean up local file
        os.remove(backup_file)
        
        # Delete old backups (7 days retention)
        print("Cleaning up old backups...")
        cutoff = datetime.now() - timedelta(days=7)
        response = s3.list_objects_v2(Bucket=settings.AWS_BUCKET_NAME, Prefix='backups/database/')
        
        deleted_count = 0
        for obj in response.get('Contents', []):
            if obj['LastModified'].replace(tzinfo=None) < cutoff:
                s3.delete_object(Bucket=settings.AWS_BUCKET_NAME, Key=obj['Key'])
                deleted_count += 1
                print(f"Deleted old backup: {obj['Key']}")
        
        print(f"✅ Backup complete. Cleaned up {deleted_count} old backups.")
        
    except Exception as e:
        print(f"❌ Backup failed: {e}")
        # Clean up local file if it exists and failed mid-upload
        if os.path.exists(backup_file):
            os.remove(backup_file)
        sys.exit(1)

if __name__ == "__main__":
    backup_to_s3()
