import logging
logger = logging.getLogger(__name__)
import os

# Hardcoded for the absolute last time
AK = os.getenv('AWS_ACCESS_KEY_ID', 'DUMMY')
SK = os.getenv('AWS_SECRET_ACCESS_KEY', 'DUMMY')
RG = "ap-south-1"
BK = "digifort-labs-files"

def recover():
    try:
        s3 = boto3.client('s3', aws_access_key_id=AK, aws_secret_access_key=SK, region_name=RG)
        
        file_path = '/tmp/tmpylg665pn.pdf'
        key = 'recovered/scan_final_recovery.pdf'
        
        logger.info(f"Uploading {file_path}...")
        with open(file_path, 'rb') as f:
            s3.upload_fileobj(f, BK, key)
            
        logger.info("Success! Generating URL...")
        url = s3.generate_presigned_url('get_object', Params={'Bucket': BK, 'Key': key}, ExpiresIn=86400)
        logger.info(f"URL: {url}")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.info(f"FATAL: {e}")

if __name__ == "__main__":
    recover()
