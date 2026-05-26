import os
import time
import requests
import traceback
import logging
from datetime import datetime

# Setup basic logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - OCR WORKER - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Must run from backend directory to import correctly
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

LIVE_API_URL = os.getenv("BACKEND_URL", "https://digifortlabs.com/api")
WORKER_API_KEY = os.getenv("WORKER_API_KEY")

if not WORKER_API_KEY:
    logger.error("WORKER_API_KEY is not set in .env")
    sys.exit(1)

def is_active_hours():
    if os.getenv("OCR_FORCE_ACTIVE") == "1":
        return True
        
    start_hr = int(os.getenv("OCR_ACTIVE_HOURS_START", "22"))
    end_hr = int(os.getenv("OCR_ACTIVE_HOURS_END", "7"))
    current_hr = datetime.now().hour
    
    if start_hr > end_hr:
        return current_hr >= start_hr or current_hr < end_hr
    else:
        return start_hr <= current_hr < end_hr

def process_jobs():
    headers = {"WORKER-API-KEY": WORKER_API_KEY}
    
    try:
        # Fetch pending jobs
        res = requests.get(f"{LIVE_API_URL}/optimization/ocr/pending", headers=headers, timeout=10)
        if res.status_code == 403:
            logger.error("Authentication failed. Invalid WORKER_API_KEY.")
            time.sleep(60)
            return
            
        res.raise_for_status()
        jobs = res.json()
        
        if not jobs:
            return
            
        logger.info(f"Found {len(jobs)} pending OCR jobs.")
        
        from app.services.ocr import extract_text_from_pdf
        
        for job in jobs:
            file_id = job['file_id']
            logger.info(f"Downloading file {file_id}...")
            
            # Download file
            download_res = requests.get(f"{LIVE_API_URL}/optimization/ocr/{file_id}/download", headers=headers, timeout=30)
            if download_res.status_code != 200:
                logger.error(f"Failed to download {file_id}: {download_res.text}")
                continue
                
            pdf_bytes = download_res.content
            
            logger.info(f"Running OCR on file {file_id}...")
            extracted_text = extract_text_from_pdf(pdf_bytes)
            
            if extracted_text and extracted_text.strip():
                logger.info(f"OCR successful for {file_id} ({len(extracted_text)} chars). Uploading result...")
                submit_res = requests.post(
                    f"{LIVE_API_URL}/optimization/ocr/{file_id}/result",
                    headers=headers,
                    json={"ocr_text": extracted_text},
                    timeout=30
                )
                if submit_res.status_code == 200:
                    logger.info(f"Result submitted successfully for {file_id}.")
                else:
                    logger.error(f"Failed to submit result for {file_id}: {submit_res.text}")
            else:
                logger.info(f"No text extracted for {file_id}. Marking as empty to avoid retry loop.")
                # We should still submit empty so it doesn't stay stuck
                requests.post(
                    f"{LIVE_API_URL}/optimization/ocr/{file_id}/result",
                    headers=headers,
                    json={"ocr_text": " "}, # Space to mark it non-null but basically empty
                    timeout=30
                )
                
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error communicating with live server: {e}")
    except Exception as e:
        logger.error(f"Error processing jobs: {e}")
        logger.debug(traceback.format_exc())

if __name__ == "__main__":
    logger.info("Distributed OCR Worker started.")
    
    while True:
        if is_active_hours():
            logger.info("Within active hours. Checking for jobs...")
            process_jobs()
            time.sleep(30) # Wait 30 seconds between polling during active hours
        else:
            logger.info("Outside active hours. Sleeping...")
            time.sleep(3600) # Sleep for an hour
