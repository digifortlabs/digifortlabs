from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..crud import crud_all
from ..models import QAIssue, User, UserRole, PDFFile
from ..routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(tags=["qa"])

class QAResponse(BaseModel):
    issue_id: int
    hospital_id: int
    file_id: Optional[int] = None
    record_id: Optional[int] = None
    filename: str
    issue_type: str
    details: str
    severity: str
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class QAReportRequest(BaseModel):
    file_id: int
    issue_type: str
    details: str
    severity: str = "medium"

@router.get("")
@router.get("/", response_model=List[QAResponse])
def get_qa_issues(
    status: Optional[str] = "open",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(QAIssue)
    
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(QAIssue.hospital_id == current_user.hospital_id)
        
    if status:
        query = query.filter(QAIssue.status == status)
        
    return query.all()

@router.post("/report")
def report_qa_issue(
    request: QAReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify file ownership
    db_file = crud_all.p_d_f_file.get_first(db, PDFFile.file_id == request.file_id)
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
        
    if current_user.role != UserRole.SUPER_ADMIN:
        if db_file.patient.hospital_id != current_user.hospital_id:
            raise HTTPException(status_code=403, detail="Not authorized to report for this hospital")

    new_issue = QAIssue(
        hospital_id=db_file.patient.hospital_id,
        file_id=request.file_id,
        record_id=db_file.record_id,
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
    issue = crud_all.q_a_issue.get_first(db, QAIssue.issue_id == issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    # Only Super Admin or Hospital Admin can resolve
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    if current_user.role == UserRole.HOSPITAL_ADMIN and issue.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Not authorized for this hospital")

    issue.status = "resolved"  # type: ignore
    db.commit()
    return {"status": "success", "message": "Issue marked as resolved"}

@router.post("/{issue_id}/ignore")
def ignore_qa_issue(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = crud_all.q_a_issue.get_first(db, QAIssue.issue_id == issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can ignore issues")

    issue.status = "ignored"  # type: ignore
    db.commit()
    return {"status": "success", "message": "Issue minimized"}
