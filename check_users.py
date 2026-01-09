import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Live RDS Connection
DATABASE_URL = "postgresql://postgres:Keva%212902@digifort-demo-db.crs4e62wi3w2.ap-south-1.rds.amazonaws.com:5432/postgres?sslmode=require"

def check_users():
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            result = connection.execute(text("SELECT user_id, email, role, is_active FROM users WHERE email = 'admin@digifortlabs.com'"))
            user = result.fetchone()
            if user:
                print(f"User Found: ID={user[0]}, Email={user[1]}, Role={user[2]}, Active={user[3]}")
            else:
                print("User 'admin@digifortlabs.com' NOT FOUND in Live DB.")
                
            # List all users just in case
            print("\nAll Users:")
            all_users = connection.execute(text("SELECT user_id, email, role FROM users"))
            for u in all_users:
                print(f"- {u[0]}: {u[1]} ({u[2]})")
                
    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    check_users()
