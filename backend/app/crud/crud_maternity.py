from typing import Dict, Any
from .base import CRUDBase
from ..models import MaternityPatient, ANCVisit, DeliveryRecord, NewbornRecord

class CRUDMaternityPatient(CRUDBase[MaternityPatient, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDANCVisit(CRUDBase[ANCVisit, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDDeliveryRecord(CRUDBase[DeliveryRecord, Dict[str, Any], Dict[str, Any]]):
    pass

class CRUDNewbornRecord(CRUDBase[NewbornRecord, Dict[str, Any], Dict[str, Any]]):
    pass

maternity_patient = CRUDMaternityPatient(MaternityPatient)
anc_visit = CRUDANCVisit(ANCVisit)
delivery_record = CRUDDeliveryRecord(DeliveryRecord)
newborn_record = CRUDNewbornRecord(NewbornRecord)
