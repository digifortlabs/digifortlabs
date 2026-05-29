import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.routers.patients import PatientUpdate
from pydantic import ValidationError

try:
    payload = {"doctor_name": "Dr. Smith"}
    model = PatientUpdate(**payload)
    print("Success:", model.dict(exclude_unset=True))
except ValidationError as e:
    print("Error:", e)
