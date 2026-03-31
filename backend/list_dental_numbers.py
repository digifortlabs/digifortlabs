import sys
import os

# Set root path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import DentalPatient

def list_numbers():
    db = SessionLocal()
    try:
        # Get last 5 patients with either UHID or OPD
        patients = db.query(DentalPatient).filter(
            (DentalPatient.uhid != None) | (DentalPatient.opd_number != None)
        ).order_by(DentalPatient.patient_id.desc()).limit(5).all()
        
        print("Existing Patterns:")
        for p in patients:
            print(f"UHID: {p.uhid} | OPD: {p.opd_number}")
    finally:
        db.close()

if __name__ == "__main__":
    list_numbers()
