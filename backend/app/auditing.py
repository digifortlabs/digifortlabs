import json
import logging
from sqlalchemy import event, inspect
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import get_history
from .context import get_current_user_id, get_current_hospital_id
from .models import AuditLog, Base

logger = logging.getLogger(__name__)

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    from datetime import date, datetime
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    return str(obj)

def audit_after_flush(session: Session, flush_context):
    """
    Hook into SQLAlchemy's after_flush event to record all changes.
    We iterate over new, dirty, and deleted objects in the session.
    """
    user_id = get_current_user_id()
    hospital_id = get_current_hospital_id()
    
    # We may not want to log if there is no user context (e.g. background tasks)
    # But for a strict audit trail, maybe we log with user_id=None
    
    audit_records = []
    
    for obj in session.new:
        if isinstance(obj, AuditLog):
            continue
            
        mapper = inspect(obj).mapper
        table_name = mapper.local_table.name
        
        # Build state representation
        state = {}
        for attr in mapper.column_attrs:
            val = getattr(obj, attr.key)
            state[attr.key] = val
            
        details = json.dumps({"new": state}, default=json_serial)
        
        # Primary key might not be fully available if DB generates it on flush,
        # but after_flush usually has it populated if using RETURNING.
        pk = getattr(obj, mapper.primary_key[0].name, None)
        
        audit_records.append(
            AuditLog(
                user_id=user_id,
                hospital_id=hospital_id,
                action="CREATE",
                module=table_name,
                target_id=str(pk) if pk else None,
                details=details
            )
        )

    for obj in session.dirty:
        if isinstance(obj, AuditLog):
            continue
            
        mapper = inspect(obj).mapper
        table_name = mapper.local_table.name
        
        changes = {"old": {}, "new": {}}
        has_changes = False
        
        for attr in mapper.column_attrs:
            history = get_history(obj, attr.key)
            if history.has_changes():
                has_changes = True
                changes["old"][attr.key] = history.deleted[0] if history.deleted else None
                changes["new"][attr.key] = history.added[0] if history.added else None
                
        if not has_changes:
            continue
            
        details = json.dumps(changes, default=json_serial)
        pk = getattr(obj, mapper.primary_key[0].name, None)
        
        audit_records.append(
            AuditLog(
                user_id=user_id,
                hospital_id=hospital_id,
                action="UPDATE",
                module=table_name,
                target_id=str(pk) if pk else None,
                details=details
            )
        )

    for obj in session.deleted:
        if isinstance(obj, AuditLog):
            continue
            
        mapper = inspect(obj).mapper
        table_name = mapper.local_table.name
        
        state = {}
        for attr in mapper.column_attrs:
            val = getattr(obj, attr.key)
            state[attr.key] = val
            
        details = json.dumps({"old": state}, default=json_serial)
        pk = getattr(obj, mapper.primary_key[0].name, None)
        
        audit_records.append(
            AuditLog(
                user_id=user_id,
                hospital_id=hospital_id,
                action="DELETE",
                module=table_name,
                target_id=str(pk) if pk else None,
                details=details
            )
        )
        
    if audit_records:
        session.add_all(audit_records)

def setup_auditing():
    from .database import SessionLocal
    event.listen(SessionLocal, 'after_flush', audit_after_flush)
