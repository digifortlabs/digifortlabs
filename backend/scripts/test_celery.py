import sys
import os
import time

# Ensure app can be imported
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "backend"))

try:
    from app.tasks.optimization import process_pdf_optimization
    print("✅ Successfully imported task")
except ImportError as e:
    print(f"❌ Failed to import task: {e}")
    sys.exit(1)

def run_test():
    job_id = f"test_job_{int(time.time())}"
    print(f"📡 Triggering task for {job_id}...")
    
    # We use delay() to send to the broker
    result = process_pdf_optimization.delay(job_id, {"level": "high", "engine": "ghostscript"})
    
    print(f"✅ Task sent! Task ID: {result.id}")
    print(f"Current Status: {result.status}")
    
    print("\nNote: To see this execute, you must have Redis and a Celery worker running.")
    print("Run: celery -A app.core.celery_app worker --loglevel=info")

if __name__ == "__main__":
    run_test()
