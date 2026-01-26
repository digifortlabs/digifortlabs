
from app.models import Invoice, InvoiceItem
from app.database import SessionLocal

db = SessionLocal()

def check_orphans():
    print("--- Checking for Orphaned Invoice Items ---")
    
    # Get all distinct invoice_ids from items
    item_invoice_ids = db.query(InvoiceItem.invoice_id).distinct().all()
    item_invoice_ids = [i[0] for i in item_invoice_ids]
    
    # Get all actual invoice ids
    actual_invoice_ids = db.query(Invoice.invoice_id).all()
    actual_invoice_ids = [i[0] for i in actual_invoice_ids]
    
    orphans = set(item_invoice_ids) - set(actual_invoice_ids)
    
    print(f"Total Invoice IDs in Items: {len(item_invoice_ids)}")
    print(f"Total Actual Invoices: {len(actual_invoice_ids)}")
    print(f"Orphaned Invoice IDs (in Items but not Invoices): {orphans}")
    
    if orphans:
        count = db.query(InvoiceItem).filter(InvoiceItem.invoice_id.in_(orphans)).count()
        print(f"Total Orphaned Items: {count}")
        
        # List a few file IDs associated
        orphan_items = db.query(InvoiceItem).filter(InvoiceItem.invoice_id.in_(orphans)).limit(5).all()
        for item in orphan_items:
            print(f" - Orphan Item {item.item_id}: File {item.file_id}, Amount {item.amount}")

if __name__ == "__main__":
    check_orphans()
