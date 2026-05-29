import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.routers.emergency import EmergencyVisitUpdate

payload = {
    "status": "Admitted",
    "diagnosis": "Test Diagnosis"
}
model = EmergencyVisitUpdate(**payload)
update_data = model.dict(exclude_unset=True)
print(update_data)
