from app.database import SessionLocal
from app.models import User
import sys

def check_users():
    try:
        db = SessionLocal()
        users = db.query(User).all()
        print(f"Total Users: {len(users)}")
        for u in users:
            print(f"- {u.email} (Role: {u.role})")
        
        target = "admin@digifortlabs.com"
        user = db.query(User).filter(User.email == target).first()
        if user:
            print(f"\nTarget User Found: {user.email}")
            print(f"Hash: {user.hashed_password[:10]}...")
            print(f"Active: {user.is_active}")
        else:
            print(f"\nTarget User {target} NOT FOUND")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_users()
