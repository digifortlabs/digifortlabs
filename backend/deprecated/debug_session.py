import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Try to load environment variables
load_dotenv(override=True)

# Connection configurations to try
configs = [
    os.getenv("DATABASE_URL"),
    "postgresql://digifort_admin:Digif0rtlab$@localhost:5433/digifort_db",
    "postgresql://postgres:password@localhost:5432/digifortlabs"
]

def check_db(url):
    if not url:
        return False
    print(f"\n--- Testing: {url.split('@')[-1]} ---")
    try:
        engine = create_engine(url, connect_args={'connect_timeout': 5})
        with engine.connect() as conn:
            print("✅ Connection successful!")
            
            # Check users table
            print("\nChecking 'users' table:")
            try:
                res = conn.execute(text("SELECT user_id, email, full_name, role, current_session_id FROM users")).fetchall()
                print(f"Found {len(res)} users.")
                for row in res:
                    print(f"  - ID: {row[0]}, Email: {row[1]}, Role: {row[3]}, Session: {row[4]}")
            except Exception as e:
                print(f"❌ Error querying users: {e}")
                
                # Check column existence
                print("\nChecking columns in 'users' table:")
                res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'")).fetchall()
                cols = [r[0] for r in res]
                print(f"Available columns: {', '.join(cols)}")
                
            return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    success = False
    for url in configs:
        if check_db(url):
            success = True
            break
            
    if not success:
        print("\n❌ Could not connect to any database. Is the SSH tunnel or local Postgres running?")
        sys.exit(1)
