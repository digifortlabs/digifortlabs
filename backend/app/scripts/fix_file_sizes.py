"""
Script: fix_file_sizes.py
Calculates and updates `file_size_mb` for all existing PDFFile records.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
import sys

# Add parent directory to path to import app modules
script_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.join(script_dir, '..', '..')
sys.path.insert(0, app_dir)

from app.core.config import settings
from app.models import PDFFile

# Database connection
DATABASE_URL = settings.DATABASE_URL
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def fix_file_sizes():
    print("🔧 Starting File Size (MB) Backfill...")
    db = SessionLocal()
    try:
        # Fetch all files where file_size_mb is 0 or NULL
        files = db.query(PDFFile).filter(
            (PDFFile.file_size_mb == 0) | (PDFFile.file_size_mb == None)
        ).all()
        
        print(f"📊 Found {len(files)} files needing update.")
        
        updated_count = 0
        for f in files:
            if f.file_size and f.file_size > 0:
                old_mb = f.file_size_mb
                f.file_size_mb = f.file_size / (1024 * 1024)
                updated_count += 1
                print(f"   updated {f.file_id}: {old_mb} -> {f.file_size_mb:.2f} MB")
            else:
                print(f"   ⚠️ Skipping {f.file_id}: file_size is 0 or invalid.")
        
        if updated_count > 0:
            db.commit()
            print(f"✅ Successfully updated {updated_count} records.")
        else:
            print("✨ No updates needed.")
            
    except Exception as e:
        print(f"❌ Error during update: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_file_sizes()
