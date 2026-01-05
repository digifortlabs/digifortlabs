from sqlalchemy.orm import Session
from .models import AuditLog

def log_audit(db: Session, user_id: int | None, action: str, details: str):
    new_log = AuditLog(
        user_id=user_id,
        action=action,
        details=details
    )
    db.add(new_log)
    db.commit()
