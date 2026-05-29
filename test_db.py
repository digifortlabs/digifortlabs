import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.models import SystemSetting, Hospital

DATABASE_URL = "postgresql://postgres:digifort2024@localhost/digifort_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

print("--- System Setting ---")
setting = db.query(SystemSetting).filter(SystemSetting.key == "platform_ai_settings").first()
if setting:
    print("AI Setting found:", setting.value)
else:
    print("AI Setting not found")

print("--- Hospitals ---")
hospitals = db.query(Hospital).all()
for h in hospitals:
    print(f"Hospital {h.hospital_id}: {h.ai_settings}")
