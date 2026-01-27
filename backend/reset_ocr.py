from app.database import SessionLocal
from app.models import PDFFile

db = SessionLocal()
try:
    # Find stuck files
    stuck_files = db.query(PDFFile).filter(
        PDFFile.processing_stage == 'analyzing'
    ).all()
    
    count = len(stuck_files)
    print(f"Found {count} stuck files.")
    
    if count > 0:
        for file in stuck_files:
            file.processing_stage = None # Reset to ready state
        
        db.commit()
        print(f"✅ Successfully reset {count} files. They can now be re-processed.")
    else:
        print("No stuck files found.")
        
finally:
    db.close()
