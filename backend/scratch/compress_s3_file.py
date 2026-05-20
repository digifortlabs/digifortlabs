import os
import sys
import boto3
from pathlib import Path
from dotenv import load_dotenv

# Set ENCRYPTION_KEY before imports
os.environ["ENCRYPTION_KEY"] = "a1z-3mNXYRp0yKAcP6xVpX6pjK6O38h039zisZMjE1U="

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.encryption import encrypt_file, decrypt_data
from app.services.compression import CompressionService

def process_s3_optimization(key, level="BALANCED"):
    load_dotenv()
    s3 = boto3.client(
        's3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        region_name=os.getenv('AWS_REGION')
    )
    bucket = os.getenv('AWS_BUCKET_NAME')
    
    print(f"[S3] Downloading: {key}")
    local_enc = "temp_s3_input.enc"
    resp = s3.get_object(Bucket=bucket, Key=key)
    with open(local_enc, 'wb') as f:
        f.write(resp['Body'].read())
    
    # 1. Decrypt
    print("[CRYPTO] Decrypting...")
    with open(local_enc, 'rb') as f:
        encrypted_bytes = f.read()
    decrypted_bytes = decrypt_data(encrypted_bytes)
    
    temp_pdf = "temp_s3_decrypted.pdf"
    with open(temp_pdf, 'wb') as f:
        f.write(decrypted_bytes)
        
    # 2. Compress
    print(f"[COMPRESS] Optimizing with level: {level}...")
    output_pdf = "temp_s3_optimized.pdf"
    
    # Try BALANCED, fallback to FAST if GS missing
    result = CompressionService.optimize_pdf(temp_pdf, output_pdf, level=level)
    if not result['success']:
        print("[WARN] BALANCED failed, falling back to FAST...")
        result = CompressionService.optimize_pdf(temp_pdf, output_pdf, level="FAST")
        
    # 3. Re-encrypt
    print("[CRYPTO] Re-encrypting...")
    final_enc = encrypt_file(output_pdf)
    
    # 4. Upload
    new_key = key.replace(".enc", "_optimized.enc")
    print(f"[S3] Uploading optimized version to: {new_key}")
    with open(final_enc, 'rb') as f:
        s3.upload_fileobj(f, bucket, new_key)
        
    print(f"✅ SUCCESS!")
    print(f"Original: {os.path.getsize(local_enc)/1024:.2f} KB")
    print(f"Optimized: {os.path.getsize(final_enc)/1024:.2f} KB")
    
    # Cleanup
    for f in [local_enc, temp_pdf, output_pdf, final_enc]:
        if os.path.exists(f): os.remove(f)
        
    return new_key

if __name__ == "__main__":
    target_key = 'Dixit_Hospital/2025/02/D756268_3bdba0ec.enc'
    process_s3_optimization(target_key)
