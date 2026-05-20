from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Warehouse,
    PhysicalRack,
    User,
    UserRole,
)
from ..routers.auth import get_current_user

router = APIRouter(prefix="/platform-ops", tags=["Platform Operations"])

class WarehouseCreate(BaseModel):
    name: str
    location: Optional[str] = None
    is_active: Optional[bool] = True

class WarehouseResponse(BaseModel):
    warehouse_id: int
    name: str
    location: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class AssignRackRequest(BaseModel):
    rack_id: int
    warehouse_id: int

@router.post("/warehouses", response_model=WarehouseResponse)
def create_warehouse(warehouse: WarehouseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admins can manage warehouses")
        
    exists = db.query(Warehouse).filter(Warehouse.name == warehouse.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Warehouse with this name already exists")
        
    db_warehouse = Warehouse(**warehouse.dict())
    db.add(db_warehouse)
    db.commit()
    db.refresh(db_warehouse)
    return db_warehouse

@router.get("/warehouses", response_model=List[WarehouseResponse])
def get_warehouses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
        
    return db.query(Warehouse).all()

@router.post("/assign-rack")
def assign_rack_to_warehouse(req: AssignRackRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
        
    rack = db.query(PhysicalRack).filter(PhysicalRack.rack_id == req.rack_id).first()
    warehouse = db.query(Warehouse).filter(Warehouse.warehouse_id == req.warehouse_id).first()
    
    if not rack or not warehouse:
        raise HTTPException(status_code=404, detail="Rack or Warehouse not found")
        
    rack.warehouse_id = req.warehouse_id
    db.commit()
    return {"status": "success", "message": f"Rack {rack.label} assigned to Warehouse {warehouse.name}"}
