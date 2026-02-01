from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, not_

from ..database import get_db
from ..models import (
    Invoice, InvoiceItem, PDFFile, Hospital, User, Patient,
    AccountingVendor, AccountingExpense, AccountingTransaction, AccountingConfig, UserRole
)
from .auth import get_current_user
from ..services.email_service import EmailService

router = APIRouter()

# --- Pydantic Models for API ---

class InvoiceItemResponse(BaseModel):
    item_id: int
    file_id: Optional[int] = None
    filename: Optional[str] = None
    amount: float
    discount: float = 0.0
    description: Optional[str] = None
    hsn_code: Optional[str] = "998311" # Standard SAC for IT/Data services

    class Config:
        from_attributes = True

class InvoiceResponse(BaseModel):
    invoice_id: int
    hospital_id: int
    hospital_name: Optional[str] = None
    invoice_number: str
    total_amount: float
    tax_amount: float = 0.0
    gst_rate: float = 18.0
    status: str
    bill_date: Optional[datetime]
    created_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    payment_date: Optional[datetime] = None
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    
    # Hospital Details for Bill Preview
    hospital_gst: Optional[str] = None
    hospital_address: Optional[str] = None
    hospital_city: Optional[str] = None
    hospital_state: Optional[str] = None
    hospital_pincode: Optional[str] = None
    hospital_pan: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_no: Optional[str] = None
    bank_ifsc: Optional[str] = None
    amount_in_words: Optional[str] = None
    company_name: Optional[str] = "Digifort Labs"
    company_address: Optional[str] = "Vapi, Gujarat, India"
    company_gst: Optional[str] = None
    company_email: Optional[str] = "info@digifortlabs.com"
    company_website: Optional[str] = "www.digifortlabs.com"
    company_bank_name: Optional[str] = None
    company_bank_acc: Optional[str] = None
    company_bank_ifsc: Optional[str] = None
    is_gst_bill: bool = True
    
    items: List[InvoiceItemResponse] = []

    class Config:
        from_attributes = True

class CustomItem(BaseModel):
    description: str
    amount: float
    discount: float = 0.0
    hsn_code: Optional[str] = "998311"

class GenerateInvoiceRequest(BaseModel):
    hospital_id: int
    file_ids: List[int] = []
    custom_items: List[CustomItem] = []
    due_date: Optional[datetime] = None
    bill_date: Optional[datetime] = None
    include_registration_fee: bool = True
    registration_fee_amount: Optional[float] = None
    is_gst_bill: bool = True # Toggle for GST vs Bill of Supply
    custom_invoice_number: Optional[str] = None # Semi-auto numbering

class ReceivePaymentRequest(BaseModel):
    transaction_id: str
    payment_method: str
    payment_date: Optional[datetime] = None

class UpdateInvoiceItem(BaseModel):
    item_id: Optional[int] = None
    description: str
    amount: float
    discount: float = 0.0
    hsn_code: Optional[str] = "998311"

class UpdateInvoiceRequest(BaseModel):
    invoice_number: Optional[str] = None
    due_date: Optional[datetime] = None
    bill_date: Optional[datetime] = None
    status: Optional[str] = None # e.g. CANCELLED
    is_gst_bill: Optional[bool] = None
    items: Optional[List[UpdateInvoiceItem]] = None

# --- Configuration Endpoints ---

@router.get("/config")
def get_accounting_config(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    config = db.query(AccountingConfig).first()
    if not config:
        # Create default if not exists
        config = AccountingConfig()
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

class ConfigUpdate(BaseModel):
    current_fy: Optional[str] = None
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    company_gst: Optional[str] = None
    company_email: Optional[str] = None
    company_website: Optional[str] = None
    company_bank_name: Optional[str] = None
    company_bank_acc: Optional[str] = None
    company_bank_ifsc: Optional[str] = None
    invoice_prefix: Optional[str] = None
    invoice_prefix_nongst: Optional[str] = None
    receipt_prefix: Optional[str] = None
    expense_prefix: Optional[str] = None
    next_invoice_number: Optional[int] = None
    next_invoice_number_nongst: Optional[int] = None
    next_receipt_number: Optional[int] = None
    next_expense_number: Optional[int] = None
    number_format: Optional[str] = None

@router.post("/config")
def update_accounting_config(
    req: ConfigUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update accounting settings."""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    config = db.query(AccountingConfig).first()
    if not config:
        config = AccountingConfig()
        db.add(config)
    
    for key, value in req.dict(exclude_unset=True).items():
        setattr(config, key, value)
    
    db.commit()
    return config

@router.post("/config/reset-counters")
def reset_invoice_counters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reset all invoice/receipt/expense counters to 1. Use with caution!"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    config = db.query(AccountingConfig).first()
    if not config:
        raise HTTPException(status_code=404, detail="Accounting config not found")
    
    config.next_invoice_number = 1
    config.next_invoice_number_nongst = 1
    config.next_receipt_number = 1
    config.next_expense_number = 1
    
    db.commit()
    return {
        "message": "All counters reset to 1",
        "next_invoice_number": 1,
        "next_receipt_number": 1,
        "next_expense_number": 1
    }

# --- Endpoints ---

@router.get("/", response_model=List[InvoiceResponse])
def get_invoices(
    hospital_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all invoices with optional filters."""
    query = db.query(Invoice).join(Hospital)
    
    # Restricted to Super Admin / Platform Staff
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    if hospital_id:
        query = query.filter(Invoice.hospital_id == hospital_id)
        
    if status:
        query = query.filter(Invoice.status == status)
        
    invoices = query.order_by(Invoice.bill_date.desc()).all()
    
    # Format response to include hospital name
    results = []
    for inv in invoices:
        res = InvoiceResponse.model_validate(inv)
        res.hospital_name = inv.hospital.legal_name if inv.hospital else "Unknown"
        res.hospital_gst = inv.hospital.gst_number if inv.hospital else None
        res.bank_name = inv.hospital.bank_name if inv.hospital else None
        res.bank_account_no = inv.hospital.bank_account_no if inv.hospital else None
        res.bank_ifsc = inv.hospital.bank_ifsc if inv.hospital else None
        res.is_gst_bill = (inv.gst_rate or 0) > 0
        results.append(res)
        
    return results

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice_details(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get full details of a single invoice including items."""
    invoice = db.query(Invoice).filter(Invoice.invoice_id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    res = InvoiceResponse.model_validate(invoice)
    res.hospital_name = invoice.hospital.legal_name if invoice.hospital else "Unknown"
    res.hospital_gst = invoice.hospital.gst_number if invoice.hospital else None
    res.bank_name = invoice.hospital.bank_name if invoice.hospital else None
    res.bank_account_no = invoice.hospital.bank_account_no if invoice.hospital else None
    res.bank_ifsc = invoice.hospital.bank_ifsc if invoice.hospital else None
    res.hospital_address = invoice.hospital.address if invoice.hospital else None
    res.hospital_city = invoice.hospital.city if invoice.hospital else None
    res.hospital_state = invoice.hospital.state if invoice.hospital else None
    res.hospital_pincode = getattr(invoice.hospital, 'pincode', None) if invoice.hospital else None
    res.hospital_pan = getattr(invoice.hospital, 'pan_number', None) if invoice.hospital else None
    res.amount_in_words = number_to_words(invoice.total_amount)
    res.is_gst_bill = (invoice.gst_rate or 0) > 0
    
    # Add Company Details from Config
    config = db.query(AccountingConfig).first()
    if config:
        res.company_name = config.company_name
        res.company_address = config.company_address
        res.company_gst = config.company_gst
        res.company_email = config.company_email
        res.company_website = config.company_website
        res.company_bank_name = config.company_bank_name
        res.company_bank_acc = config.company_bank_acc
        res.company_bank_ifsc = config.company_bank_ifsc
    else:
        res.company_gst = "24AAFCD9999A1ZP" # Fallback
    
    # Populate items
    res.items = []
    for item in invoice.items:
        res.items.append(InvoiceItemResponse(
            item_id=item.item_id,
            file_id=item.file_id,
            filename=item.pdf_file.filename if item.pdf_file else None,
            amount=item.amount,
            discount=item.discount,
            description=item.description,
            hsn_code=item.hsn_code
        ))
    return res



@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: int,
    req: UpdateInvoiceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update metadata, items, and taxes for an existing invoice."""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        raise HTTPException(status_code=403, detail="Only Super Admins can update invoices")
        
    invoice = db.query(Invoice).filter(Invoice.invoice_id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status == "PAID" and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=400, detail="Only Super Admins can modify a PAID invoice.")

    try:
        # 1. Update Basic Meta
        if req.invoice_number:
            invoice.invoice_number = req.invoice_number
        if req.bill_date:
            invoice.bill_date = req.bill_date
        if req.due_date:
            invoice.due_date = req.due_date
        if req.status:
            invoice.status = req.status
            
        # 2. Update GST state if provided
        if req.is_gst_bill is not None:
            invoice.gst_rate = 18.0 if req.is_gst_bill else 0.0

        # 3. Update Items (Complete Replacement for simplicity/safety)
        if req.items is not None:
            # Note: We don't restore PDFFile.is_paid here because usually items are removed 
            # and added back, or just modified. If an item is PERMANENTLY removed, 
            # the user should use the dedicated item delete endpoint to handle file cleanup.
            # However, for 'Manage Invoice' UI, we might need a sync logic.
            
            # Simple approach: Delete existing and add new
            db.query(InvoiceItem).filter(InvoiceItem.invoice_id == invoice_id).delete()
            
            subtotal = 0.0
            for item in req.items:
                net_amount = item.amount - item.discount
                subtotal += net_amount
                
                inv_item = InvoiceItem(
                    invoice_id=invoice_id,
                    amount=item.amount,
                    discount=item.discount,
                    description=item.description,
                    hsn_code=item.hsn_code or "998311"
                )
                db.add(inv_item)
            
            # Recalculate Totals
            rate = invoice.gst_rate or 0.0
            tax = (subtotal * rate) / 100
            grand = round(subtotal + tax)
            
            invoice.total_amount = grand
            invoice.tax_amount = tax
            
        elif req.is_gst_bill is not None:
            # Case where only GST flag was toggled but items stayed same
            # We need subtotal to recalculate tax
            items = db.query(InvoiceItem).filter(InvoiceItem.invoice_id == invoice_id).all()
            subtotal = sum((i.amount - i.discount) for i in items)
            
            rate = invoice.gst_rate or 0.0
            tax = (subtotal * rate) / 100
            grand = round(subtotal + tax)
            
            invoice.total_amount = grand
            invoice.tax_amount = tax

        db.commit()
        db.refresh(invoice)

        # 4. Sync Ledger Entry
        txn = db.query(AccountingTransaction).filter(
            AccountingTransaction.voucher_type == "INVOICE",
            AccountingTransaction.voucher_id == invoice.invoice_id
        ).first()
        
        if txn:
            txn.debit = invoice.total_amount
            txn.voucher_number = invoice.invoice_number
            txn.date = invoice.bill_date or txn.date
            db.commit()
            
        return get_invoice_details(invoice_id, db, current_user)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")

@router.delete("/items/{item_id}")
def delete_invoice_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a single item from an invoice and recalculate totals."""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        raise HTTPException(status_code=403, detail="Only Super Admins can edit invoices")
        
    item = db.query(InvoiceItem).filter(InvoiceItem.item_id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    invoice = item.invoice
    if invoice.status == "PAID":
        raise HTTPException(status_code=400, detail="Cannot edit a paid invoice")
        
    # Mark file as unpaid if applicable
    if item.pdf_file:
        item.pdf_file.is_paid = False
        
    # Reset reg fee status if it was a reg fee item
    if item.description == "One-time Registration Fee" and invoice.hospital:
        invoice.hospital.is_reg_fee_paid = False
        
    # Remove item
    db.delete(item)
    db.flush() # Ensure item is gone for total calculation
    
    # Recalculate Totals
    new_subtotal = sum((i.amount - i.discount) for i in invoice.items)
    invoice.tax_amount = (new_subtotal * invoice.gst_rate) / 100
    invoice.total_amount = round(new_subtotal + invoice.tax_amount)
    
    db.commit()

    # Sync Ledger Entry (Debit)
    txn = db.query(AccountingTransaction).filter(
        AccountingTransaction.voucher_type == "INVOICE",
        AccountingTransaction.voucher_id == invoice.invoice_id
    ).first()
    
    if txn:
        txn.debit = invoice.total_amount
        db.commit()

    return {"message": "Item removed and totals updated", "new_total": invoice.total_amount}

def number_to_words(number):
    """Simple converter for Indian Currency wording (Lakhs/Crores)."""
    # basic implementation for demo purposes, can be replaced with 'num2words' if installed
    def _helper(n):
        units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", 
                 "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
        tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
        if n < 20: return units[n]
        if n < 100: return tens[n // 10] + (" " + units[n % 10] if n % 10 != 0 else "")
        if n < 1000: return units[n // 100] + " Hundred" + (" and " + _helper(n % 100) if n % 100 != 0 else "")
        if n < 100000: return _helper(n // 1000) + " Thousand" + (" " + _helper(n % 1000) if n % 1000 != 0 else "")
        if n < 10000000: return _helper(n // 100000) + " Lakh" + (" " + _helper(n % 100000) if n % 100000 != 0 else "")
        return _helper(n // 10000000) + " Crore" + (" " + _helper(n % 10000000) if n % 10000000 != 0 else "")

    integer_part = int(number)
    decimal_part = int(round((number - integer_part) * 100))
    
    res = _helper(integer_part) + " Rupees"
    if decimal_part > 0:
        res += " and " + _helper(decimal_part) + " Paise"
    return res + " Only"


@router.post("/generate", response_model=InvoiceResponse)
def generate_invoice(
    req: GenerateInvoiceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a new invoice for a set of files."""
    try:
        if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
            raise HTTPException(status_code=403, detail="Only Super Admins can generate invoices")
            
        hospital = db.query(Hospital).filter(Hospital.hospital_id == req.hospital_id).first()
        if not hospital:
            raise HTTPException(status_code=404, detail="Hospital not found")
            
        # Check if files belong to this hospital and are not already billed/paid
        files = db.query(PDFFile).join(Patient).filter(
            PDFFile.file_id.in_(req.file_ids),
            Patient.hospital_id == req.hospital_id,
            PDFFile.is_paid == False
        ).all()
        
        if not files and not req.custom_items and not (req.include_registration_fee and hospital and not hospital.is_reg_fee_paid):
            raise HTTPException(status_code=400, detail="No valid, unpaid files, custom items, or registration fee to bill for this invoice")
            
        # Get Accounting Config for Numbering
        config = db.query(AccountingConfig).first()
        if not config:
            config = AccountingConfig()
            db.add(config)
            db.flush()
            
        # Generate or Use Custom Invoice Number
        if req.custom_invoice_number:
            invoice_number = req.custom_invoice_number
            # We do NOT increment the auto-counter if manual override is used, 
            # to prevent gaps/jumps unless explicitly handled. 
            # User must manually update config if they want to skip ahead.
        else:
            # Determine prefix and current counter based on GST vs Non-GST
            if req.is_gst_bill:
                prefix = config.invoice_prefix
                current_counter = config.next_invoice_number
                invoice_type = 'gst'
            else:
                prefix = config.invoice_prefix_nongst or "BOS"
                current_counter = config.next_invoice_number_nongst or 1
                invoice_type = 'nongst'
            
            # OPTIMIZED: Check cache table for available numbers (O(1) instead of O(n))
            from ..models import AvailableInvoiceNumber
            available = db.query(AvailableInvoiceNumber).filter(
                AvailableInvoiceNumber.invoice_type == invoice_type,
                AvailableInvoiceNumber.financial_year == config.current_fy
            ).order_by(AvailableInvoiceNumber.number).first()
            
            if available:
                # Reuse deleted invoice number
                next_number = available.number
                db.delete(available)  # Remove from available pool
            else:
                # No gaps, use next counter
                next_number = current_counter
                # Increment counter
                if req.is_gst_bill:
                    config.next_invoice_number += 1
                else:
                    config.next_invoice_number_nongst = (config.next_invoice_number_nongst or 1) + 1
            
            # Generate the invoice number
            invoice_number = config.number_format.format(
                prefix=prefix,
                fy=config.current_fy,
                number=next_number
            )
        
        # Check for collision (Manual or Auto)
        if db.query(Invoice).filter(Invoice.invoice_number == invoice_number).first():
            raise HTTPException(status_code=400, detail=f"Invoice number '{invoice_number}' already exists!")
            
        # Calculate total and items
        total_amount = 0.0
        invoice_items = []
        detailed_patient_records = []
        
        # Determine Invoice Period (based on upload dates of files)
        upload_dates = [f.upload_date for f in files if f.upload_date]
        invoice_period = "N/A"
        if upload_dates:
            min_date = min(upload_dates).strftime("%d-%m-%Y")
            max_date = max(upload_dates).strftime("%d-%m-%Y")
            invoice_period = f"{min_date} - {max_date}"

        # Check for Registration Fee if requested
        if req.include_registration_fee and hospital and not hospital.is_reg_fee_paid:
            reg_fee = req.registration_fee_amount if req.registration_fee_amount is not None else (hospital.registration_fee or 1000.0)
            total_amount += reg_fee
            invoice_items.append({
                "file_id": None,
                "amount": reg_fee,
                "discount": 0.0,
                "description": "One-time Registration Fee",
                "hsn_code": "998311"
            })
            hospital.is_reg_fee_paid = True 

        for f in files:
            # Calculate cost logic
            # Use pricing from PDFFile (historical capture) or fall back to defaults
            base_price = f.price_per_file if f.price_per_file is not None else 100.0
            included = f.included_pages if f.included_pages is not None else 20
            extra_rate = f.price_per_extra_page if f.price_per_extra_page is not None else 1.0
            page_count = f.page_count or 0
            extra_pages = max(0, page_count - included)
            file_cost = base_price + (extra_pages * extra_rate)
            
            total_amount += file_cost
            
            description = f"Processing of patient record: {f.filename}"
            if f.patient:
                description = f"Processing MRD: {f.patient.patient_u_id} - {f.patient.full_name} ({f.filename})"
                detailed_patient_records.append({
                    "mrd_id": f.patient.patient_u_id,
                    "name": f.patient.full_name,
                    "admission_date": f.patient.admission_date.strftime("%Y-%m-%d") if f.patient.admission_date else "N/A",
                    "file_id": f.file_id,
                    "pages": f.page_count
                })
                
            invoice_items.append({
                "file_id": f.file_id,
                "amount": file_cost,
                "discount": 0.0,
                "description": description,
                "hsn_code": "998311"
            })

        # Add Custom Items
        for ci in req.custom_items:
            net_amount = ci.amount - ci.discount
            total_amount += net_amount
            invoice_items.append({
                "file_id": None,
                "amount": net_amount, # Store Net Amount
                "discount": ci.discount,
                "description": ci.description,
                "hsn_code": ci.hsn_code or "998311"
            })

        # Calculate GST (18% if GST Bill, else 0%)
        gst_rate = 18.0 if req.is_gst_bill else 0.0
        tax_amount = (total_amount * gst_rate) / 100
        grand_total = round(total_amount + tax_amount)

        # Create Invoice
        new_invoice = Invoice(
            hospital_id=req.hospital_id,
            invoice_number=invoice_number,
            total_amount=grand_total,
            tax_amount=tax_amount,
            gst_rate=gst_rate,
            bill_date=req.bill_date or datetime.now(),
            due_date=req.due_date,
            status="PENDING"
        )
        db.add(new_invoice)
        db.flush() 
        
        # Create Items
        for item in invoice_items:
            inv_item = InvoiceItem(
                invoice_id=new_invoice.invoice_id,
                file_id=item["file_id"],
                amount=item["amount"],
                discount=item["discount"],
                description=item["description"],
                hsn_code=item.get("hsn_code")
            )
            db.add(inv_item)
            
        # Create Ledger Entry (Debit)
        ledger_entry = AccountingTransaction(
            party_type="HOSPITAL",
            party_id=req.hospital_id,
            voucher_type="INVOICE",
            voucher_id=new_invoice.invoice_id,
            voucher_number=invoice_number,
            debit=grand_total,
            credit=0.0,
            description=f"Sales Invoice for {len(files)} records and items"
        )
        db.add(ledger_entry)
            
        db.commit()
        db.refresh(new_invoice)
        
        # Send Email automatically with detailed info
        EmailService.send_invoice_email(
            recipient_email=hospital.email,
            hospital_name=hospital.legal_name,
            invoice_number=invoice_number,
            amount=grand_total,
            items=[{
                "description": item["description"],
                "amount": item["amount"],
                "hsn": item["hsn_code"]
            } for item in invoice_items],
            bank_details={
                "name": hospital.bank_name,
                "account": hospital.bank_account_no,
                "ifsc": hospital.bank_ifsc,
                "gst": hospital.gst_number
            },
            extra_details={
                "amount_in_words": number_to_words(grand_total),
                "invoice_period": invoice_period,
                "detailed_records": detailed_patient_records
            }
        )
        
        res = InvoiceResponse.model_validate(new_invoice)
        res.hospital_name = hospital.legal_name
        res.hospital_gst = hospital.gst_number
        res.bank_name = hospital.bank_name
        res.bank_account_no = hospital.bank_account_no
        res.bank_ifsc = hospital.bank_ifsc
        res.amount_in_words = number_to_words(grand_total)
        res.is_gst_bill = req.is_gst_bill

        # Add Company Details from Config
        if config:
            res.company_name = config.company_name
            res.company_address = config.company_address
            res.company_gst = config.company_gst
            res.company_email = config.company_email
            res.company_website = config.company_website
            res.company_bank_name = config.company_bank_name
            res.company_bank_acc = config.company_bank_acc
            res.company_bank_ifsc = config.company_bank_ifsc
        
        return res
        
    except Exception as e:
        db.rollback()
        error_msg = f"ERROR in generate_invoice: {type(e).__name__}: {str(e)}"
        print(f"--- FAILED TO GENERATE INVOICE ---")
        print(error_msg)
        import traceback
        traceback.print_exc()
        # Check for integrity errors (unique constraints)
        if "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="Duplicate invoice number detected. Please try again.")
        
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=error_msg)
        

@router.post("/{invoice_id}/receive-payment")
def receive_payment(
    invoice_id: int,
    req: ReceivePaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record payment for an invoice."""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        raise HTTPException(status_code=403, detail="Only Super Admins can process payments")
        
    invoice = db.query(Invoice).filter(Invoice.invoice_id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if invoice.status == "PAID":
        raise HTTPException(status_code=400, detail="Invoice is already paid")
        
    invoice.status = "PAID"
    invoice.transaction_id = req.transaction_id
    invoice.payment_method = req.payment_method
    invoice.payment_date = req.payment_date or datetime.now()
    
    # Mark all associated files as PAID
    items = db.query(InvoiceItem).filter(InvoiceItem.invoice_id == invoice_id).all()
    file_ids = [item.file_id for item in items if item.file_id is not None] # Only include actual file_ids
    
    db.query(PDFFile).filter(PDFFile.file_id.in_(file_ids)).update({
        "is_paid": True,
        "payment_date": datetime.now()
    }, synchronize_session=False)

    # Create Ledger Entry (Credit)
    ledger_entry = AccountingTransaction(
        party_type="HOSPITAL",
        party_id=invoice.hospital_id,
        voucher_type="RECEIPT",
        voucher_id=invoice.invoice_id,
        voucher_number=invoice.invoice_number,
        debit=0.0,
        credit=invoice.total_amount,
        description=f"Payment received via {req.payment_method}. Ref: {req.transaction_id}"
    )
    db.add(ledger_entry)
    
    db.commit()
    
    return {"message": "Payment recorded successfully", "invoice_number": invoice.invoice_number}

@router.get("/unbilled/{hospital_id}")
async def get_unbilled_files(hospital_id: int, db: Session = Depends(get_db)):
    """Retrieve all unpaid files for a specific hospital that are ready for billing."""
    # Find files belonging to hospital that are NOT in any InvoiceItem
    billed_file_ids = db.query(InvoiceItem.file_id).filter(InvoiceItem.file_id.isnot(None)).subquery()

    pfiles = db.query(PDFFile).join(Patient).filter(
        Patient.hospital_id == hospital_id,
        PDFFile.upload_status == 'confirmed',  # Only confirmed files (not drafts)
        not_(PDFFile.file_id.in_(billed_file_ids))
    ).all()
    
    results = []
    for f in pfiles:
        # Calculate cost logic (mirroring reports logic)
        # Use pricing from PDFFile (snapshot) or defaults
        base_price = f.price_per_file if f.price_per_file is not None else 100.0
        included = f.included_pages if f.included_pages is not None else 20
        extra_rate = f.price_per_extra_page if f.price_per_extra_page is not None else 1.0
        page_count = f.page_count or 0
        extra_pages = max(0, page_count - included)
        file_cost = base_price + (extra_pages * extra_rate)
        
        results.append({
            "file_id": f.file_id,
            "filename": f.filename,
            "patient_name": f.patient.full_name if f.patient else "Unknown",
            "mrd_id": f.patient.patient_u_id if f.patient else "N/A",
            "page_count": f.page_count,
            "created_at": f.upload_date,
            "suggested_amount": file_cost
        })
        
    return results

@router.post("/{invoice_id}/send-email")
def send_invoice_email(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send the invoice details to the hospital admin via email."""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        raise HTTPException(status_code=403, detail="Only Super Admins can send invoice emails")
    invoice = db.query(Invoice).filter(Invoice.invoice_id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    hospital = invoice.hospital
    if not hospital or not hospital.email:
        raise HTTPException(status_code=400, detail="Hospital email not found")
        
    # Call email service
    success = EmailService.send_invoice_email(
        recipient_email=invoice.hospital.email,
        hospital_name=invoice.hospital.legal_name,
        invoice_number=invoice.invoice_number,
        amount=invoice.total_amount,
        items=[{
            "description": item.description or f"File #{item.file_id}",
            "amount": item.amount,
            "hsn": item.hsn_code
        } for item in invoice.items],
        bank_details={
            "name": invoice.hospital.bank_name,
            "account": invoice.hospital.bank_account_no,
            "ifsc": invoice.hospital.bank_ifsc,
            "gst": invoice.hospital.gst_number
        }
    )
    
    if success:
        return {"message": "Invoice email sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email")

@router.delete("/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an invoice and reset associated files to 'unpaid'."""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        raise HTTPException(status_code=403, detail="Only Super Admins can delete invoices")
        
    invoice = db.query(Invoice).filter(Invoice.invoice_id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if invoice.status == "PAID":
         raise HTTPException(status_code=400, detail="Cannot delete a PAID invoice. Please delete the receipt/payment first.")

    # Reset Reg Fee if applicable
    if any(item.description == "One-time Registration Fee" for item in invoice.items):
        if invoice.hospital:
            invoice.hospital.is_reg_fee_paid = False

    # Delete associated Ledger Entry
    db.query(AccountingTransaction).filter(
        AccountingTransaction.voucher_type == "INVOICE",
        AccountingTransaction.voucher_id == invoice_id
    ).delete()

    # Reset File Statuses
    items = db.query(InvoiceItem).filter(InvoiceItem.invoice_id == invoice_id).all()
    file_ids = [item.file_id for item in items if item.file_id is not None]
    
    if file_ids:
        db.query(PDFFile).filter(PDFFile.file_id.in_(file_ids)).update({
            "is_paid": False,
            "payment_date": None
        }, synchronize_session=False)

    # --- GAP FILLING LOGIC ---
    # Recycle the invoice number for reuse
    try:
        config = db.query(AccountingConfig).first()
        if config and invoice.invoice_number:
            # Format: PREFIX/FY/NUMBER
            parts = invoice.invoice_number.split('/')
            if len(parts) == 3:
                raw_number = int(parts[2])
                fy = parts[1]
                
                # Determine type by prefix
                inv_type = 'gst'
                if parts[0] == config.invoice_prefix_nongst or parts[0] == "BOS":
                    inv_type = 'nongst'
                
                from ..models import AvailableInvoiceNumber
                # Add to pool if not already there
                exists = db.query(AvailableInvoiceNumber).filter(
                    AvailableInvoiceNumber.number == raw_number,
                    AvailableInvoiceNumber.invoice_type == inv_type,
                    AvailableInvoiceNumber.financial_year == fy
                ).first()
                
                if not exists:
                    pool_entry = AvailableInvoiceNumber(
                        number=raw_number,
                        invoice_type=inv_type,
                        financial_year=fy
                    )
                    db.add(pool_entry)
                    db.commit()
    except Exception as e:
        print(f"Non-critical error recycling invoice number: {e}")
    # -------------------------

    # Delete Invoice (Cascade will delete items)
    db.delete(invoice)
    db.commit()
    
    # Check if table is empty, if so, reset pool and counters
    if db.query(Invoice).count() == 0:
        if config:
            config.next_invoice_number = 1
            config.next_invoice_number_nongst = 1
            
            from ..models import AvailableInvoiceNumber
            db.query(AvailableInvoiceNumber).delete() # Clear pool
            db.commit()
            
    return {"message": "Invoice deleted, number recycled, ledger updated, and items reset"}
