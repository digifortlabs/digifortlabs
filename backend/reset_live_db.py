import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add current directory to path to import app modules
sys.path.append(os.getcwd())

from app.database import Base
from app.models import User, UserRole
from app.utils import get_password_hash

# LIVE RDS CONNECTION STRING
DATABASE_URL = "postgresql://postgres:Keva%212902@digifort-demo-db.crs4e62wi3w2.ap-south-1.rds.amazonaws.com:5432/postgres?sslmode=require"

def reset_database():
    print(f"🔥 CONNECTING TO LIVE DATABASE: {DATABASE_URL}")
    confirm = input("⚠️  WARNING: THIS WILL DELETE ALL DATA IN THE LIVE DATABASE. Type 'DELETE' to confirm: ")
    if confirm != "DELETE":
        print("❌ Aborted.")
        return

    engine = create_engine(DATABASE_URL)
    
    print("🗑️  Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("🏗️  Re-creating schema...")
    Base.metadata.create_all(bind=engine)
    
    print("👤 Creating Super Admin User...")
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        admin = User(
            email="admin@digifortlabs.com",
            hashed_password=get_password_hash("Keva!2902"),
            plain_password="Keva!2902",
            role=UserRole.SUPER_ADMIN,
            is_active=True,
            force_password_change=False
        )
        db.add(admin)
        db.commit()
        print("✅ Super Admin Created: admin@digifortlabs.com / Keva!2902")
        print("🎉 Database Reset Complete!")
        
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_database()
