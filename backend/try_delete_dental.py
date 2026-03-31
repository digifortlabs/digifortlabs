import os
import sys

os.environ["DATABASE_URL"] = "postgresql://digifort_admin:Digif0rtlab$@localhost:5432/digifort_db"
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
engine = create_engine(os.environ["DATABASE_URL"])

with engine.connect() as conn:
    print("Trying to delete dental_patients for hospital 8 directly...")
    try:
        conn.execute(text("DELETE FROM dental_patients WHERE hospital_id = 8"))
        conn.commit()
        print("Success! It had no children locking it.")
    except Exception as e:
        print("FAILED to delete dental_patients! Reason:")
        print(str(e))
