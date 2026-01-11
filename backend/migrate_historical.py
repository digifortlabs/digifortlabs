from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fallback to local sqlite if not in env (matching main.py/config.py logic)
    DATABASE_URL = "sqlite:///./digifortlabs.db"

print(f"🔄 Migrating Database: {DATABASE_URL}")

from sqlalchemy import create_engine
engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("🛠️ Adding historical billing columns to 'pdf_files' table...")
        
        # PostgreSQL syntax for adding multiple columns if not exist
        if "postgresql" in DATABASE_URL:
            try:
                conn.execute(text("ALTER TABLE pdf_files ADD COLUMN IF NOT EXISTS price_per_file FLOAT DEFAULT 100.0"))
                conn.execute(text("ALTER TABLE pdf_files ADD COLUMN IF NOT EXISTS included_pages INTEGER DEFAULT 20"))
                conn.execute(text("ALTER TABLE pdf_files ADD COLUMN IF NOT EXISTS price_per_extra_page FLOAT DEFAULT 1.0"))
                conn.commit()
                print("✅ PostgreSQL Migration Success")
            except Exception as e:
                print(f"⚠️ PG Migration Warning (might already exist): {e}")
        else:
            # SQLite fallback (no IF NOT EXISTS for ADD COLUMN in older sqlite, but let's try)
            try:
                conn.execute(text("ALTER TABLE pdf_files ADD COLUMN price_per_file FLOAT DEFAULT 100.0"))
            except: pass
            try:
                conn.execute(text("ALTER TABLE pdf_files ADD COLUMN included_pages INTEGER DEFAULT 20"))
            except: pass
            try:
                conn.execute(text("ALTER TABLE pdf_files ADD COLUMN price_per_extra_page FLOAT DEFAULT 1.0"))
            except: pass
            conn.commit()
            print("✅ SQLite Migration Success")

if __name__ == "__main__":
    migrate()
