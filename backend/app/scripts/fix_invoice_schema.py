import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./digifortlabs.db")
engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.connect() as conn:
        print(f"Checking for missing columns in 'invoices' table on {DATABASE_URL.split('@')[-1]}...")
        
        # Determine existing columns for PostgreSQL
        try:
            res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'invoices'"))
            existing_columns = [row[0] for row in res.fetchall()]
            print(f"Found existing columns: {existing_columns}")
        except Exception as e:
            print(f"Could not retrieve table info using information_schema: {e}")
            existing_columns = []
        
        # PostgreSQL specific types: DATETIME -> TIMESTAMP
        columns_to_add = [
            ("payment_date", "TIMESTAMP"),
            ("payment_method", "VARCHAR(255)"),
            ("transaction_id", "VARCHAR(255)"),
            ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        ]
        
        for col_name, col_type in columns_to_add:
            if col_name in existing_columns:
                print(f"Column '{col_name}' already exists.")
                continue
                
            try:
                # PostgreSQL requires explicit commit and handles transactions strictly
                conn.execute(text(f"ALTER TABLE invoices ADD COLUMN {col_name} {col_type}"))
                conn.commit() 
                print(f"Added column: {col_name}")
            except Exception as e:
                conn.rollback() 
                if "already exists" in str(e).lower():
                    print(f"Column '{col_name}' already exists (caught exception).")
                else:
                    print(f"Error adding '{col_name}': {e}")
        
    print("Migration completed.")

if __name__ == "__main__":
    run_migration()
