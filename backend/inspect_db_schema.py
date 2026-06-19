import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from sqlalchemy import inspect

def test():
    db = SessionLocal()
    try:
        inspector = inspect(db.bind)
        columns = inspector.get_columns("lab_results")
        print("Columns in lab_results table:")
        for col in columns:
            print(f"  - {col['name']}: {col['type']}")
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test()
