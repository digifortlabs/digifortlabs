from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from ..database import get_db
from ..models import (
    User, Hospital, AccountingVendor, AccountingExpense, AccountingTransaction, Invoice, AccountingConfig
)
from .auth import get_current_user

router = APIRouter()

# --- Pydantic Models ---

class VendorCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    gst_number: Optional[str] = None
    category: Optional[str] = "Operations"

class ExpenseCreate(BaseModel):
    description: str
    amount: float
    tax_amount: Optional[float] = 0.0
    category: str
    payment_method: str = "Cash"
    vendor_id: Optional[int] = None
    reference_number: Optional[str] = None
    date: Optional[datetime] = None

class TransactionResponse(BaseModel):
    transaction_id: int
    party_type: str
    party_id: Optional[int]
    voucher_type: str
    voucher_number: Optional[str]
    debit: float
    credit: float
    description: Optional[str]
    date: datetime

    class Config:
        from_attributes = True

class LedgerResponse(BaseModel):
    party_name: str
    opening_balance: float = 0.0
    closing_balance: float
    transactions: List[TransactionResponse]

class FinancialOverview(BaseModel):
    total_receivables: float # Money hospitals owe us
    total_payables: float # Money we owe vendors (if any)
    total_sales_mtd: float # Sales Month-to-Date
    total_expenses_mtd: float # Expenses Month-to-Date
    net_profit_mtd: float
    cash_in_hand: float

class GenericReceiptCreate(BaseModel):
    party_type: str # HOSPITAL or VENDOR
    party_id: int
    amount: float
    payment_method: str = "Bank Transfer"
    reference_number: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None

# --- Endpoints ---

@router.post("/receipts", response_model=TransactionResponse)
def create_receipt_voucher(
    req: GenericReceiptCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generic Receipt Voucher: Record money received from a party.
    Unlike 'receive-payment', this doesn't need to be tied to a specific invoice.
    """
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Access denied")

    # Get Config
    config = db.query(AccountingConfig).first()
    if not config:
        config = AccountingConfig()
        db.add(config)
        db.flush()

    # Generate Receipt Number if not provided
    voucher_number = req.reference_number
    if not voucher_number:
        voucher_number = config.number_format.format(
            prefix=config.receipt_prefix,
            fy=config.current_fy,
            number=config.next_receipt_number
        )
        config.next_receipt_number += 1

    # Create Ledger Entry (Credit)
    ledger_entry = AccountingTransaction(
        party_type=req.party_type,
        party_id=req.party_id,
        voucher_type="RECEIPT",
        voucher_number=voucher_number,
        debit=0.0,
        credit=req.amount,
        description=req.description or f"Payment received via {req.payment_method}",
        date=req.date or datetime.now()
    )
    db.add(ledger_entry)
    db.commit()
    db.refresh(ledger_entry)
    return ledger_entry

@router.get("/ledger/{party_type}/{party_id}", response_model=LedgerResponse)
def get_ledger(
    party_type: str, 
    party_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve full Statement of Account for a Hospital or Vendor."""
    if current_user.role != "superadmin":
        # Hospitals can only see their own ledger
        if party_type != "HOSPITAL" or party_id != current_user.hospital_id:
            raise HTTPException(status_code=403, detail="Access denied")

    party_name = "Unknown"
    if party_type == "HOSPITAL":
        h = db.query(Hospital).filter(Hospital.hospital_id == party_id).first()
        party_name = h.legal_name if h else "Unknown Hospital"
    else:
        v = db.query(AccountingVendor).filter(AccountingVendor.vendor_id == party_id).first()
        party_name = v.name if v else "Unknown Vendor"

    query = db.query(AccountingTransaction).filter(AccountingTransaction.party_type == party_type)
    
    if party_id == 0:
        query = query.filter(AccountingTransaction.party_id.is_(None))
    else:
        query = query.filter(AccountingTransaction.party_id == party_id)
        
    transactions = query.order_by(AccountingTransaction.date.asc()).all()

    # Calculate balances
    total_debit = sum(t.debit for t in transactions)
    total_credit = sum(t.credit for t in transactions)
    closing_balance = total_debit - total_credit

    return {
        "party_name": party_name,
        "opening_balance": 0.0,
        "closing_balance": closing_balance,
        "transactions": transactions
    }

@router.post("/expenses", response_model=ExpenseCreate)
def create_expense(
    req: ExpenseCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Log a business expense."""
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Access denied")

    # Get Config
    config = db.query(AccountingConfig).first()
    if not config:
        config = AccountingConfig()
        db.add(config)
        db.flush()

    # Generate Expense Number if not provided
    voucher_number = req.reference_number
    if not voucher_number:
        voucher_number = config.number_format.format(
            prefix=config.expense_prefix,
            fy=config.current_fy,
            number=config.next_expense_number
        )
        config.next_expense_number += 1

    new_expense = AccountingExpense(
        description=req.description,
        amount=req.amount,
        tax_amount=req.tax_amount,
        category=req.category,
        payment_method=req.payment_method,
        vendor_id=req.vendor_id,
        reference_number=voucher_number,
        date=req.date or datetime.now()
    )
    db.add(new_expense)
    db.flush()

    # Create Ledger Entry (Internal/Expense)
    # Debiting the Expense Account, Crediting Cash/Bank
    ledger_entry = AccountingTransaction(
        party_type="INTERNAL",
        party_id=None,
        voucher_type="EXPENSE",
        voucher_id=new_expense.expense_id,
        voucher_number=voucher_number,
        debit=req.amount + req.tax_amount,
        credit=0.0,
        description=f"Expense: {req.description} ({req.category})"
    )
    db.add(ledger_entry)
    
    # If Vendor is linked, create a CREDIT for vendor (Payable)
    if req.vendor_id:
        vendor_credit = AccountingTransaction(
            party_type="VENDOR",
            party_id=req.vendor_id,
            voucher_type="EXPENSE",
            voucher_id=new_expense.expense_id,
            voucher_number=voucher_number,
            debit=0.0,
            credit=req.amount + req.tax_amount,
            description=f"Purchase/Expense: {req.description} (Voucher: {voucher_number})",
            date=new_expense.date
        )
        db.add(vendor_credit)

    db.commit()
    return req

@router.get("/dashboard/overview", response_model=FinancialOverview)
def get_accounting_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Professional Financial Dashboard Summary."""
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Access denied")

    # 1. Total Receivables (Balance from all Hospital Ledgers)
    h_transactions = db.query(AccountingTransaction).filter(AccountingTransaction.party_type == "HOSPITAL").all()
    total_receivables = sum(t.debit for t in h_transactions) - sum(t.credit for t in h_transactions)

    # 2. Sales MTD (Current Month)
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    monthly_sales = db.query(func.sum(Invoice.total_amount)).filter(
        func.extract('month', Invoice.bill_date) == current_month,
        func.extract('year', Invoice.bill_date) == current_year,
        Invoice.status != "CANCELLED"
    ).scalar() or 0.0

    # 3. Expenses MTD
    monthly_expenses = db.query(func.sum(AccountingExpense.amount + AccountingExpense.tax_amount)).filter(
        func.extract('month', AccountingExpense.date) == current_month,
        func.extract('year', AccountingExpense.date) == current_year
    ).scalar() or 0.0

    # 4. Total Cash In Hand (Collected Payments - Expenses)
    total_collected = db.query(func.sum(AccountingTransaction.credit)).filter(
        AccountingTransaction.party_type == "HOSPITAL",
        AccountingTransaction.voucher_type == "RECEIPT"
    ).scalar() or 0.0
    
    total_out = db.query(func.sum(AccountingTransaction.debit)).filter(
        AccountingTransaction.party_type == "INTERNAL",
        AccountingTransaction.voucher_type == "EXPENSE"
    ).scalar() or 0.0

    # 1.5 Total Payables (Balance from all Vendor Ledgers)
    v_transactions = db.query(AccountingTransaction).filter(AccountingTransaction.party_type == "VENDOR").all()
    total_payables = sum(t.credit for t in v_transactions) - sum(t.debit for t in v_transactions)

    return {
        "total_receivables": total_receivables,
        "total_payables": total_payables,
        "total_sales_mtd": monthly_sales,
        "total_expenses_mtd": monthly_expenses,
        "net_profit_mtd": monthly_sales - monthly_expenses,
        "cash_in_hand": total_collected - total_out
    }

@router.post("/vendors", response_model=VendorCreate)
def create_vendor(
    req: VendorCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Access denied")

    vendor = AccountingVendor(**req.dict())
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return req

@router.get("/vendors")
def list_vendors(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(AccountingVendor).all()

@router.put("/expenses/{expense_id}")
def update_expense(
    expense_id: int,
    req: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing expense and its linked transactions."""
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Access denied")

    expense = db.query(AccountingExpense).filter(AccountingExpense.expense_id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Update Expense Record
    expense.description = req.description
    expense.amount = req.amount
    expense.category = req.category
    expense.payment_method = req.payment_method
    expense.date = req.date or expense.date
    
    # Update Related Ledger Entries (Reset amounts)
    internal_txn = db.query(AccountingTransaction).filter(
        AccountingTransaction.voucher_type == "EXPENSE",
        AccountingTransaction.voucher_id == expense_id,
        AccountingTransaction.party_type == "INTERNAL"
    ).first()
    
    if internal_txn:
        internal_txn.debit = req.amount + req.tax_amount
        internal_txn.description = f"Expense: {req.description} ({req.category})"
        internal_txn.date = expense.date

    # If linked to vendor, update that too
    if expense.vendor_id:
        vendor_txn = db.query(AccountingTransaction).filter(
            AccountingTransaction.voucher_type == "EXPENSE",
            AccountingTransaction.voucher_id == expense_id,
            AccountingTransaction.party_type == "VENDOR"
        ).first()
        if vendor_txn:
            vendor_txn.credit = req.amount + req.tax_amount
            vendor_txn.description = f"Purchase/Expense: {req.description}"
            vendor_txn.date = expense.date

    db.commit()
    return {"message": "Expense updated successfully"}

@router.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an expense and remove it from the ledger."""
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Access denied")

    expense = db.query(AccountingExpense).filter(AccountingExpense.expense_id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Delete Linked Transactions First
    db.query(AccountingTransaction).filter(
        AccountingTransaction.voucher_type == "EXPENSE",
        AccountingTransaction.voucher_id == expense_id
    ).delete()

    # Delete Expense
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}
