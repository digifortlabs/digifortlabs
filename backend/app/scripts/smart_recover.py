
import boto3
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
import sys
import re
from datetime import datetime

# Add parent directory to path to import app modules
script_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.join(script_dir, '..', '..')
sys.path.insert(0, app_dir)

from app.core.config import settings
from app.models import PDFFile, Patient, Hospital

# Database connection
DATABASE_URL = settings.DATABASE_URL
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# S3 connection
s3_client = boto3.client(
    's3',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)
BUCKET_NAME = settings.AWS_BUCKET_NAME

def list_recovered_objects():
    """List all objects in Recovered_Drafts folders."""
    objects = []
    paginator = s3_client.get_paginator('list_objects_v2')
    
    # We need to scan the whole bucket or known prefixes. 
    # Since we moved them to "Something/Recovered_Drafts/", we scan specifically for that.
    # But listing the whole bucket is safer to catch all.
    print("🔍 Scanning S3 for 'Recovered_Drafts'...")
    
    for page in paginator.paginate(Bucket=BUCKET_NAME):
        if 'Contents' in page:
            for obj in page['Contents']:
                if "Recovered_Drafts/" in obj['Key']:
                    objects.append(obj)
    return objects

def sanitize(n): 
    if not n: return "Unknown"
    return re.sub(r'[^\w\s-]', '', n).replace(' ', '_')

def smart_recover():
    print("🧠 Starting SMART RECOVERY...")
    db = SessionLocal()
    
    try:
        objects = list_recovered_objects()
        print(f"📦 Found {len(objects)} orphaned files to process.")
        
        success_count = 0
        skip_count = 0
        
        for obj in objects:
            key = obj['Key']
            # Key format expected: HospitalName/Recovered_Drafts/FILENAME.enc
            # Filename expected: MRD_UniqueId.enc OR just MRD.enc
            
            filename = os.path.basename(key)
            
            # 1. Extract Potential MRD
            # Regex: detailed capture of MRD from "D78102_b162.enc" -> "D78102"
            # Adjust regex based on your MRD format. Assuming alphanumeric start.
            match = re.match(r"^([A-Za-z0-9]+)", filename)
            if not match:
                print(f"⚠️  Skipping {key}: Could not parse MRD from filename.")
                skip_count += 1
                continue
                
            mrd_candidate = match.group(1)
            
            # 2. Look up Patient
            # We try precise match first, then case-insensitive
            patient = db.query(Patient).filter(Patient.patient_u_id == mrd_candidate).first()
            
            if not patient:
                # Try case insensitive
                patient = db.query(Patient).filter(Patient.patient_u_id.ilike(mrd_candidate)).first()
            
            if not patient:
                # Fuzzy Match Strategy 1: Handle "/" (e.g. D7302302 -> D73023/02)
                # If identifier ends with 2 digits, try inserting slash
                if len(mrd_candidate) > 2 and mrd_candidate[-2:].isdigit():
                    fuzzy_slash = f"{mrd_candidate[:-2]}/{mrd_candidate[-2:]}" # D73023/02
                    patient = db.query(Patient).filter(Patient.patient_u_id == fuzzy_slash).first()
            
            if not patient:
                 # Fuzzy Match Strategy 2: Normalize DB check
                 # Fetch all patients (expensive but necessary for recovery of 13 items) 
                 # or fetch likely matches (e.g. startswith)
                 # We'll try fetching similar starting IDs to minimize load
                 prefix = mrd_candidate[:5] # First 5 chars
                 candidates = db.query(Patient).filter(Patient.patient_u_id.like(f"{prefix}%")).all()
                 
                 clean_candidate = re.sub(r'[^a-zA-Z0-9]', '', mrd_candidate).lower()
                 
                 for p in candidates:
                     clean_db = re.sub(r'[^a-zA-Z0-9]', '', p.patient_u_id).lower()
                     if clean_db == clean_candidate:
                         patient = p
                         print(f"      ✨ Fuzzy Match Found: {mrd_candidate} matches DB {p.patient_u_id}")
                         break
            
            if not patient:
                print(f"⚠️  Skipping {filename}: Patient MRD '{mrd_candidate}' not found in DB.")
                skip_count += 1
                continue
            
            print(f"✅ Match Found! File: {filename} -> Patient: {patient.full_name} ({patient.patient_u_id})")
            
            # 3. Calculate Correct Storage Path
            # Logic: Hospital/Year/Month/MRD_Unique.enc
            date_source = patient.discharge_date or patient.admission_date or patient.created_at or datetime.now()
            year_str = date_source.strftime("%Y")
            month_str = date_source.strftime("%m")
            
            hospital = patient.hospital
            hospital_name = sanitize(hospital.legal_name or f"Hospital_{hospital.hospital_id}")
            mrd_clean = sanitize(patient.patient_u_id)
            
            # Persist original unique ID if present, else generate new one to avoid collisions
            if "_" in filename:
                unique_part = filename.split('_', 1)[1] # "b162.enc"
            else:
                import uuid
                ext = os.path.splitext(filename)[1]
                unique_part = f"{uuid.uuid4().hex[:6]}{ext}"
                
            new_key = f"{hospital_name}/{year_str}/{month_str}/{mrd_clean}_{unique_part}"
            
            # 4. Move File in S3
            try:
                print(f"   🚚 Moving to: {new_key}")
                s3_client.copy_object(
                    Bucket=BUCKET_NAME,
                    CopySource={'Bucket': BUCKET_NAME, 'Key': key},
                    Key=new_key
                )
                s3_client.delete_object(Bucket=BUCKET_NAME, Key=key)
                
                # 5. Restore Database Record
                # Check if file already counts (to prevent duplicates if run multiple times)
                existing = db.query(PDFFile).filter(PDFFile.s3_key == new_key).first()
                if not existing:
                    new_file = PDFFile(
                        record_id=patient.record_id,
                        filename=filename,
                        file_path=new_key, # Key
                        s3_key=new_key,
                        storage_path=f"s3://{BUCKET_NAME}/{new_key}",
                        file_size=obj['Size'],
                        upload_status='confirmed', # It's in final storage
                        processing_stage='completed',
                        is_searchable=False
                    )
                    db.add(new_file)
                    db.commit()
                    print(f"   💾 Database record restored.")
                else:
                    print(f"   ℹ️  Database record already exists.")
                    
                success_count += 1
                
            except Exception as e:
                print(f"   ❌ Error moving/restoring: {e}")
                skip_count += 1

        print("\n" + "="*50)
        print("🎉 SMART RECOVERY COMPLETE")
        print(f"✅ Successfully Restored: {success_count}")
        print(f"⏩ Skipped (No Patient Match): {skip_count}")
        print("="*50)

    except Exception as e:
        print(f"❌ Fatal Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    smart_recover()
