import math
from datetime import date, datetime, timedelta
from typing import Dict, Optional

from fastapi import APIRouter, Depends, Request
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    AuditLog,
    FileRequest,
    Hospital,
    Patient,
    PDFFile,
    PhysicalBox,
    User,
    UserRole,
)
from ..routers.auth import get_current_user

router = APIRouter(
    tags=["stats"]
)

@router.get("/dashboard")
def get_dashboard_stats(
    request: Request, 
    hospital_id: Optional[int] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
) -> Dict:
    
    app_state = request.app.state
    # Determine Scope
    is_super = current_user.role == UserRole.SUPER_ADMIN
    
    # If super admin provides a hospital_id, override context
    if is_super and hospital_id:
        target_hospital_id = hospital_id
        is_drilled_down = True
    else:
        target_hospital_id = current_user.hospital_id
        is_drilled_down = False

    # 1. User Stats & Trend
    try:
        q_users = db.query(User)
        if target_hospital_id: 
            q_users = q_users.filter(User.hospital_id == target_hospital_id)
        
        user_count = q_users.count()
        
        # Active Users (last 15 mins)
        fifteen_mins_ago = datetime.utcnow() - timedelta(minutes=15)
        active_users = q_users.filter(User.last_active_at >= fifteen_mins_ago).count()
    
        # Trend: Users joined in last 24h vs previous 24h
        now = datetime.utcnow()
        last_24h = now - timedelta(hours=24)
        prev_24h = now - timedelta(hours=48)
        
        new_users_24h = q_users.filter(User.created_at >= last_24h).count()
        old_users_24h = q_users.filter(User.created_at >= prev_24h, User.created_at < last_24h).count()
        
        user_trend = "+0%"
        if old_users_24h > 0:
            diff = ((new_users_24h - old_users_24h) / old_users_24h) * 100
            user_trend = f"{'+' if diff >= 0 else ''}{int(diff)}%"
        elif new_users_24h > 0:
            user_trend = f"+{new_users_24h}"
    except Exception as e:
        db.rollback()
        print(f"Stats Error (Users): {e}")
        user_count = 0
        active_users = 0
        user_trend = "Error"

    # 2. Patient Data & Trend
    try:
        q_patients = db.query(Patient)
        if target_hospital_id: 
            q_patients = q_patients.filter(Patient.hospital_id == target_hospital_id)
        
        patient_count = q_patients.count()
        
        new_patients_24h = q_patients.filter(Patient.created_at >= last_24h).count()
        old_patients_24h = q_patients.filter(Patient.created_at >= prev_24h, Patient.created_at < last_24h).count()
        
        patient_trend = "+0%"
        if old_patients_24h > 0:
            diff = ((new_patients_24h - old_patients_24h) / old_patients_24h) * 100
            patient_trend = f"{'+' if diff >= 0 else ''}{int(diff)}%"
        elif new_patients_24h > 0:
            patient_trend = f"+{new_patients_24h}"
    except Exception as e:
        db.rollback()
        print(f"Stats Error (Patients): {e}")
        patient_count = 0
        patient_trend = "Error"

    # 3. Warehouse Data
    try:
        if is_super and not is_drilled_down:
            box_count = db.query(PhysicalBox).count()
            warehouse_capacity_pct = round((box_count / 5000) * 100, 1) if box_count > 0 else 0
        else:
            # For individual hospital, show their specific box count if assigned
            box_count = db.query(PhysicalBox).join(Patient).filter(Patient.hospital_id == target_hospital_id).distinct().count()
            warehouse_capacity_pct = 0
    except Exception as e:
        db.rollback()
        print(f"Stats Error (Warehouse): {e}")
        box_count = 0
        warehouse_capacity_pct = 0
    
    # 4. Requests (Pending) & Today's Scans
    try:
        q_reqs = db.query(FileRequest).filter(FileRequest.status == "Pending")
        if target_hospital_id:
            q_reqs = q_reqs.filter(FileRequest.hospital_id == target_hospital_id)
        pending_requests = q_reqs.count()

        # Calculate Today's Scans
        today_start = datetime.combine(date.today(), datetime.min.time())
        q_todays_scans = db.query(PDFFile).filter(PDFFile.upload_date >= today_start)
        if target_hospital_id:
             q_todays_scans = q_todays_scans.join(Patient).filter(Patient.hospital_id == target_hospital_id)
        todays_scans_count = q_todays_scans.count()
    except Exception as e:
        db.rollback()
        print(f"Stats Error (Requests): {e}")
        pending_requests = 0
        todays_scans_count = 0
    
    # 5. Recent Activity (Filtered to File Movements for Dashboard)
    audit_data = []
    try:
        q_audit = db.query(AuditLog).filter(AuditLog.action.like("FILE_%"))
        
        if target_hospital_id:
            q_audit = q_audit.filter(AuditLog.hospital_id == target_hospital_id)
            
        recent_audits = q_audit.order_by(AuditLog.timestamp.desc()).limit(8).all()
        audit_data = [{
            "id": log.log_id,
            "action": log.action.replace("FILE_", ""), # Remove prefix for cleaner UI
            "details": log.details,
            "time": log.timestamp.strftime("%H:%M")
        } for log in recent_audits]
    except Exception as e:
        db.rollback()
        print(f"Stats Error (Audit): {e}")

    # 6. QA Issues (Real Data Only)
    qa_data = []
    try:
        from ..models import QAIssue
        q_qa = db.query(QAIssue).filter(QAIssue.status == "open")
        if target_hospital_id:
            q_qa = q_qa.filter(QAIssue.hospital_id == target_hospital_id)
        
        qa_issues = q_qa.all()
        qa_data = [{
            "id": i.issue_id,
            "file": i.filename,
            "issue": i.issue_type,
            "details": i.details,
            "severity": i.severity,
            "timestamp": i.created_at.strftime("%Y-%m-%d") if i.created_at else "N/A"
        } for i in qa_issues]
    except Exception as e:
        db.rollback()
        print(f"Stats Error (QA): {e}")

    # 7. Storage & Trends
    total_bytes = 0
    usage_str = "0 B"
    storage_trend = "+0%"
    storage_capacity_pct = 0
    try:
        storage_query = db.query(func.sum(PDFFile.file_size)).filter(PDFFile.upload_status.in_(['confirmed', 'draft']))
        if target_hospital_id:
            storage_query = storage_query.join(Patient).filter(Patient.hospital_id == target_hospital_id)
        
        total_bytes = storage_query.scalar() or 0
        
        # Human Readable Storage (Improved for multi-unit)
        def format_size(size_bytes):
            size_bytes = float(size_bytes)
            if size_bytes <= 0: return "0 B"
            units = ("B", "KB", "MB", "GB", "TB", "PB")
            i = int(math.floor(math.log(size_bytes, 1024)))
            p = math.pow(1024, i)
            s = round(size_bytes / p, 2)
            return f"{s} {units[i]}"

        usage_str = format_size(total_bytes)
        
        # Storage Trend: New uploads in last 24h
        new_bytes_24h = storage_query.filter(PDFFile.upload_date >= last_24h).scalar() or 0
        storage_trend = f"+{format_size(new_bytes_24h)}" if float(new_bytes_24h) > 0 else "+0%"
        
        # 15. Storage Capacity Percentage
        # Assuming max storage per hospital is configurable, defaulting to 1TB
        max_storage_bytes = 1024 * 1024 * 1024 * 1024  # 1TB
        storage_capacity_pct = min(round((total_bytes / max_storage_bytes) * 100, 1), 100)
    except Exception as e:
        db.rollback()
        print(f"Stats Error (Storage): {e}")

    # 8. Billing & Revenue (For Detailed Hospital View)
    billing_data = None
    hospital_name = "Digifort Labs"
    
    try:
        if target_hospital_id:
            hospital = db.query(Hospital).filter(Hospital.hospital_id == target_hospital_id).first()
            if hospital:
                hospital_name = hospital.legal_name
                # Simplified Revenue Calculation for Demo: price_per_file * total_files
                # In a real system, this would consider page counts
                q_total_files = q_patients.join(PDFFile).filter(PDFFile.upload_status.in_(['confirmed', 'draft']))
                total_files = q_total_files.count()
                estimated_revenue = total_files * hospital.price_per_file
                billing_data = {
                    "subscription_tier": hospital.subscription_tier,
                    "price_per_file": hospital.price_per_file,
                    "total_estimated_cost": round(estimated_revenue, 2),
                    "currency": "INR",
                    "files_count": total_files
                }
    except Exception as e:
        db.rollback()
        print(f"Stats Error (Billing): {e}")

    # 9. Open Boxes Count
    open_boxes_count = 0
    try:
        q_open_boxes = db.query(PhysicalBox).filter(PhysicalBox.is_open == True)
        if target_hospital_id:
            q_open_boxes = q_open_boxes.filter(PhysicalBox.hospital_id == target_hospital_id)
        open_boxes_count = q_open_boxes.count()
    except Exception as e:
        db.rollback()
        print(f"Stats Error (Boxes): {e}")
    
    # 10. Files Pending QA
    files_pending_qa = len(qa_data)
    
    # 11. Category Breakdown (for pie chart)
    category_breakdown = []
    try:
        for category in ['STANDARD', 'MLC', 'BIRTH', 'DEATH']:
            q_cat = q_patients.filter(Patient.patient_category == category)
            count = q_cat.count()
            if count > 0:
                category_breakdown.append({"name": category, "value": count})
    except Exception as e:
        db.rollback()
        print(f"Stats Error (Categories): {e}")
    
    # 12. Activity Trend (last 7 days for line chart)
    activity_trend = []
    try:
        for i in range(6, -1, -1):  # Last 7 days
            day_start = datetime.combine(date.today() - timedelta(days=i), datetime.min.time())
            day_end = day_start + timedelta(days=1)
            
            q_day_files = db.query(PDFFile).filter(
                PDFFile.upload_date >= day_start,
                PDFFile.upload_date < day_end
            )
            if target_hospital_id:
                q_day_files = q_day_files.join(Patient).filter(Patient.hospital_id == target_hospital_id)
            
            day_count = q_day_files.count()
            activity_trend.append({
                "day": day_start.strftime("%a"),  # Mon, Tue, etc.
                "count": day_count
            })
    except Exception as e:
        db.rollback()
        print(f"Stats Error (Activity): {e}")
    
    # 13. Enhanced Recent Activity with Patient Names
    audit_data_enhanced = []
    try:
        q_audit_enhanced = db.query(AuditLog).filter(AuditLog.action.like("FILE_%"))
        
        if target_hospital_id:
            q_audit_enhanced = q_audit_enhanced.filter(AuditLog.hospital_id == target_hospital_id)
            
        recent_audits_enhanced = q_audit_enhanced.order_by(AuditLog.timestamp.desc()).limit(10).all()
        
        for log in recent_audits_enhanced:
            # Try to extract patient info from details
            patient_name = "Unknown"
            action_type = log.action.replace("FILE_", "")
            
            # Parse details for patient name if available
            if log.details:
                # Assuming details might contain patient info
                patient_name = log.details.split(" - ")[0] if " - " in log.details else log.details[:30]
            
            audit_data_enhanced.append({
                "id": log.log_id,
                "action": action_type,
                "patient": patient_name,
                "details": log.details,
                "time": log.timestamp.strftime("%H:%M"),
                "user": log.user.email if log.user else "System"
            })
    except Exception as e:
        db.rollback()
        print(f"Stats Error (Recent Audits): {e}")

    # 14. Recent Uploads (last 24 hours)
    recent_uploads_count = todays_scans_count
    
    # 9. System Metrics
    avg_latency = 0
    if app_state.total_requests > 0:
        avg_latency = (app_state.total_latency / app_state.total_requests) * 1000
    
    uptime_delta = datetime.utcnow() - app_state.startup_time
    uptime_str = f"{uptime_delta.days}d {uptime_delta.seconds // 3600}h" if uptime_delta.days > 0 else f"{uptime_delta.seconds // 3600}h {(uptime_delta.seconds % 3600) // 60}m"
    
    network_load = "0.0 MB/s"
    
    connected_db_str = "Error"
    try:
       connected_db_str = str(getattr(db.get_bind(), 'url', 'Unknown')).split('@')[-1] if 'sqlite' not in str(getattr(db.get_bind(), 'url', '')) else 'SQLite (Local)'
    except:
       pass

    return {
        "hospital_name": hospital_name,
        "is_detailed": bool(target_hospital_id),
        "users": {
            "total": user_count,
            "active": active_users,
            "trend": user_trend
        },
        "patients": {
            "total": patient_count,
            "trend": patient_trend
        },
        "warehouse": {
            "total_boxes": box_count,
            "open_boxes": open_boxes_count,
            "capacity_pct": warehouse_capacity_pct,
            "movement_logs": 0 
        },
        "storage": {
            "usage": usage_str,
            "trend": storage_trend,
            "capacity_pct": storage_capacity_pct
        },
        "billing": billing_data,
        "requests": {
            "pending": pending_requests,
            "todays_scans": todays_scans_count
        },
        "qa": {
            "pending": files_pending_qa,
            "issues": qa_data
        },
        "category_breakdown": category_breakdown,
        "activity_trend": activity_trend,
        "recent_uploads": recent_uploads_count,
        "system": {
            "health": "Optimal",
            "uptime": uptime_str,
            "latency": f"{int(avg_latency)} ms",
            "network_load": network_load,
            "connected_db": connected_db_str
        },
        "recent_activity": audit_data_enhanced,
        "qa_issues": qa_data,
        "traffic_data": [] 
    }

