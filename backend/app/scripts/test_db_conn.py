import sqlalchemy
import os

DATABASE_URL = "postgresql://digifort_admin:Digif0rtlab$@localhost:5433/digifort_db"

print(f"Connecting to {DATABASE_URL}...")
try:
    engine = sqlalchemy.create_engine(DATABASE_URL, connect_args={'connect_timeout': 5})
    with engine.connect() as conn:
        result = conn.execute(sqlalchemy.text("SELECT 1"))
        print(f"SUCCESS: {result.fetchone()}")
except Exception as e:
    print(f"FAILURE: {e}")
