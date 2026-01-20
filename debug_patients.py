from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.database import Base
from app.models import Patient

SQLALCHEMY_DATABASE_URL = "sqlite:///./backend/digifortlabs.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_patients():
    db = SessionLocal()
    try:
        # 1. Raw SQL Check
        print("--- Raw SQL Check ---")
        with engine.connect() as con:
            result = con.execute(text("SELECT record_id, age, typeof(age) FROM patients LIMIT 5"))
            for row in result:
                print(f"ID: {row[0]}, Age: {row[1]}, Type: {row[2]}")

        # 2. ORM Check
        print("\n--- ORM Check ---")
        patients = db.query(Patient).limit(5).all()
        for p in patients:
            print(f"ID: {p.record_id}, Age: {p.age}, Type: {type(p.age)}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_patients()
