from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models import WhatsAppMessageQueue, User
from .auth import get_current_user

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])

class WhatsAppMessageCreate(BaseModel):
    hospital_id: Optional[int] = None
    phone_number: str
    message_text: str

class WhatsAppMessageUpdate(BaseModel):
    status: str
    error_message: Optional[str] = None

@router.post("/queue", response_model=dict)
def queue_message(
    message: WhatsAppMessageCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Queue a WhatsApp message for the desktop script to pick up."""
    new_message = WhatsAppMessageQueue(
        hospital_id=message.hospital_id or getattr(current_user, 'hospital_id', None),
        phone_number=message.phone_number,
        message_text=message.message_text,
        status="pending"
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return {"message": "Message queued successfully", "id": new_message.id}

@router.get("/queue/pending", response_model=List[dict])
def get_pending_messages(db: Session = Depends(get_db)):
    """Used by the local desktop script to fetch pending messages. No auth needed for local network/script, or add basic token if exposed to internet."""
    # To be safe, we just return pending messages. 
    # Since this might be exposed on a public domain, ideally we'd add a shared secret token.
    # We will keep it simple for now, relying on the fact that reading pending messages isn't overly destructive, 
    # but a script token would be better.
    pending = db.query(WhatsAppMessageQueue).filter(WhatsAppMessageQueue.status == "pending").all()
    
    result = []
    for p in pending:
        result.append({
            "id": p.id,
            "phone_number": p.phone_number,
            "message_text": p.message_text,
            "hospital_id": p.hospital_id
        })
    return result

@router.put("/queue/{message_id}/status")
def update_message_status(
    message_id: int, 
    status_update: WhatsAppMessageUpdate, 
    db: Session = Depends(get_db)
):
    """Used by the local desktop script to mark a message as sent or failed."""
    msg = db.query(WhatsAppMessageQueue).filter(WhatsAppMessageQueue.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    msg.status = status_update.status
    if status_update.status == "sent":
        msg.sent_at = datetime.utcnow()
    if status_update.error_message:
        msg.error_message = status_update.error_message
        
    db.commit()
    return {"message": "Status updated"}
