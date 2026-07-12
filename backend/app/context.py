import contextvars
from typing import Optional

# Global context variables to store current user and hospital IDs
current_user_id = contextvars.ContextVar("current_user_id", default=None)
current_hospital_id = contextvars.ContextVar("current_hospital_id", default=None)

def set_current_user_id(user_id: int):
    current_user_id.set(user_id)

def get_current_user_id() -> Optional[int]:
    return current_user_id.get()

def set_current_hospital_id(hospital_id: int):
    current_hospital_id.set(hospital_id)

def get_current_hospital_id() -> Optional[int]:
    return current_hospital_id.get()
