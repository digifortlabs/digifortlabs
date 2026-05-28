import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy import text
from app.database import SessionLocal

def run_migration():
    db = SessionLocal()
    try:
        print("Adding opd_number to patients table...")
        db.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS opd_number VARCHAR;"))
        db.commit()
        print("Migration successful!")
    except Exception as e:
        db.rollback()
        print(f"Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
