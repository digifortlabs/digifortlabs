from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, date, timedelta
from pydantic import BaseModel

from ..database import get_db
from ..models import User, PharmaMedicine, PharmaStock, PharmaSale, PharmaSaleItem, PharmaExpiry
from .auth import get_current_user

router = APIRouter(prefix="/pharma", tags=["Pharmacy"])

# --- Pydantic Schemas ---

class MedicineCreate(BaseModel):
    medicine_name: str
    generic_name: Optional[str] = None
    brand_name: Optional[str] = None
    manufacturer: Optional[str] = None
    category: Optional[str] = None
    drug_class: Optional[str] = None
    schedule: Optional[str] = None
    form: Optional[str] = None
    strength: Optional[str] = None
    pack_size: Optional[int] = 1
    mrp: float
    purchase_price: float
    selling_price: float
    gst_rate: float = 12.0
    reorder_level: int = 10
    requires_prescription: bool = True

class StockCreate(BaseModel):
    medicine_id: int
    batch_number: str
    manufacturing_date: Optional[date] = None
    expiry_date: date
    quantity_received: int
    supplier_name: Optional[str] = None
    supplier_invoice: Optional[str] = None
    purchase_price_per_unit: float
    selling_price_per_unit: float

class SaleCreate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    prescription_number: Optional[str] = None
    doctor_name: Optional[str] = None
    items: List[dict]  # [{medicine_id, stock_id, quantity, unit_price, discount}]
    discount: float = 0.0
    payment_method: str = "cash"

# --- Endpoints ---

@router.post("/medicines")
def add_medicine(
    medicine: MedicineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add new medicine to inventory"""
    med = PharmaMedicine(
        hospital_id=current_user.hospital_id,
        medicine_name=medicine.medicine_name,
        generic_name=medicine.generic_name,
        brand_name=medicine.brand_name,
        manufacturer=medicine.manufacturer,
        category=medicine.category,
        drug_class=medicine.drug_class,
        schedule=medicine.schedule,
        form=medicine.form,
        strength=medicine.strength,
        pack_size=medicine.pack_size,
        mrp=medicine.mrp,
        purchase_price=medicine.purchase_price,
        selling_price=medicine.selling_price,
        gst_rate=medicine.gst_rate,
        reorder_level=medicine.reorder_level,
        requires_prescription=medicine.requires_prescription
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    return med

@router.get("/medicines")
def get_medicines(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all medicines"""
    query = db.query(PharmaMedicine).filter(
        PharmaMedicine.hospital_id == current_user.hospital_id,
        PharmaMedicine.is_active == True
    )
    
    if search:
        query = query.filter(
            func.lower(PharmaMedicine.medicine_name).contains(func.lower(search))
        )
    
    return query.all()

@router.post("/stock")
def add_stock(
    stock: StockCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add stock/batch"""
    medicine = db.query(PharmaMedicine).filter(
        PharmaMedicine.medicine_id == stock.medicine_id,
        PharmaMedicine.hospital_id == current_user.hospital_id
    ).first()
    
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    
    new_stock = PharmaStock(
        medicine_id=stock.medicine_id,
        batch_number=stock.batch_number,
        manufacturing_date=stock.manufacturing_date,
        expiry_date=stock.expiry_date,
        quantity_received=stock.quantity_received,
        quantity_remaining=stock.quantity_received,
        supplier_name=stock.supplier_name,
        supplier_invoice=stock.supplier_invoice,
        purchase_price_per_unit=stock.purchase_price_per_unit,
        selling_price_per_unit=stock.selling_price_per_unit
    )
    db.add(new_stock)
    
    # Update medicine stock
    medicine.current_stock += stock.quantity_received
    
    db.commit()
    db.refresh(new_stock)
    return new_stock

@router.get("/stock/expiring")
def get_expiring_stock(
    days: int = 90,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get stock expiring within specified days"""
    cutoff_date = date.today() + timedelta(days=days)
    
    expiring = db.query(PharmaStock).join(PharmaMedicine).filter(
        PharmaMedicine.hospital_id == current_user.hospital_id,
        PharmaStock.expiry_date <= cutoff_date,
        PharmaStock.quantity_remaining > 0
    ).all()
    
    return expiring

@router.post("/sales")
def create_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Process medicine sale"""
    subtotal = 0
    gst_amount = 0
    
    # Create sale record
    new_sale = PharmaSale(
        hospital_id=current_user.hospital_id,
        customer_name=sale.customer_name,
        customer_phone=sale.customer_phone,
        prescription_number=sale.prescription_number,
        doctor_name=sale.doctor_name,
        discount=sale.discount,
        payment_method=sale.payment_method
    )
    db.add(new_sale)
    db.flush()
    
    # Process items
    for item in sale.items:
        medicine = db.query(PharmaMedicine).filter(
            PharmaMedicine.medicine_id == item["medicine_id"]
        ).first()
        
        stock = db.query(PharmaStock).filter(
            PharmaStock.stock_id == item["stock_id"]
        ).first()
        
        if not stock or stock.quantity_remaining < item["quantity"]:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        
        # Calculate item total
        item_total = item["quantity"] * item["unit_price"]
        item_discount = item.get("discount", 0)
        item_subtotal = item_total - item_discount
        item_gst = item_subtotal * (medicine.gst_rate / 100)
        
        subtotal += item_subtotal
        gst_amount += item_gst
        
        # Create sale item
        sale_item = PharmaSaleItem(
            sale_id=new_sale.sale_id,
            medicine_id=item["medicine_id"],
            stock_id=item["stock_id"],
            quantity=item["quantity"],
            unit_price=item["unit_price"],
            discount=item_discount,
            gst_rate=medicine.gst_rate,
            total_price=item_subtotal + item_gst
        )
        db.add(sale_item)
        
        # Update stock
        stock.quantity_remaining -= item["quantity"]
        medicine.current_stock -= item["quantity"]
    
    # Update sale totals
    new_sale.subtotal = subtotal
    new_sale.gst_amount = gst_amount
    new_sale.total_amount = subtotal + gst_amount - sale.discount
    
    db.commit()
    db.refresh(new_sale)
    return new_sale

@router.get("/stats")
def get_pharma_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get pharmacy statistics"""
    total_medicines = db.query(PharmaMedicine).filter(
        PharmaMedicine.hospital_id == current_user.hospital_id,
        PharmaMedicine.is_active == True
    ).count()
    
    low_stock = db.query(PharmaMedicine).filter(
        PharmaMedicine.hospital_id == current_user.hospital_id,
        PharmaMedicine.current_stock <= PharmaMedicine.reorder_level
    ).count()
    
    today_sales = db.query(PharmaSale).filter(
        PharmaSale.hospital_id == current_user.hospital_id,
        func.date(PharmaSale.sale_date) == date.today()
    ).count()
    
    today_revenue = db.query(func.sum(PharmaSale.total_amount)).filter(
        PharmaSale.hospital_id == current_user.hospital_id,
        func.date(PharmaSale.sale_date) == date.today()
    ).scalar() or 0
    
    return {
        "total_medicines": total_medicines,
        "low_stock_items": low_stock,
        "today_sales": today_sales,
        "today_revenue": float(today_revenue)
    }
