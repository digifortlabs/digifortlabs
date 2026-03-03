import sys
import os

# Add parent directory to path to import app modules
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User, Patient

DATABASE_URL = "postgresql://digifort_admin:Digif0rtlab$@127.0.0.1:5433/digifort_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

db = SessionLocal()

try:
    user = db.query(User).filter(User.email == "admin@digifortlabs.com").first()
    if not user:
        print("User not found")
        sys.exit(0)
        
    print(f"User found: {user.email}, Role: {user.role}, Hospital ID: {user.hospital_id}")
    
    # Simulate exactly what stats.py does
    target_hospital_id = user.hospital_id
    if user.role == "superadmin":
        # assuming not drilled down
        target_hospital_id = None
        print("User is superadmin, target_hospital_id = None")
        
    q_patients = db.query(Patient)
    if target_hospital_id:
        q_patients = q_patients.filter(Patient.hospital_id == target_hospital_id)
        print(f"Filtering patients by hospital_id = {target_hospital_id}")
        
    total_patients = q_patients.count()
    print(f"Total patients in scope: {total_patients}")
    
    category_breakdown = []
    for category in ['STANDARD', 'MLC', 'BIRTH', 'DEATH']:
        q_cat = q_patients.filter(Patient.patient_category == category)
        count = q_cat.count()
        print(f"  Category {category} count: {count}")
        if count > 0:
            category_breakdown.append({"name": category, "value": count})
            
    print(f"Final Category Breakdown: {category_breakdown}")

    # Let's see what unique categories ACTUALLY exist for this scope
    # Since SQLAlchemy has trouble with execute sometimes, let's use the ORM
    categories_actual = set([p.patient_category for p in q_patients.all()])
    print(f"Actual patient_category values in DB for this scope: {categories_actual}")

finally:
    db.close()
