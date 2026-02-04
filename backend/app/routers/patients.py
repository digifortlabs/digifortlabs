import datetime
import os
import uuid
from typing import List, Optional, Union

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, Response
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from ..database import SessionLocal, get_db
from ..models import BandwidthUsage, Patient, PDFFile, User, UserRole
from ..routers.auth import get_current_user
from ..services.compression import compress_pdf, compress_video_to_mp4
from ..services.ocr import extract_text_from_pdf, classify_document, extract_text_from_image
from ..services.s3_handler import S3Manager
from ..services.ai_service import ai_service
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
            
        # 1.5 Page Counting (Keep here for Review Step)
        if os.path.splitext(original_filename)[1].lower() == '.pdf':
            try:
                db_file.processing_stage = 'analyzing' 
                db.commit()
                
                with open(processed_path, 'rb') as f:
                    content_bytes = f.read()
                
                # Count Pages
                try:
                    from pypdf import PdfReader
                    import io
                    reader = PdfReader(io.BytesIO(content_bytes))
                    db_file.page_count = len(reader.pages)
                    db.commit() 
                    print(f"📄 Page Count: {db_file.page_count}")
                except Exception as pe:
                    print(f"⚠️ Page count error: {pe}")
            except Exception as e:
                print(f"⚠️ PageCount Warning: {e}")
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
        
        # Save to Storage (S3 Enforced)
        with open(processed_path, 'rb') as f:
            # Removed "Force Local" logic as per user request (store only in S3)
            # Drafts will now reside in S3 under drafts/ bucket prefix
            success, location = s3_manager.upload_file(f, s3_key)
            
        if success:
            db_file.s3_key = s3_key
            db_file.file_size = os.path.getsize(processed_path)
            db_file.file_size_mb = db_file.file_size / (1024 * 1024)
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

def log_ocr(msg: str):
    print(msg)
    try:
        with open("backend/logs/ocr_debug.log", "a", encoding="utf-8") as f:
            f.write(f"{msg}\n")
    except Exception:
        pass

def run_post_confirmation_ocr(file_id: int):
    """
    Background Task to run OCR after file is confirmed.
    """
    db = SessionLocal()
    s3_manager = S3Manager()
    try:
        db_file = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
        if not db_file:
            return

        log_ocr(f"🔍 Post-Confirmation OCR Started: {file_id}")
        db_file.processing_stage = 'analyzing'
        db.commit()
        
        # Get and Decrypt Bytes
        try:
            encrypted_bytes = s3_manager.get_file_bytes(db_file.s3_key)
            if not encrypted_bytes:
                log_ocr(f"❌ Physical file not found for OCR: {db_file.s3_key}")
                return
                
            from ..services.encryption import decrypt_data
            decrypted_bytes = decrypt_data(encrypted_bytes)
            
            # Run OCR
            extracted_text = extract_text_from_pdf(decrypted_bytes)
            if extracted_text:
                db_file.ocr_text = extracted_text
                db_file.is_searchable = True
                
                # AI Tagging
                auto_tags = classify_document(extracted_text)
                if auto_tags:
                    db_file.tags = ", ".join(auto_tags)
                
                log_ocr(f"✅ Post-Confirmation OCR Complete: {file_id}")
            else:
                log_ocr(f"ℹ️ No OCR text found for {file_id}")
                
            db_file.processing_stage = 'completed'
            db.commit()
            
        except Exception as e:
            log_ocr(f"❌ Post-Confirmation OCR Error during processing: {e}")
            db_file.processing_stage = 'completed' # Still completed even if OCR fails
            db.commit()
            
    except Exception as e:
        log_ocr(f"❌ Post-Confirmation OCR Task Error: {e}")
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
    upload_date: Optional[datetime.datetime] = None
    file_size_mb: Union[float, None] = 0.0
    page_count: Union[int, None] = 0
    upload_status: str
    tags: Optional[str] = None
    ocr_text: Optional[str] = None
    is_searchable: bool = False
    
    # Progress Tracking
    processing_stage: Optional[str] = None
    processing_progress: Optional[int] = 0

    price_per_extra_page: float = 1.0
    
    # Storage Class Info
    is_glacier: bool = False
    restore_status: Optional[str] = None

    class Config:
        from_attributes = True

# Response Models
from typing import List, Optional, Union

# ...

class PatientResponse(BaseModel):
    record_id: int
    patient_u_id: str
    hospital_id: int
    full_name: str
    uhid: Optional[str] = None
    age: Optional[Union[str, int]] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    contact_number: Optional[str] = None
    email_id: Optional[str] = None
    email_id: Optional[str] = None
    aadhaar_number: Optional[str] = None
    patient_category: str = "STANDARD" # STANDARD, MLC, BIRTH, DEATH
    dob: Optional[datetime.datetime] = None
    admission_date: Optional[datetime.datetime] = None
    discharge_date: Optional[datetime.datetime] = None
    physical_box_id: Optional[int] = None
    box_label: Optional[str] = None
    box_location_code: Optional[str] = None
    files: List[FileData] = []
    
    # Billing info (inherited from hospital)
    @property
    def price_per_file(self) -> float:
        return self.hospital.price_per_file if self.hospital else 100.0
    
    @property
    def included_pages(self) -> int:
        return self.hospital.included_pages if self.hospital else 20
    
    @property
    def price_per_extra_page(self) -> float:
        return self.hospital.price_per_extra_page if self.hospital else 1.0

    # New Medical Fields
    doctor_name: Optional[str] = None
    weight: Optional[str] = None
    diagnosis: Optional[str] = None
    operative_notes: Optional[str] = None
    mediclaim: Optional[str] = None
    medical_summary: Optional[str] = None
    remarks: Optional[str] = None

    mother_record_id: Optional[int] = None
    mother_details: Optional[dict] = None # Basic info about mother if linked

    class Config:
        from_attributes = True

class PatientCreate(BaseModel):
    patient_u_id: str
    uhid: Optional[str] = None
    full_name: str
    age: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    contact_number: Optional[str] = None
    email_id: Optional[str] = None
    email_id: Optional[str] = None
    aadhaar_number: Optional[str] = None
    patient_category: str = "STANDARD" # STANDARD, MLC, BIRTH, DEATH
    dob: Optional[datetime.datetime] = None
    admission_date: Optional[datetime.datetime] = None
    discharge_date: Optional[datetime.datetime] = None  # Made optional for registration
    discharge_date: Optional[datetime.datetime] = None  # Made optional for registration
    hospital_id: Optional[int] = None
    mother_record_id: Optional[int] = None

    # New Medical Fields
    doctor_name: Optional[str] = None
    weight: Optional[str] = None
    diagnosis: Optional[str] = None
    operative_notes: Optional[str] = None
    mediclaim: Optional[str] = None
    medical_summary: Optional[str] = None
    remarks: Optional[str] = None

class PatientUpdate(BaseModel):
    patient_u_id: Optional[str] = None
    uhid: Optional[str] = None
    full_name: Optional[str] = None
    age: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    contact_number: Optional[str] = None
    email_id: Optional[str] = None
    aadhaar_number: Optional[str] = None
    patient_category: str = "STANDARD" # STANDARD, MLC, BIRTH, DEATH
    dob: Optional[datetime.datetime] = None
    admission_date: Optional[datetime.datetime] = None
    admission_date: Optional[datetime.datetime] = None
    discharge_date: Optional[datetime.datetime] = None
    mother_record_id: Optional[int] = None

    # New Medical Fields
    doctor_name: Optional[str] = None
    weight: Optional[str] = None
    diagnosis: Optional[str] = None
    operative_notes: Optional[str] = None
    mediclaim: Optional[str] = None
    medical_summary: Optional[str] = None
    remarks: Optional[str] = None

class PatientDetailResponse(PatientResponse):
    pass

class UpdateTagsRequest(BaseModel):
    tags: str

# ... (Existing update_patient)


@router.put("/{patient_id}", response_model=PatientDetailResponse)
def update_patient(patient_id: int, patient_update: PatientUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Authorization
    db_patient = db.query(Patient).options(joinedload(Patient.files)).filter(Patient.record_id == patient_id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    is_platform = current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]
    if not is_platform and db_patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # 1.5 Date Validation for Updates
    effective_admission = patient_update.admission_date or db_patient.admission_date
    effective_discharge = patient_update.discharge_date or db_patient.discharge_date
    
    # Only validate if both exist (either in DB or in Update) and we are updating at least one of them
    is_updating_dates = (patient_update.admission_date is not None) or (patient_update.discharge_date is not None)
    
    if is_updating_dates and effective_admission and effective_discharge:
        # Check logic
        if effective_discharge < effective_admission:
             raise HTTPException(status_code=400, detail="Discharge Date cannot be before Admission Date.")

    # 2. Update Fields
    for var, value in vars(patient_update).items():
        if value is not None:
             setattr(db_patient, var, value)
             
    db.commit()
    db.refresh(db_patient)

    try:
        from ..audit import log_audit
        log_audit(db, current_user.user_id, "PATIENT_UPDATED", f"Updated patient: {db_patient.full_name} ({db_patient.patient_u_id})", hospital_id=db_patient.hospital_id)
    except Exception as e:
        print(f"Audit Log Error: {e}")

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

    # 2. Date Validation (Phase 2 Requirement)
    if patient.admission_date and patient.discharge_date:
        # Pydantic parses them as datetimes. We can compare directly.
        # Ensure we compare date parts if times are somehow included but irrelevant
        if patient.discharge_date < patient.admission_date:
             raise HTTPException(status_code=400, detail="Discharge Date cannot be before Admission Date.")

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
        admission_date=patient.admission_date,
        discharge_date=patient.discharge_date,
        mother_record_id=patient.mother_record_id,
        doctor_name=patient.doctor_name,
        weight=patient.weight,
        diagnosis=patient.diagnosis,
        operative_notes=patient.operative_notes,
        mediclaim=patient.mediclaim,
        medical_summary=patient.medical_summary,
        remarks=patient.remarks
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
    
    try:
        from ..audit import log_audit
        log_audit(db, current_user.user_id, "PATIENT_CREATED", f"Created patient: {db_patient.full_name} ({db_patient.patient_u_id})", hospital_id=hospital_id)
    except Exception as e:
        print(f"Audit Log Error: {e}") 

    # --- Auto-Assign Storage ---
    # Disabled by user request (Manual Assignment Mode)
    # try:
    #     StorageService.auto_assign_patient(db, db_patient)
    # except Exception as e:
    #     print(f"Auto-assign failed: {e}")
    #     # We don't fail the request, just log it. Patient is created.
        
    return db_patient

@router.post("/{patient_id}/upload")
async def upload_patient_file(
    patient_id: int, 
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        print(f"🔵 UPLOAD REQUEST: {file.filename}")
        
        # 0. Authorization
        is_platform = current_user.role in ["superadmin", "superadmin_staff"]
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
            raise HTTPException(status_code=500, detail=f"Failed to save upload to server temp: {str(e)}")

        # 2. Create Initial DB Record
        new_file = PDFFile(
            record_id=patient_id,
            filename=file.filename,
            s3_key="pending", # Placeholder
            file_size=os.path.getsize(tmp_path),
            file_size_mb=os.path.getsize(tmp_path) / (1024 * 1024),
            upload_status="draft", # Force draft for Review Step
            processing_stage="queued",
            processing_progress=0,
            # Capture Historical Pricing from Hospital
            price_per_file=patient.hospital.price_per_file if patient.hospital else 100.0,
            included_pages=patient.hospital.included_pages if patient.hospital else 20,
            price_per_extra_page=patient.hospital.price_per_extra_page if patient.hospital else 1.0
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

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Using 422 Unprocessable Entity to ensure the error message passes through Nginx
        # (Nginx often intercepts 500 errors and shows a generic HTML page)
        raise HTTPException(status_code=422, detail=f"Upload Error: {str(e)}")

@router.get("/search/", response_model=List[dict])
def search_files(q: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Search in Filename OR OCR Text (case insensitive)
    # If Website role, search across all. If Hospital role, filter by hospital.
    is_platform = current_user.role in ["superadmin", "superadmin_staff"]
    
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
        elif current_user.role == UserRole.WAREHOUSE_MANAGER:
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

@router.get("/next-id")
def get_next_mrd_id(hospital_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target_hospital_id = current_user.hospital_id

    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        if hospital_id:
            target_hospital_id = hospital_id
    
    if not target_hospital_id:
        raise HTTPException(status_code=400, detail="Hospital Context Required")

    # Fetch all UIDs for this hospital to find max
    # Note: This is a simple approach. For high scale, use a sequence or dedicated counter table.
    patients = db.query(Patient.patient_u_id).filter(Patient.hospital_id == target_hospital_id).all()
    
    max_val = 0
    prefix = "" 
    
    import re # Ensure imported
    
    # Simple heuristic: Look for pattern Prefix+Number or just Number
    for p in patients:
        uid = p.patient_u_id
        # Extract number from end
        match = re.search(r'(\d+)$', uid)
        if match:
            num_part = int(match.group(1))
            if num_part > max_val:
                max_val = num_part
                # Update prefix if this is the max (best guess at current series)
                prefix = uid[:match.start()]

    # If no patients, start at 1
    next_val = max_val + 1
    
    # Simple zero-padding logic: if max_val likely came from a padded string (impossible to know for sure without original str)
    # But usually 5 or 6 digits is standard. Let's return raw next string for now based on prefix.
    
    last_id = f"{prefix}{max_val}" if max_val > 0 else "None"
    next_id = f"{prefix}{next_val}"
    
    return {"next_id": next_id, "last_id": last_id}

@router.get("/doctors", response_model=List[str])
def get_unique_doctors(
    hospital_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Determine effective hospital_id
    target_hospital_id = current_user.hospital_id
    
    # If Super Admin, allow specifying hospital_id
    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        if hospital_id:
            target_hospital_id = hospital_id
            
    if not target_hospital_id:
        return []

    # Fetch unique strings from DB
    results = db.query(Patient.doctor_name).filter(
        Patient.hospital_id == target_hospital_id,
        Patient.doctor_name != None
    ).distinct().all()
    
    doctors = set()
    for (doc_str,) in results:
        if doc_str:
            # Handle comma separated values if they exist
            parts = [p.strip() for p in doc_str.split(',') if p.strip()]
            for p in parts:
                doctors.add(p)
                
    return sorted(list(doctors))

@router.get("/", response_model=List[PatientResponse])
def get_patients(
    q: Optional[str] = None, 
    unassigned_only: bool = False,
    hospital_id: Optional[int] = None, # New: Allow filtering by specific hospital
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    is_platform = current_user.role in ["superadmin", "superadmin_staff"]
    
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
    is_platform = current_user.role in ["superadmin", "superadmin_staff"]
    
    query = db.query(Patient).options(joinedload(Patient.files)).filter(Patient.record_id == patient_id)
    if not is_platform:
        query = query.filter(Patient.hospital_id == current_user.hospital_id)
    
    patient = query.first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # Populate S3 Glacier Status
    s3_manager = S3Manager()
    for f in (patient.files or []):
        if f.upload_status == 'confirmed' and f.s3_key:
            info = s3_manager.get_object_info(f.s3_key)
            if info:
                f.is_glacier = info.get("IsGlacier", False)
                r_str = info.get("Restore", "")
                if r_str:
                    if 'ongoing-request="true"' in r_str:
                        f.restore_status = "RETRIEVING"
                    else:
                        f.restore_status = "AVAILABLE"
                else:
                    f.restore_status = None

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
                "dob": patient.dob,
                "last_mrd": patient.patient_u_id # Return the most recent MRD
            }
        }
    return {"exists": False}

@router.post("/files/{file_id}/run-ocr")
def run_manual_ocr(file_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Permission Check
    is_admin = current_user.role in ["superadmin", "superadmin_staff", "hospital_admin"]
    is_mrd = current_user.role == "warehouse_manager" # MRD can also trigger
    
    if not (is_admin or is_mrd):
        raise HTTPException(status_code=403, detail="Not authorized to trigger OCR")

    # 2. Get File
    q = db.query(PDFFile).join(Patient).filter(PDFFile.file_id == file_id)
    if current_user.role not in ["superadmin", "superadmin_staff"]:
        q = q.filter(Patient.hospital_id == current_user.hospital_id)
    
    db_file = q.first()
    if not db_file:
         raise HTTPException(status_code=404, detail="File not found")

    # 3. Trigger
    db_file.processing_stage = 'analyzing'
    db.commit()
    
    background_tasks.add_task(run_post_confirmation_ocr, file_id)
    
    return {"message": "OCR triggered successfully"}

class OCRUpdateRequest(BaseModel):
    ocr_text: str
    tags: Optional[str] = None

@router.put("/files/{file_id}/ocr")
def update_ocr_text(file_id: int, body: OCRUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Check Permissions (Hospital Staff/Admin logic)
    is_platform = current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]
    
    q = db.query(PDFFile).join(Patient).filter(PDFFile.file_id == file_id)
    if not is_platform:
        q = q.filter(Patient.hospital_id == current_user.hospital_id)
    f = q.first()
    
    if not f:
        raise HTTPException(status_code=404, detail="File not found or access denied")
        
    # 2. Update Text
    f.ocr_text = body.ocr_text
    db.commit()
    return {"message": "OCR text updated"}

@router.post("/extract-details")
async def extract_patient_details_from_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Extracts structured patient data from an uploaded document (PDF or Image).
    """
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        print(f"DEBUG: Processing /extract-details. Filename: {filename}, Size: {len(content)} bytes")
        
        extracted_text = ""
        extracted_json = None

        if filename.endswith(".pdf"):
            extracted_text = extract_text_from_pdf(content)
            if not extracted_text:
                print(f"DEBUG: OCR returned empty text for {filename}")
                raise HTTPException(status_code=400, detail="No text found in document. Please ensure the file is clear.")
            # Pass to Gemini for structured extraction from text
            extracted_json = ai_service.extract_patient_details(extracted_text)
        elif filename.endswith((".png", ".jpg", ".jpeg", ".webp")):
            # NEW: Use Gemini Vision directly for images
            mime_type = file.content_type or "image/jpeg"
            extracted_json = ai_service.extract_patient_details_from_image(content, mime_type)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Use PDF or Image.")

        if not extracted_json:
            print(f"❌ Extraction failed. AI returned empty result for {filename}")
            raise HTTPException(status_code=500, detail="AI extraction failed. Please ensure the document is clear and contains patient details.")

        print(f"✅ Extraction Successful: {extracted_json.get('full_name')}")
        return extracted_json
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Extraction API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    # 3. Update Tags
    if body.tags is not None:
        f.tags = body.tags
    else:
        # Only auto-classify if manual tags NOT provided
        new_tags = classify_document(f.ocr_text)
        f.tags = ",".join(new_tags) if new_tags else None
    
    db.commit()
    
    # Log Audit
    from ..audit import log_audit
    log_audit(db, current_user.user_id, "OCR_EDIT", f"Updated OCR text for {f.filename}", hospital_id=current_user.hospital_id)
    
    return {"status": "success", "message": "OCR Text updated successfully"}

@router.post("/files/{file_id}/confirm")
def confirm_upload(file_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    is_platform = current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]
    
    q = db.query(PDFFile).join(Patient).filter(PDFFile.file_id == file_id)
    if not is_platform:
        q = q.filter(Patient.hospital_id == current_user.hospital_id)
    f = q.first()
    
    if not f: 
        raise HTTPException(status_code=404, detail="File not found or access denied")
        
    # Migration Logic: Handle both local drafts/ and S3 draft/ folders
    s3_key = f.s3_key or ""
    
    # Case 1: Local drafts/ folder (legacy)
    if "drafts/" in s3_key:
        success, msg = StorageService.migrate_to_s3(db, file_id)
        if not success:
            # If S3 migration failed, we still mark as confirmed locally
            f.upload_status = 'confirmed'
            db.commit()
            background_tasks.add_task(run_post_confirmation_ocr, file_id)
            return {"status": "partial", "message": f"Confirmed locally, but archival error: {msg}"}
        
        background_tasks.add_task(run_post_confirmation_ocr, file_id)
        return {"status": "success", "message": "File confirmed and archived to S3. OCR is running in background."}
    
    # Case 2: S3 draft/ or draft_backup/ folders (current uploads)
    elif "draft/" in s3_key or "draft_backup/" in s3_key:
        success, msg = StorageService.migrate_s3_draft_to_final(db, file_id)
        if not success:
            f.upload_status = 'confirmed'
            db.commit()
            background_tasks.add_task(run_post_confirmation_ocr, file_id)
            return {"status": "partial", "message": f"Confirmed, but migration error: {msg}"}
        
        background_tasks.add_task(run_post_confirmation_ocr, file_id)
        return {"status": "success", "message": "File confirmed and moved to final storage. OCR is running in background."}

    # Case 3: Already in final storage
    f.upload_status = 'confirmed'
    db.commit()
    background_tasks.add_task(run_post_confirmation_ocr, file_id)

    from ..audit import log_audit
    log_audit(db, current_user.user_id, "FILE_CONFIRMED", f"Confirmed: {f.filename}", hospital_id=current_user.hospital_id)
    return {"status": "success", "message": "File confirmed and published. OCR is running in background."}

@router.delete("/files/{file_id}/draft")
def delete_draft(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    s3_manager = S3Manager()
    # MRD uses this to discard drafts
    # Review Step: Allow discarding drafts
    # if current_user.role != UserRole.WAREHOUSE_MANAGER:
    #      raise HTTPException(status_code=403, detail="Access Denied")
         
    is_platform = current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]
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

@router.get("/drafts", response_model=List[dict])
def list_drafts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # List all files with 'draft' status for the current hospital
    # Primarily for MRD to manage their queue. 
    # Admins currently excluded per "invisible" requirement, can relax if needed.
    
    if current_user.role not in [UserRole.WAREHOUSE_MANAGER]:
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
    
    # Audit Log (Phase 3)
    try:
        from ..audit import log_audit
        log_audit(db, current_user.user_id, "VIEW_DOCUMENT", f"Viewed file: {pdf_file.filename}", hospital_id=current_user.hospital_id)
    except Exception as e:
        print(f"Audit log failed: {e}")

    s3_manager = S3Manager()
    
    # Check if file is in Glacier
    obj_info = s3_manager.get_object_info(pdf_file.s3_key)
    if obj_info and obj_info.get("IsGlacier"):
        # If it's Glacier, check if it's currently restored
        restore_status = obj_info.get("Restore", "")
        if not restore_status or 'ongoing-request="true"' in restore_status:
            raise HTTPException(
                status_code=403, 
                detail="This file is archived in Glacier (Cold Storage). Please request 'Retrieval' to view it. Restoration takes 3-5 hours (Standard) or 1-5 mins (Expedited)."
            )

    encrypted_bytes = s3_manager.get_file_bytes(pdf_file.s3_key)
    
    if not encrypted_bytes:
        raise HTTPException(status_code=404, detail="Physical file not found")
        
    try:
        decrypted_bytes = decrypt_data(encrypted_bytes)
        return Response(
            content=decrypted_bytes,
            media_type="application/pdf" if ".pdf" in pdf_file.filename.lower() else "video/mp4",
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

@router.post("/files/{file_id}/restore")
def request_restore_from_glacier(
    file_id: int, 
    background_tasks: BackgroundTasks,
    tier: str = 'Standard', # Standard, Expedited, Bulk
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Request S3 to restore a file from Glacier/Cold Storage.
    Emails the hospital admin once ready.
    """
    pdf_file = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
    if not pdf_file:
        raise HTTPException(status_code=404, detail="File not found")
        
    # Check permissions
    if current_user.hospital_id and pdf_file.patient.hospital_id != current_user.hospital_id:
        if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
            raise HTTPException(status_code=403, detail="Not authorized")
            
    s3_manager = S3Manager()
    info = s3_manager.get_object_info(pdf_file.s3_key)
    if not info or not info.get("IsGlacier"):
        return {"status": "success", "message": "File is already in Standard storage, no restoration needed."}
        
    success, msg = s3_manager.initiate_restoration(pdf_file.s3_key, tier=tier)
    if not success:
        raise HTTPException(status_code=500, detail=f"S3 Restoration failed: {msg}")
        
    # Send to Hospital Admin's registered email
    hospital_email = pdf_file.patient.hospital.email
    
    # Trigger monitoring task
    background_tasks.add_task(monitor_restoration_and_email, file_id, hospital_email)
    
    return {
        "status": "success", 
        "message": f"Restoration ({tier}) initiated. Once complete, the file will be sent to {hospital_email}."
    }

def monitor_restoration_and_email(file_id: int, hospital_email: str):
    """
    Background worker to poll S3 and email file when ready.
    Designed for 'Expedited' tier mostly (polls for 10 mins).
    """
    import time
    from ..services.email_service import EmailService
    
    # We use a fresh session for background task
    db = SessionLocal()
    s3_manager = S3Manager()
    try:
        # Check every 60s for 1 hour. 
        # For 'Standard', it will likely timeout if we don't have a persistent worker, 
        # but for demo/expedited it will work.
        for _ in range(60): 
            f = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
            if not f: break
            
            info = s3_manager.get_object_info(f.s3_key)
            if not info: break
            
            restore_str = info.get('Restore', '')
            if restore_str and 'ongoing-request="false"' in restore_str:
                # READY!
                content = s3_manager.get_file_bytes(f.s3_key)
                if content:
                    decrypted = decrypt_data(content)
                    EmailService.send_file_retrieval_success_email(
                        recipient_email=hospital_email,
                        hospital_name=f.patient.hospital.legal_name,
                        patient_name=f.patient.full_name,
                        mrd_number=f.patient.patient_u_id,
                        filename=f.filename,
                        file_content=decrypted
                    )
                break
            time.sleep(60)
    except Exception as e:
        print(f"❌ monitor_restoration error: {e}")
    finally:
        db.close()

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
    if current_user.role == UserRole.WAREHOUSE_MANAGER:
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
    patient = db.query(Patient).filter(Patient.record_id == db_file.record_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    is_platform = current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]
    if not is_platform and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete from storage
    try:
        s3_manager = S3Manager()
        location = db_file.storage_path
        
        # Check if legacy local file exists and delete it
        if location and os.path.isabs(location) and os.path.exists(location):
            try:
                os.remove(location)
                print(f"✅ Deleted legacy local file: {location}")
            except Exception as e:
                print(f"⚠️ Failed to delete local file: {e}")

        # Always try S3 deletion if key exists (Normal flow)
        if db_file.s3_key:
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
    is_platform = current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]
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
    
    # Eager load files to ensure we can clean them up
    patient = db.query(Patient).options(joinedload(Patient.files)).filter(Patient.record_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if not is_platform and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        # 1. Clean up S3 Files first
        s3_manager = S3Manager()
        files_deleted_count = 0
        
        if patient.files:
            for f in patient.files:
                if f.s3_key:
                    # Attempt delete from S3
                    s3_manager.delete_file(f.s3_key)
                    # Also try local path if distinct (legacy support)
                    if f.storage_path and f.storage_path != f.s3_key and os.path.isabs(f.storage_path):
                         try:
                             if os.path.exists(f.storage_path): os.remove(f.storage_path)
                         except: pass
                    files_deleted_count += 1
        
        print(f"🗑️ Patient Deletion: Removed {files_deleted_count} associated S3 files.")

        # 2. DB Deletion (Cascade will handle rows)
        db.delete(patient)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Delete Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete patient.")

    from ..audit import log_audit
    log_audit(db, current_user.user_id, "PATIENT_DELETED", f"Deleted patient: {patient.full_name}", hospital_id=current_user.hospital_id)

    return {"status": "success", "message": "Patient deleted successfully"}

@router.post("/files/{file_id}/request-download")
def request_file_download(
    file_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Sends a download request email to a custom address and CCs the hospital admin.
    """
    pdf_file = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
    if not pdf_file:
        raise HTTPException(status_code=404, detail="File not found")
        
    # Check permissions (only for their own hospital)
    if current_user.hospital_id and pdf_file.patient.hospital_id != current_user.hospital_id:
        if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
            raise HTTPException(status_code=403, detail="Not authorized")
            
    # Get hospital admin email (from Hospital table)
    hospital = pdf_file.patient.hospital
    admin_email = hospital.email
    
    # Custom mail ID (Target for the request)
    # Using a placeholder, should ideally be in settings
    custom_target_email = "requests@digifortlabs.com"
    
    # Check limit for hospital users
    is_hospital_user = current_user.role in [UserRole.HOSPITAL_ADMIN, UserRole.HOSPITAL_STAFF]
    if is_hospital_user:
        if pdf_file.download_request_count is None:
            pdf_file.download_request_count = 0
            
        if pdf_file.download_request_count >= 5:
            raise HTTPException(
                status_code=403, 
                detail="Security Limit: Download requests for this file have reached the maximum limit of 5. Please contact support."
            )
    
    success = EmailService.send_download_request_email(
        custom_email=custom_target_email,
        admin_email=admin_email,
        hospital_name=hospital.legal_name,
        patient_name=pdf_file.patient.full_name,
        mrd_id=pdf_file.patient.patient_u_id,
        filename=pdf_file.filename,
        requester_email=current_user.email
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send download request email")
    
    # Increment count for hospital users
    if is_hospital_user:
        pdf_file.download_request_count = (pdf_file.download_request_count or 0) + 1
        db.commit()
        
    remaining = 5 - (pdf_file.download_request_count or 0) if is_hospital_user else "Unlimited"
    
    return {
        "status": "success", 
        "message": f"Download request sent to {custom_target_email}. Hospital admin ({admin_email}) has been CC'd.",
        "remaining_requests": remaining
    }
