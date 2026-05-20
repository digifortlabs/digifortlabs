from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from celery.result import AsyncResult
import uuid
import os
import shutil
import io
from typing import Dict, Any, Optional
from app.core.celery_app import celery_app
from app.tasks.optimization import process_pdf_optimization
from app.services.storage import StorageService
from app.core.config import settings
from app.services.encryption import decrypt_file

router = APIRouter()
storage = StorageService()

@router.post("/trigger")
async def trigger_optimization(
    file: UploadFile = File(...),
    level: str = settings.DEFAULT_COMPRESSION_STRATEGY
):
    """
    Upload a PDF and trigger an asynchronous optimization task.
    Returns a job_id for status polling.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    job_id = str(uuid.uuid4())
    job_dir = storage.get_job_dir(job_id)
    
    # Save uploaded file
    file_path = os.path.join(job_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Trigger task
    # Note: Using .delay() which is a shortcut for apply_async()
    task = process_pdf_optimization.delay(
        job_id=job_id,
        input_filename=file.filename,
        settings_dict={"level": level}
    )
    
    return {
        "job_id": job_id,
        "task_id": task.id,
        "status": "queued",
        "level": level,
        "input_file": file.filename
    }

@router.get("/status/{task_id}")
async def get_optimization_status(task_id: str):
    """
    Check the status of an optimization task using the Celery task ID.
    Supports granular progress info.
    """
    task_result = AsyncResult(task_id, app=celery_app)
    
    result = {
        "task_id": task_id,
        "status": task_result.status,
    }
    
    if task_result.status == "PROGRESS":
        result["meta"] = task_result.info
    elif task_result.ready():
        if task_result.successful():
            result["result"] = task_result.result
        else:
            result["error"] = str(task_result.result)
            
    return result

@router.get("/download/{job_id}/{filename}")
async def download_optimized_file(job_id: str, filename: str):
    """
    Retrieve the optimized PDF file.
    Decrypts the file on-the-fly in-memory if encrypted, or serves normally if unencrypted.
    """
    # Security: Ensure we don't allow path traversal
    if ".." in job_id or ".." in filename:
         raise HTTPException(status_code=403, detail="Forbidden")

    job_dir = storage.get_job_dir(job_id)
    
    # Secure lookup candidates (checking encrypted first)
    candidates = [
        (os.path.join(job_dir, f"optimized_{filename}.enc"), True),
        (os.path.join(job_dir, f"{filename}.enc"), True),
        (os.path.join(job_dir, f"optimized_{filename}"), False),
        (os.path.join(job_dir, filename), False)
    ]
    
    target_path = None
    is_encrypted = False
    
    for path, enc in candidates:
        if os.path.exists(path):
            target_path = path
            is_encrypted = enc
            break
            
    if not target_path:
        raise HTTPException(status_code=404, detail="File not found")

    if is_encrypted:
        try:
            # Dynamic in-memory decryption
            decrypted_bytes = decrypt_file(target_path)
            return StreamingResponse(
                io.BytesIO(decrypted_bytes),
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f"attachment; filename={filename}",
                    "Cache-Control": "no-store, no-cache, must-revalidate"
                }
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to decrypt file: {str(e)}")
            
    # Fallback for unencrypted legacy files
    return FileResponse(
        path=target_path,
        filename=filename,
        media_type="application/pdf"
    )

