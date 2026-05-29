import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import EmergencyVisit

db = SessionLocal()
visit = db.query(EmergencyVisit).first()

# simulate PUT request
update_data = {"status": "Admitted"}
for key, value in update_data.items():
    print(f"Setting {key} to {value}")
    setattr(visit, key, value)
    
db.commit()
db.refresh(visit)
print("After commit:", visit.status)
