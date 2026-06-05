from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
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
from app.services.encryption import decrypt_file, decrypt_data
from app.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models import PDFFile, Patient, SystemSetting, AIExtraction
from app.services.s3_handler import S3Manager
from app.services.ocr import classify_document
from app.services.ai_service import AIService
from fastapi import Header, Body, BackgroundTasks
from pydantic import BaseModel
import json

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
    file_name = os.path.basename(file.filename) if file.filename else "unnamed.pdf"
    if not file_name.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    job_id = str(uuid.uuid4())
    job_dir = storage.get_job_dir(job_id)
    
    # Save uploaded file
    file_path = os.path.join(job_dir, file_name)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Trigger task
    # Note: Using .delay() which is a shortcut for apply_async()
    task = process_pdf_optimization.delay(
        job_id=job_id,
        input_filename=file_name,
        settings_dict={"level": level}
    )
    
    return {
        "job_id": job_id,
        "task_id": task.id,
        "status": "queued",
        "level": level,
        "input_file": file_name
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
            
    return FileResponse(
        path=target_path,
        filename=filename,
        media_type="application/pdf"
    )


# ==========================================
# DISTRIBUTED OCR WORKER ENDPOINTS
# ==========================================

def verify_worker_api_key(worker_api_key: str = Header(None)):
    expected_key = os.getenv("WORKER_API_KEY")
    if not expected_key or worker_api_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid WORKER_API_KEY")
    return True

class PendingJobResponse(BaseModel):
    file_id: int
    filename: str
    hospital_id: int

class OCRResultRequest(BaseModel):
    ocr_text: str

@router.get("/ocr/pending", response_model=list[PendingJobResponse])
def get_pending_ocr_jobs(db: Session = Depends(get_db), authenticated: bool = Depends(verify_worker_api_key)):
    """
    Fetch up to 20 files that are uploaded but missing OCR.
    """
    pending_files = db.query(PDFFile).join(Patient).filter(
        PDFFile.is_searchable == False,
        PDFFile.processing_stage == 'completed',
        PDFFile.upload_status == 'confirmed',
        or_(PDFFile.ocr_text is None, PDFFile.ocr_text == '')
    ).order_by(PDFFile.file_id.asc()).limit(20).all()

    results = []
    for f in pending_files:
        results.append({
            "file_id": f.file_id,
            "filename": f.filename,
            "hospital_id": f.patient.hospital_id
        })
    return results

@router.get("/ocr/{file_id}/download")
def download_file_for_ocr(file_id: int, db: Session = Depends(get_db), authenticated: bool = Depends(verify_worker_api_key)):
    """
    Streams the decrypted file bytes to the worker for OCR processing.
    """
    db_file = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
    if not db_file or not db_file.s3_key:
        raise HTTPException(status_code=404, detail="File not found")

    s3_manager = S3Manager()
    encrypted_bytes = s3_manager.get_file_bytes(str(db_file.s3_key))
    if not encrypted_bytes:
        raise HTTPException(status_code=404, detail="Physical file not found in storage")
        
    try:
        decrypted_bytes = decrypt_data(encrypted_bytes)
        return StreamingResponse(io.BytesIO(decrypted_bytes), media_type="application/pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Decryption failed")

def background_ai_extraction(file_id: int, extracted_text: str):
    from app.database import SessionLocal
    from app.models import PDFFile, Patient, SystemSetting, AIExtraction
    from app.services.ai_service import AIService
    import json
    
    db = SessionLocal()
    try:
        db_file = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
        if not db_file:
            return
            
        hospital = db_file.patient.hospital if db_file.patient else None
        ai_config = hospital.ai_settings if hospital and hospital.ai_settings else {}
        api_key = ai_config.get("api_key")
        is_enabled = ai_config.get("enabled", False)
        
        if not is_enabled or not api_key:
            platform_ai = db.query(SystemSetting).filter(SystemSetting.key == "platform_ai_settings").first()
            if platform_ai and platform_ai.value:
                try:
                    plat_cfg = json.loads(str(platform_ai.value))
                    if plat_cfg.get("enabled"):
                        api_key = plat_cfg.get("api_key")
                        is_enabled = True
                except:
                    pass
                
        if is_enabled and api_key:
            try:
                ai_svc = AIService(api_key=api_key)
                structured_data = ai_svc.extract_patient_details(extracted_text)
                if structured_data:
                    extraction_record = AIExtraction(
                        file_id=file_id,
                        raw_json=json.dumps(structured_data, indent=2),
                        extracted_text=extracted_text,
                        visit_type=structured_data.get('patient_category') or "OPD",
                        doctor_name=structured_data.get('doctor_name'),
                        summary=structured_data.get('diagnosis')
                    )
                    db.add(extraction_record)
                    db.commit()
            except Exception:
                pass
    finally:
        db.close()

@router.post("/ocr/{file_id}/result")
def submit_ocr_result(
    file_id: int, 
    background_tasks: BackgroundTasks,
    request: OCRResultRequest = Body(...), 
    db: Session = Depends(get_db), 
    authenticated: bool = Depends(verify_worker_api_key)
):
    """
    Receives OCR text from worker, updates DB, and attempts AI extraction in background.
    """
    db_file = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
        
    extracted_text = request.ocr_text.strip()
    if extracted_text:
        db_file.ocr_text = extracted_text  # type: ignore
        db_file.is_searchable = True  # type: ignore
        
        # 1. Tags
        auto_tags = classify_document(extracted_text)
        if auto_tags:
            db_file.tags = ", ".join(auto_tags)  # type: ignore
            
        # 2. Structured Extraction (Offloaded to background task)
        background_tasks.add_task(background_ai_extraction, file_id, extracted_text)
                
    db.commit()
    return {"status": "success", "file_id": file_id}

