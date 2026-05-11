import time
from app.core.celery_app import celery_app
from app.services.storage import StorageService

@celery_app.task(name="optimization.process_pdf")
def process_pdf_optimization(job_id: str, settings: dict):
    """
    Stub task for PDF optimization to verify pipeline.
    """
    print(f"🚀 [WORKER] Starting optimization for job {job_id}")
    
    storage = StorageService()
    job_dir = storage.get_job_dir(job_id)
    
    # Mock heavy processing
    time.sleep(5)
    
    print(f"✅ [WORKER] Optimization complete for job {job_id}. Data stored in {job_dir}")
    
    return {
        "status": "success",
        "job_id": job_id,
        "path": job_dir,
        "settings_applied": settings
    }
