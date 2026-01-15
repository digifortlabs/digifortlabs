
from app.database import SessionLocal
from app.models import Hospital

db = SessionLocal()
h = db.query(Hospital).filter(Hospital.hospital_id == 1).first()

if h:
    h.subscription_tier = "Standard"
    h.price_per_file = 100.0
    db.commit()
    print("Updated Hospital 1: Tier=Standard, Price=100.0")
else:
    print("Hospital 1 not found")

db.close()
