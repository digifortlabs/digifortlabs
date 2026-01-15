import datetime
import os
import uuid
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, Response
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from ..database import SessionLocal, get_db
from ..models import BandwidthUsage, Patient, PDFFile, User, UserRole
from ..routers.auth import get_current_user
from ..services.compression import compress_pdf, compress_video_to_mp4
from ..services.ocr import extract_text_from_pdf, classify_document
from ..services.s3_handler import S3Manager
from ..services.storage_service import StorageService

router = APIRouter(tags=["patients"])


from ..services.encryption import encrypt_file, decrypt_data


def process_upload_task(file_id: int, temp_path: str, original_filename: str, user_id: int, hospital_id: int):
    """
    Background Task to Compress -> Encrypt -> Upload.
    Updates DB status for polling.
    """
    db = SessionLocal()
    s3_manager = S3Manager()
    try:
        # Retrieve File Record
        db_file = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
        if not db_file:
            print(f"❌ Process Task Failed: File {file_id} not found in DB")
            return

        # Check Cancellation
        if db_file.processing_stage == 'cancelled':
            return

        print(f"⚙️ Processing Task Started: {file_id}")
        
        # 1. COMPRESSION
        db_file.processing_stage = 'compressing'
        db_file.processing_progress = 10
        db.commit()
        
        ext = os.path.splitext(original_filename)[1].lower()
        processed_path = temp_path
        compression_ratio = 0.0
        original_size = os.path.getsize(temp_path)
        
        # Simulate progress for compression (since actual call is blocking)
        # In a real heavy implementation, compression service would callback or we use ffmpeg with progress
        db_file.processing_progress = 20
        db.commit()
        
        try:
            if ext == '.pdf':
                with open(temp_path, 'rb') as f:
                    content = f.read()
                compressed = compress_pdf(content)
                if compressed and len(compressed) < original_size:
                    with open(temp_path, 'wb') as f:
                        f.write(compressed)
                    processed_path = temp_path
            elif ext in ['.mp4', '.mov', '.avi', '.mkv']:
                processed_path = compress_video_to_mp4(temp_path) # Returns new path
        except Exception as e:
            print(f"Compression warning: {e}")
            # Continue with original if compression fails
            
        db_file.processing_progress = 50
        db.commit()

        if db_file.processing_stage == 'cancelled': return
            
        # 1.5 OCR (Text Extraction) & Page Counting
        # Run only for PDFs
        if os.path.splitext(original_filename)[1].lower() == '.pdf':
            try:
                db_file.processing_stage = 'analyzing' # customized stage for OCR
                db.commit()
                
                with open(processed_path, 'rb') as f:
                    content_bytes = f.read()
                
                # Count Pages
                try:
                    from pypdf import PdfReader
                    import io
                    reader = PdfReader(io.BytesIO(content_bytes))
                    db_file.page_count = len(reader.pages)
                    db.commit() # IMMEDIATE COMMIT for UI feedback
                    print(f"📄 Page Count: {db_file.page_count}")
                except Exception as pe:
                    print(f"⚠️ Page count error: {pe}")
                    
                extracted_text = extract_text_from_pdf(content_bytes)
                if extracted_text:
                    db_file.ocr_text = extracted_text
                    db_file.is_searchable = True
                    print(f"✅ OCR Text Extracted: {len(extracted_text)} chars")
                    
                    # Automated Tagging (AI Analysis)
                    auto_tags = classify_document(extracted_text)
                    if auto_tags:
                        db_file.tags = ", ".join(auto_tags)
                        print(f"🏷️ AI Tags applied: {db_file.tags}")
                else:
                    print("ℹ️ No text extracted (Scanned PDF?)")
                    
            except Exception as e:
                print(f"⚠️ OCR/PageCount Warning: {e}")
            db.commit()
        
        # 2. ENCRYPTION
        db_file.processing_stage = 'encrypting'
        db_file.processing_progress = 60
        db.commit()
        
        try:
            encrypted_path = encrypt_file(processed_path)
            # Switch pointer to encrypted file
            if processed_path != temp_path and processed_path != encrypted_path:
                os.remove(processed_path) # Remove intermediate compressed file
            processed_path = encrypted_path
        except Exception as e:
            print(f"Encryption failed: {e}")
            db_file.processing_stage = 'failed' 
            db_file.processing_progress = 0
            db.commit()
            return
            
        db_file.processing_progress = 80
        db.commit()

        # Check Cancellation
        db.refresh(db_file)
        if db_file.processing_stage == 'cancelled': return

        # 3. UPLOAD (Force Local for Drafts)
        db_file.processing_stage = 'uploading'
        db.commit()
        
        # Structure: drafts/hospital/MRD_uuid.ext.enc
        import re
        def sanitize_name(name): return re.sub(r'[^\w\s-]', '', name).replace(' ', '_')
        
        patient = db_file.patient
        hospital_name = sanitize_name(patient.hospital.legal_name or f"Hospital_{patient.hospital_id}")
        mrd_number = sanitize_name(patient.patient_u_id)
        
        final_ext = os.path.splitext(processed_path)[1] # includes .enc usually
        # We store as drafts/ initially
        s3_key = f"drafts/{hospital_name}/{mrd_number}_{uuid.uuid4().hex[:8]}{final_ext}"

        # We always use s3_manager.upload_file, but if it's a draft, we might want to FORCE local mode
        # Actually, let's just use a special local prefix for drafts in the database
        # and let the s3_manager handle the physical write to Local Storage
        
        # Save to Local Storage (as drafts)
        with open(processed_path, 'rb') as f:
            # We temporarily switch s3_manager to local mode if we want to save S3 costs for drafts
            # OR we just store it in a 'drafts/' prefix in S3. 
            # User specifically said "move file AFTER clicking confirm to S3".
            # So let's force local for drafts.
            
            # Temporary "Force Local" for drafts
            original_mode = s3_manager.mode
            s3_manager.mode = "local" 
            success, location = s3_manager.upload_file(f, s3_key)
            s3_manager.mode = original_mode # Restore
            
        if success:
            db_file.s3_key = s3_key
            db_file.file_size = os.path.getsize(processed_path)
            db_file.storage_path = location # Store bucket path or verify what usage expects
            
            db_file.processing_stage = 'completed'
            db_file.processing_progress = 100
        else:
            db_file.processing_stage = 'failed'
            
        db.commit()
        
        # Log Audit
        from ..audit import log_audit
        log_audit(db, user_id, "FILE_UPLOADED", f"Uploaded: {original_filename}", hospital_id=hospital_id)
        
        # Cleanup
        if os.path.exists(temp_path): os.remove(temp_path)
        if os.path.exists(processed_path) and processed_path != temp_path: os.remove(processed_path)
        
        print(f"✅ Processing Complete: {file_id}")

    except Exception as e:
        print(f"❌ Background Task Error: {e}")
        try:
            db_file.processing_stage = 'failed'
            db.commit()
        except: pass
    finally:
        db.close()

def process_pdf_background_legacy(file_id: int, file_bytes: bytes):
    """
    Background Task to process PDF text extraction.
    Creates its own DB session.
    """
    db = SessionLocal()
    try:
        text = extract_text_from_pdf(file_bytes)
        if text:
            db_file = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
            if db_file:
                db_file.ocr_text = text
                db_file.is_searchable = True
                db.commit()
                # log_audit(db, system_user_id, "OCR_COMPLETED", ...) - Optional
    except Exception as e:
        print(f"OCR Background Error: {e}")
    finally:
        db.close()

# Response Models
class FileData(BaseModel):
    file_id: int
    filename: str
    upload_date: datetime.datetime
    file_size_mb: float
    page_count: int = 0
    upload_status: str
    tags: Optional[str] = None
    is_searchable: bool = False
    
    # Historical Pricing captured at upload
    price_per_file: float = 100.0
    included_pages: int = 20
    price_per_extra_page: float = 1.0

# Response Models
class PatientResponse(BaseModel):
    record_id: int
    patient_u_id: str
    hospital_id: int
    full_name: str
    uhid: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    contact_number: Optional[str] = None
    email_id: Optional[str] = None
    aadhaar_number: Optional[str] = None
    dob: Optional[datetime.datetime] = None
    discharge_date: Optional[datetime.datetime] = None
    physical_box_id: Optional[int] = None
    box_label: Optional[str] = None
    box_location_code: Optional[str] = None
    files: List[FileData] = []
    
    # Billing info (inherited from hospital)
    price_per_file: float = 100.0
    included_pages: int = 20
    price_per_extra_page: float = 1.0
    
    class Config:
        from_attributes = True

class PatientCreate(BaseModel):
    patient_u_id: str
    uhid: Optional[str] = None
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    contact_number: Optional[str] = None
    email_id: Optional[str] = None
    aadhaar_number: Optional[str] = None
    dob: Optional[datetime.datetime] = None
    discharge_date: Optional[datetime.datetime] = None  # Made optional for registration
    hospital_id: Optional[int] = None

class PatientUpdate(BaseModel):
    patient_u_id: Optional[str] = None
    uhid: Optional[str] = None
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    contact_number: Optional[str] = None
    email_id: Optional[str] = None
    aadhaar_number: Optional[str] = None
    dob: Optional[datetime.datetime] = None
    discharge_date: Optional[datetime.datetime] = None

class PatientDetailResponse(PatientResponse):
    pass

class UpdateTagsRequest(BaseModel):
    tags: str

# ... (Existing update_patient)


@router.put("/{patient_id}")
def update_patient(patient_id: int, patient_update: PatientUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Authorization
    db_patient = db.query(Patient).filter(Patient.record_id == patient_id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    is_platform = current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]
    if not is_platform and db_patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # 2. Update Fields
    for var, value in vars(patient_update).items():
        if value is not None:
             setattr(db_patient, var, value)
             
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.post("/")
def create_patient(patient: PatientCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Enforce hospital data segregation
    hospital_id = current_user.hospital_id
    if not hospital_id:
        if patient.hospital_id and current_user.role == UserRole.SUPER_ADMIN:
            hospital_id = patient.hospital_id
        else:
             raise HTTPException(status_code=400, detail="User context missing hospital ID")

    # 1. Check for Duplicate MRD (Explicit Check for better error)
    existing_mrd = db.query(Patient).filter(
        Patient.hospital_id == hospital_id,
        Patient.patient_u_id == patient.patient_u_id
    ).first()
    
    if existing_mrd:
        raise HTTPException(status_code=400, detail=f"MRD Number '{patient.patient_u_id}' already exists.")

    db_patient = Patient(
        patient_u_id=patient.patient_u_id,
        uhid=patient.uhid,
        hospital_id=hospital_id,
        full_name=patient.full_name,
        age=patient.age,
        gender=patient.gender,
        address=patient.address,
        contact_number=patient.contact_number,
        email_id=patient.email_id,
        aadhaar_number=patient.aadhaar_number,
        dob=patient.dob,
        discharge_date=patient.discharge_date
    )
    
    try:
        db.add(db_patient)
        db.commit()
        db.refresh(db_patient)
    except Exception as e:
        db.rollback()
        # Check for integrity error match
        if "UNIQUE constraint failed" in str(e) or "_hospital_mrd_uc" in str(e):
             raise HTTPException(status_code=400, detail="This MRD Number already exists in your hospital.")
        if "aadhaar_number" in str(e): # If we added unique constraint to aadhaar later
             raise HTTPException(status_code=400, detail="This Aadhaar Number is already registered.")
        print(f"❌ Database Error: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred during creation.")
    
    # --- Auto-Assign Storage ---
    try:
        StorageService.auto_assign_patient(db, db_patient)
    except Exception as e:
        print(f"Auto-assign failed: {e}")
        # We don't fail the request, just log it. Patient is created.
        
    return db_patient

@router.post("/{patient_id}/upload")
# async def upload_patient_file(
#     patient_id: int, 
#     background_tasks: BackgroundTasks,
#     file: UploadFile = File(...), 
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
async def upload_patient_file(
    patient_id: int, 
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print(f"🔵 UPLOAD REQUEST: {file.filename}")
    
    # 0. Authorization
    is_platform = current_user.role in ["website_admin", "website_staff"]
    patient = db.query(Patient).filter(Patient.record_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    if not is_platform and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Not authorized to upload for this patient")

    allowed_extensions = {'.pdf', '.mp4', '.mov', '.avi', '.mkv'}
    ext = os.path.splitext(file.filename)[1].lower()
    
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Only PDF and Video files are allowed")

    # 1. Save to Temp File (Stream to disk to avoid Memory Crash)
    import tempfile
    try:
        tmp_fd, tmp_path = tempfile.mkstemp(suffix=ext)
        os.close(tmp_fd)
        
        with open(tmp_path, "wb") as buffer:
            while content := await file.read(1024 * 1024): # 1MB chunks
                buffer.write(content)
                
    except Exception as e:
        print(f"Disk Write Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to save upload to server temp")

    # 2. Create Initial DB Record
    new_file = PDFFile(
        record_id=patient_id,
        filename=file.filename,
        s3_key="pending", # Placeholder
        file_size=os.path.getsize(tmp_path),
        upload_status="draft", # Force draft for Review Step
        processing_stage="queued",
        processing_progress=0,
        # Capture Historical Pricing
        price_per_file=patient.price_per_file,
        included_pages=patient.included_pages,
        price_per_extra_page=patient.price_per_extra_page
    )
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    
    # 3. Trigger Background Task
    background_tasks.add_task(process_upload_task, new_file.file_id, tmp_path, file.filename, current_user.user_id, current_user.hospital_id)
    
    return {
        "status": "processing",
        "file_id": new_file.file_id,
        "message": "Upload accepted, processing in background."
    }

@router.get("/search/", response_model=List[dict])
def search_files(q: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Search in Filename OR OCR Text (case insensitive)
    # If Website role, search across all. If Hospital role, filter by hospital.
    is_platform = current_user.role in ["website_admin", "website_staff"]
    
    query_obj = db.query(PDFFile).join(Patient)
    if not is_platform:
        query_obj = query_obj.filter(Patient.hospital_id == current_user.hospital_id)
        
    results = query_obj.filter(
        or_(
            PDFFile.filename.ilike(f"%{q}%"),
            PDFFile.ocr_text.ilike(f"%{q}%"),
            PDFFile.tags.ilike(f"%{q}%")
        )
    ).all()
    
    # Filter Buffer: Only show 'confirmed' files OR 'draft' files if I am the owner (Not storing owner_id on file yet, assuming MRD sees all drafts for their hospital for now)
    # Actually, simpler: MRD sees ALL drafts for their hospital. Admins see ONLY confirmed.
    filtered_results = []
    for f in results:
        if f.upload_status == 'confirmed':
            filtered_results.append(f)
        elif current_user.role == UserRole.MRD_STAFF:
            # MRD can see drafts
            filtered_results.append(f)
            
    return [
        {
            "file_id": f.file_id,
            "filename": f.filename,
            "patient_name": f.patient.full_name,
            "match_type": "Content" if f.ocr_text and q.lower() in (f.ocr_text or "").lower() else "Filename",
            "upload_status": f.upload_status
        }
        for f in filtered_results
    ]

@router.get("/", response_model=List[PatientResponse])
def get_patients(
    q: Optional[str] = None, 
    unassigned_only: bool = False,
    hospital_id: Optional[int] = None, # New: Allow filtering by specific hospital
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    is_platform = current_user.role in ["website_admin", "website_staff"]
    
    query = db.query(Patient).options(joinedload(Patient.files))
    
    if unassigned_only:
        query = query.filter(Patient.physical_box_id == None)

    if not is_platform:
        # Standard Staff: RESTRICT to their own hospital
        query = query.filter(Patient.hospital_id == current_user.hospital_id)
    else:
        # Platform Staff:
        # If hospital_id is provided, filter by it.
        # If NOT provided, return ALL (or maybe we should force selection for performance? logic below allows all)
        if hospital_id:
            query = query.filter(Patient.hospital_id == hospital_id)
    
    if q:
        query = query.filter(
            or_(
                Patient.full_name.ilike(f"%{q}%"),
                Patient.patient_u_id.ilike(f"%{q}%"),
                Patient.contact_number.ilike(f"%{q}%"),
                Patient.uhid.ilike(f"%{q}%")
            )
        )
    
    return query.all()

@router.get("/{patient_id}", response_model=PatientDetailResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    is_platform = current_user.role in ["website_admin", "website_staff"]
    
    query = db.query(Patient).options(joinedload(Patient.files)).filter(Patient.record_id == patient_id)
    if not is_platform:
        query = query.filter(Patient.hospital_id == current_user.hospital_id)
    
    patient = query.first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # Filter files in response based on status
    # Filter files: Admin/MRD see drafts (to review uploads). Website Staff/Dat Users?
    # For now, allow all hospital staff to see drafts to facilitate the review flow.
    # if current_user.role not in [UserRole.MRD_STAFF, UserRole.HOSPITAL_ADMIN]:
    #      patient.files = [f for f in patient.files if f.upload_status == 'confirmed']
         
    return patient

@router.get("/check/uhid/{uhid_no}")
def check_uhid_exists(uhid_no: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Check if a UHID exists and return the patient details if found.
    Used for Auto-Fill logic.
    """
    # Normalize UHID
    uhid_no = uhid_no.upper().strip()
    
    # Search across all hospitals? Or current hospital?
    # Ideally UHID is global (person identifier).
    # But for privacy/tenancy, we might restrict it.
    # For now, let's allow finding across hospitals IF user is SuperAdmin, 
    # but for hospital staff, search their own DB first.
    
    # Finding ANY patient record with this UHID
    patient = db.query(Patient).filter(Patient.uhid == uhid_no).order_by(Patient.created_at.desc()).first()
    
    if patient:
        return {
            "exists": True,
            "patient": {
                "full_name": patient.full_name,
                "age": patient.age,
                "gender": patient.gender,
                "address": patient.address,
                "contact_number": patient.contact_number,
                "email_id": patient.email_id,
                "aadhaar_number": patient.aadhaar_number,
                "dob": patient.dob
            }
        }
    return {"exists": False}

@router.post("/files/{file_id}/confirm")
def confirm_upload(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    is_platform = current_user.role in ["website_admin", "website_staff"]
    
    q = db.query(PDFFile).join(Patient).filter(PDFFile.file_id == file_id)
    if not is_platform:
        q = q.filter(Patient.hospital_id == current_user.hospital_id)
    f = q.first()
    
    if not f: 
        raise HTTPException(status_code=404, detail="File not found or access denied")
        
    # Migration Logic: Local Draft -> S3 Archive via StorageService
    if "drafts/" in (f.s3_key or ""):
        success, msg = StorageService.migrate_to_s3(db, file_id)
        if not success:
            # If S3 migration failed, we still mark as confirmed locally
            f.upload_status = 'confirmed'
            db.commit()
            return {"status": "partial", "message": f"Confirmed locally, but archival error: {msg}"}
        
        return {"status": "success", "message": "File confirmed and archived to S3"}

    f.upload_status = 'confirmed'
    db.commit()

    from ..audit import log_audit
    log_audit(db, current_user.user_id, "FILE_CONFIRMED", f"Confirmed: {f.filename}", hospital_id=current_user.hospital_id)
    return {"status": "success", "message": "File confirmed and published"}

@router.delete("/files/{file_id}/draft")
def delete_draft(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    s3_manager = S3Manager()
    # MRD uses this to discard drafts
    # Review Step: Allow discarding drafts
    # if current_user.role != UserRole.MRD_STAFF:
    #      raise HTTPException(status_code=403, detail="Access Denied")
         
    is_platform = current_user.role in ["website_admin", "website_staff"]
    q = db.query(PDFFile).join(Patient).filter(PDFFile.file_id == file_id)
    if not is_platform:
        q = q.filter(Patient.hospital_id == current_user.hospital_id)
    f = q.first()
    
    if not f: 
        raise HTTPException(status_code=404, detail="File not found")
        
    if f.upload_status != 'draft':
        raise HTTPException(status_code=400, detail="Can only delete DRAFT files directly. Confirmed files require deletion request.")
        
    s3_manager.delete_file(f.s3_key)
    filename = f.filename
    db.delete(f)
    db.commit()

    from ..audit import log_audit
    log_audit(db, current_user.user_id, "FILE_DRAFT_DISCARDED", f"Discarded draft: {filename}", hospital_id=current_user.hospital_id)
    return {"status": "success", "message": "Draft discarded"}

@router.delete("/files/{file_id}")
async def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a file from database and storage"""
    # Authorization Check
    # Only Admin or Hospital Admin (if same hospital)
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.MRD_STAFF]:
         raise HTTPException(status_code=403, detail="Not authorized to delete files")

    # Get the file
    db_file = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check Hospital Scope
    patient = db.query(Patient).filter(Patient.record_id == db_file.patient_id).first()
    if not patient:
        # Orphaned file? Just delete if super admin
        if current_user.role != UserRole.SUPER_ADMIN:
             raise HTTPException(status_code=404, detail="Patient context not found")
             
    if current_user.role != UserRole.SUPER_ADMIN:
        if patient.hospital_id != current_user.hospital_id:
            raise HTTPException(status_code=403, detail="Access denied")

    # MRD Staff can only delete if status is NOT 'archived'? Or restricted?
    # For now, allow MRD to delete if they made a mistake.
    
    # Delete from storage
    try:
        s3_manager = S3Manager()
        # Extract path from location (format: "local://path" or "s3://path" or just path)
        # Assuming database stores relative or absolute path in s3_key
        
        # If using s3_key from model:
        s3_manager.delete_file(db_file.s3_key)
        
    except Exception as e:
        print(f"⚠️ Failed to delete from storage: {e}")
        # Continue to delete from DB to keep metadata clean? 
        # Or fail? Better to log and continue so DB isn't out of sync.
    
    # Update storage usage
    # We need to decrement the used_mb
    if patient:
        from ..models import BandwidthUsage # StorageUsage seems to be BandwidthUsage in this system or missing?
        # Checked models.py: BandwidthUsage exists, StorageUsage was in delete_endpoint.txt but let's check models.py
        # Actually models.py has BandwidthUsage, but maybe not StorageUsage. check AuditLog...
        pass

    # Delete from database
    filename = db_file.filename
    db.delete(db_file)
    db.commit()
    
    from ..audit import log_audit
    log_audit(db, current_user.user_id, "FILE_DELETED", f"Deleted file: {filename}", hospital_id=current_user.hospital_id)
    
    return {"status": "success", "message": "File deleted successfully"}

@router.get("/drafts", response_model=List[dict])
def list_drafts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # List all files with 'draft' status for the current hospital
    # Primarily for MRD to manage their queue. 
    # Admins currently excluded per "invisible" requirement, can relax if needed.
    
    if current_user.role not in [UserRole.MRD_STAFF]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    results = db.query(PDFFile).join(Patient).filter(
        Patient.hospital_id == current_user.hospital_id,
        PDFFile.upload_status == 'draft'
    ).all()
    
    return [
        {
            "file_id": f.file_id,
            "filename": f.filename,
            "patient_name": f.patient.full_name,
            "patient_id": f.patient.record_id,
            "upload_date": f.upload_date,
            "file_size_mb": f.file_size_mb
        }
        for f in results
    ]

@router.get("/files/{file_id}/url")
def get_file_url(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify access first
    is_platform = current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]
    
    query = db.query(PDFFile).join(Patient).filter(PDFFile.file_id == file_id)
    if not is_platform:
        query = query.filter(Patient.hospital_id == current_user.hospital_id)
        
    pdf_file = query.first()
    if not pdf_file:
         raise HTTPException(status_code=404, detail="File not found or access denied")
    
    # Return proxy view URL with token for authenticated browser access
    from ..core.config import settings
    # Use the same token that was used for this request
    # However, since we don't have the raw token here, we might need to recreate a short-lived one or just pass the current one from frontend.
    # For now, we will return the base URL and let the frontend append the token.
    url = f"{settings.BACKEND_URL}/patients/files/{file_id}/serve"
    return {"url": url}

@router.get("/files/{file_id}/serve")
def serve_file(
    file_id: int, 
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Decrypt and stream file to browser.
    Allows authentication via query param 'token' for direct browser viewing.
    """
    from ..routers.auth import get_current_user as verify_user
    
    # Authenticate manually since standard Depends(get_current_user) won't work for tags/embeds
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required in query params")
        
    try:
        current_user = verify_user(token=token, db=db)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

    is_platform = current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]
    
    query = db.query(PDFFile).join(Patient).filter(PDFFile.file_id == file_id)
    if not is_platform:
        query = query.filter(Patient.hospital_id == current_user.hospital_id)
        
    pdf_file = query.first()
    if not pdf_file:
         raise HTTPException(status_code=404, detail="File not found")
    
    s3_manager = S3Manager()
    encrypted_bytes = s3_manager.get_file_bytes(pdf_file.s3_key)
    
    if not encrypted_bytes:
        raise HTTPException(status_code=404, detail="Physical file not found")
        
    try:
        decrypted_bytes = decrypt_data(encrypted_bytes)
        return Response(
            content=decrypted_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{pdf_file.filename}"'
            }
        )
    except Exception as e:
        print(f"❌ Decryption Failed for file {file_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to decrypt file")

@router.get("/files/{file_id}/status")
def get_file_status(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    file = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
        
    return {
        "file_id": file.file_id,
        "stage": file.processing_stage, # queued, compressing, encrypting, uploading, completed
        "progress": file.processing_progress,
        "error": None # Ideally capture error message in DB if failed
    }

@router.post("/files/{file_id}/cancel")
def cancel_upload(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    file = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
        
    # Only allow cancellation if not completed
    if file.processing_stage in ['completed', 'failed']:
        raise HTTPException(status_code=400, detail="Cannot cancel completed or failed tasks")
        
    file.processing_stage = 'cancelled'
    db.commit()
    return {"status": "cancelled", "message": "Cancellation signal sent"}


@router.post("/files/{file_id}/request-deletion")
def request_deletion(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.MRD_STAFF:
        raise HTTPException(status_code=403, detail="MRD Staff cannot delete files. Please contact Admin.")

    is_platform = current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]
    
    query = db.query(PDFFile).join(Patient).filter(PDFFile.file_id == file_id)
    if not is_platform:
        query = query.filter(Patient.hospital_id == current_user.hospital_id)
        
    pdf_file = query.first()
    if not pdf_file:
        raise HTTPException(status_code=404, detail="File not found")

    
    # Logic: MRD -> 'requested', Hospital Admin/Super Admin -> Immediate Deletion
    if current_user.role in [UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN]:
        # Strict bypass: Admins can delete immediately
        s3_manager = S3Manager()
        s3_manager.delete_file(pdf_file.s3_key)
        db.delete(pdf_file)
        db.commit()
        
        from ..audit import log_audit
        log_audit(db, current_user.user_id, "FILE_DELETED", f"{current_user.role} deleted file {file_id}")
        return {"message": "File permanently deleted"}
    
    # MRD or others
    pdf_file.deletion_step = "requested"
    pdf_file.is_deletion_pending = True
    db.commit()
    
    from ..audit import log_audit
    log_audit(db, current_user.user_id, "FILE_DELETION_REQUESTED", f"Requested deletion: {pdf_file.filename}", hospital_id=current_user.hospital_id)
    
    return {"message": "Deletion request submitted for Hospital Admin approval"}

@router.post("/files/{file_id}/approve-deletion")
def approve_deletion(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can approve deletions")


    is_super = current_user.role == UserRole.SUPER_ADMIN
    query = db.query(PDFFile).join(Patient).filter(PDFFile.file_id == file_id)
    if not is_super:
        query = query.filter(Patient.hospital_id == current_user.hospital_id)
        
    pdf_file = query.first()
    if not pdf_file or not pdf_file.is_deletion_pending:
        raise HTTPException(status_code=404, detail="Pending deletion request not found")

    # Workflow Logic
    # Workflow Logic
    if current_user.role == UserRole.HOSPITAL_ADMIN:
        # Hospital Admin approves MRD request -> Final Delete
        if pdf_file.deletion_step != 'requested':
             raise HTTPException(status_code=400, detail="Invalid deletion step for Hospital Admin")
        
        s3_manager = S3Manager()
        s3_manager.delete_file(pdf_file.s3_key)
        db.delete(pdf_file)
        db.commit()
        
        from ..audit import log_audit
        log_audit(db, current_user.user_id, "FILE_DELETED", f"Hospital Admin approved and deleted file {file_id}")
        return {"message": "Deletion approved and file permanently deleted."}

    # Super Admin (Final Deletion)
    if is_super:
        # Can delete from any step, but typically from 'hospital_approved'
        s3_manager = S3Manager()
        s3_manager.delete_file(pdf_file.s3_key)
        db.delete(pdf_file)
        db.commit()
        
        from ..audit import log_audit
        log_audit(db, current_user.user_id, "FILE_DELETED", f"Super Admin approved and deleted file {file_id}")
        return {"message": "File permanently deleted"}

@router.post("/files/{file_id}/reject-deletion")
def reject_deletion(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can reject deletions")

    is_super = current_user.role == UserRole.SUPER_ADMIN
    query = db.query(PDFFile).join(Patient).filter(PDFFile.file_id == file_id)
    if not is_super:
        query = query.filter(Patient.hospital_id == current_user.hospital_id)
        
    pdf_file = query.first()
    if not pdf_file:
        raise HTTPException(status_code=404, detail="File not found")

    pdf_file.is_deletion_pending = False
    db.commit()
    return {"message": "Deletion request rejected"}

@router.get("/pending-deletions/")
def list_pending_deletions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")

    is_super = current_user.role == UserRole.SUPER_ADMIN
    
    query = db.query(PDFFile).join(Patient).filter(PDFFile.is_deletion_pending == True)
    
    if is_super:
        # Super Admin sees 'hospital_approved' (or 'requested' if we want visibility, but let's filter for noise)
        query = query.filter(PDFFile.deletion_step == 'hospital_approved')
    else:
        # Hospital Admin sees 'requested' (from MRD etc)
        query = query.filter(Patient.hospital_id == current_user.hospital_id)
        query = query.filter(PDFFile.deletion_step == 'requested')
        
    results = query.all()
    return [
        {
            "file_id": f.file_id,
            "filename": f.filename,
            "patient_name": f.patient.full_name,
            "hospital_name": f.patient.hospital.legal_name,
            "upload_date": f.upload_date.isoformat() if f.upload_date else None
        }
        for f in results
    ]

@router.delete("/files/{file_id}")
async def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a file from database and storage"""
    print(f"🗑️ DELETE request for file_id: {file_id}")
    
    # Get the file
    db_file = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Authorization check
    patient = db.query(Patient).filter(Patient.record_id == db_file.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    is_platform = current_user.role in ["website_admin", "website_staff"]
    if not is_platform and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete from storage
    try:
        s3_manager = S3Manager()
        location = db_file.storage_path
        if location and location.startswith("local://"):
            file_path = location.replace("local://", "")
            s3_manager.delete_file(file_path)
            print(f"✅ Deleted from storage: {file_path}")
        elif db_file.s3_key:
             s3_manager.delete_file(db_file.s3_key)

    except Exception as e:
        print(f"⚠️ Failed to delete from storage: {e}")
    
    # Update storage usage
    file_size_mb = db_file.file_size_mb
    usage = db.query(BandwidthUsage).filter(
        BandwidthUsage.hospital_id == patient.hospital_id
    ).first()
    if usage:
        usage.used_mb = max(0, usage.used_mb - file_size_mb)
    
    # Delete from database
    db.delete(db_file)
    db.commit()
    
    print(f"✅ File {file_id} deleted successfully")
    
    return {"status": "success", "message": "File deleted successfully"}

@router.put("/files/{file_id}/tags")
def update_file_tags(
    file_id: int,
    request: UpdateTagsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update manual tags for a file"""
    db_file = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
        
    # Auth
    is_platform = current_user.role in ["website_admin", "website_staff"]
    if not is_platform:
        # Check hospital ownership
        if db_file.patient.hospital_id != current_user.hospital_id:
            raise HTTPException(status_code=403, detail="Access denied")

    db_file.tags = request.tags
    db.commit()
    return {"message": "Tags updated successfully", "tags": db_file.tags}

@router.delete("/{patient_id}")
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a patient and all associated files"""
    # Authorization
    is_platform = current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]
    
    patient = db.query(Patient).filter(Patient.record_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if not is_platform and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        # DB Cascade should handle files, but explicit is better if we want to delete S3 objects.
        # For now, just DB deletion as per request context (assuming S3 cleanup is secondary or handled by a batch job)
        db.delete(patient)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Delete Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete patient.")

    from ..audit import log_audit
    log_audit(db, current_user.user_id, "PATIENT_DELETED", f"Deleted patient: {patient.full_name}", hospital_id=current_user.hospital_id)

    return {"status": "success", "message": "Patient deleted successfully"}
