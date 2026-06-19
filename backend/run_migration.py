from sqlalchemy import text
from app.database import engine

def run_migration():
    print("Starting database migration...")
    with engine.begin() as conn:
        # Add advance_balance
        try:
            conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS advance_balance DOUBLE PRECISION DEFAULT 0.0;"))
            print("Successfully added column 'advance_balance' to 'patients' table.")
        except Exception as e:
            print(f"Error adding 'advance_balance': {e}")
            
        # Add cashless_approved_amount
        try:
            conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS cashless_approved_amount DOUBLE PRECISION DEFAULT 0.0;"))
            print("Successfully added column 'cashless_approved_amount' to 'patients' table.")
        except Exception as e:
            print(f"Error adding 'cashless_approved_amount': {e}")
            
        # Add total_paid
        try:
            conn.execute(text("ALTER TABLE patients ADD COLUMN IF NOT EXISTS total_paid DOUBLE PRECISION DEFAULT 0.0;"))
            print("Successfully added column 'total_paid' to 'patients' table.")
        except Exception as e:
            print(f"Error adding 'total_paid': {e}")
            
    print("Migration finished.")

if __name__ == "__main__":
    run_migration()
