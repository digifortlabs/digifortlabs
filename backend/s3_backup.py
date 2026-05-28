import os
import sys
import boto3
import traceback

def main():
    if len(sys.argv) < 3:
        print("Usage: python s3_backup.py <output_dir> <encryption_key>")
        sys.exit(1)

    output_dir = sys.argv[1]
    encryption_key = sys.argv[2]

    print(f"Setting up S3 backup to {output_dir}...")
    os.makedirs(output_dir, exist_ok=True)

    # Set encryption key so app.services.encryption works
    os.environ["ENCRYPTION_KEY"] = encryption_key

    try:
        from app.core.config import settings
        from app.services.encryption import decrypt_data
        from app.services.s3_handler import S3Manager
    except ImportError as e:
        print(f"ImportError: {e}")
        sys.exit(1)

    s3_manager = S3Manager()
    if s3_manager.mode != "s3":
        print("S3Manager is not in S3 mode. Check AWS credentials.")
        sys.exit(1)

    s3_client = s3_manager.s3_client
    bucket_name = s3_manager.bucket_name

    print(f"Listing objects in bucket: {bucket_name}")
    try:
        paginator = s3_client.get_paginator('list_objects_v2')
        pages = paginator.paginate(Bucket=bucket_name)

        total_files = 0
        success_files = 0

        for page in pages:
            if 'Contents' not in page:
                continue

            for obj in page['Contents']:
                key = obj['Key']
                total_files += 1
                
                print(f"Downloading {key}...")
                
                # Retrieve bytes
                try:
                    response = s3_client.get_object(Bucket=bucket_name, Key=key)
                    raw_bytes = response['Body'].read()
                except Exception as e:
                    print(f" Failed to download {key}: {e}")
                    continue

                # Attempt to decrypt
                decrypted_bytes = raw_bytes
                try:
                    # Note: We can try to decrypt everything, or check if it ends with .enc?
                    # The code says we can decrypt if it's encrypted. 
                    # Actually, decrypt_data handles checking for MAGIC bytes.
                    # But if it's not encrypted, decrypt_data might fail or just return the data?
                    # Wait, decrypt_data raises ValueError if it fails.
                    # Let's try decrypting.
                    try:
                        decrypted_bytes = decrypt_data(raw_bytes)
                        is_encrypted = True
                    except ValueError:
                        # Probably not encrypted
                        decrypted_bytes = raw_bytes
                        is_encrypted = False
                except Exception as e:
                    print(f" Failed to decrypt {key}: {e}")
                    # Save as raw if decrypt fails just in case
                    decrypted_bytes = raw_bytes
                    is_encrypted = False

                # Write to local file
                # Key might contain slashes. We need to create subdirectories
                local_path = os.path.join(output_dir, key)
                # Remove .enc extension if it was successfully decrypted and has it
                if is_encrypted and local_path.endswith('.enc'):
                    local_path = local_path[:-4]

                os.makedirs(os.path.dirname(local_path), exist_ok=True)
                with open(local_path, 'wb') as f:
                    f.write(decrypted_bytes)
                
                success_files += 1

        print(f"Successfully downloaded and decrypted {success_files}/{total_files} files.")
    except Exception as e:
        print(f"Error during backup: {e}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
