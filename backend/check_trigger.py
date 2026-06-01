import os, psycopg2
from dotenv import load_dotenv
load_dotenv(override=True)
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute("SELECT trigger_name, action_statement FROM information_schema.triggers WHERE event_object_table = 'appointments';")
print(cur.fetchall())
