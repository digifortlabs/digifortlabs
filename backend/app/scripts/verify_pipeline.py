import logging
logger = logging.getLogger(__name__)
import requests
import time
import sys

BASE_URL = "http://localhost:8000"

def test_full_pipeline(file_path: str):
    # 1. Trigger
    logger.info(f"[START] Triggering optimization for {file_path}...")
    files = {'file': open(file_path, 'rb')}
    response = requests.post(f"{BASE_URL}/optimization/trigger", files=files)
    
    if response.status_code != 200:
        logger.info(f"[ERROR] Failed to trigger: {response.text}")
        return
    
    data = response.json()
    task_id = data['task_id']
    job_id = data['job_id']
    filename = data.get('input_file', 'test_input.pdf') # Fallback if not returned
    logger.info(f"[OK] Task Triggered. ID: {task_id}")

    # 2. Poll
    logger.info("[WAIT] Polling for status...")
    while True:
        status_resp = requests.get(f"{BASE_URL}/optimization/status/{task_id}")
        status_data = status_resp.json()
        status = status_data['status']
        
        if status == "PROGRESS":
            meta = status_data.get('meta', {})
            logger.info(f"   - {status}: {meta.get('step')} ({meta.get('percent')}%)")
        else:
            logger.info(f"   - {status}")
            
        if status in ["SUCCESS", "FAILURE"]:
            break
        
        time.sleep(2)

    if status == "SUCCESS":
        # 3. Download
        # The trigger doesn't return input_file name in the response I wrote, 
        # let's extract it from the path or just use a fixed name if we know it.
        # Wait, I should have included it.
        logger.info(f"? Downloading optimized file...")
        dl_url = f"{BASE_URL}/optimization/download/{job_id}/test_input.pdf"
        dl_resp = requests.get(dl_url)
        
        if dl_resp.status_code == 200:
            logger.info(f"[OK] Download Successful. Size: {len(dl_resp.content)} bytes")
        else:
            logger.info(f"[ERROR] Download Failed: {dl_resp.status_code} - {dl_resp.text}")
    else:
        logger.info(f"[ERROR] Pipeline failed with status: {status}")

if __name__ == "__main__":
    file_to_test = sys.argv[1] if len(sys.argv) > 1 else "test_input.pdf"
    test_full_pipeline(file_to_test)
