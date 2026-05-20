from sqlalchemy import create_engine, text
import sys
import os
from dotenv import load_dotenv

# Add the parent directory to sys.path to allow importing from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load Environment Variables from current directory (where migrate_v1_3.py is)
# or from root if called from there
load_dotenv(os.path.join(os.getcwd(), '.env'), override=True)
load_dotenv(os.path.join(os.getcwd(), 'backend', '.env'), override=True)

# Prefer environment variable DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ ERROR: DATABASE_URL not found in environment or .env file.")
    sys.exit(1)

# Mask password for printing
masked_url = DATABASE_URL.split('@')[-1]
print(f"🚀 Connecting to Database: {masked_url}")

engine = create_engine(DATABASE_URL)

def run_migration():
    print("🚀 Starting Production Schema Migration (v1.3)...")
    
    with engine.connect() as conn:
        # 1. Add opd_patient_id to opd_visits
        try:
            print("Checking opd_visits columns...")
            if "postgresql" in DATABASE_URL:
                res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='opd_visits'"))
                cols = [r[0] for r in res.fetchall()]
            else:
                # SQLite fallback check (unlikely in prod but good for safety)
                res = conn.execute(text("PRAGMA table_info(opd_visits)"))
                cols = [r[1] for r in res.fetchall()]
            
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
            if "postgresql" in DATABASE_URL:
                res = conn.execute(text("SELECT count(*) FROM information_schema.tables WHERE table_name='system_error_logs'"))
                exists = res.fetchone()[0] > 0
            else:
                # SQLite fallback
                res = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='system_error_logs'"))
                exists = res.fetchone() is not None

            if not exists:
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
    
    print("✅ Migration process finished.")

if __name__ == "__main__":
    run_migration()
