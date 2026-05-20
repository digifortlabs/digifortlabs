import os
import boto3
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("ENCRYPTION_KEY")
print(f"Testing Key: {key}")

s3 = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION')
)
bucket = os.getenv('AWS_BUCKET_NAME')
test_key = 'Dixit_Hospital/2025/02/D756268_3bdba0ec.enc'

resp = s3.get_object(Bucket=bucket, Key=test_key)
data = resp['Body'].read()

print(f"Data Starts with: {data[:10]}")

try:
    f = Fernet(key.encode())
    dec = f.decrypt(data)
    print(f"SUCCESS! Decrypted {len(dec)} bytes")
except Exception as e:
    print(f"FAILURE: {e}")
