import os
import sys

# Setup environment
os.environ["DATABASE_URL"] = "postgresql://digifort_admin:Digif0rtlab$@localhost:5432/digifort_db"

# Add backend to path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.routers.hospitals import delete_hospital
from app.models import User

db = SessionLocal()

# We need a mock user for current_user
super_admin = db.query(User).filter(User.email == "admin@digifortlabs.com").first()

try:
    print("Testing delete on hospital 10...")
    result = delete_hospital(hospital_id=10, db=db, current_user=super_admin)
    print("Success:", result)
except Exception as e:
    print("Failed!")
    print(e)
    if os.path.exists("delete_error.log"):
        with open("delete_error.log", "r") as f:
            print("\n--- TRACEBACK ---")
            print(f.read())
