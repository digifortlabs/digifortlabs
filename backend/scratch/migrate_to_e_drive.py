import os
import sys
import boto3
import shutil
from pathlib import Path
from dotenv import load_dotenv

# Set ENCRYPTION_KEY and GHOSTSCRIPT_CMD before imports
load_dotenv()
if not os.getenv("GHOSTSCRIPT_CMD"):
    os.environ["GHOSTSCRIPT_CMD"] = r"C:\Program Files\gs\gs10.07.0\bin\gswin64c.exe"

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.encryption import encrypt_data, decrypt_data
from app.services.compression import CompressionService

def migrate_s3_to_e_drive(target_drive="E:\\Digifort_Migration"):
    bucket_name = os.getenv('AWS_BUCKET_NAME')
    s3 = boto3.client(
        's3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        region_name=os.getenv('AWS_REGION')
    )
    
    os.makedirs(target_drive, exist_ok=True)
    
    print(f"Starting FULL Migration to {target_drive}...")
    sys.stdout.flush()
    
    paginator = s3.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=bucket_name)
    
    total_processed = 0
    total_original_size = 0
    total_new_size = 0
    
    for page in pages:
        for obj in page.get('Contents', []):
            key = obj['Key']
            # Removed .enc filter to process ALL files
            
            print(f"Processing: {key}")
            sys.stdout.flush()
            
            # 1. Setup local paths on E:
            local_final_path = os.path.join(target_drive, key)
            os.makedirs(os.path.dirname(local_final_path), exist_ok=True)
            
            temp_download = local_final_path + ".download"
            temp_decrypted = local_final_path + ".decrypted"
            temp_optimized = local_final_path + ".optimized"
            
            try:
                # 2. Download
                s3.download_file(bucket_name, key, temp_download)
                original_size = os.path.getsize(temp_download)
                total_original_size += original_size
                
                # 3. Decrypt
                # Most files on S3 are expected to be encrypted
                with open(temp_download, 'rb') as f:
                    raw_data = f.read()
                
                try:
                    dec_data = decrypt_data(raw_data)
                    print(f"  Decrypted successfully.")
                except Exception as dec_err:
                    print(f"  Decryption skipped/failed (using raw): {dec_err}")
                    dec_data = raw_data
                
                # 4. Process (Compression if PDF)
                # Check for PDF magic bytes at the start
                is_pdf = dec_data.startswith(b"%PDF-")
                if is_pdf:
                    with open(temp_decrypted, 'wb') as f:
                        f.write(dec_data)
                    print(f"  Optimizing PDF...")
                    sys.stdout.flush()
                    CompressionService.optimize_pdf(temp_decrypted, temp_optimized, level="BALANCED")
                    with open(temp_optimized, 'rb') as f:
                        final_data = f.read()
                else:
                    final_data = dec_data
                
                # 5. Re-encrypt (New Format)
                print(f"  Securing in new format...")
                new_enc_data = encrypt_data(final_data)
                
                with open(local_final_path, 'wb') as f:
                    f.write(new_enc_data)
                
                new_size = os.path.getsize(local_final_path)
                total_new_size += new_size
                
                reduction = (1 - (new_size / original_size)) * 100 if original_size > 0 else 0
                print(f"  Done: {original_size/1024:.1f}KB -> {new_size/1024:.1f}KB ({reduction:.1f}% reduction)")
                sys.stdout.flush()
                
                total_processed += 1
                
            except Exception as e:
                print(f"  CRITICAL ERROR processing {key}: {e}")
                sys.stdout.flush()
            finally:
                # Cleanup temp files
                for tmp in [temp_download, temp_decrypted, temp_optimized]:
                    if os.path.exists(tmp): os.remove(tmp)
                    
    print("\nMIGRATION SUMMARY")
    print(f"Total Files: {total_processed}")
    print(f"Original Volume: {total_original_size/1024/1024:.2f} MB")
    print(f"New Volume: {total_new_size/1024/1024:.2f} MB")
    if total_original_size > 0:
        print(f"Total Reduction: {(1 - (total_new_size/total_original_size))*100:.1f}%")
    sys.stdout.flush()

if __name__ == "__main__":
    migrate_s3_to_e_drive()
