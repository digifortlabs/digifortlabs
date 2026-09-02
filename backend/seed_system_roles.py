import os
import sys

# Setup environment to import backend modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Role, UserRoleMap, User
from sqlalchemy.orm import Session

def seed_roles():
    db = SessionLocal()
    try:
        print("Starting role seed process...")

        system_roles = [
            {
                "name": "Super Admin",
                "description": "Full system access.",
                "is_system_locked": True,
                "hospital_id": None,
                "permissions": {
                    "patients": {"all": True},
                    "hms": {"all": True},
                    "clinic": {"all": True},
                    "dental": {"all": True},
                    "ent": {"all": True},
                    "pharmacy": {"all": True},
                    "accounting": {"all": True},
                    "inventory": {"all": True},
                    "settings": {"all": True},
                    "staff": {"all": True}
                }
            },
            {
                "name": "Hospital Admin",
                "description": "Full access to the hospital portal.",
                "is_system_locked": True,
                "hospital_id": None,
                "permissions": {
                    "patients": {"all": True},
                    "hms": {"all": True},
                    "clinic": {"all": True},
                    "dental": {"all": True},
                    "ent": {"all": True},
                    "pharmacy": {"all": True},
                    "accounting": {"all": True},
                    "inventory": {"all": True},
                    "settings": {"all": True},
                    "staff": {"all": True}
                }
            }
        ]

        for role_data in system_roles:
            role = db.query(Role).filter(Role.name == role_data["name"]).first()
            if not role:
                print(f"Creating role: {role_data['name']}")
                role = Role(
                    name=role_data["name"],
                    description=role_data["description"],
                    is_system_locked=role_data["is_system_locked"],
                    hospital_id=role_data["hospital_id"],
                    permissions=role_data["permissions"]
                )
                db.add(role)
            else:
                print(f"Role already exists: {role_data['name']}")
        
        db.commit()
        print("Role seeding completed successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_roles()
