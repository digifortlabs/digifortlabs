import os
from sqlalchemy import create_engine
from app.models import Base
from app.database import SQLALCHEMY_DATABASE_URL

# Default fallback if environment variable is not picked up
db_url = os.getenv("DATABASE_URL", "sqlite:///./digifortlabs.db")
print(f"Connecting to database: {db_url}")

# Create engine
engine = create_engine(db_url, connect_args={"check_same_thread": False} if "sqlite" in db_url else {})

def init_ent_db():
    print("Creating ENT module tables...")
    try:
        # This will create any tables that are defined in models.py
        # but don't exist in the database yet.
        # Tables that already exist will be ignored.
        Base.metadata.create_all(bind=engine)
        print("ENT tables created successfully.")
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    init_ent_db()
