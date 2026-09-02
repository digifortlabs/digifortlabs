from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from ..database import get_db
from ..models import User, UserRole, PlatformEmailLog, Hospital
from ..routers.auth import get_current_user
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class EmailSendRequest(BaseModel):
    recipient_email: str
    recipient_name: Optional[str] = None
    subject: str
    body_html: str
    category: Optional[str] = "CUSTOM"
    hospital_id: Optional[int] = None

class EmailLogResponse(BaseModel):
    id: int
    mail_type: str
    category: str
    sender_email: str
    sender_name: Optional[str] = None
    recipient_email: str
    recipient_name: Optional[str] = None
    cc: Optional[str] = None
    bcc: Optional[str] = None
    subject: str
    body_html: Optional[str] = None
    body_text: Optional[str] = None
    status: str
    is_starred: bool
    is_archived: bool
    hospital_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/stats")
def get_mail_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF, UserRole.WEBSITE_ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")

    inbox_count = db.query(PlatformEmailLog).filter(PlatformEmailLog.mail_type == "INBOX", PlatformEmailLog.is_archived == False).count()
    outbox_count = db.query(PlatformEmailLog).filter(PlatformEmailLog.mail_type == "OUTBOX", PlatformEmailLog.is_archived == False).count()
    unread_count = db.query(PlatformEmailLog).filter(PlatformEmailLog.mail_type == "INBOX", PlatformEmailLog.status == "UNREAD", PlatformEmailLog.is_archived == False).count()
    starred_count = db.query(PlatformEmailLog).filter(PlatformEmailLog.is_starred == True, PlatformEmailLog.is_archived == False).count()

    return {
        "inbox_count": inbox_count,
        "outbox_count": outbox_count,
        "unread_count": unread_count,
        "starred_count": starred_count
    }

@router.get("/", response_model=List[EmailLogResponse])
def get_emails(
    folder: str = Query("all", description="inbox, outbox, starred, archived, all"),
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF, UserRole.WEBSITE_ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")

    query = db.query(PlatformEmailLog)

    if folder == "inbox":
        query = query.filter(PlatformEmailLog.mail_type == "INBOX", PlatformEmailLog.is_archived == False)
    elif folder == "outbox":
        query = query.filter(PlatformEmailLog.mail_type == "OUTBOX", PlatformEmailLog.is_archived == False)
    elif folder == "starred":
        query = query.filter(PlatformEmailLog.is_starred == True, PlatformEmailLog.is_archived == False)
    elif folder == "archived":
        query = query.filter(PlatformEmailLog.is_archived == True)
    else:
        query = query.filter(PlatformEmailLog.is_archived == False)

    if category and category.upper() != "ALL":
        query = query.filter(PlatformEmailLog.category == category.upper())

    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                PlatformEmailLog.subject.ilike(s),
                PlatformEmailLog.recipient_email.ilike(s),
                PlatformEmailLog.sender_email.ilike(s),
                PlatformEmailLog.body_text.ilike(s)
            )
        )

    return query.order_by(desc(PlatformEmailLog.created_at)).offset(offset).limit(limit).all()

@router.get("/{mail_id}", response_model=EmailLogResponse)
def get_email_by_id(
    mail_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF, UserRole.WEBSITE_ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")

    mail = db.query(PlatformEmailLog).filter(PlatformEmailLog.id == mail_id).first()
    if not mail:
        raise HTTPException(status_code=404, detail="Mail not found")

    if mail.mail_type == "INBOX" and mail.status == "UNREAD":
        mail.status = "READ"
        db.commit()

    return mail

@router.post("/send")
def send_custom_email(
    req: EmailSendRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF, UserRole.WEBSITE_ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")

    sender_email = settings.SENDER_EMAIL
    bcc_emails = "info@digifortlabs.com, admin@digifortlabs.com"

    try:
        msg = MIMEMultipart()
        msg['From'] = f"Digifort Admin <{sender_email}>"
        msg['To'] = req.recipient_email
        msg['Bcc'] = bcc_emails
        msg['Subject'] = req.subject
        msg['Date'] = datetime.now().strftime("%a, %d %b %Y %H:%M:%S %z")

        msg.attach(MIMEText(req.body_html, 'html'))

        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        
        all_recipients = [req.recipient_email, "info@digifortlabs.com", "admin@digifortlabs.com"]
        server.sendmail(sender_email, all_recipients, msg.as_string())
        server.quit()
        status = "SENT"
    except Exception as e:
        logger.error(f"Error sending custom email: {e}")
        status = "FAILED"

    # Save to Outbox log
    log = PlatformEmailLog(
        mail_type="OUTBOX",
        category=req.category or "CUSTOM",
        sender_email=sender_email,
        sender_name="Digifort Admin",
        recipient_email=req.recipient_email,
        recipient_name=req.recipient_name,
        bcc=bcc_emails,
        subject=req.subject,
        body_html=req.body_html,
        body_text=req.subject,
        status=status,
        hospital_id=req.hospital_id
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    if status == "FAILED":
        raise HTTPException(status_code=500, detail="Failed to send email via SMTP server")

    return {"message": "Email sent successfully", "id": log.id}

@router.patch("/{mail_id}/star")
def toggle_star(
    mail_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF, UserRole.WEBSITE_ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")

    mail = db.query(PlatformEmailLog).filter(PlatformEmailLog.id == mail_id).first()
    if not mail:
        raise HTTPException(status_code=404, detail="Mail not found")

    mail.is_starred = not mail.is_starred
    db.commit()
    return {"is_starred": mail.is_starred}

@router.patch("/{mail_id}/archive")
def toggle_archive(
    mail_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF, UserRole.WEBSITE_ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")

    mail = db.query(PlatformEmailLog).filter(PlatformEmailLog.id == mail_id).first()
    if not mail:
        raise HTTPException(status_code=404, detail="Mail not found")

    mail.is_archived = not mail.is_archived
    db.commit()
    return {"is_archived": mail.is_archived}

@router.delete("/{mail_id}")
def delete_email(
    mail_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF, UserRole.WEBSITE_ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")

    mail = db.query(PlatformEmailLog).filter(PlatformEmailLog.id == mail_id).first()
    if not mail:
        raise HTTPException(status_code=404, detail="Mail not found")

    db.delete(mail)
    db.commit()
    return {"message": "Mail deleted successfully"}
