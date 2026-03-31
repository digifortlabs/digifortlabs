import sqlite3
import os

db_path = os.path.join("d:\\Website\\DIGIFORTLABS\\backend", "digifortlabs.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE dental_treatments ADD COLUMN phase_id INTEGER REFERENCES dental_treatment_phases(phase_id);")
    conn.commit()
    print("Successfully added phase_id to dental_treatments table.")
except sqlite3.OperationalError as e:
    print(f"OperationalError (usually means column exists): {e}")
finally:
    conn.close()
