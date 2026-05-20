import psycopg2
import os
from dotenv import load_dotenv

# Load env from backend/.env
load_dotenv('backend/.env', override=True)

user = os.getenv("POSTGRES_USER")
password = os.getenv("POSTGRES_PASSWORD")

# Possible DB names and hosts
options = [
    {"db": "digifort_db", "host": "localhost", "port": 5432},
    {"db": "digifortlabs", "host": "localhost", "port": 5432},
    {"db": "digifort_db", "host": "127.0.0.1", "port": 5432},
    {"db": "digifort_db", "host": "localhost", "port": 5433},
]

for opt in options:
    try:
        print(f"Trying {opt['db']} on {opt['host']}:{opt['port']}...")
        conn = psycopg2.connect(
            dbname=opt['db'],
            user=user,
            password=password,
            host=opt['host'],
            port=opt['port'],
            connect_timeout=3
        )
        print(f"✅ SUCCESS! Connected to {opt['db']}")
        
        cur = conn.cursor()
        cur.execute("SELECT email FROM users LIMIT 5;")
        users = cur.fetchall()
        print(f"Found {len(users)} users: {users}")
        
        cur.close()
        conn.close()
        break
    except Exception as e:
        print(f"❌ Failed: {e}")
