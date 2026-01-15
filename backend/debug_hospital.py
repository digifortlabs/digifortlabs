
from app.database import SessionLocal
from app.models import Hospital

db = SessionLocal()
h = db.query(Hospital).filter(Hospital.hospital_id == 1).first()

if h:
    print(f"Hospital: {h.legal_name}")
    print(f"Tier: {h.subscription_tier}")
    print(f"Price: {h.price_per_file}")
else:
    print("Hospital 1 not found")

db.close()
