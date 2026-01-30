
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

from app.models import User

def list_users():
    try:
        users = db.query(User).all()
        print(f"Found {len(users)} users.")
        for u in users:
            print(f"User: {u.email} | Role: {u.role}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_users()
