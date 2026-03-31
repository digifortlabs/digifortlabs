import sys
import os

# Ensure we can import app
sys.path.append(os.getcwd())

from app.database import engine
from sqlalchemy import text

def migrate():
    print(f"Connecting to DB via engine: {engine.url}")
    with engine.connect() as conn:
        try:
            # Check if column exists
            # This logic works for SQLite. For Postgres, we'd query information_schema.
            # But the app defaults to SQLite and common env is SQLite here.
            
            # Identify DB type
            is_sqlite = 'sqlite' in str(engine.url)
            
            if is_sqlite:
                result = conn.execute(text("PRAGMA table_info(patients)"))
                columns = [row[1] for row in result.fetchall()]
                
                if 'mother_record_id' not in columns:
                    print("Adding mother_record_id column...")
                    conn.execute(text("ALTER TABLE patients ADD COLUMN mother_record_id INTEGER"))
                    print("Column added successfully.")
                else:
                    print("Column mother_record_id already exists.")
            else:
                # PostgreSQL check
                # Simplified check: just try to add and ignore "duplicate column" error
                try:
                    conn.execute(text("ALTER TABLE patients ADD COLUMN mother_record_id INTEGER REFERENCES patients(record_id)"))
                    print("Column added successfully (Postgres).")
                except Exception as e:
                    if "already exists" in str(e):
                        print("Column already exists (Postgres).")
                    else:
                        raise e
                        
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
