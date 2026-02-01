
from sqlalchemy import create_engine, text
try:
    from app.database import SQLALCHEMY_DATABASE_URL
except ImportError:
    import os
    from dotenv import load_dotenv
    load_dotenv()
    POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password")
    POSTGRES_SERVER = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB = os.getenv("POSTGRES_DB", "digifortlabs")
    SQLALCHEMY_DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"

def migrate_patients():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        print("--- Migrating Patients Table (Adding Medical Fields) ---")
        columns_to_add = [
            ("doctor_name", "VARCHAR"),
            ("weight", "VARCHAR"),
            ("diagnosis", "TEXT"),
            ("operative_notes", "TEXT"),
            ("mediclaim", "VARCHAR"),
            ("medical_summary", "TEXT"),
            ("remarks", "TEXT")
        ]
        
        for col_name, col_type in columns_to_add:
            try:
                print(f"Adding column {col_name}...")
                conn.execute(text(f"ALTER TABLE patients ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                print(f"✅ Added {col_name}")
            except Exception as e:
                print(f"❌ Error adding {col_name}: {e}")
        
        conn.commit()
        print("Migration completed successfully.")

if __name__ == "__main__":
    migrate_patients()
