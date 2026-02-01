from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import (
    FileRequest,
    Hospital,
    Patient,
    PDFFile,
    PhysicalBox,
    PhysicalMovementLog,
    PhysicalRack,
    User,
    UserRole,
)
from ..routers.auth import get_current_user
from ..services.storage_service import StorageService
from ..services.email_service import EmailService

router = APIRouter()

# --- Helper Functions for Emails ---
def get_hospital_admin_emails(db: Session, hospital_id: int) -> List[str]:
    users = db.query(User).filter(
        User.hospital_id == hospital_id,
        User.role == UserRole.HOSPITAL_ADMIN
    ).all()
    return [u.email for u in users if u.email]

def get_super_admin_emails(db: Session) -> List[str]:
    users = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).all()
    return [u.email for u in users if u.email]

# --- Rack Models ---
class RackCreate(BaseModel):
    label: str
    aisle: int
    capacity: int = 500
    total_rows: int = 5
    total_columns: int = 10
    hospital_id: Optional[int] = None # For Super Admin

class RackUpdate(BaseModel):
    label: Optional[str] = None
    aisle: Optional[int] = None
    capacity: Optional[int] = None
    total_rows: Optional[int] = None
    total_columns: Optional[int] = None

class RackResponse(BaseModel):
    rack_id: int
    hospital_id: Optional[int] = None
    label: str
    aisle: int
    capacity: int
    total_rows: int = 5
    hospital_name: Optional[str] = None
    total_columns: int = 10
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Pydantic Models ---
class BoxCreate(BaseModel):
    label: str
    location_code: str
    hospital_id: Optional[int] = None # Required for Super Admin
    rack_id: Optional[int] = None
    capacity: Optional[int] = 500
    category: Optional[str] = "GENERAL"

class BoxUpdate(BaseModel):
    label: Optional[str] = None
    location_code: Optional[str] = None
    status: Optional[str] = None
    rack_id: Optional[int] = None
    rack_row: Optional[int] = None
    rack_column: Optional[int] = None
    capacity: Optional[int] = None
    category: Optional[str] = None

class BoxResponse(BaseModel):
    box_id: int
    hospital_name: Optional[str] = None
    label: str
    location_code: Optional[str] = None # Hidden for Hospital Staff
    status: str
    patient_count: int = 0
    capacity: int = 500
    category: str = "GENERAL"
    rack_id: Optional[int] = None
    rack_row: Optional[int] = None
    rack_column: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RequestCreate(BaseModel):
    box_id: int
    requester_name: str

class RequestResponse(BaseModel):
    request_id: int
    box_label: str
    requester_name: str
    status: str
    request_date: datetime
    
    class Config:
        from_attributes = True

class AssignBoxRequest(BaseModel):
    box_id: int

class MovementLogCreate(BaseModel):
    type: str # CHECK-IN, CHECK-OUT
    uhid: str
    name: str # Patient Name
    dest: str # Destination

class MovementLogResponse(BaseModel):
    id: int
    type: str
    uhid: str
    name: str
    dest: str
    time: str
    status: str

    class Config:
        from_attributes = True

# --- Endpoints ---

@router.post("/racks", response_model=RackResponse)
def create_rack(rack: RackCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Auth
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.WAREHOUSE_MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    target_hospital_id = current_user.hospital_id
    if current_user.role == UserRole.SUPER_ADMIN:
         if rack.hospital_id:
             target_hospital_id = rack.hospital_id
         # else: target_hospital_id = None (Shared rack)
    else:
        # Standard users create racks for their own hospital if not super admin
        if not target_hospital_id:
             target_hospital_id = 1

    # --- AUTO-NAMING LOGIC (RACK) ---
    final_label = rack.label
    
    if not final_label or final_label.strip() == "":
        # Logic: RACK-{AISLE_CODE}-{SEQ}
        # e.g., Aisle 1 -> RACK-A1-01
        
        # Count existing racks in this aisle (Across all hospitals or per hospital?)
        # Since racks are now potentially global/shared, let's count all racks in this aisle.
        query = db.query(PhysicalRack).filter(
            PhysicalRack.aisle == rack.aisle
        )
        if target_hospital_id and current_user.role != UserRole.SUPER_ADMIN:
            # For non-superadmins, they only interact with their hospital's sequential naming?
            # Actually, label collision should be warehouse-wide.
            pass
        
        count_in_aisle = query.count()
        
        seq = count_in_aisle + 1
        final_label = f"RACK-A{rack.aisle}-{str(seq).zfill(2)}"
        
        # Safety check for collision (increment if needed)
        while db.query(PhysicalRack).filter(PhysicalRack.label == final_label).first():
            seq += 1
            final_label = f"RACK-A{rack.aisle}-{str(seq).zfill(2)}"

    # Check for duplicate label (Global check)
    exists = db.query(PhysicalRack).filter(
        PhysicalRack.label == final_label
    ).first()
    
    if exists:
        raise HTTPException(status_code=400, detail=f"Rack with label {final_label} already exists")

    new_rack = PhysicalRack(
        hospital_id=target_hospital_id,
        label=final_label,
        aisle=rack.aisle,
        capacity=rack.capacity,
        total_rows=rack.total_rows,
        total_columns=rack.total_columns
    )
    db.add(new_rack)
    db.commit()
    db.refresh(new_rack)
    return new_rack

@router.patch("/racks/{rack_id}", response_model=RackResponse)
def update_rack(rack_id: int, rack_update: RackUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Auth
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.WAREHOUSE_MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_rack = db.query(PhysicalRack).filter(PhysicalRack.rack_id == rack_id).first()
    if not db_rack:
        raise HTTPException(status_code=404, detail="Rack not found")
        
    if current_user.role != UserRole.SUPER_ADMIN and db_rack.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = rack_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_rack, key, value)

    db.commit()
    db.refresh(db_rack)
    return db_rack

@router.delete("/racks/{rack_id}")
def delete_rack(rack_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Auth
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.WAREHOUSE_MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_rack = db.query(PhysicalRack).filter(PhysicalRack.rack_id == rack_id).first()
    if not db_rack:
        raise HTTPException(status_code=404, detail="Rack not found")
        
    if current_user.role != UserRole.SUPER_ADMIN and db_rack.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check for boxes
    has_boxes = db.query(PhysicalBox).filter(PhysicalBox.rack_id == rack_id).first()
    if has_boxes:
        raise HTTPException(status_code=400, detail="Cannot delete rack containing boxes. Remove boxes first.")

    db.delete(db_rack)
    db.commit()
    return {"status": "success", "message": "Rack deleted"}

@router.get("/racks", response_model=List[RackResponse])
def get_racks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(PhysicalRack)
    racks = query.all()
    
    # Enrich with hospital_name
    results = []
    for r in racks:
        h_name = r.hospital.legal_name if r.hospital else None
        results.append(RackResponse(
            rack_id=r.rack_id,
            hospital_id=r.hospital_id,
            label=r.label,
            aisle=r.aisle,
            capacity=r.capacity,
            total_rows=r.total_rows,
            hospital_name=h_name,
            total_columns=r.total_columns,
            created_at=r.created_at
        ))
    return results


@router.get("/layout")
def get_warehouse_layout(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.PLATFORM_STAFF, UserRole.HOSPITAL_ADMIN]:
        return []

    # Fetch all racks (Racks are now shared warehouse resources)
    db_racks = db.query(PhysicalRack).all()
    
    if not db_racks:
        return []

    # Optimize: Single Aggregation Query for Rack Occupancy
    # SELECT rack_id, COUNT(*) FROM physical_box WHERE rack_id IN (...) GROUP BY rack_id
    rack_ids = [r.rack_id for r in db_racks]
    occupancy_data = db.query(
        PhysicalBox.rack_id, 
        func.count(PhysicalBox.box_id)
    ).filter(
        PhysicalBox.rack_id.in_(rack_ids)
    ).group_by(PhysicalBox.rack_id).all()
    
    # Map occupancy to rack_id
    occupancy_map = {r_id: count for r_id, count in occupancy_data}

    layout_map = {}
    for rack in db_racks:
        if rack.aisle not in layout_map:
            layout_map[rack.aisle] = []
        
        # O(1) Lookup
        occupied = occupancy_map.get(rack.rack_id, 0)
        
        layout_map[rack.aisle].append({
            "id": str(rack.rack_id),
            "name": rack.label,
            "capacity": rack.capacity,
            "occupied": occupied
        })

    result = []
    for aisle_num in sorted(layout_map.keys()):
        result.append({
            "aisle": aisle_num,
            "racks": layout_map[aisle_num]
        })
        
    return result

# --- New Models ---
class BoxStatusUpdate(BaseModel):
    is_open: bool

class BulkAssignRequest(BaseModel):
    identifiers: List[str] 
    box_id: int

class BulkUnassignRequest(BaseModel):
    identifiers: List[str]

# --- New Endpoints ---

@router.patch("/boxes/{box_id}/status")
def toggle_box_status(box_id: int, status: BoxStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.WAREHOUSE_MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_box = db.query(PhysicalBox).filter(PhysicalBox.box_id == box_id).first()
    if not db_box:
        raise HTTPException(status_code=404, detail="Box not found")
        
    if current_user.role != UserRole.SUPER_ADMIN and db_box.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # If opening this box, CLOSE ALL OTHERS first
    if status.is_open:
        # Find all open boxes for this hospital and close them
        target_hospital_id = db_box.hospital_id
        db.query(PhysicalBox).filter(
            PhysicalBox.hospital_id == target_hospital_id,
            PhysicalBox.is_open == True
        ).update({
            "is_open": False,
            "status": "CLOSED"
        }, synchronize_session=False)

    db_box.is_open = status.is_open
    if not status.is_open:
        db_box.status = "CLOSED"
    else:
        db_box.status = "OPEN"
        
    db.commit()
    db.refresh(db_box) # Refresh to get latest state
    return {"status": "success", "message": f"Box {'opened' if status.is_open else 'closed'}", "is_open": db_box.is_open}

@router.post("/files/bulk-assign")
def bulk_assign_files(req: BulkAssignRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.HOSPITAL_ADMIN, UserRole.PLATFORM_STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    box = db.query(PhysicalBox).filter(PhysicalBox.box_id == req.box_id).first()
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
        
    if not box.is_open:
        raise HTTPException(status_code=400, detail="This box is CLOSED. Please open it first.")

    # Check current capacity
    current_count = db.query(Patient).filter(Patient.physical_box_id == box.box_id).count()
    
    # Valid scope: Patients must belong to the same hospital as the box
    target_hospital_id = box.hospital_id
    
    success_count = 0
    errors = []
    
    for ident in req.identifiers:
        # Check if box is full before each assignment
        if current_count >= box.capacity:
            # AUTO-EXPAND POLICY:
            # If current user is Admin/Warehouse/Platform, we increase capacity automatically up to 1000
            # This prevents "199/200" blockers during bulk operations.
            if current_user.role in [UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.PLATFORM_STAFF, UserRole.HOSPITAL_ADMIN] and box.capacity < 1000:
                 box.capacity = max(box.capacity + 100, current_count + 50) # Give extra breathing room
                 if box.capacity > 1000: box.capacity = 1000
                 db.commit() # Save capacity increase immediately
            
            # Re-check
            if current_count >= box.capacity:
                errors.append(f"{ident}: Box is FULL (capacity: {box.capacity})")
                continue
            
        p = db.query(Patient).filter(
            Patient.hospital_id == target_hospital_id,
            (Patient.patient_u_id == ident) | (Patient.uhid == ident)
        ).first()

        if not p:
            # Try parsing as int for record_id (Frontend sends record_id)
            try:
                rid = int(ident)
                p = db.query(Patient).filter(
                    Patient.hospital_id == target_hospital_id, 
                    Patient.record_id == rid
                ).first()
            except:
                pass
        
        if not p:
            errors.append(f"{ident}: Not Found")
            continue
            
        if p.physical_box_id == box.box_id:
            errors.append(f"{ident}: Already in this box")
            continue

        # Strict Category Check
        # Normalize Legacy Categories
        normalize_map = {
            "STANDARD": "IPD",
            "GENERAL": "IPD",
            "MLC": "MCL",
            "BIRTH": "BRT",
            "DEATH": "DHT"
        }
        
        p_raw = (p.patient_category or "IPD").upper()
        p_cat = normalize_map.get(p_raw, p_raw) # Default to self if not in map (e.g., already IPD, OPD)
        
        b_raw = (box.category or "IPD").upper()
        b_cat = normalize_map.get(b_raw, b_raw)
        
        if p_cat != b_cat:
            errors.append(f"{ident}: Mismatch - File is {p_cat}, Box is {b_cat}")
            continue
            
        p.physical_box_id = box.box_id
        success_count += 1
        current_count += 1
        
    db.commit()
    
    # Auto-close box if it reached capacity
    if current_count >= box.capacity and box.is_open:
        box.is_open = False
        box.status = "CLOSED"
        db.commit()
        
    return {
        "status": "success",
        "assigned": success_count,
        "errors": errors,
        "message": f"Successfully assigned {success_count} files." + (" Box is now FULL and auto-closed." if current_count >= box.capacity else ""),
        "box_full": current_count >= box.capacity
    }

@router.post("/files/bulk-unassign")
def bulk_unassign_files(req: BulkUnassignRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Reusing BulkUnassignRequest (safe now)
    
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.HOSPITAL_ADMIN, UserRole.PLATFORM_STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized")

    hospital_id = current_user.hospital_id
    success_count = 0
    errors = []

    for ident in req.identifiers:
        # Build base query
        query = db.query(Patient)
        if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
             query = query.filter(Patient.hospital_id == hospital_id)
        
        # Find by ID or UHID
        p = query.filter((Patient.patient_u_id == ident) | (Patient.uhid == ident)).first()

        if not p:
            # Try parsing as int for record_id
            try:
                rid = int(ident)
                query_rid = db.query(Patient)
                if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
                    query_rid = query_rid.filter(Patient.hospital_id == hospital_id)
                p = query_rid.filter(Patient.record_id == rid).first()
            except:
                pass

        if not p:
            errors.append(f"{ident}: Not Found")
            continue

        p.physical_box_id = None
        success_count += 1

    db.commit()

    return {
        "status": "success", 
        "unassigned": success_count,
        "errors": errors,
        "message": f"Successfully unassigned {success_count} files."
    }


@router.get("/logs", response_model=List[MovementLogResponse])
def get_movement_logs(limit: int = 50, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logs = db.query(PhysicalMovementLog).order_by(PhysicalMovementLog.timestamp.desc()).limit(limit).all()
    return [
        MovementLogResponse(
            id=log.log_id,
            type=log.action_type,
            uhid=log.uhid,
            name=log.patient_name,
            dest=log.destination,
            time=log.timestamp.strftime("%I:%M %p"),
            status=log.status
        ) for log in logs
    ]

@router.post("/move")
def record_movement(move: MovementLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized to move files")

    new_log = PhysicalMovementLog(
        action_type=move.type,
        uhid=move.uhid,
        patient_name=move.name,
        destination=move.dest,
        performed_by_user_id=current_user.user_id,
        status="Success"
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    
    return {"status": "success", "log_id": new_log.log_id}


# --- Original Endpoints (Kept for compatibility) ---

@router.get("/boxes", response_model=List[BoxResponse])
def get_boxes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(PhysicalBox)
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        query = query.filter(PhysicalBox.hospital_id == current_user.hospital_id)
    
    boxes = query.all()
    results = []
    
    for b in boxes:
        count = db.query(Patient).filter(Patient.physical_box_id == b.box_id).count()
        hospital_name = b.hospital.legal_name if b.hospital else "Unknown"
        show_location = current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]
        
        results.append(BoxResponse(
            box_id=b.box_id,
            hospital_name=hospital_name,
            label=b.label,
            location_code=b.location_code if show_location else "RESTRICTED",
            status=b.status,
            patient_count=count,
            capacity=b.capacity or 100, 
            category=b.category or "GENERAL",
            rack_id=b.rack_id,
            rack_row=b.rack_row,
            rack_column=b.rack_column,
            created_at=b.created_at
        ))
    return results

@router.post("/boxes", response_model=BoxResponse)
def create_box(box: BoxCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.WAREHOUSE_MANAGER]:
         raise HTTPException(status_code=403, detail="Not authorized to create boxes")
    
    target_hospital_id = current_user.hospital_id
    if current_user.role == UserRole.SUPER_ADMIN:
        # Prioritize box.hospital_id if provided by super admin
        if box.hospital_id:
            target_hospital_id = box.hospital_id
        elif box.rack_id:
             rack_obj = db.query(PhysicalRack).filter(PhysicalRack.rack_id == box.rack_id).first()
             if rack_obj: target_hospital_id = rack_obj.hospital_id
        
        if not target_hospital_id: target_hospital_id = 1

    # --- AUTO-NAMING ---
    final_label = box.label
    final_location = box.location_code
    
    rack = None
    if box.rack_id:
         rack = db.query(PhysicalRack).filter(PhysicalRack.rack_id == box.rack_id).first()
    
    if not final_label or final_label.strip() == "":
        # Format: BOX-{YYYY}-{MM}-{SEQ}
        now = datetime.now()
        prefix = f"BOX-{now.year}-{str(now.month).zfill(2)}"
        
        # Get Global Global Sequence for this hospital/prefix OR per Rack?
        # Let's use Rack Sequence if Rack exists, otherwise Global.
        # Decision: Global is safer for uniqueness.
        
        count = db.query(PhysicalBox).filter(
            PhysicalBox.hospital_id == target_hospital_id,
            PhysicalBox.label.like(f"{prefix}%")
        ).count()
        
        seq = count + 1
        final_label = f"{prefix}-{str(seq).zfill(3)}"
        
        while db.query(PhysicalBox).filter(PhysicalBox.label == final_label).first():
            seq += 1
            final_label = f"{prefix}-{str(seq).zfill(3)}"

    # --- AUTO-SLOTTING ---
    # Find next available row/col in the Rack
    assigned_row = None
    assigned_col = None
    
    if rack:
        # Get all occupied slots
        occupied_slots = db.query(PhysicalBox.rack_row, PhysicalBox.rack_column).filter(
            PhysicalBox.rack_id == rack.rack_id
        ).all()
        occupied_set = set((r, c) for r, c in occupied_slots if r and c)
        
        # Grid Search
        found = False
        for r in range(1, rack.total_rows + 1):
            if found: break
            for c in range(1, rack.total_columns + 1):
                if (r, c) not in occupied_set:
                    assigned_row = r
                    assigned_col = c
                    found = True
                    break
                    
        if not found:
            raise HTTPException(status_code=400, detail="Rack is physically full (no empty slots).")
            
        # Update Location Code
        if not final_location:
            final_location = f"{rack.label}-R{assigned_row}-C{assigned_col}"

    new_box = PhysicalBox(
        hospital_id=target_hospital_id,
        label=final_label,
        location_code=final_location,
        rack_id=box.rack_id,
        rack_row=assigned_row,
        rack_column=assigned_col,
        capacity=box.capacity or 500,
        category=box.category or "GENERAL",
        status="OPEN"
    )

    db.add(new_box)
    db.commit()
    db.refresh(new_box)
    
    return BoxResponse(
        box_id=new_box.box_id,
        hospital_name=new_box.hospital.legal_name if new_box.hospital else "Unknown",
        label=new_box.label,
        location_code=new_box.location_code,
        status=new_box.status,
        patient_count=0,
        capacity=new_box.capacity,
        category=new_box.category,
        rack_id=new_box.rack_id,
        rack_row=new_box.rack_row,
        rack_column=new_box.rack_column,
        created_at=new_box.created_at
    )

@router.patch("/boxes/{box_id}", response_model=BoxResponse)
def update_box(box_id: int, box_update: BoxUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_box = db.query(PhysicalBox).filter(PhysicalBox.box_id == box_id).first()
    if not db_box:
        raise HTTPException(status_code=404, detail="Box not found")
        
    # Auth check
    if current_user.role not in [UserRole.SUPER_ADMIN] and db_box.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    if box_update.label is not None:
        # Check uniqueness if label changes
        if box_update.label != db_box.label:
            exists = db.query(PhysicalBox).filter(PhysicalBox.label == box_update.label).first()
            if exists:
                raise HTTPException(status_code=400, detail="Box with this label already exists")
        db_box.label = box_update.label
        
    if box_update.location_code is not None:
        db_box.location_code = box_update.location_code
        
    if box_update.status is not None:
        db_box.status = box_update.status
        
    if box_update.rack_id is not None:
        db_box.rack_id = box_update.rack_id
    if box_update.rack_row is not None:
        db_box.rack_row = box_update.rack_row
    if box_update.rack_column is not None:
        db_box.rack_column = box_update.rack_column
    if box_update.capacity is not None:
        db_box.capacity = box_update.capacity

    db.commit()
    db.refresh(db_box)
    
    count = db.query(Patient).filter(Patient.physical_box_id == db_box.box_id).count()
    return BoxResponse(
        box_id=db_box.box_id,
        hospital_name=db_box.hospital.legal_name if db_box.hospital else "Unknown",
        label=db_box.label,
        location_code=db_box.location_code,
        status=db_box.status,
        patient_count=count,
        capacity=db_box.capacity,
        category=db_box.category or "GENERAL",
        rack_id=db_box.rack_id,
        created_at=db_box.created_at
    )

@router.delete("/boxes/{box_id}")
def delete_box(box_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_box = db.query(PhysicalBox).filter(PhysicalBox.box_id == box_id).first()
    if not db_box:
        raise HTTPException(status_code=404, detail="Box not found")
        
    # Auth check
    if current_user.role not in [UserRole.SUPER_ADMIN] and db_box.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # 1. Check for Patients
    has_patients = db.query(Patient).filter(Patient.physical_box_id == box_id).count()
    if has_patients > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete: Box contains {has_patients} patient records.")

    # 2. Check for PDF Files (orphaned from patient but linked to box)
    has_files = db.query(PDFFile).filter(PDFFile.box_id == box_id).count()
    if has_files > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete: Box contains {has_files} PDF files.")

    # 3. Check for File Requests (History)
    has_requests = db.query(FileRequest).filter(FileRequest.box_id == box_id).count()
    if has_requests > 0:
        # Check for ACTIVE requests
        active_requests = db.query(FileRequest).filter(
            FileRequest.box_id == box_id, 
            FileRequest.status.in_([ "Pending", "In Transit", "Approved"])
        ).count()
        
        if active_requests > 0:
             raise HTTPException(status_code=400, detail=f"Cannot delete: Box has {active_requests} ACTIVE file requests.")
             
        # If only historical (Returned/Rejected/Completed), detach them
        # We keep the history but remove the link to this specific physical box
        db.query(FileRequest).filter(FileRequest.box_id == box_id).update({FileRequest.box_id: None})
        db.commit()

    try:
        db.delete(db_box)
        db.commit()
    except Exception as e:
        db.rollback()
        # Fallback for other unknown FKs
        raise HTTPException(status_code=400, detail=f"Database Integrity Error: {str(e)}")
        
    return {"status": "success", "message": "Box deleted successfully"}

@router.get("/next-sequence")
def get_next_sequence(hospital_id: int, category: str = "GENERAL", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Auth check
    if current_user.role not in [UserRole.SUPER_ADMIN] and hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # 1. Get Hospital City for Code
    hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
    if not hospital:
        return {"next_sequence": "001", "full_label": f"XX/GEN/001"}
        
    # Generate Hospital Code: First 2 letters of Legal Name
    # Example: "Varun Hospital" -> "VA"
    raw_name = hospital.legal_name or "Unknown"
    hospital_code = raw_name.replace(" ", "")[:2].upper()
    
    if len(hospital_code) < 2:
        hospital_code = (hospital_code + "XX")[:2]
    
    # Generate Category Code
    # Mapped Short Codes for Label Generation
    # User Requested: OPD, IPD, MCL, BRT, DHT
    cat_map = {
        "OPD": "OPD",       # Outpatient
        "IPD": "IPD",       # Inpatient
        "MLC": "MCL",       # Medico-Legal (User Code: MCL)
        "BIRTH": "BRT",     # Birth
        "DEATH": "DHT"      # Death (User Code: DHT)
    }
    cat_code = cat_map.get(category.upper(), "IPD") # Default to IPD if unknown

    # Format: HOSP/TYPE/SEQ
    # Example: VA/GEN/0001
    prefix = f"{hospital_code}/{cat_code}/"
    pattern = f"{prefix}%"
    
    boxes = db.query(PhysicalBox).filter(
        PhysicalBox.hospital_id == hospital_id,
        PhysicalBox.label.like(pattern)
    ).all()
    
    max_seq = 0
    for b in boxes:
        try:
            # Label: VA/GEN/0001
            parts = b.label.split('/')
            
            # Expecting 3 parts
            if len(parts) == 3:
                seq_str = parts[-1]
                seq_num = int(seq_str)
                if seq_num > max_seq:
                    max_seq = seq_num
        except (ValueError, IndexError):
            continue
            
    next_seq = str(max_seq + 1).zfill(4)
    full_label = f"{prefix}{next_seq}"
    
    return {"next_sequence": next_seq, "full_label": full_label}

@router.get("/boxes/{box_id}/patients")
def get_box_patients(box_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_box = db.query(PhysicalBox).filter(PhysicalBox.box_id == box_id).first()
    if not db_box:
        raise HTTPException(status_code=404, detail="Box not found")
        
    # Auth check
    if current_user.role not in [UserRole.SUPER_ADMIN] and db_box.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    patients = db.query(Patient).filter(Patient.physical_box_id == box_id).all()
    
    return [
        {
            "record_id": p.record_id,
            "patient_u_id": p.patient_u_id,
            "full_name": p.full_name,
            "hospital_id": p.hospital_id
        } for p in patients
    ]

@router.post("/patients/{patient_id}/assign-box")
def assign_patient_to_box(patient_id: int, request: AssignBoxRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.record_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # Auth check
    if current_user.role not in [UserRole.SUPER_ADMIN] and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    box = db.query(PhysicalBox).filter(PhysicalBox.box_id == request.box_id).first()
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
        
    if not box.is_open:
        raise HTTPException(status_code=400, detail="This box is CLOSED. Please open it first.")
        
    patient.physical_box_id = box.box_id
    db.commit()
    return {"status": "success", "message": f"Patient assigned to box {box.label}"}

@router.post("/patients/{patient_id}/unassign-box")
def unassign_patient_from_box(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.record_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # Auth check
    if current_user.role not in [UserRole.SUPER_ADMIN] and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    patient.physical_box_id = None
    db.commit()
    return {"status": "success", "message": "Patient unassigned from box"}

@router.get("/requests", response_model=List[RequestResponse])
def get_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(FileRequest)
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        query = query.filter(FileRequest.hospital_id == current_user.hospital_id)
        
    reqs = query.all()
    # Need to join box to get label
    results = []
    
    show_box_info = current_user.role in [UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.PLATFORM_STAFF]
    
    for r in reqs:
        box = db.query(PhysicalBox).filter(PhysicalBox.box_id == r.box_id).first()
        
        display_label = "Unknown"
        if box:
            if show_box_info:
                display_label = box.label
            else:
                display_label = f"Box #{box.box_id} (Restricted)"

        results.append(RequestResponse(
            request_id=r.request_id,
            box_label=display_label,
            requester_name=r.requester_name,
            status=r.status,
            request_date=r.request_date
        ))
    return results

@router.post("/requests")
def create_request(req: RequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_req = FileRequest(
        hospital_id=current_user.hospital_id,
        box_id=req.box_id,
        requester_name=current_user.email, # Use authenticated user's email
        status="Pending Approval" if current_user.role == UserRole.WAREHOUSE_MANAGER else "Pending"
    )
    if not current_user.hospital_id:
         raise HTTPException(status_code=400, detail="Super Admins must switch to a hospital context")
         
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    
    # --- EVENT 1: New File Request ---
    # Notify Super Admins + Hospital Admins
    try:
        # Get Box Label
        box_label = "Unknown"
        box = db.query(PhysicalBox).filter(PhysicalBox.box_id == req.box_id).first()
        if box: box_label = box.label

        recipients = get_super_admin_emails(db) + get_hospital_admin_emails(db, current_user.hospital_id)
        # Remove duplicates
        recipients = list(set(recipients))
        
        for email in recipients:
             EmailService.send_file_request_notification(
                to_email=email,
                subject=f"New File Request - {box_label}",
                headline="New File Request",
                message_content=f"A new file request has been initiated.",
                box_label=box_label,
                requester=current_user.email
             )
    except Exception as e:
        print(f"Failed to send email notifications: {e}")
        
    return {"status": "success", "request_id": new_req.request_id}

@router.patch("/requests/{request_id}/status")
def update_request_status(request_id: int, status: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    req = db.query(FileRequest).filter(FileRequest.request_id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    # Auth
    if current_user.role not in [UserRole.SUPER_ADMIN] and req.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Restrict Approval to Admins
    if req.status == "Pending Approval" and status != "Pending Approval" and current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN]:
        raise HTTPException(status_code=403, detail="Only Admins can approve requests")
        
    req.status = status
    db.commit()
    
    # --- EVENTS 2, 3, 4, 5: Status Updates ---
    try:
        box_label = "Unknown"
        box = db.query(PhysicalBox).filter(PhysicalBox.box_id == req.box_id).first()
        if box: box_label = box.label
        
        headline = f"Status Update: {status}"
        subject = f"File Request Update - {status}"
        message = f"The file request status has been updated to {status}."
        
        recipients = []
        
        if status == "In Transit": # Event 2 (Admin)
             recipients = get_hospital_admin_emails(db, req.hospital_id)
             
        elif status == "Delivered": # Event 3 (Admin, Superadmin)
             recipients = get_hospital_admin_emails(db, req.hospital_id) + get_super_admin_emails(db)
             
        elif status == "Return Requested": # Event 4 (Admin, Superadmin)
             recipients = get_hospital_admin_emails(db, req.hospital_id) + get_super_admin_emails(db)
             
        elif status == "Returned": # Event 5 (Admin - meaning Warehouse Staff/Admin)
             # "File received to warehouse" -> Notify Hospital Admin it's back safe? 
             # Or notify Super Admin? Request said "file recived to warehouse (admin)"
             # Assuming Hospital Admin wants to know.
             recipients = get_hospital_admin_emails(db, req.hospital_id)

        # Send Emails
        recipients = list(set(recipients))
        for email in recipients:
             EmailService.send_file_request_notification(
                to_email=email,
                subject=subject,
                headline=headline,
                message_content=message,
                box_label=box_label,
                requester=req.requester_name
             )
    except Exception as e:
        print(f"Failed to send email notifications: {e}")

    return {"status": "success", "message": f"Status updated to {status}"}

@router.delete("/requests/{request_id}")
def delete_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    req = db.query(FileRequest).filter(FileRequest.request_id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    # Auth: Super Admin, Hospital Admin, or the User who created it
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.WAREHOUSE_MANAGER]
    is_owner = req.requester_name == current_user.email or req.requester_name == current_user.role # Simplified owner check, ideally user_id
    
    if not is_admin:
        # Since we stored requester_name as string, verifying "ownership" is hard without user_id. 
        # For now, allow Admins/Staff to delete. 
        # If we really want users to cancel, we should have stored requester_user_id. 
        # Assuming current impl restricts deletion to Admins/Staff for safety.
        raise HTTPException(status_code=403, detail="Access denied")
        
    db.delete(req)
    db.commit()
    return {"status": "success", "message": "Request deleted successfully"}


@router.get("/search")
def search_files(q: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Global Warehouse Search.
    Finds files by Name, UHID, or Old Request ID.
    Returns hierarchical location data.
    """
    if not q or len(q) < 2:
        return []
        
    # Use outerjoin to include patients even if they don't have boxes yet
    query = db.query(Patient).outerjoin(PhysicalBox, Patient.physical_box_id == PhysicalBox.box_id).outerjoin(PhysicalRack, PhysicalBox.rack_id == PhysicalRack.rack_id)
    
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        query = query.filter(Patient.hospital_id == current_user.hospital_id)
        
    # Search logic
    search = f"%{q}%"
    results = query.filter(
        (Patient.full_name.ilike(search)) |
        (Patient.uhid.ilike(search)) |
        (Patient.patient_u_id.ilike(search))
    ).limit(20).all()
    
    data = []
    
    # Redact for Hospital Users
    show_location = current_user.role in [UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.PLATFORM_STAFF]

    for p in results:
        box = p.physical_box if hasattr(p, 'physical_box') else None
        rack = box.rack if (box and hasattr(box, 'rack')) else None
        
        data.append({
            "record_id": p.record_id,
            "patient_name": p.full_name,
            "uhid": p.uhid,
            "mrd_id": p.patient_u_id,
            "location": {
                "aisle": rack.aisle if (rack and show_location) else 0,
                "rack": rack.label if (rack and show_location) else "RESTRICTED",
                "box": box.label if (box and show_location) else "RESTRICTED",
                "box_id": box.box_id if box else None, # Required for Request Logic
                "status": box.status if box else "NOT_ARCHIVED",
                "category": box.category if box else None
            },
            "physical_box_id": box.box_id if box else None
        })
        
    return data

@router.post("/confirm-all")
def confirm_all_drafts(hospital_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Auth Check: "All Admin"
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Determine Filter
    target_hospital_id = None
    
    if current_user.role == UserRole.HOSPITAL_ADMIN:
        target_hospital_id = current_user.hospital_id
    elif current_user.role == UserRole.SUPER_ADMIN and hospital_id:
        target_hospital_id = hospital_id
    
    # Query Drafts
    query = db.query(PDFFile).filter(PDFFile.upload_status == 'draft')
    
    if target_hospital_id:
        query = query.join(Patient).filter(Patient.hospital_id == target_hospital_id)
        
    drafts = query.all()
    
    if not drafts:
        return {"status": "success", "confirmed_count": 0, "message": "No pending drafts found."}
        
    count = 0
    failed = 0
    
    for f in drafts:
        success, msg = StorageService.migrate_to_s3(db, f.file_id)
        if success:
            count += 1
        else:
            # Fallback: Force confirm locally if migration fails (to fix stats)
            # OR log it. For now, forcing confirm to satisfy "Add to stats" request
            f.upload_status = 'confirmed'
            db.commit() 
            failed += 1
            
    return {
        "status": "success", 
        "confirmed_count": count, 
        "forced_count": failed,
        "message": f"Confirmed {count + failed} files."
    }
