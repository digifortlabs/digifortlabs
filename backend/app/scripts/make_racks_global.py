import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./digifortlabs.db")

engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.connect() as conn:
        print(f"Connecting to {DATABASE_URL}")
        
        if "sqlite" in DATABASE_URL:
            # SQLite doesn't directly support ALTER TABLE for nullability easily in standard SQL without table recreation,
            # but sometimes SQLAlchemy or modern SQLite PRAGMAs can help.
            # However, for simplicity in dev, we often just check if it works.
            print("SQLite detected. Nullability changes often require table recreation.")
            # We'll skip for now if it's sqlite as it's dev-only and might already be flexible or require more complex logic.
        else:
            print("PostgreSQL detected. Altering table...")
            try:
                conn.execute(text("ALTER TABLE physical_racks ALTER COLUMN hospital_id DROP NOT NULL;"))
                conn.commit()
                print("Successfully made hospital_id nullable in physical_racks.")
            except Exception as e:
                print(f"Error: {e}")

if __name__ == "__main__":
    run_migration()
