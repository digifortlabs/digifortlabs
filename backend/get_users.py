import os
import sys
sys.path.append('Z:\\Website\\DIGIFORTLABS\\backend')
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User

engine = create_engine('postgresql://digifort_admin:Digif0rtlab$@localhost:5433/digifort_db')
SessionLocal = sessionmaker(bind=engine)
session = SessionLocal()

users = session.query(User).all()
for u in users:
    print(f'Email: {u.email} | Role: {u.role}')
