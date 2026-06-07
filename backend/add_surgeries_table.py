import sys
from app.database import engine
from app.models import Base, Surgery

print("Creating surgeries table...")
try:
    Surgery.__table__.create(engine)
    print("Successfully created surgeries table!")
except Exception as e:
    print(f"Error: {e}")
