from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from ..services.email_service import EmailService

router = APIRouter()

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    message: str

@router.post("")
async def submit_contact_form(form: ContactForm):
    success = EmailService.send_contact_form(form.name, form.email, form.message)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send message. Please try again later.")
    return {"status": "success", "message": "Message sent successfully"}
