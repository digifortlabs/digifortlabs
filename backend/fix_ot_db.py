import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE operation_theaters ADD COLUMN current_surgery_name VARCHAR;"))
        conn.execute(text("ALTER TABLE operation_theaters ADD COLUMN current_anesthesia_type VARCHAR;"))
        conn.execute(text("ALTER TABLE operation_theaters ADD COLUMN current_diagnosis TEXT;"))
        conn.execute(text("ALTER TABLE operation_theaters ADD COLUMN special_requirements TEXT;"))
        conn.commit()
        print("Successfully added OT columns")
    except Exception as e:
        print(f"Error: {e}")

