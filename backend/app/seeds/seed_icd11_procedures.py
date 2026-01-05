from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import ICD11ProcedureCode, Base
import json
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_procedures():
    db = SessionLocal()
    try:
        # Check if table exists, if not create
        ICD11ProcedureCode.__table__.create(bind=engine, checkfirst=True)
        
        # Check if data exists
        count = db.query(ICD11ProcedureCode).count()
        if count > 0:
            logger.info(f"Procedures table already has {count} entries. Skipping seed.")
            return

        # Load JSON
        json_path = os.path.join(os.path.dirname(__file__), "icd11_procedures_sample.json")
        if not os.path.exists(json_path):
            logger.error(f"Sample file not found at {json_path}")
            return

        with open(json_path, "r") as f:
            data = json.load(f)

        logger.info(f"Seeding {len(data)} procedures...")
        
        for item in data:
            code = ICD11ProcedureCode(
                code=item["code"],
                description=item["description"]
            )
            db.merge(code) # Use merge to avoid dupes if partial seed
        
        db.commit()
        logger.info("✅ Procedure seeding complete!")

    except Exception as e:
        logger.error(f"❌ Seed failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_procedures()
