import os
from sqlalchemy import create_engine, text

# Assumes run from digifortlabs.com/backend
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://digifort_admin:Digif0rtlab$@localhost:5432/digifort_db")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("SELECT timestamp, error_type, error_message, endpoint, status FROM system_error_logs ORDER BY timestamp DESC LIMIT 5"))
    logs = result.fetchall()
    
    if not logs:
        print("No error logs found.")
    else:
        for row in logs:
            print(f"[{row[0]}] {row[1]} at {row[3]}: {row[2]} (Status: {row[4]})")
