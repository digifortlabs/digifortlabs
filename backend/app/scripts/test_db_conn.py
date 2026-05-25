import logging
logger = logging.getLogger(__name__)
import sqlalchemy
import os

DATABASE_URL = "postgresql://digifort_admin:Digif0rtlab$@localhost:5433/digifort_db"

logger.info(f"Connecting to {DATABASE_URL}...")
try:
    engine = sqlalchemy.create_engine(DATABASE_URL, connect_args={'connect_timeout': 5})
    with engine.connect() as conn:
        result = conn.execute(sqlalchemy.text("SELECT 1"))
        logger.info(f"SUCCESS: {result.fetchone()}")
except Exception as e:
    logger.info(f"FAILURE: {e}")
