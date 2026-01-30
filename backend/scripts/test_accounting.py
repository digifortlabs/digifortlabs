
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

from app.models import Invoice, Hospital, InvoiceItem
from app.routers.accounting import InvoiceResponse

def test_config():
    try:
        invoices = db.query(Invoice).all()
        print(f"Found {len(invoices)} invoices.")
        
        for inv in invoices:
            print(f"Checking Invoice {inv.invoice_id}...")
            # Simulate Pydantic validation which happens in API response
            try:
                res = InvoiceResponse.model_validate(inv)
                
                # Check helpers
                hospital_gst = inv.hospital.gst_number if inv.hospital else None
                print(f"  - Validated OK. Hospital GST: {hospital_gst}")
                
            except Exception as e:
                print(f"❌ Pydantic Validation Failed for Invoice {inv.invoice_id}: {e}")
                # Print values
                print(f"    total_amount: {inv.total_amount} ({type(inv.total_amount)})")
                print(f"    tax_amount: {inv.tax_amount} ({type(inv.tax_amount)})")
                print(f"    gst_rate: {inv.gst_rate} ({type(inv.gst_rate)})")
                print(f"    hospital: {inv.hospital}")
                
    except Exception as e:
        print(f"❌ Query Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_config()
