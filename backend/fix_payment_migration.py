from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.connect() as conn:
        print("Starting Robust Migration...")
        transaction = conn.begin()
        try:
            # Check existence using information_schema
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='pdf_files' AND column_name='is_paid';
            """)
            result = conn.execute(check_query).fetchone()
            
            if result:
                print("Column 'is_paid' already exists.")
            else:
                print("Adding columns...")
                conn.execute(text("ALTER TABLE pdf_files ADD COLUMN is_paid BOOLEAN DEFAULT FALSE"))
                conn.execute(text("ALTER TABLE pdf_files ADD COLUMN payment_date TIMESTAMP NULL"))
                print("Columns added.")
            
            transaction.commit()
            print("Migration Successful!")
            
        except Exception as e:
            transaction.rollback()
            print(f"Migration Failed: {e}")

if __name__ == "__main__":
    run_migration()
