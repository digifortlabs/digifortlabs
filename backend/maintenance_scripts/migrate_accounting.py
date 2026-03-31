
from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

def migrate():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        print("--- Migrating Accounting Config Table ---")
        try:
            # Check if columns exist (postgres specific check, or just try alter and ignore error)
            # We will try to add columns and catch "duplicate column" errors for simplicity
            
            queries = [
                "ALTER TABLE accounting_config ADD COLUMN invoice_prefix_nongst VARCHAR DEFAULT 'BOS';",
                "ALTER TABLE accounting_config ADD COLUMN next_invoice_number_nongst INTEGER DEFAULT 1;"
            ]
            
            for q in queries:
                try:
                    conn.execute(text(q))
                    print(f"Executed: {q}")
                except Exception as e:
                    print(f"Skipped (likely exists): {q} | Error: {str(e)}")
                    
            conn.commit()
            print("Migration completed successfully.")
            
        except Exception as e:
            print(f"Migration Failed: {e}")

if __name__ == "__main__":
    migrate()
