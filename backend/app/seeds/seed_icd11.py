
import json
import os
import sys

# Ensure we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import SessionLocal
from app.models import ICD11Code


def seed_icd11():
    db = SessionLocal()
    
    json_path = os.path.join(os.path.dirname(__file__), 'icd11_sample.json')
    
    if not os.path.exists(json_path):
        print(f"File not found: {json_path}")
        return

    with open(json_path, 'r') as f:
        data = json.load(f)
        
    print(f"Updating/Seeding {len(data)} ICD-11 codes...")
    
    for item in data:
        code = ICD11Code(
            code=item['code'],
            description=item['description'],
            chapter=item.get('chapter', '')
        )
        db.merge(code)
    
    try:
        db.commit()
        print("✅ Diagnosis update complete!")
    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_icd11()
