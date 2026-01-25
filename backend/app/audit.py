import logging
from typing import Optional
from sqlalchemy.orm import Session
from .models import AuditLog

# Get file-based loggers
auth_logger = logging.getLogger('auth')
activity_logger = logging.getLogger('activity')
system_logger = logging.getLogger('system')

def log_audit(db: Session, user_id: Optional[int], action: str, details: str, hospital_id: Optional[int] = None):
    # 1. DB Audit (Always Source of Truth for Dashboard)
    new_log = AuditLog(
        user_id=user_id,
        hospital_id=hospital_id,
        action=action,
        details=details
    )
    db.add(new_log)
    
    # 2. File Audit (Categorized)
    try:
        log_msg = f"User: {user_id} | Hosp: {hospital_id} | Action: {action} | {details}"
        
        if any(x in action for x in ['LOGIN', 'LOGOUT', 'AUTH', 'PASSWORD', 'USER', 'ADMIN']):
            auth_logger.info(log_msg)
            
        elif any(x in action for x in ['FILE', 'PATIENT', 'UPLOAD', 'DOWNLOAD', 'VIEW', 'PRINT', 'OCR']):
            activity_logger.info(log_msg)
            
        elif any(x in action for x in ['SYSTEM', 'ERROR', 'CONFIG', 'HOSPITAL']):
            system_logger.info(log_msg)
            
        else:
            # Fallback for unknown categories
            system_logger.info(log_msg)
            
    except Exception as e:
        print(f"File Logging Error: {e}")

    # db.commit() # Caller must commit to reduce transaction overhead
