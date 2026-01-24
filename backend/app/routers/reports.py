from datetime import datetime, timedelta, date
from typing import List, Optional
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload, subqueryload

from ..database import get_db
from ..models import (
    AuditLog,
    Hospital,
    Patient,
    PDFFile,
    PhysicalBox,
    User,
    UserRole,
)
from ..routers.auth import get_current_user

router = APIRouter()

# --- Helpers ---

def verify_access(user: User, resource_hospital_id: Optional[int] = None):
    """
    Ensure user has access to data.
    Super Admin: Access All.
    Hospital Staff: Access only their hospital.
    """
    if user.role == UserRole.SUPER_ADMIN:
        return True
    
    if not user.hospital_id:
        raise HTTPException(status_code=403, detail="User has no hospital context")
        
    if resource_hospital_id and resource_hospital_id != user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied to this hospital's data")
        
    return True

def apply_hospital_filter(query, model_with_hospital_id, user: User, target_hospital_id: Optional[int]):
    """
    Applies filtering based on User Role and Requested Target.
    """
    if user.role == UserRole.SUPER_ADMIN:
        if target_hospital_id:
            return query.filter(model_with_hospital_id.hospital_id == target_hospital_id)
        return query # Return all
    else:
        # Enforce User's Hospital
        return query.filter(model_with_hospital_id.hospital_id == user.hospital_id)

def apply_date_filter(query, date_column, start_date: Optional[date], end_date: Optional[date]):
    if start_date:
        query = query.filter(date_column >= start_date)
    if end_date:
        # End of the day for end_date
        query = query.filter(date_column < (end_date + timedelta(days=1)))
    return query

# --- Endpoints ---

@router.get("/billing")
def get_billing_report(
    hospital_id: Optional[int] = None, 
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    export_csv: bool = False,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(PDFFile).join(Patient).options(joinedload(PDFFile.patient))
    query = apply_hospital_filter(query, Patient, current_user, hospital_id)
    query = apply_date_filter(query, PDFFile.upload_date, start_date, end_date)
    
    files = query.all()
    
    data = []
    total_cost = 0.0
    
    for f in files:
        # Cost Logic: Base Price + (Extra Pages * Price Per Page)
        # Using historical captured price if available, else current patient/hospital price
        base_price = f.price_per_file or 100.0
        included = f.included_pages or 20
        extra_rate = f.price_per_extra_page or 1.0
        
        page_count = f.page_count or 0
        extra_pages = max(0, page_count - included)
        cost = base_price + (extra_pages * extra_rate)
        total_cost += cost
        
        row = {
            "file_id": f.file_id,
            "record_id": f.record_id,
            "upload_date": f.upload_date.strftime("%Y-%m-%d %H:%M") if f.upload_date else "N/A",
            "patient_name": f.patient.full_name,
            "mrd": f.patient.patient_u_id,
            "uhid": f.patient.uhid, # Added Field
            "age": f.patient.age,   # Added Field
            "admission_date": f.patient.admission_date.strftime("%Y-%m-%d") if f.patient.admission_date else None, # Added Field
            "discharge_date": f.patient.discharge_date.strftime("%Y-%m-%d") if f.patient.discharge_date else None, # Added Field
            "filename": f.filename,
            "page_count": page_count,
            "file_size_mb": round(f.file_size_mb, 2),
            "cost": round(cost, 2),
            "status": f.upload_status,
            "is_paid": f.is_paid or False,
            "payment_date": f.payment_date.strftime("%Y-%m-%d") if f.payment_date else None
        }
        data.append(row)

    if export_csv:
        output = io.StringIO()
        fieldnames = ["file_id", "record_id", "upload_date", "patient_name", "mrd", "uhid", "age", "admission_date", "discharge_date", "filename", "page_count", "file_size_mb", "cost", "status", "is_paid", "payment_date"]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        if writer:
            writer.writeheader()
            writer.writerows(data)
        
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=billing_report_{datetime.now().strftime('%Y%m%d')}.csv"}
        )

    return {
        "summary": {
            "total_files": len(files),
            "total_cost": round(total_cost, 2),
            "currency": "INR"
        },
        "data": data
    }

@router.get("/inventory")
def get_inventory_report(
    hospital_id: Optional[int] = None, 
    search: Optional[str] = None,
    export_csv: bool = False,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(PhysicalBox).options(joinedload(PhysicalBox.rack))
    query = apply_hospital_filter(query, PhysicalBox, current_user, hospital_id)
    
    if search:
        search_term = f"%{search}%"
        # Need to join rack if searching rack label, but let's stick to box fields for simplicity or simple join
        # PhysicalBox has relationship `rack`
        query = query.outerjoin(PhysicalBox.rack).filter(
            or_(
                PhysicalBox.label.ilike(search_term),
                PhysicalBox.location_code.ilike(search_term),
                # PhysicalBox.rack.has(Rack.label.ilike(search_term)) # If using has
                # Since we joined, we can filter on Rack model if imported. 
                # Let's simplify and search local fields first. 
                # To search rack label, we need Rack model or aliases. 
                # Let's stick to Box Label and Location for now to avoid complexity without Rack model import.
                # Actually, Rack model is likely available via relationships.
                PhysicalBox.description.ilike(search_term)
            )
        )
    
    boxes = query.all()
    data = []
    
    for b in boxes:
        # Patient Count
        p_count = db.query(Patient).filter(Patient.physical_box_id == b.box_id).count()
        utilization = round((p_count / (b.capacity or 50)) * 100, 1) if b.capacity else 0
        
        row = {
            "box_label": b.label,
            "location": b.location_code,
            "rack": b.rack.label if b.rack else "Unassigned",
            "status": b.status,
            "files_stored": p_count,
            "capacity": b.capacity,
            "utilization_pct": utilization,
            "created_at": b.created_at.strftime("%Y-%m-%d") if b.created_at else "N/A"
        }
        data.append(row)
        
    if export_csv:
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys()) if data else None
        if writer:
            writer.writeheader()
            writer.writerows(data)
            
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=inventory_report_{datetime.now().strftime('%Y%m%d')}.csv"}
        )

    return data

@router.get("/audit")
def get_audit_report(
    hospital_id: Optional[int] = None, 
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    export_csv: bool = False,
    limit: int = 100,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(AuditLog).options(joinedload(AuditLog.user))
    query = apply_hospital_filter(query, AuditLog, current_user, hospital_id)
    query = apply_date_filter(query, AuditLog.timestamp, start_date, end_date)
    
    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    
    data = []
    for log in logs:
        row = {
            "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "user": log.user.email if log.user else "System",
            "action": log.action,
            "details": log.details,
            "hospital_id": log.hospital_id
        }
        data.append(row)
        
    if export_csv:
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys()) if data else None
        if writer:
            writer.writeheader()
            writer.writerows(data)
            
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=audit_report_{datetime.now().strftime('%Y%m%d')}.csv"}
        )

    return data

class PaymentUpdate(BaseModel):
    file_ids: List[int]
    is_paid: bool

@router.post("/billing/mark-paid")
def mark_files_as_paid(
    payload: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.SUPER_ADMIN:
         raise HTTPException(status_code=403, detail="Only Super Admin can manage payments")
         
    files = db.query(PDFFile).filter(PDFFile.file_id.in_(payload.file_ids)).all()
    count = 0
    for f in files:
        f.is_paid = payload.is_paid
        f.payment_date = datetime.utcnow() if payload.is_paid else None
        count += 1
        
    db.commit()
    return {"message": f"Updated {count} records", "status": "success"}

@router.get("/clinical")
def get_clinical_report(
    hospital_id: Optional[int] = None, 
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    export_csv: bool = False,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(PDFFile).join(Patient).options(
        joinedload(PDFFile.patient).subqueryload(Patient.diagnoses)
    )
    query = apply_hospital_filter(query, Patient, current_user, hospital_id)
    query = apply_date_filter(query, PDFFile.upload_date, start_date, end_date)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Patient.full_name.ilike(search_term),
                Patient.patient_u_id.ilike(search_term),
                PDFFile.filename.ilike(search_term),
                PDFFile.tags.ilike(search_term)
            )
        )
    
    files = query.all()
    
    # Aggregation Logic
    tag_counts = {}
    detailed_data = []
    
    for f in files:
        if f.tags:
            tags = [t.strip() for t in f.tags.split(',')]
            for tag in tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        else:
            tag_counts["Unclassified"] = tag_counts.get("Unclassified", 0) + 1
            
        detailed_data.append({
            "file_id": f.file_id,
            "filename": f.filename,
            "patient_name": f.patient.full_name if f.patient else "Unknown",
            "patient_id": f.patient.record_id if f.patient else None,
            "tags": f.tags or "Unclassified",
            "icd_codes": ", ".join([d.code for d in f.patient.diagnoses]) if f.patient and f.patient.diagnoses else "N/A",
            "upload_date": f.upload_date.strftime("%Y-%m-%d") if f.upload_date else "N/A"
        })
            
    if export_csv:
        output = io.StringIO()
        fieldnames = ["file_id", "filename", "patient_name", "icd_codes", "tags", "upload_date"]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        if writer:
            writer.writeheader()
            writer.writerows(detailed_data)
            
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=clinical_report_{datetime.now().strftime('%Y%m%d')}.csv"}
        )

    return {
        "summary": tag_counts,
        "details": detailed_data
    }
