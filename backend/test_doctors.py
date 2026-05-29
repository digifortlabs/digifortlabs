import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import SessionLocal
from app.models import DoctorProfile

db = SessionLocal()
docs = db.query(DoctorProfile).all()
for d in docs:
    print(d.profile_id, d.user.full_name if d.user else "NO USER")
