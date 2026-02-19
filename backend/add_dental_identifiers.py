import sqlite3
import os
from datetime import datetime

# Database path
DB_PATH = "digifortlabs.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database '{DB_PATH}' not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if columns exist
        cursor.execute("PRAGMA table_info(dental_patients)")
        columns = [row[1] for row in cursor.fetchall()]

        # Add uhid
        if "uhid" not in columns:
            print("Adding 'uhid' column...")
            cursor.execute("ALTER TABLE dental_patients ADD COLUMN uhid TEXT")
        else:
            print("'uhid' column already exists.")

        # Add opd_number
        if "opd_number" not in columns:
            print("Adding 'opd_number' column...")
            cursor.execute("ALTER TABLE dental_patients ADD COLUMN opd_number TEXT")
        else:
            print("'opd_number' column already exists.")
            
        # Add registration_date
        if "registration_date" not in columns:
            print("Adding 'registration_date' column...")
            # Default to current time for existing records
            now_iso = datetime.now().isoformat()
            cursor.execute(f"ALTER TABLE dental_patients ADD COLUMN registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        else:
            print("'registration_date' column already exists.")

        conn.commit()
        print("Migration successful.")

    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
