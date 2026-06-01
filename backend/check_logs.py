import os, psycopg2
from dotenv import load_dotenv
load_dotenv(override=True)
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute("SELECT timestamp, severity, message, traceback FROM system_error_logs ORDER BY timestamp DESC LIMIT 5")
for row in cur.fetchall():
    print(f"[{row[0]}] {row[1]}: {row[2]}")
    # print(row[3][:200] + '...')
