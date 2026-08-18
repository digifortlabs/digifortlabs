import sys
from app.database import engine
from sqlalchemy import inspect, text

def check_database():
    print("==========================================")
    print("DIGIFORT LABS - DATABASE INTEGRITY CHECK")
    print("==========================================")
    
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Total Tables in DB: {len(tables)}")
    
    key_tables = [
        'hospitals', 'hospital_groups', 'users', 'patients', 
        'ipd_admissions', 'appointments', 'invoices', 'pdf_files',
        'referrals', 'self_registrations', 'maternity_patients'
    ]
    
    print("\n--- Key Table Audit ---")
    with engine.connect() as conn:
        for tbl in key_tables:
            if tbl in tables:
                cnt = conn.execute(text(f"SELECT COUNT(1) FROM {tbl}")).scalar()
                print(f"  [EXISTS] {tbl:<25} -> {cnt} records")
            else:
                print(f"  [MISSING] {tbl:<24} -> NOT CREATED!")
                
    print("\nStatus: Database connections and schema checks operational!")

if __name__ == "__main__":
    check_database()
