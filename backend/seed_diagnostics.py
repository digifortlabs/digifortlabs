from app.database import SessionLocal
from app.models import LabTestCatalog, Hospital

def seed_tests():
    db = SessionLocal()
    hospital = db.query(Hospital).first()
    if hospital:
        tests = [
            # CT Scans
            ("CT Head / Brain", 2500.0),
            ("HRCT Chest", 3500.0),
            ("CT Abdomen & Pelvis", 4500.0),
            ("CT KUB (Kidney, Ureter, Bladder)", 3000.0),
            ("CT PNS (Paranasal Sinuses)", 2500.0),
            ("CT Angiography", 6500.0),
            
            # MRI
            ("MRI Brain", 6000.0),
            ("MRI Cervical Spine", 5500.0),
            ("MRI Lumbar Spine", 5500.0),
            ("MRI Whole Abdomen", 8000.0),
            ("MRI Knee Joint", 6000.0),
            ("MRI Pelvis", 6500.0),
            
            # Sonography / Ultrasound
            ("USG Whole Abdomen", 1200.0),
            ("USG KUB (Kidneys, Ureters, Bladder)", 1000.0),
            ("USG Pelvis", 1000.0),
            ("USG Fetal Wellbeing", 1500.0),
            ("USG Pregnancy Routine", 1200.0),
            ("USG Thyroid", 1200.0),
            ("Echocardiography (Echo)", 1800.0),
            ("Doppler Scan", 2500.0),
            
            # Pathology / Lab Tests
            ("Complete Blood Count (CBC)", 450.0),
            ("C-Reactive Protein (CRP)", 500.0),
            ("Liver Function Test (LFT)", 800.0),
            ("Kidney Function Test (KFT)", 800.0),
            ("Lipid Profile", 700.0),
            ("Thyroid Profile (T3, T4, TSH)", 650.0),
            ("HbA1c", 450.0),
            ("Vitamin D3", 1200.0),
            ("Vitamin B12", 1000.0),
            ("Urine Routine & Microscopy", 200.0),
            ("Blood Culture", 800.0),
            ("Widal Test (Typhoid)", 300.0),
            ("Dengue NS1 Antigen", 600.0),
            ("Malaria Antigen", 400.0),
            ("Electrolytes (Na, K, Cl)", 450.0),
            ("Uric Acid", 250.0),
            ("Prothrombin Time (PT/INR)", 400.0)
        ]
        
        count = 0
        for name, price in tests:
            existing = db.query(LabTestCatalog).filter_by(hospital_id=hospital.hospital_id, test_name=name).first()
            if not existing:
                db.add(LabTestCatalog(hospital_id=hospital.hospital_id, test_name=name, price=price))
                count += 1
                
        db.commit()
        print(f"Successfully seeded {count} new comprehensive tests to hospital: {hospital.legal_name}")
    else:
        print("No hospital found.")

if __name__ == "__main__":
    seed_tests()
