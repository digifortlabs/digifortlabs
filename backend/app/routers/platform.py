from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SystemSetting, User, UserRole
from ..routers.auth import get_current_user
from ..audit import log_audit

router = APIRouter()

class SettingUpdate(BaseModel):
    value: str

@router.get("/settings")
async def get_settings(db: Session = Depends(get_db)):
    # All users can arguably see settings (like announcement), but only admin can edit.
    settings = db.query(SystemSetting).all()
    return {s.key: s.value for s in settings}

@router.post("/settings/{key}")
async def update_setting(key: str, update: SettingUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        setting = SystemSetting(key=key, value=update.value)
        db.add(setting)
    else:
        setting.value = update.value
    
    db.commit()
    
    try:
        log_audit(db, current_user.user_id, "SETTING_UPDATED", f"Updated system setting: {key} = {update.value}")
    except Exception as e:
        print(f"Audit Log Error: {e}")

    return {"status": "success", "key": key, "value": update.value}

from fastapi import BackgroundTasks
from ..models import PDFFile

@router.post("/bulk-ocr")
async def run_bulk_ocr(
    background_tasks: BackgroundTasks,
    limit: int = 50,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Triggers OCR for files that are 'confirmed' but NOT 'is_searchable'.
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.PLATFORM_STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Find candidates
    candidates = db.query(PDFFile).filter(
        PDFFile.upload_status == 'confirmed',
        PDFFile.is_searchable == False,
        PDFFile.processing_stage != 'analyzing' # Skip already running
    ).limit(limit).all()
    
    if not candidates:
        return {"status": "success", "message": "No pending files found for OCR."}

    from ..routers.patients import run_post_confirmation_ocr
    
    count = 0
    for file in candidates:
        file.processing_stage = 'analyzing'
        background_tasks.add_task(run_post_confirmation_ocr, file.file_id, db) # Note: db session sharing might be tricky in bg tasks, ideally new session
        count += 1
    
    db.commit() # Save 'analyzing' state

    try:
        log_audit(db, current_user.user_id, "BULK_OCR_TRIGGERED", f"Triggered OCR for {count} files")
    except Exception as e:
        print(f"Audit Log Error: {e}")
    
    return {
        "status": "success", 
        "message": f"Triggered OCR for {count} files.", 
        "candidates": [f.file_id for f in candidates]
    }

@router.get("/ocr-status")
async def get_ocr_status(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Returns the count of files in different OCR stages.
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.PLATFORM_STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized")

    pending = db.query(PDFFile).filter(
        PDFFile.upload_status == 'confirmed',
        PDFFile.is_searchable == False,
        PDFFile.processing_stage != 'analyzing'
    ).count()

    analyzing = db.query(PDFFile).filter(
        PDFFile.processing_stage == 'analyzing'
    ).count()

    completed = db.query(PDFFile).filter(
        PDFFile.is_searchable == True
    ).count()

    return {
        "pending_ocr": pending,
        "analyzing": analyzing,
        "completed_ocr": completed
    }

@router.get("/ocr-logs")
async def get_ocr_logs(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.PLATFORM_STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    log_file = "backend/logs/ocr_debug.log"
    logs = []
    try:
        import os
        if os.path.exists(log_file):
            with open(log_file, "r", encoding="utf-8") as f:
                logs = f.readlines()
                # Get last 50 lines
                logs = logs[-50:]
                logs = [l.strip() for l in logs]
    except Exception as e:
        logs = [f"Error reading logs: {e}"]
        
    return {"logs": logs}
