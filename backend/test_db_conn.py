
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
print(f"Attempting to connect to: {db_url.split('@')[-1]}")

try:
    conn = psycopg2.connect(db_url)
    print("✅ Connection successful!")
    cur = conn.cursor()
    cur.execute("SELECT version();")
    print(f"DB Version: {cur.fetchone()}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"❌ Connection failed: {e}")
