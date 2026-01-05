
import json
import os
import sys

# Ensure we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import SessionLocal, engine
from app.models import Base, ICD11Code

def seed_icd11():
    db = SessionLocal()
    
    # Check if table has data
    try:
        count = db.query(ICD11Code).count()
        if count > 0:
            print(f"ICD-11 Codes already exist ({count} found). Skipping seed.")
            return
    except Exception as e:
        print("Table might not exist yet. Ensure migrations run first.", e)
        return

    json_path = os.path.join(os.path.dirname(__file__), 'icd11_sample.json')
    
    with open(json_path, 'r') as f:
        data = json.load(f)
        
    print(f"Seeding {len(data)} ICD-11 codes...")
    
    for item in data:
        code = ICD11Code(
            code=item['code'],
            description=item['description'],
            chapter=item.get('chapter', '')
        )
        db.add(code)
    
    try:
        db.commit()
        print("Seeding Complete!")
    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_icd11()
