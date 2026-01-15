
from app.database import SessionLocal
from app.models import Hospital

db = SessionLocal()
h = db.query(Hospital).filter(Hospital.hospital_id == 1).first()

if h:
    h.price_per_file = 80.0
    db.commit()
    print("Updated Hospital 1: Price=80.0")
else:
    print("Hospital 1 not found")

db.close()
