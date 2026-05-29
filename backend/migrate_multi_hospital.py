import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    print("Adding subdomain column to users table...")
    db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS subdomain VARCHAR;"))
    db.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_subdomain ON users (subdomain);"))
    
    print("Adding is_residential column to doctor_profiles table...")
    db.execute(text("ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS is_residential BOOLEAN DEFAULT TRUE;"))
    
    print("Dropping unique constraint on doctor_profiles.user_id...")
    # In PostgreSQL, the unique constraint on user_id is typically named doctor_profiles_user_id_key
    db.execute(text("ALTER TABLE doctor_profiles DROP CONSTRAINT IF EXISTS doctor_profiles_user_id_key;"))
    
    db.commit()
    print("Migration completed successfully!")
except Exception as e:
    db.rollback()
    print("Error:", e)
finally:
    db.close()
