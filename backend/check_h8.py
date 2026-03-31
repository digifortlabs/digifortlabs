import os
import sys

os.environ["DATABASE_URL"] = "postgresql://digifort_admin:Digif0rtlab$@localhost:5432/digifort_db"
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
engine = create_engine(os.environ["DATABASE_URL"])

with engine.connect() as conn:
    print("Checking Hospital 8 dependencies...")
    
    # Tables we know have hospital_id
    tables = [
        "users", "patients", "dental_patients", "ent_patients", 
        "invoices", "bandwidth_usage", "system_error_logs", "audit_logs",
        "qa_issues", "physical_racks", "insurance_providers",
        "dental_labs", "dental_inventory_items", "pharma_medicines", "pharma_sales",
        "ent_surgeries", "ent_examinations", "audiometry_tests"
    ]
    
    for tbl in tables:
        try:
            res = conn.execute(text(f"SELECT COUNT(*) FROM {tbl} WHERE hospital_id = 8")).scalar()
            if res > 0:
                print(f"Table {tbl} has {res} rows for hospital 8.")
        except Exception:
            pass
            
