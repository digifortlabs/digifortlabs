import os, psycopg2
from dotenv import load_dotenv
load_dotenv(override=True)
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='system_error_logs'")
for row in cur.fetchall():
    print(row[0])
