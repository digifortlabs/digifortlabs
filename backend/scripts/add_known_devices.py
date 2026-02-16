from sqlalchemy import create_engine, text
import os
import sys

# Hack: Add parent dir to path to find "app"
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

from app.core.config import settings

def migrate():
    print(f"🔌 Connecting to database: {settings.POSTGRES_SERVER}...")
    # SQL Alchemy connection string
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as connection:
        # Check if column exists
        print("Checking users table...")
        check_query = text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='known_devices';")
        result = connection.execute(check_query).fetchone()
        
        if not result:
            print("🚀 'known_devices' column missing. Adding it now...")
            # Add column as TEXT (storing JSON string)
            alter_query = text("ALTER TABLE users ADD COLUMN known_devices TEXT DEFAULT '[]';")
            connection.execute(alter_query)
            connection.commit()
            print("✅ Column 'known_devices' added successfully.")
        else:
            print("ℹ️ Column 'known_devices' already exists.")

if __name__ == "__main__":
    if not settings.DATABASE_URL:
        print("❌ DATABASE_URL not found in environment.")
        exit(1)
    migrate()
