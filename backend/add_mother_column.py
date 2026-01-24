from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    # Force PostgreSQL URL if needed, although safe to use settings
    print(f"Connecting to DB: {settings.DATABASE_URL}")
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # Check if column exists
            print("Checking if column 'mother_record_id' exists in 'patients'...")
            result = conn.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name='patients' AND column_name='mother_record_id'"
            ))
            exists = result.fetchone()
            
            if not exists:
                print("Column missing. Adding 'mother_record_id'...")
                conn.execute(text("ALTER TABLE patients ADD COLUMN mother_record_id INTEGER NULL"))
                conn.execute(text("ALTER TABLE patients ADD CONSTRAINT fk_mother FOREIGN KEY (mother_record_id) REFERENCES patients(record_id)"))
                conn.commit()
                print("Migration Successful!")
            else:
                print("Column already exists. No action needed.")
                
        except Exception as e:
            print(f"Migration Failed: {e}")

if __name__ == "__main__":
    migrate()
