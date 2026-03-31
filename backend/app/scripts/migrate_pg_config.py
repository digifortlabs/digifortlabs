import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), "backend")))

from sqlalchemy import text
from app.database import SessionLocal, engine
from app.models import AccountingConfig

def run_migration():
    print("Connecting to RDS database...")
    db = SessionLocal()
    try:
        # Check if table exists (it might not have been created yet if it's new)
        # Base.metadata.create_all(bind=engine) # This will create all missing tables
        
        columns_to_add = [
            ("company_name", "TEXT"),
            ("company_address", "TEXT"),
            ("company_email", "TEXT"),
            ("company_website", "TEXT"),
            ("company_bank_name", "TEXT"),
            ("company_bank_acc", "TEXT"),
            ("company_bank_ifsc", "TEXT")
        ]

        # First, ensure table exists
        AccountingConfig.__table__.create(bind=engine, checkfirst=True)
        print("Ensured 'accounting_config' table exists.")

        for col_name, col_type in columns_to_add:
            try:
                print(f"Adding column {col_name}...")
                db.execute(text(f"ALTER TABLE accounting_config ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                db.commit()
                print(f"Column {col_name} added or already exists.")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")
                db.rollback()

        print("Migration completed.")
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
