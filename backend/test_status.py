import os
import sys

# Add the backend dir to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import EmergencyVisit

db = SessionLocal()
visits = db.query(EmergencyVisit).all()
for v in visits:
    print(f"ID: {v.emergency_id}, Status: {v.status}")
