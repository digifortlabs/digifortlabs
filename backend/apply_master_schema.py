
import sys
import os
from sqlalchemy import text
from app.database import SessionLocal

# Ensure we can import 'app'
sys.path.append(os.getcwd())

def apply_master_schema():
    db = SessionLocal()
    try:
        print("🔄 Applying Master Warehouse Schema Changes...")
        
        # 1. Add last_box_seq to physical_racks
        print(" -> Updating physical_racks...")
        db.execute(text("ALTER TABLE physical_racks ADD COLUMN IF NOT EXISTS last_box_seq INTEGER DEFAULT 0"))

        # 2. Add new columns to physical_boxes
        print(" -> Updating physical_boxes...")
        db.execute(text("ALTER TABLE physical_boxes ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'OPEN'"))
        db.execute(text("ALTER TABLE physical_boxes ADD COLUMN IF NOT EXISTS rack_row INTEGER"))
        db.execute(text("ALTER TABLE physical_boxes ADD COLUMN IF NOT EXISTS rack_column INTEGER"))

        # 3. Add expected_return to physical_movement_logs if needed, but keeping it simple for now as per design docs
        
        db.commit()
        print("✅ Schema Updates Applied Successfully.")
        
    except Exception as e:
        print(f"❌ Error applying migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    apply_master_schema()
