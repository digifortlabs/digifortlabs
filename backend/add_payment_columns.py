from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    from app.database import SessionLocal
    db = SessionLocal()
else:
    engine = create_engine(DATABASE_URL)
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

def migrate_payment_columns():
    print("Starting Payment Column Migration...")
    try:
        # Check if column exists
        try:
            db.execute(text("SELECT is_paid FROM pdf_files LIMIT 1"))
            print("Column 'is_paid' already exists. Skipping.")
        except Exception:
            print("Column 'is_paid' missing. Adding...")
            db.execute(text("ALTER TABLE pdf_files ADD COLUMN is_paid BOOLEAN DEFAULT FALSE"))
            db.execute(text("ALTER TABLE pdf_files ADD COLUMN payment_date TIMESTAMP NULL"))
            db.commit()
            print("Columns added successfully!")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_payment_columns()
