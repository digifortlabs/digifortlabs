import os
import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

def apply_migrations():
    print("🚀 Starting Schema Migration...")
    print(f"Target Database: {settings.POSTGRES_SERVER} / {settings.POSTGRES_DB}")
    
    engine = create_engine(settings.DATABASE_URL)
    
    commands = [
        # 1. Add patient_category column to patients
        """
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='patient_category') THEN 
                ALTER TABLE patients ADD COLUMN patient_category VARCHAR DEFAULT 'STANDARD'; 
                CREATE INDEX ix_patients_patient_category ON patients(patient_category);
                RAISE NOTICE 'Added patient_category column';
            END IF; 
        END $$;
        """,
        
        # 2. Add is_open column to physical_boxes
        """
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='physical_boxes' AND column_name='is_open') THEN 
                ALTER TABLE physical_boxes ADD COLUMN is_open BOOLEAN DEFAULT TRUE; 
                RAISE NOTICE 'Added is_open column';
            END IF; 
        END $$;
        """
    ]

    with engine.connect() as conn:
        for cmd in commands:
            try:
                conn.execute(text(cmd))
                print("✅ Command Executed Successfully")
            except Exception as e:
                print(f"⚠️ Error executing command: {e}")
        conn.commit()
        
    print("🎉 Migration Complete!")

if __name__ == "__main__":
    apply_migrations()
