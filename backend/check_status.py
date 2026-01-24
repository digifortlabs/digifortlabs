from app.database import SessionLocal
from app.models import PDFFile, Patient

def check_status():
    db = SessionLocal()
    try:
        analyzing = db.query(PDFFile).filter(PDFFile.processing_stage == 'analyzing').all()
        print(f"--- Active OCR Jobs: {len(analyzing)} ---")
        for f in analyzing:
            # Fetch patient name if possible
            patient = db.query(Patient).filter(Patient.record_id == f.record_id).first()
            p_name = patient.full_name if patient else "Unknown"
            print(f"ID: {f.file_id} | File: {f.filename} | Patient: {p_name} | Progress: {f.processing_progress}%")
            
        if not analyzing:
            print("No files differ processing_stage='analyzing' found.")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_status()
