from app.database import SessionLocal
from app.models import PDFFile

db = SessionLocal()
try:
    pending = db.query(PDFFile).filter(
        PDFFile.upload_status == 'confirmed',
        PDFFile.is_searchable == False
    ).count()
    
    analyzing = db.query(PDFFile).filter(
        PDFFile.processing_stage == 'analyzing'
    ).count()

    completed = db.query(PDFFile).filter(
        PDFFile.is_searchable == True
    ).count()
    
    print(f"Pending OCR (not searchable): {pending}")
    print(f"Currently Analyzing: {analyzing}")
    print(f"Completed OCR: {completed}")
finally:
    db.close()
