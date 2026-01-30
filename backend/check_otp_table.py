
import sys
import os
sys.path.append(os.getcwd())

from app.database import engine
from sqlalchemy import inspect, text

def check_table():
    inspector = inspect(engine)
    if "password_reset_otps" not in inspector.get_table_names():
        print("❌ Table 'password_reset_otps' DOES NOT EXIST!")
        return

    print("✅ Table 'password_reset_otps' exists.")
    columns = inspector.get_columns("password_reset_otps")
    for col in columns:
        print(f"Column: {col['name']} - Type: {col['type']} - Nullable: {col['nullable']} - Default: {col.get('default')}")

    # Check sequence
    print("\nChecking sequences:")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'S';"))
        sequences = [row[0] for row in result]
        print(sequences)
        
        # Check if id has default value
        result = conn.execute(text("SELECT column_default FROM information_schema.columns WHERE table_name = 'password_reset_otps' AND column_name = 'id';"))
        default_val = result.scalar()
        print(f"\nID Column Default: {default_val}")

if __name__ == "__main__":
    check_table()
