
from pydantic import BaseModel

class PaymentUpdate(BaseModel):
    file_ids: List[int]
    is_paid: bool

@router.post("/billing/mark-paid")
def mark_files_as_paid(
    payload: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only Super Admin or Hospital Admin can mark paid? 
    # Actually, usually Super Admin receives money and marks as paid.
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
