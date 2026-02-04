from typing import Optional
from datetime import date, datetime, timedelta
import csv
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import desc, or_
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import AuditLog, User, UserRole
from .auth import get_current_user

router = APIRouter()

@router.get("/logs")
def get_audit_logs(
    hospital_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 50,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    action: Optional[str] = None,
    search: Optional[str] = None,
    export_csv: bool = False,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = db.query(AuditLog).options(joinedload(AuditLog.user))
    
    # 1. Hospital Context Filter
    if current_user.role == UserRole.HOSPITAL_ADMIN:
        query = query.join(User).filter(User.hospital_id == current_user.hospital_id)
    elif hospital_id:
        query = query.join(User).filter(User.hospital_id == hospital_id)

    # 2. Date Filter
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    if end_date:
        query = query.filter(AuditLog.timestamp < (end_date + timedelta(days=1)))

    # 3. Action Filter
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))

    # 4. Search Filter (User Email or Details)
    if search:
        search_term = f"%{search}%"
        query = query.join(User, isouter=True).filter(
            or_(
                User.email.ilike(search_term),
                AuditLog.details.ilike(search_term),
                AuditLog.action.ilike(search_term)
            )
        )

    # 5. Export CSV
    if export_csv:
        logs = query.order_by(desc(AuditLog.timestamp)).limit(1000).all() # Cap at 1000 for export
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Timestamp", "User", "Action", "Details", "IP Address"])
        
        for log in logs:
            writer.writerow([
                log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if log.timestamp else "N/A",
                log.user.email if log.user else "System",
                log.action,
                log.details,
                "N/A" # IP not stored in model shown previously, placeholder
            ])
            
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=audit_logs_{datetime.now().strftime('%Y%m%d')}.csv"}
        )

    # 6. Pagination & Response
    total = query.count()
    logs = query.order_by(desc(AuditLog.timestamp)).offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "logs": [
            {
                "log_id": log.log_id,
                "timestamp": log.timestamp,
                "action": log.action,
                "details": log.details,
                "user_id": log.user_id,
                "user_email": log.user.email if log.user else "System"
            } for log in logs
        ],
        "total": total,
        "page": page,
        "pages": (total + page_size - 1) // page_size
    }
