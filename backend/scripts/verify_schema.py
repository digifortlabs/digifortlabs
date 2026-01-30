
import os
import sys
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Database URL not found")
    sys.exit(1)

engine = create_engine(DATABASE_URL)

def check_schema():
    inspector = inspect(engine)
    # Check hospitals and invoices specifically
    tables = ['hospitals', 'invoices', 'invoice_items']
    
    for table in tables:
        if table not in inspector.get_table_names():
            print(f"\n❌ Table {table} NOT FOUND in database!")
            continue
            
        print(f"\n📋 Table: {table}")
        columns = inspector.get_columns(table)
        col_names = [c['name'] for c in columns]
        
        # Check for specific critical columns
        required = []
        if table == 'hospitals':
            required = ['gst_number', 'bank_name', 'bank_account_no', 'bank_ifsc', 'is_reg_fee_paid']
        
        for req in required:
            if req not in col_names:
                print(f"  ❌ MISSING COLUMN: {req}")
            else:
                print(f"  ✅ Found {req}")
                
        # List all for reference
        # for c in columns:
        #    print(f"  - {c['name']} ({c['type']})")

if __name__ == "__main__":
    check_schema()
