import re
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models import Hospital

def get_hospital_id_settings(db: Session, hospital_id: int, module: str) -> dict:
    """Fetch ID generation settings for a specific module."""
    hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
    if not hospital:
        return {}
    
    settings = hospital.id_generation_settings or {}
    
    # Handle legacy settings if they exist (e.g., uhid_prefix)
    if module == "uhid" and "uhid_prefix" in settings and "uhid" not in settings:
        return {
            "prefix": settings.get("uhid_prefix", "DF-"),
            "padding": settings.get("uhid_padding", 4),
            "postfix": settings.get("uhid_postfix", ""),
            "mode": "auto"
        }
        
    return settings.get(module, {})

def process_template(template: str, date_ref: Optional[datetime] = None) -> str:
    """Replaces date placeholders like {YYYY} with actual date components."""
    if not date_ref:
        date_ref = datetime.now()
        
    res = template
    res = res.replace("{YYYY}", date_ref.strftime("%Y"))
    res = res.replace("{YY}", date_ref.strftime("%y"))
    res = res.replace("{MM}", date_ref.strftime("%m"))
    res = res.replace("{DD}", date_ref.strftime("%d"))
    return res

def generate_next_id(db: Session, hospital_id: int, module: str, model_class, id_column, date_ref: Optional[datetime] = None) -> str:
    """
    Generates the next sequential ID based on hospital configurations.
    
    Args:
        db: Database session
        hospital_id: ID of the hospital
        module: The config key (e.g., 'uhid', 'invoice')
        model_class: SQLAlchemy model to query
        id_column: SQLAlchemy column for the ID
        date_ref: Reference date for dynamic prefixes (defaults to now)
    """
    settings = get_hospital_id_settings(db, hospital_id, module)
    
    # Default configurations if none set
    prefix_template = settings.get("prefix", f"{module.upper()}-")
    padding = int(settings.get("padding", 4))
    
    if not date_ref:
        date_ref = datetime.now()
        
    # E.g. "INV-{YYYY}-" -> "INV-2026-"
    prefix = process_template(prefix_template, date_ref)
    
    # Fetch existing IDs that start with this prefix to find the max
    query = db.query(id_column).filter(
        id_column.like(f"{prefix}%")
    )
    
    # Check if the model has a hospital_id column to restrict the search
    if hasattr(model_class, 'hospital_id'):
        hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
        if hospital and hospital.group_id:
            group_hospitals = db.query(Hospital.hospital_id).filter(Hospital.group_id == hospital.group_id).all()
            group_hospital_ids = [h[0] for h in group_hospitals]
            query = query.filter(model_class.hospital_id.in_(group_hospital_ids))
        else:
            query = query.filter(model_class.hospital_id == hospital_id)
        
    results = query.all()
    
    max_val = 0
    for r in results:
        uid = r[0]
        if not uid: continue
        
        # Remove prefix to isolate the numerical part
        if uid.startswith(prefix):
            remainder = uid[len(prefix):]
            # Match digits at the start of the remainder
            match = re.search(r'^(\d+)', remainder)
            if match:
                val = int(match.group(1))
                if val > max_val:
                    max_val = val
                    
    next_val = max_val + 1
    padded = str(next_val).zfill(padding)
    
    # Optional postfix? (Legacy support)
    postfix = settings.get("postfix", "")
    
    return f"{prefix}{padded}{postfix}"
