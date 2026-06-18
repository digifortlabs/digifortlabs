from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta

from ..database import get_db
from ..models import User, InventoryItem, PharmacySupplier, MedicineBatch, PurchaseInvoice, PurchaseItem
from .auth import get_current_user

router = APIRouter(
    prefix="/pharmacy/inventory",
    tags=["pharmacy_inventory"]
)

# --- Schemas ---

class SupplierCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gst_number: Optional[str] = None
    address: Optional[str] = None

class PurchaseItemCreate(BaseModel):
    item_id: int
    batch_number: str
    mfg_date: Optional[str] = None
    expiry_date: Optional[str] = None
    quantity: int
    free_quantity: int = 0
    purchase_price: float
    mrp: float
    tax_percentage: float = 0.0
    total_price: float

class PurchaseInvoiceCreate(BaseModel):
    supplier_id: int
    invoice_number: str
    invoice_date: Optional[str] = None
    subtotal: float
    tax_amount: float
    discount: float
    total_amount: float
    items: List[PurchaseItemCreate]

# --- Endpoints ---

@router.get("/suppliers")
def get_suppliers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(PharmacySupplier).filter(PharmacySupplier.hospital_id == current_user.hospital_id).all()

@router.post("/suppliers")
def create_supplier(payload: SupplierCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_supplier = PharmacySupplier(
        hospital_id=current_user.hospital_id,
        **payload.dict()
    )
    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)
    return new_supplier

@router.post("/purchases")
def create_purchase(payload: PurchaseInvoiceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Create Invoice
    invoice = PurchaseInvoice(
        hospital_id=current_user.hospital_id,
        supplier_id=payload.supplier_id,
        received_by=current_user.user_id,
        invoice_number=payload.invoice_number,
        invoice_date=datetime.fromisoformat(payload.invoice_date.replace("Z", "+00:00")) if payload.invoice_date else datetime.now(),
        subtotal=payload.subtotal,
        tax_amount=payload.tax_amount,
        discount=payload.discount,
        total_amount=payload.total_amount
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    # 2. Process Items (Create Batches & Update Master Stock)
    for req_item in payload.items:
        # Create Batch
        mfg_dt = datetime.fromisoformat(req_item.mfg_date.replace("Z", "+00:00")) if req_item.mfg_date else None
        exp_dt = datetime.fromisoformat(req_item.expiry_date.replace("Z", "+00:00")) if req_item.expiry_date else None
        
        batch = MedicineBatch(
            item_id=req_item.item_id,
            hospital_id=current_user.hospital_id,
            supplier_id=payload.supplier_id,
            batch_number=req_item.batch_number,
            mfg_date=mfg_dt,
            expiry_date=exp_dt,
            purchase_price=req_item.purchase_price,
            mrp=req_item.mrp,
            initial_stock=req_item.quantity + req_item.free_quantity,
            current_stock=req_item.quantity + req_item.free_quantity
        )
        db.add(batch)
        db.commit()
        db.refresh(batch)

        # Create Purchase Item line
        purchase_item = PurchaseItem(
            invoice_id=invoice.invoice_id,
            batch_id=batch.batch_id,
            item_id=req_item.item_id,
            quantity=req_item.quantity,
            free_quantity=req_item.free_quantity,
            purchase_price=req_item.purchase_price,
            tax_percentage=req_item.tax_percentage,
            total_price=req_item.total_price
        )
        db.add(purchase_item)

        # Update Master Catalog Stock
        inv_item = db.query(InventoryItem).filter(InventoryItem.item_id == req_item.item_id).first()
        if inv_item:
            inv_item.current_stock += (req_item.quantity + req_item.free_quantity)

    db.commit()
    return {"message": "Purchase recorded successfully", "invoice_id": invoice.invoice_id}

@router.get("/expiring")
def get_expiring_stock(days: int = 90, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    threshold_date = datetime.now() + timedelta(days=days)
    
    batches = db.query(MedicineBatch).filter(
        MedicineBatch.hospital_id == current_user.hospital_id,
        MedicineBatch.current_stock > 0,
        MedicineBatch.expiry_date != None,
        MedicineBatch.expiry_date <= threshold_date
    ).order_by(MedicineBatch.expiry_date.asc()).all()
    
    result = []
    for b in batches:
        result.append({
            "batch_id": b.batch_id,
            "item_name": b.item.name,
            "batch_number": b.batch_number,
            "expiry_date": b.expiry_date,
            "current_stock": b.current_stock,
            "supplier_name": b.supplier.name if b.supplier else "Unknown"
        })
    return result

@router.get("/batches/{item_id}")
def get_item_batches(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    batches = db.query(MedicineBatch).filter(
        MedicineBatch.hospital_id == current_user.hospital_id,
        MedicineBatch.item_id == item_id,
        MedicineBatch.current_stock > 0
    ).order_by(MedicineBatch.expiry_date.asc()).all()
    
    result = []
    for b in batches:
        result.append({
            "batch_id": b.batch_id,
            "batch_number": b.batch_number,
            "expiry_date": b.expiry_date,
            "mrp": b.mrp,
            "stock": b.current_stock
        })
    return result
