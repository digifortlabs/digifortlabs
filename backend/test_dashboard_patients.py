import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Patient, OPDVisit, IPDAdmission, DentalTreatment, PatientInvoice

def test():
    db = SessionLocal()
    try:
        # Let's mock a hospital_id
        # Let's find first active patient's hospital_id
        p = db.query(Patient).first()
        if not p:
            print("No patients found in DB.")
            return
        hospital_id = p.hospital_id
        print(f"Testing with hospital_id: {hospital_id}")
        
        patients = db.query(Patient).filter(Patient.hospital_id == hospital_id).all()
        print(f"Found {len(patients)} patients.")
        
        unbilled_opd = db.query(OPDVisit.patient_id).filter(OPDVisit.hospital_id == hospital_id, OPDVisit.patient_invoice_id == None).all()
        unbilled_ipd = db.query(IPDAdmission.patient_id).filter(IPDAdmission.hospital_id == hospital_id, IPDAdmission.patient_invoice_id == None).all()
        unbilled_dental = db.query(DentalTreatment.patient_id).join(Patient, DentalTreatment.patient_id == Patient.record_id).filter(Patient.hospital_id == hospital_id, DentalTreatment.patient_invoice_id == None).all()
        
        patients_with_invoices = db.query(PatientInvoice.patient_id).filter(PatientInvoice.hospital_id == hospital_id).subquery()
        unbilled_reg = db.query(Patient.record_id).filter(Patient.hospital_id == hospital_id, ~Patient.record_id.in_(patients_with_invoices)).all()
        
        unbilled_ids = set()
        for row in unbilled_opd: unbilled_ids.add(row[0])
        for row in unbilled_ipd: unbilled_ids.add(row[0])
        for row in unbilled_dental: unbilled_ids.add(row[0])
        for row in unbilled_reg: unbilled_ids.add(row[0])
        
        print(f"Unbilled IDs count: {len(unbilled_ids)}")
        
        results = []
        for p in patients:
            results.append({
                "record_id": p.record_id,
                "patient_u_id": p.patient_u_id,
                "full_name": p.full_name,
                "admission_date": p.admission_date,
                "discharge_date": p.discharge_date,
                "total_bill_amount": p.total_bill_amount,
                "has_unbilled_records": p.record_id in unbilled_ids
            })
            
        print("Successfully generated raw results dictionary list.")
        
        from app.routers.patient_billing import DashboardPatientResponse
        # Validate Pydantic schema
        validated = [DashboardPatientResponse(**r) for r in results]
        print(f"Successfully validated {len(validated)} response items.")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test()
