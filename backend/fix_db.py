import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    # Add fluid_balance_log if it doesn't exist
    try:
        conn.execute(text("ALTER TABLE ipd_admissions ADD COLUMN fluid_balance_log JSON DEFAULT '[]'::json;"))
        conn.commit()
        print("Successfully added fluid_balance_log to ipd_admissions")
    except Exception as e:
        print(f"Error: {e}")

