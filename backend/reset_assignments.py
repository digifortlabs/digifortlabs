import sys
import os
from sqlalchemy import text

# Ensure we can import 'app'
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models import Patient

def reset_assignments():
    db = SessionLocal()
    try:
        print("🔄 Resetting all Patient Box Assignments...")
        
        # Method 1: Bulk Update via SQLAlchemy ORM (slower for huge datasets but safer)
        # db.query(Patient).update({Patient.physical_box_id: None})
        
        # Method 2: Direct SQL for speed (preferred for "Reset All")
        db.execute(text("UPDATE patients SET physical_box_id = NULL"))
        db.commit()
        
        print("✅ Success: All patients are now 'Unassigned'.")
        
    except Exception as e:
        print(f"❌ Error resetting assignments: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_assignments()
