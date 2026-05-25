import logging
logger = logging.getLogger(__name__)
import sqlite3
import os

db_path = r"d:\Website\DIGIFORTLABS\backend\digifortlabs.db"

logger.info(f"Connecting to database at: {db_path}")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

columns_to_add = [
    ("company_name", "TEXT DEFAULT 'Digifort Labs'"),
    ("company_address", "TEXT DEFAULT 'Vapi, Gujarat, India'"),
    ("company_email", "TEXT DEFAULT 'info@digifortlabs.com'"),
    ("company_website", "TEXT DEFAULT 'www.digifortlabs.com'"),
    ("company_bank_name", "TEXT"),
    ("company_bank_acc", "TEXT"),
    ("company_bank_ifsc", "TEXT")
]

for col_name, col_type in columns_to_add:
    try:
        logger.info(f"Adding column {col_name}...")
        cursor.execute(f"ALTER TABLE accounting_config ADD COLUMN {col_name} {col_type}")
        logger.info(f"Column {col_name} added successfully.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            logger.info(f"Column {col_name} already exists.")
        else:
            logger.info(f"Error adding {col_name}: {e}")

conn.commit()
conn.close()
logger.info("Migration completed.")
