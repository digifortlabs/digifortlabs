import json
import logging
import os
import sys

# Ensure we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import SessionLocal, engine
from app.models import ICD11ProcedureCode

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_procedures():
    db = SessionLocal()
    try:
        # Check if table exists, if not create
        ICD11ProcedureCode.__table__.create(bind=engine, checkfirst=True)
        
        # Load JSON
        json_path = os.path.join(os.path.dirname(__file__), "icd11_procedures_sample.json")
        if not os.path.exists(json_path):
            logger.error(f"Sample file not found at {json_path}")
            return

        with open(json_path, "r") as f:
            data = json.load(f)

        logger.info(f"Updating/Seeding {len(data)} procedures...")
        
        for item in data:
            code = ICD11ProcedureCode(
                code=item["code"],
                description=item["description"]
            )
            db.merge(code) # Use merge to avoid dupes and update existing
        
        db.commit()
        logger.info("✅ Procedure update complete!")

    except Exception as e:
        logger.error(f"❌ Seed failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_procedures()
