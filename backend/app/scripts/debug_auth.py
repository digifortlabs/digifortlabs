from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core.config import settings
from app.models import User, Hospital

db_path = os.path.join(os.getcwd(), 'backend', 'digifortlabs.db')
engine = create_engine(f"sqlite:///{db_path}")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

print("--- DEBUG USERS ---")
users = db.query(User).all()
for u in users:
    print(f"ID: {u.user_id} | Email: {u.email} | Role: {u.role} | Active: {u.is_active}")

print("\n--- DEBUG HOSPITALS ---")
hospitals = db.query(Hospital).all()
for h in hospitals:
    print(f"ID: {h.hospital_id} | Name: {h.legal_name} | Active: {h.is_active}")

db.close()
