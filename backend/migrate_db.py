
import os
import sys
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

# Import all models to ensure they are registered with Base
from app.models import Base
from app.database import SQLALCHEMY_DATABASE_URL as SQLITE_URL

def migrate_to_rds(rds_url):
    """
    Migrates data from local SQLite to RDS PostgreSQL.
    """
    print("==========================================")
    print("   SQLITE TO RDS MIGRATION TOOL")
    print("==========================================")

    # 1. Connect to SQLite (Source)
    print(f"[1/5] Connecting to Source: {SQLITE_URL}...")
    source_engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
    SourceSession = sessionmaker(bind=source_engine)
    source_session = SourceSession()

    # 2. Connect to RDS (Destination)
    print(f"[2/5] Connecting to Destination: {rds_url.split('@')[-1]}...")
    dest_engine = create_engine(rds_url)
    DestSession = sessionmaker(bind=dest_engine)
    dest_session = DestSession()

    # 3. Create Tables in Destination
    print("[3/5] Creating Tables in Destination...")
    Base.metadata.drop_all(bind=dest_engine) # OPTIONAL: Clear dest first? Yes for clean migration.
    Base.metadata.create_all(bind=dest_engine)

    # 4. Migrate Data
    print("[4/5] Migrating Data...")
    
    # Get all tables from metadata sorted by dependency
    sorted_tables = Base.metadata.sorted_tables
    
    try:
        for table in sorted_tables:
            print(f"  - Migrating {table.name}...")
            
            # Fetch all rows from source
            rows = source_session.execute(table.select()).fetchall()
            
            if rows:
                # Insert into destination
                # We use lower-level insert to bypass some ORM overhead but keep it simple
                dest_engine.execute(table.insert(), [dict(row) for row in rows])
                print(f"    -> Transferred {len(rows)} rows.")
            else:
                print("    -> Empty table.")
        
        dest_session.commit()
        print("[SUCCESS] Data migration complete.")
        
    except Exception as e:
        print(f"[ERROR] Migration failed: {e}")
        dest_session.rollback()
        return

    # 5. Instructions
    print("\n[5/5] Migration Finished. Next Steps:")
    print("---------------------------------------")
    print("1. On your server, create a file named 'backend/.env'")
    print(f"2. Add the line: DATABASE_URL={rds_url}")
    print("3. Restart your backend server.")
    print("==========================================")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python migrate_db.py <RDS_CONNECTION_STRING>")
        print("Example: python migrate_db.py postgresql://user:pass@endpoint:5432/db")
        sys.exit(1)
    
    target_url = sys.argv[1]
    migrate_to_rds(target_url)
