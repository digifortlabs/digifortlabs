from app.database import engine
from sqlalchemy import text

def migrate_pg():
    print("Migrating PostgreSQL schema...")
    with engine.connect() as conn:
        try:
            # Check existing columns
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='dental_patients'"))
            columns = [row[0] for row in result.fetchall()]
            
            # Add columns if missing
            if 'uhid' not in columns:
                print("Adding uhid column...")
                conn.execute(text("ALTER TABLE dental_patients ADD COLUMN uhid VARCHAR"))
            
            if 'opd_number' not in columns:
                print("Adding opd_number column...")
                conn.execute(text("ALTER TABLE dental_patients ADD COLUMN opd_number VARCHAR"))
                
            if 'registration_date' not in columns:
                print("Adding registration_date column...")
                conn.execute(text("ALTER TABLE dental_patients ADD COLUMN registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()"))
                
            conn.commit()
            print("Migration complete.")
        except Exception as e:
            print(f"Migration error: {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate_pg()
