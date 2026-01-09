import os
from sqlalchemy import create_engine, text
from passlib.context import CryptContext

# --- CONFIGURATION ---
TARGET_EMAIL = "admin@digifortlabs.com"
NEW_PASSWORD = "Keva!2902"
DATABASE_URL = "postgresql://postgres:Keva%212902@digifort-demo-db.crs4e62wi3w2.ap-south-1.rds.amazonaws.com:5432/postgres?sslmode=require"

# --- SETUP HASHING ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def reset_password():
    print(f"🔌 Connecting to Live RDS...")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            # 1. Check if user exists
            result = connection.execute(text("SELECT user_id, email, is_active FROM users WHERE email = :email"), {"email": TARGET_EMAIL})
            user = result.fetchone()
            
            if not user:
                print(f"❌ User {TARGET_EMAIL} not found!")
                return

            print(f"✅ User found: ID={user[0]}, Active={user[2]}")

            # 2. Update Password
            new_hash = get_password_hash(NEW_PASSWORD)
            update_query = text("UPDATE users SET hashed_password = :pwd, is_active = true WHERE email = :email")
            connection.execute(update_query, {"pwd": new_hash, "email": TARGET_EMAIL})
            connection.commit()
            
            print(f"🎉 Password successfully reset to: {NEW_PASSWORD}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    reset_password()
