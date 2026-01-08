from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

# Target the v2 database in backend
db_path = 'sqlite:///./backend/digifortlabs_v2.db'
print(f"Connecting to {db_path}...")

engine = create_engine(db_path)
Session = sessionmaker(bind=engine)
session = Session()

try:
    result = session.execute(text("SELECT email, role, is_active FROM users"))
    users = result.fetchall()
    print(f"Found {len(users)} users:")
    for u in users:
        print(u)
except Exception as e:
    print(f"Error: {e}")
finally:
    session.close()
