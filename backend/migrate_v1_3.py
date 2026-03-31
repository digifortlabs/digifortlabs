from sqlalchemy import text
import sys
import os

# Add the parent directory to sys.path to allow importing from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine

def run_migration():
    print("🚀 Starting Production Schema Migration (v1.3)...")
    
    with engine.connect() as conn:
        # 1. Add opd_patient_id to opd_visits
        try:
            print("Checking opd_visits columns...")
            res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='opd_visits'"))
            cols = [r[0] for r in res.fetchall()]
            
            if 'opd_patient_id' not in cols:
                print("Adding opd_patient_id to opd_visits...")
                conn.execute(text("ALTER TABLE opd_visits ADD COLUMN opd_patient_id INTEGER REFERENCES opd_patients(opd_patient_id)"))
            else:
                print("opd_patient_id already exists in opd_visits.")
        except Exception as e:
            print(f"⚠️ Error migrating opd_visits: {e}")

        # 2. Create system_error_logs table
        try:
            print("Checking system_error_logs table...")
            res = conn.execute(text("SELECT count(*) FROM information_schema.tables WHERE table_name='system_error_logs'"))
            if res.fetchone()[0] == 0:
                print("Creating system_error_logs table...")
                conn.execute(text("""
                    CREATE TABLE system_error_logs (
                        id SERIAL PRIMARY KEY,
                        severity VARCHAR(50) DEFAULT 'ERROR',
                        module VARCHAR(255),
                        message TEXT NOT NULL,
                        traceback TEXT,
                        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                """))
            else:
                print("system_error_logs table already exists.")
        except Exception as e:
            print(f"⚠️ Error creating system_error_logs: {e}")

        conn.commit()
    
    print("✅ Migration completed successfully.")

if __name__ == "__main__":
    run_migration()
