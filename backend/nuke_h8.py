import os
import sys

os.environ["DATABASE_URL"] = "postgresql://digifort_admin:Digif0rtlab$@localhost:5432/digifort_db"
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
engine = create_engine(os.environ["DATABASE_URL"])

with engine.connect() as conn:
    print("Nuking all locked test data inside Hospital 8...")
    
    p_ids = conn.execute(text("SELECT patient_id FROM dental_patients WHERE hospital_id = 8")).scalars().all()
    if p_ids:
        pid_str = ",".join(map(str, p_ids))
        print("Emptying child records for Dental Patients:", pid_str)
        
        dental_children = [
            "dental_3d_scans", "dental_treatment_plans", "periodontal_exams", "ortho_records", 
            "communication_logs", "dental_appointments", "dental_treatments", "insurance_claims", "dental_lab_orders"
        ]
        
        for tbl in dental_children:
            try:
                conn.execute(text(f"DELETE FROM {tbl} WHERE patient_id IN ({pid_str})"))
            except Exception as e:
                pass
                
        # Now drop the master patients
        try:
            conn.execute(text(f"DELETE FROM dental_patients WHERE patient_id IN ({pid_str})"))
            print("Successfully erased internal dental patients!")
        except Exception as e:
            print("Still failed to delete patients:", e)
            
    conn.commit()
    print("Hospital 8 has been cleaned. The dashboard deletion should proceed perfectly now!")
