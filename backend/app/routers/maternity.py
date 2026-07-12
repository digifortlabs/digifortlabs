import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, MaternityPatient
from ..routers.auth import get_current_user
from ..crud import crud_maternity

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/maternity", tags=["maternity"])

@router.get("/patients")
def get_maternity_patients(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patients = crud_maternity.maternity_patient.get_multi(db, hospital_id=current_user.hospital_id)
    return [
        {
            "maternity_id": p.maternity_id,
            "patient_id": p.patient_id,
            "patient_name": p.patient.full_name if p.patient else "Unknown",
            "uhid": p.patient.uhid if p.patient else "Unknown",
            "edd": p.edd,
            "high_risk": p.high_risk,
            "gravidity": p.gravidity,
            "parity": p.parity,
            "lmp": p.lmp
        } for p in patients
    ]

@router.post("/patients")
def create_maternity_patient(data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient_id = data.get("patient_id")
    if crud_maternity.maternity_patient.get_multi(db, patient_id=patient_id):
        raise HTTPException(status_code=400, detail="Patient is already registered in Maternity.")
    
    data["hospital_id"] = current_user.hospital_id
    new_maternity = crud_maternity.maternity_patient.create(db, obj_in=data)
    return {"message": "Maternity patient created successfully", "maternity_id": new_maternity.maternity_id}

@router.get("/patients/{maternity_id}/anc_visits")
def get_anc_visits(maternity_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Note: Sorting wasn't directly implemented in CRUDBase generic get_multi yet, 
    # but for proof-of-concept we stick to simple get_multi.
    return crud_maternity.anc_visit.get_multi(db, maternity_id=maternity_id)

@router.post("/patients/{maternity_id}/anc_visits")
def add_anc_visit(maternity_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data["maternity_id"] = maternity_id
    new_visit = crud_maternity.anc_visit.create(db, obj_in=data)
    return {"message": "ANC visit added successfully", "anc_id": new_visit.anc_id}

@router.get("/patients/{maternity_id}/deliveries")
def get_deliveries(maternity_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return crud_maternity.delivery_record.get_multi(db, maternity_id=maternity_id)

@router.post("/patients/{maternity_id}/deliveries")
def add_delivery(maternity_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data["maternity_id"] = maternity_id
    new_delivery = crud_maternity.delivery_record.create(db, obj_in=data)
    return {"message": "Delivery record added successfully", "delivery_id": new_delivery.delivery_id}

@router.get("/deliveries/{delivery_id}/newborns")
def get_newborns(delivery_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return crud_maternity.newborn_record.get_multi(db, delivery_id=delivery_id)

@router.post("/deliveries/{delivery_id}/newborns")
def add_newborn(delivery_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data["delivery_id"] = delivery_id
    new_newborn = crud_maternity.newborn_record.create(db, obj_in=data)
    return {"message": "Newborn record added successfully", "newborn_id": new_newborn.newborn_id}
