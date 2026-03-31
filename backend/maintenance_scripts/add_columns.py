from sqlalchemy import text
from app.database import engine

def add_columns():
    with engine.connect() as conn:
        print("Checking database columns...")
        
        # 1. PhysicalBox.category
        try:
            # Try selecting the column
            conn.execute(text("SELECT category FROM physical_boxes LIMIT 1"))
            print("✅ physical_boxes.category already exists.")
        except Exception:
            print("⚠️ physical_boxes.category missing. Adding it...")
            conn.rollback() # Reset transaction
            try:
                # Add the column. Syntax works for both SQLite and Postgres usually
                conn.execute(text("ALTER TABLE physical_boxes ADD COLUMN category VARCHAR(50) DEFAULT 'IPD'"))
                conn.commit()
                print("✅ Added physical_boxes.category")
            except Exception as e:
                print(f"❌ Failed to add column: {e}")
                
if __name__ == "__main__":
    add_columns()
