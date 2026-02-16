import sqlite3
import os

db_path = os.path.join('backend', 'digifortlabs.db')
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("PRAGMA table_info(users)")
    columns = cursor.fetchall()
    print("Columns in 'users' table:")
    for col in columns:
        print(col)
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
