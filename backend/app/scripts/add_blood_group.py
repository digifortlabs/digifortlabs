import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy import text
from app.database import SessionLocal

def run_migration():
    db = SessionLocal()
    
    try:
        db.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_group VARCHAR;"))
        db.commit()
        print("Added blood_group to patients.")
    except Exception as e:
        db.rollback()
        print(f"Failed to add blood_group: {e}")

    db.close()

if __name__ == "__main__":
    run_migration()
