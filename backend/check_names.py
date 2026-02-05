from app.database import SessionLocal
from app.models import PDFFile, Patient, Hospital

db = SessionLocal()

# Search for patients in the screenshot
screenshot_names = [
    "Mrs. Ragini Singh",
    "Mrs. Aryana Sohel Khan",
    "Mrs. Divya Subhash Tiwari",
    "Mrs. Bidhyavati C. Gautam",
    "Mr. Anwar Shaikh",
    "Mrs. Hemaben Shashi Patil",
    "Mrs. Sonal Amish Patel",
    "Miss Hiral Rajesh Surve",
    "Mrs. Mohini Amit Patel",
    "Mrs. Ranjitbhai Lallubhai Nayka",
    "Mrs. Ambika Suresh Shah"
]

print("--- Database Check for Screenshot Names ---")
for name in screenshot_names:
    p = db.query(Patient).filter(Patient.full_name.ilike(f"%{name}%")).first()
    if p:
        draft_count = db.query(PDFFile).filter(PDFFile.record_id == p.record_id, PDFFile.upload_status == 'draft').count()
        print(f"Found: {p.full_name} | ID: {p.record_id} | Hospital ID: {p.hospital_id} | Draft Count: {draft_count}")
        h = db.query(Hospital).filter(Hospital.hospital_id == p.hospital_id).first()
        print(f"  Hospital: {h.legal_name if h else 'Unknown'}")
    else:
        print(f"NOT FOUND: {name}")

# Check general drafts again
print("\n--- Summary of All Drafts ---")
draft_files = db.query(PDFFile).filter(PDFFile.upload_status == 'draft').all()
hospitals_with_drafts = set()
for d in draft_files:
    if d.patient:
        hospitals_with_drafts.add(d.patient.hospital_id)

print(f"Total Drafts in DB: {len(draft_files)}")
print(f"Hospital IDs with drafts: {list(hospitals_with_drafts)}")

db.close()
