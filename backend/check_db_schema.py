
from sqlalchemy import create_engine, inspect
from app.database import SQLALCHEMY_DATABASE_URL

print(f"Checking DB: {SQLALCHEMY_DATABASE_URL}")
engine = create_engine(SQLALCHEMY_DATABASE_URL)
inspector = inspect(engine)

def check_table(name):
    if not inspector.has_table(name):
        print(f"Table '{name}' MISSING!")
        return
    
    print(f"Table '{name}' exists.")
    columns = [c['name'] for c in inspector.get_columns(name)]
    print(f"  Columns: {columns}")
    
    if name == 'physical_boxes':
        if 'capacity' in columns: print("  - capacity OK") 
        else: print("  - capacity MISSING!")
        
        if 'status' in columns: print("  - status OK")
        else: print("  - status MISSING!")

check_table('physical_racks')
check_table('physical_boxes')
check_table('patient_diagnoses')
