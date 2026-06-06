import os
import sys
from sqlalchemy import text
from app.database import SessionLocal, engine

def migrate():
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE password_reset_otps ADD COLUMN attempt_count INTEGER DEFAULT 0;"))
            conn.commit()
            print("Successfully added attempt_count column to password_reset_otps table.")
    except Exception as e:
        print(f"Error or column already exists: {e}")

if __name__ == "__main__":
    migrate()
