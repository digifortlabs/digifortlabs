from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database Connection
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fallback to hardcoded or fail (for safety, failing if not in env)
    # Assuming user has .env or I can rely on existing app Context.
    # Trying to import from app.database if possible, otherwise use local string logic
    from app.database import SessionLocal
    db = SessionLocal()
else:
    engine = create_engine(DATABASE_URL)
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

def migrate_roles():
    print("Starting Role Migration...")
    
    # Mapping Old -> New
    role_map = {
        "website_admin": "superadmin",
        "website_staff": "superadmin_staff",
        "mrd_staff": "warehouse_manager",
        "data_uploader": "hospital_staff",
        # "hospital_admin" remains "hospital_admin"
    }
    
    try:
        # Check current distribution
        result = db.execute(text("SELECT role, COUNT(*) FROM users GROUP BY role"))
        print("\nCurrent Role Distribution:")
        for row in result:
            print(f" - {row[0]}: {row[1]}")
            
        # Execute Updates
        print("\nUpdating Records...")
        for old_role, new_role in role_map.items():
            query = text(f"UPDATE users SET role = '{new_role}' WHERE role = '{old_role}'")
            res = db.execute(query)
            print(f" - Converted '{old_role}' -> '{new_role}': {res.rowcount} rows updated.")
            
        db.commit()
        print("\nMigration Commit Successful!")
        
        # Verify
        result = db.execute(text("SELECT role, COUNT(*) FROM users GROUP BY role"))
        print("\nNew Role Distribution:")
        for row in result:
            print(f" - {row[0]}: {row[1]}")
            
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_roles()
