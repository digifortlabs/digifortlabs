
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models import InventoryItem, InventoryLog, User
from app.routers.auth import get_current_user
from app.audit import log_audit

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
    responses={404: {"description": "Not found"}},
)

# --- Pydantic Models ---
class InventoryItemCreate(BaseModel):
    name: str # Fixed typo
    category: Optional[str] = "Consumables"
    unit_price: float = 0.0
    reorder_point: int = 10
    unit: str = "units"
    current_stock: int = 0

class StockUpdateRequest(BaseModel):
    change_type: str # IN, OUT, ADJUST
    quantity: int
    description: Optional[str] = None
    
class InventoryItemResponse(InventoryItemCreate):
    item_id: int
    last_updated: Optional[str] = None
    
    class Config:
        from_attributes = True

# --- Endpoints ---

@router.get("/", response_model=List[InventoryItemResponse])
def get_inventory(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(InventoryItem).all()

@router.post("/", response_model=InventoryItemResponse)
def create_item(item: InventoryItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_item = InventoryItem(
        name=item.name,
        category=item.category,
        unit_price=item.unit_price,
        reorder_point=item.reorder_point,
        unit=item.unit,
        current_stock=item.current_stock
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    # Log initial stock if > 0
    if item.current_stock > 0:
        log = InventoryLog(
            item_id=new_item.item_id,
            change_type="IN",
            quantity=item.current_stock,
            description="Initial Stock",
            performed_by=current_user.user_id
        )
        db.add(log)
        db.commit()
        
    # Log Audit
    log_audit(
        db, 
        user_id=current_user.user_id, 
        action="INVENTORY_ITEM_CREATED", 
        details=f"Created Item: {new_item.name} (Stock: {new_item.current_stock})",
        hospital_id=current_user.hospital_id
    )      
        
    return new_item

@router.patch("/{item_id}/stock")
def update_stock(
    item_id: int, 
    req: StockUpdateRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    item = db.query(InventoryItem).filter(InventoryItem.item_id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    if req.change_type == "OUT" and item.current_stock < req.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
        
    # Update Stock
    if req.change_type == "IN":
        item.current_stock += req.quantity
    elif req.change_type == "OUT":
        item.current_stock -= req.quantity
    elif req.change_type == "ADJUST":
        # Adjust expects absolute value or logic? usually adjust sets to value or adds diff.
        # Let's assume ADJUST allows manual correction (+/-) but here we stick to simple logic
        # For simplicity, let's treat ADJUST as 'Set To' or just add signed int. 
        # But req.quantity is int. Let's assume ADJUST is +/- signed in quantity
        # Actually safer to keep quantity positive and rely on change_type
        # If ADJUST, maybe it's just a correction logged.
        # Let's handle ADJUST as Set To:
        old_stock = item.current_stock
        item.current_stock = req.quantity # Dangerous if concurrent.
        # Better: ADJUST adds/removes to match result.
        pass 
    
    # Let's simplify: IN (Add), OUT (Sub), ADJUST (Add/Sub logic left to user, we just trust the math?)
    # Re-reading: req.quantity is int. 
    # Let's implement ADJUST as: SET STOCK TO X
    if req.change_type == "ADJUST":
         item.current_stock = req.quantity
         
    item.last_updated = datetime.now()
    
    # Log
    log = InventoryLog(
        item_id=item.item_id,
        change_type=req.change_type,
        quantity=req.quantity,
        description=req.description,
        performed_by=current_user.user_id
    )
    db.add(log)
    db.commit()
    
    # Log Audit
    log_audit(
        db, 
        user_id=current_user.user_id, 
        action="INVENTORY_STOCK_UPDATED", 
        details=f"Updated Stock for {item.name}: {req.change_type} {req.quantity} (New Balance: {item.current_stock})",
        hospital_id=current_user.hospital_id
    )
    
    return {"message": "Stock updated", "current_stock": item.current_stock}

@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "superadmin":
         raise HTTPException(status_code=403, detail="Not authorized")
         
    item = db.query(InventoryItem).filter(InventoryItem.item_id == item_id).first()
    if not item:
        raise HTTPException(status_code=404)
        
    db.delete(item)
    db.commit()

    # Log Audit
    log_audit(
        db, 
        user_id=current_user.user_id, 
        action="INVENTORY_ITEM_DELETED", 
        details=f"Deleted Item: {item.name}",
        hospital_id=current_user.hospital_id
    )

    return {"message": "Item deleted"}
