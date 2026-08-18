with open(r'd:\Website\DIGIFORTLABS\backend\app\routers\nursing.py', 'a') as f:
    f.write('''

from ..models import NursingHandoverLog, DietOrder

class HandoverCreate(BaseModel):
    patient_id: int
    bed_id: Optional[int] = None
    shift_type: str
    handover_notes: Optional[str] = None
    critical_alerts: Optional[str] = None

@router.post("/handover")
def create_handover(payload: HandoverCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_handover = NursingHandoverLog(
        hospital_id=current_user.hospital_id,
        patient_id=payload.patient_id,
        bed_id=payload.bed_id,
        nurse_user_id=current_user.user_id,
        shift_type=payload.shift_type,
        handover_notes=payload.handover_notes,
        critical_alerts=payload.critical_alerts
    )
    db.add(new_handover)
    db.commit()
    db.refresh(new_handover)
    return new_handover

class DietOrderCreate(BaseModel):
    patient_id: int
    bed_id: Optional[int] = None
    diet_type: str
    instructions: Optional[str] = None

@router.post("/diet")
def create_diet_order(payload: DietOrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_order = DietOrder(
        hospital_id=current_user.hospital_id,
        patient_id=payload.patient_id,
        bed_id=payload.bed_id,
        doctor_user_id=current_user.user_id,
        diet_type=payload.diet_type,
        instructions=payload.instructions
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order
''')
