import os
import logging
from pathlib import Path
from app.core.celery_app import celery_app
from app.services.storage import StorageService
from app.services.compression import CompressionService
from app.services.encryption import encrypt_file

logger = logging.getLogger("system")

@celery_app.task(bind=True, name="optimization.process_pdf")
def process_pdf_optimization(self, job_id: str, input_filename: str, settings_dict: dict):
    """
    Background task to optimize a PDF record using the CompressionService.
    Encrypts the file with AES-256 GCM immediately and deletes all raw unencrypted files.
    """
    self.update_state(state="PROGRESS", meta={"step": "Initializing", "percent": 10})
    logger.info(f"🚀 [WORKER] Starting optimization for job {job_id}")
    
    storage = StorageService()
    job_dir = storage.get_job_dir(job_id)
    
    input_path = os.path.join(job_dir, input_filename)
    output_filename = f"optimized_{input_filename}"
    output_path = os.path.join(job_dir, output_filename)
    
    level = settings_dict.get("level", "BALANCED")
    
    # Run the heavy lifting
    self.update_state(state="PROGRESS", meta={"step": f"Compressing ({level})", "percent": 30})
    success = CompressionService.compress_pdf(Path(input_path), Path(output_path), level=level)
    
    input_size = os.path.getsize(input_path) if os.path.exists(input_path) else 0
    final_size = 0
    
    self.update_state(state="PROGRESS", meta={"step": "Encrypting", "percent": 80})
    
    if success and os.path.exists(output_path):
        final_size = os.path.getsize(output_path)
        logger.info(f"🔒 [WORKER] Encrypting optimized PDF for job {job_id}")
        enc_path = encrypt_file(output_path)
        
        # Immediate secure deletion of unencrypted files
        try:
            os.remove(output_path)
            if os.path.exists(input_path):
                os.remove(input_path)
            logger.info(f"🗑️ [WORKER] Intermediate unencrypted files scrubbed for job {job_id}")
        except Exception as e:
            logger.warning(f"⚠️ [WORKER] Failed to remove some temp unencrypted files: {e}")
            
        output_file = f"{output_filename}.enc"
    else:
        # Fallback: Encrypt the original file if compression failed
        logger.warning(f"⚠️ [WORKER] Compression failed or output missing for job {job_id}. Encrypting fallback original.")
        success = False
        final_size = input_size
        
        if os.path.exists(input_path):
            enc_path = encrypt_file(input_path)
            try:
                os.remove(input_path)
                logger.info(f"🗑️ [WORKER] Fallback original unencrypted file scrubbed for job {job_id}")
            except Exception as e:
                logger.warning(f"⚠️ [WORKER] Failed to remove temp fallback file: {e}")
        
        output_file = f"{input_filename}.enc"
        
        # Clean up any partial compression output
        if os.path.exists(output_path):
            try:
                os.remove(output_path)
            except Exception:
                pass

    self.update_state(state="PROGRESS", meta={"step": "Finalizing", "percent": 95})
    
    result = {
        "success": success,
        "input_size": input_size,
        "final_size": final_size,
        "ratio": round(final_size / input_size, 4) if input_size > 0 else 1.0
    }
    
    if success:
        logger.info(f"✅ [WORKER] Optimization complete for job {job_id}. Final size: {final_size}")
    else:
        logger.error(f"❌ [WORKER] Optimization failed for job {job_id}")
    
    return {
        "status": "success" if success else "failure",
        "job_id": job_id,
        "input_file": input_filename,
        "output_file": output_file,
        "metrics": result
    }

