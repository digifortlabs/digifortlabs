import os
from datetime import datetime

from sqlalchemy.orm import Session

from ..celery_app import celery_app
from .database import SessionLocal
from .models import TempAccessCache


@celery_app.task
def cleanup_expired_files():
    """
    Runs daily or hourly. 
    Checks 'temp_access_cache' for files where expiry_timestamp < now.
    Deletes the local file and removes the DB record.
    """
    db: Session = SessionLocal()
    try:
        now = datetime.utcnow()
        expired_entries = db.query(TempAccessCache).filter(TempAccessCache.expiry_timestamp < now).all()
        
        deleted_count = 0
        for entry in expired_entries:
            if entry.local_path and os.path.exists(entry.local_path):
                try:
                    os.remove(entry.local_path)
                    print(f"Deleted file: {entry.local_path}")
                except OSError as e:
                    print(f"Error deleting {entry.local_path}: {e}")
            
            db.delete(entry)
            deleted_count += 1
        
        db.commit()
        return f"Cleanup complete. Removed {deleted_count} expired files."
    finally:
        db.close()

@celery_app.task
def reset_monthly_bandwidth():
    """
    Runs on the 1st of every month.
    Archives old usage (optional) and ensures new month starts fresh.
    """
    db: Session = SessionLocal()
    try:
        # In this simple model, we just rely on the application to create a NEW row 
        # for the new month_year string when a request comes in (see bandwidth.py).
        # However, we can use this task to send "Monthly Usage Reports" emails.
        
        current_month = datetime.utcnow().strftime("%Y-%m")
        print(f"Monthly Reset Task ran for {current_month}. (Rows are auto-created on demand).")
        
        # Example Logic: Alert hospitals nearing quota from PREVIOUS month?
        pass
    finally:
        db.close()
