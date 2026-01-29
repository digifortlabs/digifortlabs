import os
import shutil

import boto3
from botocore.exceptions import ClientError

from app.core.config import settings


class S3Manager:
    def __init__(self):
        self.mode = "s3"
        self.bucket_name = settings.AWS_BUCKET_NAME or "local-bucket"
        
        self.local_root = os.path.join(os.getcwd(), "local_storage")
        os.makedirs(self.local_root, exist_ok=True)
        
        # Check if AWS keys are present in settings (explicit) or available via environment/profile
        try:
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION
                )
            else:
                # Fallback to default session (e.g., ~/.aws/credentials)
                self.s3_client = boto3.client('s3', region_name=settings.AWS_REGION)
                self.s3_client.list_buckets()
            
            print(f"[INFO] S3 Manager initialized for bucket: {self.bucket_name} (Region: {settings.AWS_REGION})")
            self.mode = "s3"
        except Exception as e:
            self.mode = "local"
            print(f"[WARN] S3 Manager falling back to LOCAL MODE (Error: {str(e)[:50]}...). Storage: {self.local_root}")

    def upload_file(self, file_content, object_name, content_type=None):
        """
        Upload a file-like object to S3 or Local Storage.
        """
        if self.mode == "local":
            try:
                # Ensure directory exists
                full_path = os.path.join(self.local_root, object_name)
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                
                # Write file
                with open(full_path, 'wb') as f:
                    shutil.copyfileobj(file_content, f)
                    
                return True, full_path
            except Exception as e:
                print(f"[ERROR] Local Upload Error: {e}")
                return False, str(e)
        
        try:
            extra_args = {
                'StorageClass': 'INTELLIGENT_TIERING'
            }
            if content_type:
                extra_args['ContentType'] = content_type

            self.s3_client.upload_fileobj(
                file_content,
                self.bucket_name,
                object_name,
                ExtraArgs=extra_args
            )
            return True, f"s3://{self.bucket_name}/{object_name}"
        except ClientError as e:
            print(f"[ERROR] S3 Upload Error: {e}")
            return False, str(e)
        except Exception as e:
            print(f"[ERROR] Unexpected Upload Error: {e}")
            return False, str(e)

    def generate_presigned_url(self, object_name, expiration=3600):
        """
        Generate a presigned URL to share a temporary link.
        """
        if self.mode == "local":
            # Return local static URL
            # Use settings.BACKEND_URL or fallback to relative path if served from same origin
            base_url = settings.BACKEND_URL or "http://localhost:8000"
            if "localhost" in base_url and settings.ENVIRONMENT == "production":
                 # Fallback for when variable isn't set in prod
                 base_url = "" # Return relative path?
            
            return f"{base_url}/local-storage/{object_name}"

        try:
            response = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': object_name
                },
                ExpiresIn=expiration
            )
            return response
        except ClientError as e:
            print(f"[ERROR] Presign Error: {e}")
            return None

    def download_to_temp_cache(self, object_name, local_path):
        """
        Downloads file to local cache for temporary processing.
        """
        if self.mode == "local":
            try:
                source_path = os.path.join(self.local_root, object_name)
                if not os.path.exists(source_path):
                    return False
                
                os.makedirs(os.path.dirname(local_path), exist_ok=True)
                shutil.copy2(source_path, local_path)
                return True
            except Exception as e:
                print(f"[ERROR] Local Download Error: {e}")
                return False

        try:
            # Ensure directory exists if path has one
            directory = os.path.dirname(local_path)
            if directory:
                os.makedirs(directory, exist_ok=True)
            
            self.s3_client.download_file(self.bucket_name, object_name, local_path)
            return True
        except ClientError as e:
            print(f"[ERROR] Download Error: {e}")
            return False
        except Exception as e:
            print(f"[ERROR] Unexpected Download Error: {e}")
            return False

    def get_file_bytes(self, object_name: str) -> bytes:
        """
        Retrieves raw bytes from S3 or Local.
        """
        # Try local first as fallback for legacy files
        local_path = os.path.join(self.local_root, object_name)
        if os.path.exists(local_path):
            with open(local_path, 'rb') as f:
                return f.read()

        if self.mode == "s3":
            try:
                response = self.s3_client.get_object(Bucket=self.bucket_name, Key=object_name)
                return response['Body'].read()
            except Exception as e:
                print(f"[ERROR] S3 Retrieval Error: {e}")
                return None
        
        return None

    def delete_file(self, object_name):
        """
        Deletes a file from S3 or Local.
        """
        success = True
        
        # Always attempt to delete from local storage (Legacy cleanup or Local mode)
        try:
            full_path = os.path.join(self.local_root, object_name) if object_name else ""
            if full_path and os.path.exists(full_path):
                os.remove(full_path)
                print(f"[INFO] Deleted local file: {full_path}")
        except Exception as e:
            print(f"[WARN] Local Delete Warning: {e}")
            if self.mode == "local":
                success = False

        if self.mode == "s3" and object_name:
            try:
                self.s3_client.delete_object(Bucket=self.bucket_name, Key=object_name)
            except ClientError as e:
                print(f"[ERROR] S3 Delete Error: {e}")
                # If it's a 404 from S3, that's fine, we treat as deleted.
                # But for other errors we might want to flag? 
                # For now, return True so DB deletion proceeds (consistency).
                success = True 
        
        return success
