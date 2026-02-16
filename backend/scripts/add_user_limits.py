import os
from sqlalchemy import create_engine, text

from dotenv import load_dotenv

# Explicitly load .env from parent directory if needed, or let load_dotenv find it
load_dotenv() 

# Get DB URL from env (same as app)
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: DATABASE_URL not found in environment.")
    exit(1)

engine = create_engine(DATABASE_URL)


def run_migration():
    with engine.connect() as conn:
        print("Migrating hospitals table...")
        try:
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN max_users INTEGER DEFAULT 2"))
            print("Added max_users column.")
        except Exception as e:
            print(f"Skipped max_users (might exist): {e}")

        try:
            conn.execute(text("ALTER TABLE hospitals ADD COLUMN per_user_price FLOAT DEFAULT 0.0"))
            print("Added per_user_price column.")
        except Exception as e:
            print(f"Skipped per_user_price: {e}")
            
        conn.commit()
        print("Migration complete.")

if __name__ == "__main__":
    run_migration()
