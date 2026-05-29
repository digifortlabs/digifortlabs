import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    print("Adding session_type column to doctor_schedules table...")
    db.execute(text("ALTER TABLE doctor_schedules ADD COLUMN session_type VARCHAR DEFAULT 'OPD';"))
    db.commit()
    print("Column added successfully!")
except Exception as e:
    db.rollback()
    print("Error:", e)
finally:
    db.close()
