import logging
logger = logging.getLogger(__name__)
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
        logger.info(f"Trying {opt['db']} on {opt['host']}:{opt['port']}...")
        conn = psycopg2.connect(
            dbname=opt['db'],
            user=user,
            password=password,
            host=opt['host'],
            port=opt['port'],
            connect_timeout=3
        )
        logger.info(f"[OK] SUCCESS! Connected to {opt['db']}")
        
        cur = conn.cursor()
        cur.execute("SELECT email FROM users LIMIT 5;")
        users = cur.fetchall()
        logger.info(f"Found {len(users)} users: {users}")
        
        cur.close()
        conn.close()
        break
    except Exception as e:
        logger.info(f"[ERROR] Failed: {e}")
