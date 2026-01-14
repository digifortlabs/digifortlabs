from typing import Optional

from sqlalchemy.orm import Session

from .models import AuditLog


def log_audit(db: Session, user_id: Optional[int], action: str, details: str, hospital_id: Optional[int] = None):
    new_log = AuditLog(
        user_id=user_id,
        hospital_id=hospital_id,
        action=action,
        details=details
    )
    db.add(new_log)
    db.commit()
