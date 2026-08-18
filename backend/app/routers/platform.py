import logging
logger = logging.getLogger(__name__)
from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os

from ..database import get_db
from ..crud import crud_all
from ..models import SystemSetting, User, UserRole, Permission
from ..routers.auth import get_current_user, require_permission
from ..audit import log_audit

router = APIRouter()

class SettingUpdate(BaseModel):
    value: str

@router.get("/health")
async def health_check():
    """System health check for monitoring and load balancers."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@router.get("/settings")
@router.get("/settings/", include_in_schema=False)
async def get_settings(db: Session = Depends(get_db)):
    # All users can arguably see settings (like announcement), but only admin can edit.
    try:
        settings = crud_all.system_setting.get_multi(db)
        # Filter out any unexpected None entries to prevent AttributeError
        return {s.key: s.value for s in settings if s}
    except Exception as e:
        logger.info(f"? Settings Critical Error: {e}")
        # Return empty dict instead of 500 if possible, or at least log it
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error while fetching settings: {str(e)}")

@router.post("/settings/{key}")
async def update_setting(key: str, update: SettingUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.MANAGE_PLATFORM_SETTINGS))):
    # RBAC handles authorization instead of hardcoded SUPER_ADMIN check
    
    setting = crud_all.system_setting.get_first(db, SystemSetting.key == key)
    if not setting:
        setting = SystemSetting(key=key, value=update.value)
        db.add(setting)
    else:
        setting.value = update.value
    
    db.commit()
    
    try:
        log_audit(db, current_user.user_id, "SETTING_UPDATED", f"Updated system setting: {key} = {update.value}")
    except Exception as e:
        logger.info(f"Audit Log Error: {e}")

    return {"status": "success", "key": key, "value": update.value}

@router.post("/clear-cache")
async def clear_system_cache(
    request: Request,
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission(Permission.MANAGE_PLATFORM_SETTINGS))
):
    """
    Clears server-side statistics and logs a system-wide cache clear event.
    """

    # Reset in-memory statistics
    app_state = request.app.state
    app_state.total_requests = 0
    app_state.total_latency = 0.0
    
    # Log Audit
    try:
        log_audit(db, current_user.user_id, "SYSTEM_CACHE_CLEARED", "User triggered a manual system cache clear")
    except Exception as e:
        logger.info(f"Audit Log Error: {e}")

    return {
        "status": "success",
        "message": "System cache and metrics have been reset.",
        "timestamp": datetime.now().isoformat()
    }

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
    candidates = crud_all.p_d_f_file.get_multi(db, 
        PDFFile.upload_status == 'confirmed',
        PDFFile.is_searchable == False,
        PDFFile.processing_stage != 'analyzing' # Skip already running
    ).limit(limit)
    
    if not candidates:
        return {"status": "success", "message": "No pending files found for OCR."}

    from ..routers.patients import run_manual_ocr_task
    
    count = 0
    for file in candidates:
        file.processing_stage = 'analyzing'
        background_tasks.add_task(run_manual_ocr_task, file.file_id) # Fixed: Do not pass DB session
        count += 1
    
    db.commit() # Save 'analyzing' state

    try:
        log_audit(db, current_user.user_id, "BULK_OCR_TRIGGERED", f"Triggered OCR for {count} files")
    except Exception as e:
        logger.info(f"Audit Log Error: {e}")
    
    return {
        "status": "success", 
        "message": f"Triggered OCR for {count} files.", 
        "candidates": [f.file_id for f in candidates]
    }

@router.get("/system-error-logs")
async def get_system_error_logs(
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission(Permission.VIEW_ALL_AUDITS)),
    limit: int = 50
):
    """
    Returns the latest system errors from the database.
    Secured by VIEW_ALL_AUDITS permission.
    """

    try:
        from ..models import SystemErrorLog
        logs = db.query(SystemErrorLog).order_by(SystemErrorLog.timestamp.desc()).limit(limit).all()
        
        formatted_logs = []
        for l in logs:
            msg_parts = l.message.split(" | ")
            method = ""
            endpoint = ""
            err_msg = msg_parts[0]
            
            if len(msg_parts) > 1:
                req_parts = msg_parts[1].split(" ", 1)
                if len(req_parts) == 2:
                    method = req_parts[0]
                    endpoint = req_parts[1]
                else:
                    endpoint = msg_parts[1]
            
            formatted_logs.append({
                "id": l.id,
                "error_type": l.severity,
                "module": l.module,
                "error_message": err_msg,
                "method": method,
                "endpoint": endpoint,
                "timestamp": l.timestamp
            })
            
        return formatted_logs
    except Exception as e:
        logger.info(f"System Error Logs fetching error: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch system error logs")

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

    try:
        pending = crud_all.p_d_f_file.count(db, 
            PDFFile.upload_status == 'confirmed',
            PDFFile.is_searchable == False,
            PDFFile.processing_stage != 'analyzing'
        )

        analyzing = crud_all.p_d_f_file.count(db, 
            PDFFile.processing_stage == 'analyzing'
        )

        completed = crud_all.p_d_f_file.count(db, 
            PDFFile.is_searchable == True
        )

        return {
            "pending_ocr": pending,
            "analyzing": analyzing,
            "completed_ocr": completed
        }
    except Exception as e:
        logger.info(f"OCR Status Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ocr-logs")
async def get_ocr_logs(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.PLATFORM_STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    log_file = os.path.join(os.getcwd(), "backend", "logs", "ocr_debug.log")
    logs = []
    try:
        if os.path.exists(log_file):
            with open(log_file, "r", encoding="utf-8") as f:
                logs = f.readlines()
                # Get last 50 lines
                logs = logs[-50:]
                logs = [l.strip() for l in logs]
        else:
             logs = ["Log file not found."]
    except Exception as e:
        logger.info(f"Error reading logs: {e}")
        logs = [f"Error reading logs: {e}"]
        
    return {"logs": logs}

@router.get("/desktop-version")
async def get_desktop_version():
    """
    Returns the latest version of the desktop scanner app.
    Used by the app to check for updates on startup.
    """
    return {
        "latest_version": "2.1", # Updated to match new build
        "message": "A new version (v2.1) is available with MRD naming support. Please update."
    }

from fastapi.responses import FileResponse
import os

@router.get("/scanner-download")
async def download_scanner_app():
    """
    Downloads the current scanner app.
    """
    # Optimized for Docker deployment: files are copied into the backend image
    # The path is relative to the app root in the container
    exe_path = os.path.join(os.getcwd(), "app", "static", "DigifortScanner.exe")
    
    if os.path.exists(exe_path):
        return FileResponse(exe_path, media_type='application/vnd.microsoft.portable-executable', filename="DigifortScanner.exe")
    else:
        # Fallback for different environments or local dev
        fallbacks = [
            "backend/app/static/DigifortScanner.exe",
            "local_scanner/dist/DigifortScanner.exe"
        ]
        for path in fallbacks:
            if os.path.exists(path):
                return FileResponse(path, media_type='application/vnd.microsoft.portable-executable', filename="DigifortScanner.exe")
                
        raise HTTPException(status_code=404, detail="Scanner app not found on server.")

@router.get("/mrd-usage-report/{hospital_id}")
async def get_mrd_usage_report(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.MANAGE_PLATFORM_SETTINGS))
):
    """Calculates manual MRD usage report for a hospital tenant (Super Admin only)."""
    try:
        from ..services.mrd_metering import calculate_mrd_usage
        report = calculate_mrd_usage(db, hospital_id)
        return report
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error calculating MRD usage report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-mrd-invoice/{hospital_id}")
async def generate_manual_mrd_invoice(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.MANAGE_PLATFORM_SETTINGS))
):
    """Manually generates and records an MRD usage invoice for a tenant (Super Admin only)."""
    try:
        from ..services.mrd_metering import calculate_mrd_usage
        report = calculate_mrd_usage(db, hospital_id)
        
        log_audit(
            db, 
            current_user.user_id, 
            "MANUAL_MRD_INVOICE_GENERATED", 
            f"Generated MRD invoice for hospital {hospital_id}. Total: ₹{report['billing_breakdown']['total_mrd_bill']}"
        )
        db.commit()
        
        return {
            "status": "success",
            "message": f"MRD usage invoice generated for {report['legal_name']}",
            "invoice_details": report
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating manual MRD invoice: {e}")
        raise HTTPException(status_code=500, detail=str(e))

