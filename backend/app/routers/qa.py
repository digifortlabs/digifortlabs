from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import QAIssue, User, UserRole, PDFFile
from ..routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(tags=["qa"])

class QAReportRequest(BaseModel):
    file_id: int
    issue_type: str
    details: str
    severity: str = "medium"

@router.post("/report")
def report_qa_issue(
    request: QAReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify file ownership
    db_file = db.query(PDFFile).filter(PDFFile.file_id == request.file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
        
    if current_user.role != UserRole.SUPER_ADMIN:
        if db_file.patient.hospital_id != current_user.hospital_id:
            raise HTTPException(status_code=403, detail="Not authorized to report for this hospital")

    new_issue = QAIssue(
        hospital_id=db_file.patient.hospital_id,
        filename=db_file.filename or f"File_{request.file_id}",
        issue_type=request.issue_type,
        details=request.details,
        severity=request.severity,
        status="open"
    )
    db.add(new_issue)
    db.commit()
    return {"status": "success", "message": "Issue reported to QA"}

@router.post("/{issue_id}/resolve")
def resolve_qa_issue(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(QAIssue).filter(QAIssue.issue_id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    # Only Super Admin or Hospital Admin can resolve
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    if current_user.role == UserRole.HOSPITAL_ADMIN and issue.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Not authorized for this hospital")

    issue.status = "resolved"
    db.commit()
    return {"status": "success", "message": "Issue marked as resolved"}

@router.post("/{issue_id}/ignore")
def ignore_qa_issue(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(QAIssue).filter(QAIssue.issue_id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can ignore issues")

    issue.status = "ignored"
    db.commit()
    return {"status": "success", "message": "Issue minimized"}
