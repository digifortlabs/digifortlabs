import os
import requests
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models import WhatsAppMessageQueue, User, UserRole
from .auth import get_current_user

EVOLUTION_API_URL = os.getenv("EVOLUTION_API_URL", "http://127.0.0.1:8080")
EVOLUTION_API_KEY = os.getenv("EVOLUTION_API_KEY", "DIGIFORT_SECURE_KEY_123")

headers = {
    "apikey": EVOLUTION_API_KEY,
    "Content-Type": "application/json"
}

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])

class WhatsAppMessageCreate(BaseModel):
    hospital_id: Optional[int] = None
    phone_number: str
    message_text: str

class WhatsAppMessageUpdate(BaseModel):
    status: str
    error_message: Optional[str] = None

class WhatsAppInstanceCreate(BaseModel):
    hospital_id: int

@router.post("/queue", response_model=dict)
def queue_message(
    message: WhatsAppMessageCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Queue a WhatsApp message and send it immediately via Evolution API."""
    hospital_id = message.hospital_id or getattr(current_user, 'hospital_id', None)
    if not hospital_id:
        raise HTTPException(status_code=400, detail="hospital_id is required")
        
    new_message = WhatsAppMessageQueue(
        hospital_id=hospital_id,
        phone_number=message.phone_number,
        message_text=message.message_text,
        status="pending"
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    # Try sending immediately via Evolution API
    instance_name = f"hospital_{hospital_id}"
    try:
        response = requests.post(
            f"{EVOLUTION_API_URL}/message/sendText/{instance_name}",
            headers=headers,
            json={
                "number": message.phone_number,
                "text": message.message_text
            },
            timeout=10
        )
        if response.status_code in [200, 201]:
            new_message.status = "sent"
            new_message.sent_at = datetime.utcnow()
        else:
            new_message.status = "failed"
            new_message.error_message = response.text
    except Exception as e:
        new_message.status = "failed"
        new_message.error_message = str(e)
        
    db.commit()
    return {"message": "Message processed", "id": new_message.id, "status": new_message.status}

@router.get("/queue/pending", response_model=List[dict])
def get_pending_messages(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Keep this for backwards compatibility just in case."""
    query = db.query(WhatsAppMessageQueue).filter(WhatsAppMessageQueue.status == "pending").first()
    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.hospital_id is not None:
            query = query.filter(WhatsAppMessageQueue.hospital_id == current_user.hospital_id)
    pending = query.all()
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Keep for backwards compatibility."""
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

# --- Evolution API Management Endpoints ---

@router.post("/instances/create")
def create_instance(request: WhatsAppInstanceCreate, current_user: User = Depends(get_current_user)):
    hospital_id = request.hospital_id
    if current_user.role != UserRole.SUPER_ADMIN and current_user.hospital_id != hospital_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    instance_name = f"hospital_{hospital_id}"
    try:
        response = requests.post(
            f"{EVOLUTION_API_URL}/instance/create",
            headers=headers,
            json={
                "instanceName": instance_name,
                "integration": "WHATSAPP-BAILEYS",
                "qrcode": True
            },
            timeout=15
        )
        if response.status_code == 403 and "already in use" in response.text:
            return {"message": "Instance already exists"}
        if response.status_code not in (200, 201):
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/instances/{hospital_id}/qr")
def get_instance_qr(hospital_id: int, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.hospital_id != hospital_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    instance_name = f"hospital_{hospital_id}"
    try:
        import time
        for _ in range(10):
            response = requests.get(
                f"{EVOLUTION_API_URL}/instance/connect/{instance_name}",
                headers=headers,
                timeout=15
            )
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Instance not found. Create it first.")
            
            data = response.json()
            qr_base64 = data.get("base64") or (data.get("qrcode") or {}).get("base64")
            if qr_base64:
                return {"base64": qr_base64}
                
            time.sleep(1.5)
            
        return {"error": "QR code generation timed out. Please try again."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/instances/{hospital_id}/status")
def get_instance_status(hospital_id: int, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.hospital_id != hospital_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    instance_name = f"hospital_{hospital_id}"
    try:
        response = requests.get(
            f"{EVOLUTION_API_URL}/instance/connectionState/{instance_name}",
            headers=headers
        )
        if response.status_code == 404:
            return {"instance": instance_name, "state": "not_created"}
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/instances/{hospital_id}")
def delete_instance(hospital_id: int, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN and current_user.hospital_id != hospital_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    instance_name = f"hospital_{hospital_id}"
    try:
        response = requests.delete(
            f"{EVOLUTION_API_URL}/instance/delete/{instance_name}",
            headers=headers
        )
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
