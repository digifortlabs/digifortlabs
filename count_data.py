from app.database import SessionLocal
from sqlalchemy import text
import sys

def count_all_data():
    try:
        db = SessionLocal()
        # Get all table names
        res = db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
        tables = [row[0] for row in res]
        
        print(f"Checking {len(tables)} tables...")
        for table in tables:
            count = db.execute(text(f"SELECT count(*) FROM {table}")).scalar()
            print(f"- {table}: {count} records")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    count_all_data()
