import boto3
import os
import sys
from cryptography.fernet import Fernet

def get_s3_client():
    return boto3.client(
        's3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID', 'DUMMY'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY', 'DUMMY'),
        region_name='ap-south-1'
    )

def decrypt_data(encrypted_bytes: bytes, key: str) -> bytes:
    fernet = Fernet(key.encode())
    return fernet.decrypt(encrypted_bytes)

def download_and_decrypt_all(backup_dir: str, encryption_key: str):
    s3 = get_s3_client()
    bucket = 'digifort-labs-files'
    
    paginator = s3.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=bucket)
    
    count = 0
    total_size = 0
    
    for page in pages:
        if 'Contents' not in page:
            continue
            
        for obj in page['Contents']:
            key = obj['Key']
            size = obj['Size']
            
            # Skip empty directories or weird files
            if size == 0:
                continue
                
            print(f"Downloading: {key} ({size / (1024*1024):.2f} MB)")
            
            # Construct local path
            local_raw_path = os.path.join(backup_dir, 'raw_temp_' + os.path.basename(key))
            local_decrypted_path = os.path.join(backup_dir, key)
            
            # Ensure local directory exists
            os.makedirs(os.path.dirname(local_decrypted_path), exist_ok=True)
            
            try:
                # Need to check if file ends with .enc to decrypt it.
                is_encrypted = key.endswith('.enc')
                
                # Fetch bytes directly
                response = s3.get_object(Bucket=bucket, Key=key)
                file_bytes = response['Body'].read()
                
                if is_encrypted:
                    try:
                        decrypted_bytes = decrypt_data(file_bytes, encryption_key)
                        
                        # Strip .enc from final filename and ensure it has .pdf
                        final_path = local_decrypted_path[:-4] if local_decrypted_path.endswith('.enc') else local_decrypted_path
                        if not final_path.lower().endswith('.pdf'):
                            final_path += '.pdf'
                            
                        with open(final_path, 'wb') as f:
                            f.write(decrypted_bytes)
                        
                        count += 1
                        total_size += len(decrypted_bytes)
                        print(f" -> Decrypted successfully: {final_path}")
                        
                    except Exception as dec_err:
                        print(f" -> Failed to decrypt {key}: {dec_err}")
                        # Save raw if decryption fails just in case
                        final_raw = local_decrypted_path if local_decrypted_path.lower().endswith('.pdf') else local_decrypted_path + '.pdf'
                        with open(final_raw, 'wb') as f:
                            f.write(file_bytes)
                else:
                    # Save directly
                    final_path = local_decrypted_path if local_decrypted_path.lower().endswith('.pdf') else local_decrypted_path + '.pdf'
                    with open(final_path, 'wb') as f:
                        f.write(file_bytes)
                    count += 1
                    total_size += size
                    print(f" -> Downloaded unencrypted: {final_path}")
                    
            except Exception as e:
                print(f"Error processing {key}: {e}")

    print(f"\n--- S3 Backup Complete ---")
    print(f"Total files: {count}")
    print(f"Total size: {total_size / (1024*1024):.2f} MB")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python s3_backup.py <backup_dir> <encryption_key>")
        sys.exit(1)
        
    backup_dir = sys.argv[1]
    enc_key = sys.argv[2]
    
    download_and_decrypt_all(backup_dir, enc_key)
