from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SystemSetting, User, UserRole
from ..routers.auth import get_current_user

router = APIRouter()

class SettingUpdate(BaseModel):
    value: str

@router.get("/settings")
async def get_settings(db: Session = Depends(get_db)):
    # All users can arguably see settings (like announcement), but only admin can edit.
    settings = db.query(SystemSetting).all()
    return {s.key: s.value for s in settings}

@router.post("/settings/{key}")
async def update_setting(key: str, update: SettingUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        setting = SystemSetting(key=key, value=update.value)
        db.add(setting)
    else:
        setting.value = update.value
    
    db.commit()
    return {"status": "success", "key": key, "value": update.value}
