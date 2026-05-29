import logging
logger = logging.getLogger(__name__)
import datetime
import os
import uuid
from typing import List, Optional, Union

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, Response, Request, Form
from pydantic import BaseModel
from sqlalchemy import or_, cast, Date
from sqlalchemy.orm import Session, joinedload

from ..database import SessionLocal, get_db
from ..models import BandwidthUsage, Patient, PDFFile, User, UserRole, Permission, Hospital
from ..routers.auth import get_current_user, require_permission
from ..services.compression import CompressionService
from ..services.ocr import extract_text_from_pdf, classify_document, extract_text_from_image
from ..services.s3_handler import S3Manager
from ..audit import log_audit
from ..services.storage_service import StorageService
from ..services.email_service import EmailService

router = APIRouter(tags=["patients"])


from ..services.encryption import encrypt_file, decrypt_data


def process_upload_task(file_id: int, temp_path: str, original_filename: str, user_id: int, hospital_id: int, compression_level: str = "BALANCED"):
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
            logger.info(f"[ERROR] Process Task Failed: File {file_id} not found in DB")
            return

        # Check Cancellation
        if db_file.processing_stage == 'cancelled':
            return

        logger.info(f"[START] Processing Task Started: {file_id}")
        
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
            if ext == '.pdf' and compression_level not in ['NONE', 'OFF']:
                # Use the path-based CompressionService
                CompressionService.optimize_pdf(temp_path, temp_path, level=compression_level)
                processed_path = temp_path
            elif ext in ['.mp4', '.mov', '.avi', '.mkv']:
                processed_path = CompressionService.compress_video_to_mp4(temp_path)
        except Exception as e:
            logger.info(f"Compression warning: {e}")
            # Continue with original if compression fails
            
        db_file.processing_progress = 50
        db.commit()

        if db_file.processing_stage == 'cancelled': return
            
        # 1.5 Page Counting (Keep here for Review Step)
        if os.path.splitext(original_filename)[1].lower() == '.pdf':
            try:
                db_file.processing_stage = 'processing' # Changed from 'analyzing' to avoid confusion
                db.commit()
                
                # Count Pages
                try:
                    from pypdf import PdfReader
                    reader = PdfReader(processed_path)
                    db_file.page_count = len(reader.pages)
                    db.commit() 
                    logger.info(f"[INFO] Page Count (pypdf): {db_file.page_count}")
                except Exception as pe:
                    logger.info(f"[WARN] pypdf failed: {pe}, falling back to pdf2image")
                    try:
                        from pdf2image import pdfinfo_from_path
                        info = pdfinfo_from_path(processed_path)
                        if "Pages" in info:
                            db_file.page_count = int(info["Pages"])
                            db.commit()
                            logger.info(f"[INFO] Page Count (pdf2image): {db_file.page_count}")
                        else:
                            logger.info("[WARN] Pages not found in pdfinfo")
                    except Exception as fallback_e:
                        logger.info(f"[WARN] pdf2image fallback failed: {fallback_e}")
                        # --- EXTREME FALLBACK: RAW REGEX ---
                        try:
                            import re
                            with open(processed_path, 'rb') as tmp_f:
                                raw_pdf = tmp_f.read()
                            matches = re.findall(b"/Count\\s+(\\d+)", raw_pdf)
                            if matches:
                                db_file.page_count = max([int(m) for m in matches])
                                db.commit()
                                logger.info(f"[INFO] Page Count (Raw Regex): {db_file.page_count}")
                        except Exception as e3:
                            logger.info(f"[WARN] Raw Regex failed: {e3}")
            except Exception as e:
                logger.info(f"[WARN] PageCount Warning: {e}")
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
            logger.info(f"Encryption failed: {e}")
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
        
        # Structure: hospital/year/month/MRD_uuid.ext.enc
        patient = db_file.patient
        date_source = patient.discharge_date or patient.created_at or datetime.datetime.now()
        year_str = date_source.strftime("%Y")
        month_str = date_source.strftime("%m")
        
        import re
        def simple_sanitize(name: str) -> str:
            return re.sub(r'[^a-zA-Z0-9_\-]', '_', str(name))
            
        hospital_name = simple_sanitize(patient.hospital.legal_name or f"Hospital_{patient.hospital_id}")
        mrd_number = simple_sanitize(patient.patient_u_id)
        
        final_ext = os.path.splitext(processed_path)[1] # includes .enc usually
        s3_key = f"{hospital_name}/{year_str}/{month_str}/{mrd_number}_{uuid.uuid4().hex[:8]}{final_ext}"

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
            db_file.storage_path = location 
            
            db_file.upload_status = 'confirmed'
            db_file.processing_stage = 'completed'
            db_file.processing_progress = 100
        else:
            db_file.processing_stage = 'failed'
            
        db.commit()
        
        # Log Audit
        try:
            from ..audit import log_audit
            log_audit(db, user_id, "FILE_UPLOADED", f"Uploaded: {original_filename}", hospital_id=hospital_id)
            db.commit() 
        except Exception as e:
            logger.info(f"Background Audit Error: {e}")
        
        # Cleanup
        if os.path.exists(temp_path): os.remove(temp_path)
        if os.path.exists(processed_path) and processed_path != temp_path: os.remove(processed_path)
        
        logger.info(f"[OK] Processing Complete: {file_id}")

    except Exception as e:
        db.rollback()
        import traceback
        error_msg = traceback.format_exc()
        # Fallback to local file logging in case PM2 is dropping stdout
        import tempfile
        log_path = os.path.join(tempfile.gettempdir(), "custom_trace.log")
        with open(log_path, "a") as errFile:
            errFile.write(f"\n--- UPLOAD CRASH ---\nFile ID: {file_id}\n{error_msg}\n")
        logger.info(f"[ERROR] Background Task Error for {file_id}:\n{error_msg}")
        try:
            db_file.processing_stage = 'failed'
            db.commit()
        except: pass
    finally:
        db.close()

def log_ocr(msg: str):
    logger.info(msg)
    try:
        with open("backend/logs/ocr_debug.log", "a", encoding="utf-8") as f:
            f.write(f"{msg}\n")
    except Exception:
        pass

def run_manual_ocr_task(file_id: int):
    """
    Background Task to run OCR MANUALY for a given file.
    """
    db = SessionLocal()
    s3_manager = S3Manager()
    try:
        db_file = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
        if not db_file:
            return

        log_ocr(f"[SEARCH] Manual OCR Started: {file_id}")
        db_file.processing_stage = 'analyzing'
        db_file.processing_progress = 10
        db.commit()
        
        # Get and Decrypt Bytes
        try:
            encrypted_bytes = s3_manager.get_file_bytes(db_file.s3_key)
            if not encrypted_bytes:
                log_ocr(f"[ERROR] Physical file not found for OCR: {db_file.s3_key}")
                db_file.processing_stage = 'failed'
                db_file.processing_progress = 0
                db.commit()
                return
                
            db_file.processing_progress = 30
            db.commit()
            
            from ..services.encryption import decrypt_data
            decrypted_bytes = decrypt_data(encrypted_bytes)
            
            # --- START PAGE COUNT FIX ---
            if not db_file.page_count:
                log_ocr(f"[INFO] Recalculating missing page count for: {file_id}")
                try:
                    from pypdf import PdfReader
                    import io
                    reader = PdfReader(io.BytesIO(decrypted_bytes))
                    db_file.page_count = len(reader.pages)
                    db.commit()
                    log_ocr(f"[OK] Page count updated (pypdf): {db_file.page_count}")
                except Exception as pe:
                    log_ocr(f"[WARN] pypdf failed during recalculation: {pe}")
                    try:
                        import tempfile, os
                        from pdf2image import pdfinfo_from_path
                        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                            tmp.write(decrypted_bytes)
                            tmp_path = tmp.name
                        info = pdfinfo_from_path(tmp_path)
                        if "Pages" in info:
                            db_file.page_count = int(info["Pages"])
                            db.commit()
                            log_ocr(f"[OK] Page count updated (pdf2image): {db_file.page_count}")
                        os.remove(tmp_path)
                    except Exception as fallback:
                        log_ocr(f"[WARN] pdf2image fallback failed: {fallback}")
                        try: os.remove(tmp_path)
                        except: pass
                        # --- EXTREME FALLBACK: RAW REGEX ---
                        try:
                            import re
                            matches = re.findall(b"/Count\\s+(\\d+)", decrypted_bytes)
                            if matches:
                                db_file.page_count = max([int(m) for m in matches])
                                db.commit()
                                log_ocr(f"[OK] Page count updated (Raw Regex): {db_file.page_count}")
                        except Exception as e3:
                            log_ocr(f"[WARN] Raw Regex failed: {e3}")
            # --- END PAGE COUNT FIX ---

            db_file.processing_progress = 50
            db.commit()
            
            # Run OCR
            log_ocr(f"[INFO] Extracting text for: {file_id}")
            extracted_text = extract_text_from_pdf(decrypted_bytes)
            
            db_file.processing_progress = 75
            db.commit()
            
            if extracted_text:
                db_file.ocr_text = extracted_text
                db_file.is_searchable = True
                
                # 1. Tags
                auto_tags = classify_document(extracted_text)
                if auto_tags:
                    db_file.tags = ", ".join(auto_tags)
                    
                # 2. Structured Extraction (Dynamic AI)
                hospital = db_file.patient.hospital
                ai_config = hospital.ai_settings if hospital and hospital.ai_settings else {}
                api_key = ai_config.get("api_key")
                is_enabled = ai_config.get("enabled", False)
                
                # Platform Fallback
                if not is_enabled or not api_key:
                    from ..models import SystemSetting
                    platform_ai = db.query(SystemSetting).filter(SystemSetting.key == "platform_ai_settings").first()
                    if platform_ai and platform_ai.value:
                        import json
                        try:
                            plat_cfg = json.loads(platform_ai.value)
                            if plat_cfg.get("enabled"):
                                api_key = plat_cfg.get("api_key")
                                is_enabled = True
                        except: pass
                        
                if is_enabled and api_key:
                    from ..services.ai_service import AIService
                    from ..models import AIExtraction
                    import json
                    log_ocr(f"[INFO] Running AI Analysis for: {file_id}")
                    try:
                        ai_svc = AIService(api_key=api_key)
                        structured_data = ai_svc.extract_patient_details(extracted_text)
                        if structured_data:
                            extraction_record = AIExtraction(
                                file_id=file_id,
                                raw_json=json.dumps(structured_data, indent=2),
                                extracted_text=extracted_text,
                                visit_type=structured_data.get('patient_category') or "OPD",
                                doctor_name=structured_data.get('doctor_name'),
                                summary=structured_data.get('diagnosis')
                            )
                            db.add(extraction_record)
                    except Exception as ai_e:
                        log_ocr(f"[WARN] AI Extraction failed but OCR saved: {ai_e}")
                
                log_ocr(f"[OK] Manual OCR Complete: {file_id}")
            else:
                log_ocr(f"[INFO] No OCR text found for {file_id}")
                
            db_file.processing_stage = 'completed'
            db_file.processing_progress = 100
            db.commit()
            
        except Exception as e:
            db.rollback()
            log_ocr(f"[ERROR] Manual OCR Error during processing: {e}")
            db_file.processing_stage = 'failed' 
            db_file.processing_progress = 0
            db.commit()
            
    except Exception as e:
        db.rollback()
        log_ocr(f"[ERROR] Manual OCR Task Error: {e}")
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
        db.rollback()
        logger.info(f"OCR Background Error: {e}")
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

class PatientMedicalBase(BaseModel):
    # New Medical Fields
    blood_group: Optional[str] = None
    doctor_name: Optional[str] = None
    weight: Optional[str] = None
    diagnosis: Optional[str] = None
    operative_notes: Optional[str] = None
    mediclaim: Optional[str] = None
    medical_summary: Optional[str] = None
    remarks: Optional[str] = None


class PatientResponse(PatientMedicalBase):
    record_id: int
    patient_u_id: Optional[str] = None
    hospital_id: int
    full_name: str
    hospital_name: Optional[str] = None
    uhid: Optional[str] = None
    age: Optional[Union[str, int]] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    contact_number: Optional[str] = None
    email_id: Optional[str] = None
    aadhaar_number: Optional[str] = None
    abha_id: Optional[str] = None
    ayushman_id: Optional[str] = None
    maa_card: Optional[str] = None
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

    mother_record_id: Optional[int] = None
    mother_details: Optional[dict] = None # Basic info about mother if linked

    class Config:
        from_attributes = True

class PatientCreate(PatientMedicalBase):
    patient_u_id: Optional[str] = None
    uhid: Optional[str] = None
    full_name: str
    age: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    contact_number: Optional[str] = None
    email_id: Optional[str] = None
    aadhaar_number: Optional[str] = None
    abha_id: Optional[str] = None
    ayushman_id: Optional[str] = None
    maa_card: Optional[str] = None
    patient_category: str = "STANDARD" # STANDARD, MLC, BIRTH, DEATH
    dob: Optional[datetime.datetime] = None
    admission_date: Optional[datetime.datetime] = None
    discharge_date: Optional[datetime.datetime] = None  # Made optional for registration
    hospital_id: Optional[int] = None
    mother_record_id: Optional[int] = None


class PatientUpdate(PatientMedicalBase):
    patient_u_id: Optional[str] = None
    uhid: Optional[str] = None
    full_name: Optional[str] = None
    age: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    contact_number: Optional[str] = None
    email_id: Optional[str] = None
    aadhaar_number: Optional[str] = None
    abha_id: Optional[str] = None
    ayushman_id: Optional[str] = None
    maa_card: Optional[str] = None
    patient_category: str = "STANDARD" # STANDARD, MLC, BIRTH, DEATH
    dob: Optional[datetime.datetime] = None
    admission_date: Optional[datetime.datetime] = None
    discharge_date: Optional[datetime.datetime] = None
    mother_record_id: Optional[int] = None


class PatientDetailResponse(PatientResponse):
    pass

class UpdateTagsRequest(BaseModel):
    tags: str

# ... (Existing update_patient)


@router.put("/{patient_id}", response_model=PatientDetailResponse)
def update_patient(patient_id: int, patient_update: PatientUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Authorization
    db_patient = db.query(Patient).options(joinedload(Patient.files)).filter(Patient.record_id == patient_id, Patient.is_deleted == False).first()
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

    # 1.8 Check Duplication of MRD and UHID if updated
    if patient_update.patient_u_id and patient_update.patient_u_id.strip() and patient_update.patient_u_id.strip() != db_patient.patient_u_id:
        existing_mrd = db.query(Patient).filter(
            Patient.hospital_id == db_patient.hospital_id,
            Patient.patient_u_id == patient_update.patient_u_id.strip(),
            Patient.record_id != patient_id
        ).first()
        if existing_mrd:
            raise HTTPException(status_code=400, detail=f"MRD Number '{patient_update.patient_u_id}' already exists.")

    if patient_update.uhid and patient_update.uhid.strip() and patient_update.uhid.strip() != db_patient.uhid:
        existing_uhid = db.query(Patient).filter(
            Patient.hospital_id == db_patient.hospital_id,
            Patient.uhid == patient_update.uhid.strip(),
            Patient.record_id != patient_id
        ).first()
        if existing_uhid:
            raise HTTPException(status_code=400, detail=f"UHID '{patient_update.uhid}' already exists.")

    # Check Duplication of Aadhaar if updated
    if patient_update.aadhaar_number and patient_update.aadhaar_number.strip() and patient_update.aadhaar_number.strip() != db_patient.aadhaar_number:
        existing_aadhaar = db.query(Patient).filter(
            Patient.hospital_id == db_patient.hospital_id,
            Patient.aadhaar_number == patient_update.aadhaar_number.strip(),
            Patient.is_deleted == False,
            Patient.record_id != patient_id
        ).first()
        if existing_aadhaar:
            raise HTTPException(status_code=400, detail=f"Patient with Aadhaar Number '{patient_update.aadhaar_number}' is already registered.")

    # Check Duplication of Name + Contact if updated
    effective_name = patient_update.full_name or db_patient.full_name
    effective_contact = patient_update.contact_number or db_patient.contact_number
    if (patient_update.full_name or patient_update.contact_number):
        existing_name_contact = db.query(Patient).filter(
            Patient.hospital_id == db_patient.hospital_id,
            Patient.full_name.ilike(effective_name.strip()),
            Patient.contact_number == effective_contact.strip(),
            Patient.is_deleted == False,
            Patient.record_id != patient_id
        ).first()
        if existing_name_contact:
            raise HTTPException(status_code=400, detail=f"Patient '{effective_name}' with Contact Number '{effective_contact}' is already registered.")

    # 2. Update Fields
    for var, value in vars(patient_update).items():
        if value is not None:
             setattr(db_patient, var, value)
             
    try:
        from ..audit import log_audit
        log_audit(db, current_user.user_id, "PATIENT_UPDATED", f"Updated patient: {db_patient.full_name} ({db_patient.patient_u_id})", hospital_id=db_patient.hospital_id)
    except Exception as e:
        logger.info(f"Audit Log Error: {e}")

    db.commit()
    db.refresh(db_patient)

    return db_patient

@router.post("")
@router.post("/", response_model=PatientDetailResponse)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Enforce hospital data segregation
    hospital_id = current_user.hospital_id
    if not hospital_id:
        if patient.hospital_id and current_user.role == UserRole.SUPER_ADMIN:
            hospital_id = patient.hospital_id
        else:
             raise HTTPException(status_code=400, detail="User context missing hospital ID")

    # Demo Account Patient Quota Check
    if current_user.hospital and current_user.hospital.custom_pricing:
        max_patients = current_user.hospital.custom_pricing.get("max_patients")
        if max_patients:
            current_count = db.query(Patient).filter(Patient.hospital_id == hospital_id, Patient.is_deleted == False).count()
            if current_count >= max_patients:
                from fastapi import status
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Patient quota exceeded (Max: {max_patients}). Please upgrade to add more patients.")

    # 1. Check for Duplicate MRD (Explicit Check for better error)
    if patient.patient_u_id and patient.patient_u_id.strip():
        existing_mrd = db.query(Patient).filter(
            Patient.hospital_id == hospital_id,
            Patient.patient_u_id == patient.patient_u_id.strip()
        ).first()
        
        if existing_mrd:
            raise HTTPException(status_code=400, detail=f"MRD Number '{patient.patient_u_id}' already exists.")

    # 1.5 Check for Duplicate UHID (Generate if missing)
    if not patient.uhid or not patient.uhid.strip():
        # Auto-generate UHID
        res = get_next_uhid(hospital_id=hospital_id, db=db, current_user=current_user)
        patient.uhid = res["next_id"]
    else:
        existing_uhid = db.query(Patient).filter(
            Patient.hospital_id == hospital_id,
            Patient.uhid == patient.uhid.strip()
        ).first()
        if existing_uhid:
            raise HTTPException(status_code=400, detail=f"UHID '{patient.uhid}' already exists.")

    # 1.6 Check for Duplicate Aadhaar Number (if provided)
    if patient.aadhaar_number and patient.aadhaar_number.strip():
        existing_aadhaar = db.query(Patient).filter(
            Patient.hospital_id == hospital_id,
            Patient.aadhaar_number == patient.aadhaar_number.strip(),
            Patient.is_deleted == False
        ).first()
        if existing_aadhaar:
            raise HTTPException(status_code=400, detail=f"Patient with Aadhaar Number '{patient.aadhaar_number}' is already registered.")

    # 1.7 Check for Duplicate Name + Contact Number
    if patient.full_name and patient.contact_number:
        existing_name_contact = db.query(Patient).filter(
            Patient.hospital_id == hospital_id,
            Patient.full_name.ilike(patient.full_name.strip()),
            Patient.contact_number == patient.contact_number.strip(),
            Patient.is_deleted == False
        ).first()
        if existing_name_contact:
            raise HTTPException(
                status_code=409, 
                detail={
                    "message": f"Patient '{patient.full_name}' with Contact Number '{patient.contact_number}' is already registered.",
                    "existing_patient_id": existing_name_contact.record_id
                }
            )

    # 2. Date Validation (Phase 2 Requirement)
    if patient.admission_date and patient.discharge_date:
        # Pydantic parses them as datetimes. We can compare directly.
        # Ensure we compare date parts if times are somehow included but irrelevant
        if patient.discharge_date < patient.admission_date:
             raise HTTPException(status_code=400, detail="Discharge Date cannot be before Admission Date.")

    db_patient = Patient(
        patient_u_id=patient.patient_u_id.strip() if patient.patient_u_id and patient.patient_u_id.strip() else None,
        uhid=patient.uhid,
        hospital_id=hospital_id,
        full_name=patient.full_name,
        age=patient.age,
        gender=patient.gender,
        address=patient.address,
        contact_number=patient.contact_number,
        email_id=patient.email_id,
        aadhaar_number=patient.aadhaar_number,
        abha_id=patient.abha_id,
        ayushman_id=patient.ayushman_id,
        maa_card=patient.maa_card,
        patient_category=patient.patient_category,
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
        from ..audit import log_audit
        log_audit(db, current_user.user_id, "PATIENT_CREATED", f"Created patient: {db_patient.full_name} ({db_patient.patient_u_id})", hospital_id=hospital_id)
    except Exception as e:
        logger.info(f"Audit Log Error: {e}") 
    
    try:
        db.add(db_patient)
        db.commit()
        db.refresh(db_patient)
    except Exception as e:
        logger.info(f"Audit Log Error: {e}") 

    # --- Auto-Assign Storage ---
    # Disabled by user request (Manual Assignment Mode)
    # try:
    #     StorageService.auto_assign_patient(db, db_patient)
    # except Exception as e:
    #     logger.info(f"Auto-assign failed: {e}")
    #     # We don't fail the request, just log it. Patient is created.
        
    return db_patient

@router.get("/{patient_id}/timeline")
def get_patient_timeline(
    patient_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Fetch Patient to ensure existence and permission
    patient = db.query(Patient).filter(Patient.record_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    if current_user.role not in ["superadmin", "superadmin_staff"] and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    timeline = []
    
    # 1. Registration Event
    timeline.append({
        "type": "REGISTRATION",
        "date": patient.created_at or patient.admission_date or datetime.now(),
        "id_number": patient.uhid,
        "title": "Patient Registered (UHID)",
        "description": f"Registered with UHID: {patient.uhid}"
    })
    
    # 2. Appointments (OPD / Follow up)
    from .appointments import Appointment # Avoid circular import if it was at top, or just use db.query
    from ..models import Appointment as AppointmentModel
    
    appointments = db.query(AppointmentModel).filter(AppointmentModel.patient_id == patient_id).all()
    for appt in appointments:
        visit_type_label = "Follow-up" if appt.is_follow_up else (appt.visit_type or "OPD")
        timeline.append({
            "type": "FOLLOW_UP" if appt.is_follow_up else "OPD",
            "date": appt.appointment_date,
            "id_number": appt.opd_number,
            "title": f"{visit_type_label} Visit (OPD)",
            "description": f"Consultation with Doctor ID: {appt.doctor_id}. Reason: {appt.reason_for_visit or 'N/A'}"
        })
        
    # 3. Admissions (IPD)
    from ..models import IPDAdmission
    admissions = db.query(IPDAdmission).filter(IPDAdmission.patient_id == patient_id).all()
    for adm in admissions:
        # Use patient's ipd_number for now, or could be stored on admission
        timeline.append({
            "type": "IPD",
            "date": adm.admission_date,
            "id_number": patient.ipd_number or "N/A",
            "title": "Admitted to IPD",
            "description": f"Admitted to Ward ID: {adm.ward_id}, Bed ID: {adm.bed_id}. Diagnosis: {adm.diagnosis or 'N/A'}"
        })
        
    # 4. MRD Generation (if any)
    if patient.patient_u_id:
        timeline.append({
            "type": "MRD",
            "date": patient.created_at or patient.admission_date or datetime.now(), # Approximate date
            "id_number": patient.patient_u_id,
            "title": "Physical File Created (MRD)",
            "description": f"MRD Number assigned: {patient.patient_u_id}"
        })

    # Sort timeline by date descending
    timeline.sort(key=lambda x: x["date"], reverse=True)
    
    return timeline


@router.post("/{patient_id}/upload")
async def upload_patient_file(
    patient_id: int, 
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    compression_level: str = Form("BALANCED"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        logger.info(f"[INFO] UPLOAD REQUEST: {file.filename}")
        
        # 0. Authorization
        is_platform = current_user.role in ["superadmin", "superadmin_staff"]
        patient = db.query(Patient).filter(Patient.record_id == patient_id, Patient.is_deleted == False).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
            
        if not is_platform and patient.hospital_id != current_user.hospital_id:
            raise HTTPException(status_code=403, detail="Not authorized to upload for this patient")

        # Demo Account Record Quota Check
        if current_user.hospital and current_user.hospital.custom_pricing:
            max_records = current_user.hospital.custom_pricing.get("max_records")
            if max_records:
                current_count = db.query(PDFFile).filter(PDFFile.hospital_id == current_user.hospital_id).count()
                if current_count >= max_records:
                    raise HTTPException(status_code=403, detail=f"Record quota exceeded (Max: {max_records}). Please upgrade to upload more records.")

        allowed_extensions = {'.pdf', '.mp4', '.mov', '.avi', '.mkv'}
        ext = os.path.splitext(file.filename)[1].lower()
        
        if ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Only PDF and Video files are allowed")

        # 1. Save to Temp File (Stream to disk to avoid Memory Crash)
        import tempfile
        from ..utils import validate_magic_bytes
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
                tmp_path = temp_file.name
                
                # Check Magic Bytes to prevent spoofing
                first_chunk = await file.read(1024 * 1024)
                if not first_chunk:
                    raise HTTPException(status_code=400, detail="Empty file upload")
                    
                if not validate_magic_bytes(first_chunk[:100], ext):
                    raise HTTPException(status_code=400, detail=f"File content does not match extension '{ext}' (Spoofing detected)")
                    
                # Continue writing file
                temp_file.write(first_chunk)
                while content := await file.read(1024 * 1024): # 1MB chunks
                    temp_file.write(content)

            # --- COMPRESSION STEP ---
            file_size = os.path.getsize(tmp_path)
            if ext == '.pdf' and compression_level not in ['NONE', 'OFF'] and file_size > 5 * 1024 * 1024: # > 5MB
                try:
                    from ..services.compression import CompressionService
                    logger.info(f"[INFO] Compress candidate: {file.filename} ({file_size/1024/1024:.2f} MB) using level {compression_level}")
                    
                    # Use path-based optimization directly on the temp file
                    CompressionService.optimize_pdf(tmp_path, tmp_path, level=compression_level)
                    logger.info(f"[OK] Optimization check complete for: {file.filename}")
                except Exception as comp_e:
                    logger.info(f"[WARN] Compression skipped due to error: {comp_e}")
            # ------------------------
                    
        except Exception as e:
            logger.info(f"Disk Write Error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to save upload to server temp: {str(e)}")

        # 2. Create Initial DB Record
        new_file = PDFFile(
            record_id=patient_id,
            filename=file.filename,
            file_path=tmp_path, # FIX: Populate file_path
            s3_key="pending", 
            file_size=os.path.getsize(tmp_path),
            file_size_mb=os.path.getsize(tmp_path) / (1024 * 1024),
            upload_status="confirmed", # Changed from 'draft' or 'pending' to 'confirmed'
            processing_stage="queued", # Changed from 'draft' to 'queued'
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
        background_tasks.add_task(process_upload_task, new_file.file_id, tmp_path, file.filename, current_user.user_id, current_user.hospital_id, compression_level)
        
        # PROACTIVE FIX: We want it confirmed immediately.
        # The frontend expects a 'processing' status or 'success'
        return {
            "status": "processing",
            "file_id": new_file.file_id,
            "message": "Upload accepted and confirmed, processing in background."
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        # Using 422 Unprocessable Entity to ensure the error message passes through Nginx
        # (Nginx often intercepts 500 errors and shows a generic HTML page)
        raise HTTPException(status_code=422, detail=f"Upload Error: {str(e)}")

@router.post("/{patient_id}/files/{file_id}/confirm")
def confirm_upload(patient_id: int, file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Backward compatibility endpoint. 
    Since we now confirm immediately on upload, this just returns success.
    """
    return {"status": "success", "message": "File already confirmed during upload."}

@router.post("/{patient_id}/files/{file_id}/run-ocr")
def trigger_manual_ocr(
    patient_id: int, 
    file_id: int, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually trigger the OCR & AI extraction for a specific file.
    """
    db_file = db.query(PDFFile).filter(PDFFile.file_id == file_id, PDFFile.record_id == patient_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
        
    # Check permissions
    is_platform = current_user.role in ["superadmin", "superadmin_staff"]
    if not is_platform and db_file.patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if db_file.upload_status != "confirmed":
        raise HTTPException(status_code=400, detail="File must be 'confirmed' (uploaded/saved) before running AI.")
        
    if db_file.processing_stage in ["analyzing"]:
        raise HTTPException(status_code=400, detail="AI Processing is already running for this file.")

    # Reset AI associated data to re-run
    db_file.ocr_text = None
    db_file.is_searchable = False
    db_file.processing_stage = "analyzing"
    db_file.processing_progress = 0
    
    # Optionally delete old extractions
    from ..models import AIExtraction
    db.query(AIExtraction).filter(AIExtraction.file_id == file_id).delete()
    
    db.commit()
    
    background_tasks.add_task(run_manual_ocr_task, file_id)
    
    return {"message": "AI/OCR Processing explicitly started in background.", "status": "analyzing"}

@router.get("/search/", response_model=List[dict])
def search_files(q: str, hospital_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Search in Filename OR OCR Text (case insensitive)
    # If Website role, search across all or filter by provided hospital_id. If Hospital role, filter by hospital.
    is_platform = current_user.role in ["superadmin", "superadmin_staff"]
    
    query_obj = db.query(PDFFile).join(Patient)
    if not is_platform:
        query_obj = query_obj.filter(Patient.hospital_id == current_user.hospital_id)
    elif hospital_id:
        query_obj = query_obj.filter(Patient.hospital_id == hospital_id)
        
    results = query_obj.filter(
        or_(
            PDFFile.filename.ilike(f"%{q}%"),
            PDFFile.ocr_text.ilike(f"%{q}%"),
            PDFFile.tags.ilike(f"%{q}%")
        )
    ).all()
    
    # Audit Search (Optional - can be noisy)
    # try:
    #     from ..audit import log_audit
    #     log_audit(db, current_user.user_id, "SEARCH_FILES", f"Query: {q}", hospital_id=current_user.hospital_id)
    # except: pass
    
    # Filter Buffer: Only show 'confirmed' files OR 'draft' files if I am the owner (Not storing owner_id on file yet, assuming MRD sees all drafts for their hospital for now)
    # Actually, simpler: MRD sees ALL drafts for their hospital. Admins see ONLY confirmed.
    filtered_results = []
    for f in results:
        if f.upload_status == 'confirmed':
            filtered_results.append(f)
        elif current_user.role == UserRole.WAREHOUSE_MANAGER:
            # MRD can see drafts
            filtered_results.append(f)
            
    response_data = []
    for f in filtered_results:
        match_type = "Filename"
        ocr_snippet = None
        
        if f.ocr_text and q.lower() in f.ocr_text.lower():
            match_type = "Content"
            # Find snippet
            lower_text = f.ocr_text.lower()
            lower_q = q.lower()
            idx = lower_text.find(lower_q)
            
            if idx != -1:
                start_idx = max(0, idx - 40)
                end_idx = min(len(f.ocr_text), idx + len(q) + 40)
                
                # Extract original case substring
                prefix = f.ocr_text[start_idx:idx]
                match_str = f.ocr_text[idx:idx+len(q)]
                suffix = f.ocr_text[idx+len(q):end_idx]
                
                # Add ellipsis if truncated
                prefix_el = "..." if start_idx > 0 else ""
                suffix_el = "..." if end_idx < len(f.ocr_text) else ""
                
                ocr_snippet = f"{prefix_el}{prefix}<mark>{match_str}</mark>{suffix}{suffix_el}"
        elif f.tags and q.lower() in f.tags.lower():
            match_type = "Tags"
            
        response_data.append({
            "file_id": f.file_id,
            "filename": f.filename,
            "patient_name": f.patient.full_name,
            "patient_id": f.patient.record_id, # Added so frontend can route to it
            "match_type": match_type,
            "upload_status": f.upload_status,
            "ocr_snippet": ocr_snippet
        })

    return response_data

@router.get("/next-id")
def get_next_uhid(hospital_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target_hospital_id = current_user.hospital_id

    if current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]:
        if hospital_id:
            target_hospital_id = hospital_id
    
    if not target_hospital_id:
        raise HTTPException(status_code=400, detail="Hospital Context Required")

    hospital = db.query(Hospital).filter(Hospital.hospital_id == target_hospital_id).first()
    id_settings = hospital.id_generation_settings or {} if hospital else {}
    
    conf_prefix = id_settings.get("uhid_prefix", "")
    conf_postfix = id_settings.get("uhid_postfix", "")
    conf_padding = int(id_settings.get("uhid_padding", 4))

    # Fetch all UHIDs for this hospital to find max
    patients = db.query(Patient.uhid).filter(Patient.hospital_id == target_hospital_id).all()
    
    max_val = 0
    prefix = conf_prefix or "DF-" 
    
    import re
    
    for p in patients:
        uid = p.uhid
        if not uid: continue
        # Extract number from string
        numbers = re.findall(r'\d+', uid)
        if numbers:
            num_part = int(numbers[-1])
            if num_part > max_val:
                max_val = num_part

    # If no patients, start at 1
    next_val = max_val + 1
        
    padded = str(next_val).zfill(conf_padding)
    return {"next_id": f"{conf_prefix or prefix}{padded}{conf_postfix}"}

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
    start_date: Optional[datetime.date] = None,
    end_date: Optional[datetime.date] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    is_platform = current_user.role in ["superadmin", "superadmin_staff"]
    is_doctor = current_user.role in ["doctor_opd", "doctor_ipd"]
    
    query = db.query(Patient).options(joinedload(Patient.files), joinedload(Patient.box)).filter(Patient.is_deleted == False)
    
    if unassigned_only:
        query = query.filter(Patient.physical_box_id == None)

    if not is_platform:
        # Standard Staff: RESTRICT to their own hospital
        query = query.filter(Patient.hospital_id == current_user.hospital_id)
        
        # Doctor check: Only see assigned patients
        if is_doctor:
            from ..models import PatientDoctorAssignment, DoctorProfile
            # Find the doctor profile for this user
            doctor_profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.user_id).first()
            if doctor_profile:
                query = query.join(PatientDoctorAssignment).filter(PatientDoctorAssignment.doctor_profile_id == doctor_profile.profile_id)
            else:
                # If they have no profile, they see no patients
                query = query.filter(Patient.record_id == -1)
    else:
        # Platform Staff:
        # If hospital_id is provided, filter by it.
        # If NOT provided, return ALL (or maybe we should force selection for performance? logic below allows all)
        if hospital_id:
            query = query.filter(Patient.hospital_id == hospital_id)
    
    # Apply Date Filtering
    if start_date:
        query = query.filter(or_(cast(Patient.discharge_date, Date) >= start_date, cast(Patient.admission_date, Date) >= start_date))
    if end_date:
        query = query.filter(or_(cast(Patient.discharge_date, Date) <= end_date, cast(Patient.admission_date, Date) <= end_date))

    if q:
        query = query.filter(
            or_(
                Patient.full_name.ilike(f"%{q}%"),
                Patient.patient_u_id.ilike(f"%{q}%"),
                Patient.contact_number.ilike(f"%{q}%"),
                Patient.uhid.ilike(f"%{q}%")
            )
        )
    
    patients = query.all()
    for p in patients:
        p.hospital_name = p.hospital.legal_name if p.hospital else "Unknown"
        # Accessing properties to ensures they are populated for Pydantic if needed
        # (Though Pydantic's from_attributes handles it)
        _ = p.box_label
        _ = p.box_location_code
        
    return patients

@router.get("/{patient_id}", response_model=PatientDetailResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    is_platform = current_user.role in ["superadmin", "superadmin_staff"]
    is_doctor = current_user.role in ["doctor_opd", "doctor_ipd"]
    
    query = db.query(Patient).options(joinedload(Patient.files), joinedload(Patient.box)).filter(Patient.record_id == patient_id, Patient.is_deleted == False)
    if not is_platform:
        query = query.filter(Patient.hospital_id == current_user.hospital_id)
        if is_doctor:
            from ..models import PatientDoctorAssignment, DoctorProfile
            doctor_profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.user_id).first()
            if doctor_profile:
                query = query.join(PatientDoctorAssignment).filter(PatientDoctorAssignment.doctor_profile_id == doctor_profile.profile_id)
            else:
                query = query.filter(Patient.record_id == -1)
    
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

    patient.hospital_name = patient.hospital.legal_name if patient.hospital else "Unknown"
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
    patient = db.query(Patient).filter(Patient.uhid == uhid_no, Patient.is_deleted == False).order_by(Patient.created_at.desc()).first()
    
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
    
    background_tasks.add_task(run_manual_ocr_task, file_id)
    
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

@router.post("/extract-details")
async def extract_patient_details_from_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Extracts structured patient data from an uploaded document using dynamic API key.
    """
    try:
        # Determine AI API Key
        api_key = None
        is_enabled = False
        
        # Check Hospital first
        if current_user.hospital_id:
            from ..models import Hospital
            hosp = db.query(Hospital).filter(Hospital.hospital_id == current_user.hospital_id).first()
            if hosp and hosp.ai_settings:
                ai_config = hosp.ai_settings
                api_key = ai_config.get("api_key")
                is_enabled = ai_config.get("enabled", False)
                
        # Check Platform Fallback
        if not is_enabled or not api_key:
            from ..models import SystemSetting
            platform_ai = db.query(SystemSetting).filter(SystemSetting.key == "platform_ai_settings").first()
            if platform_ai and platform_ai.value:
                import json
                try:
                    plat_cfg = json.loads(platform_ai.value)
                    if plat_cfg.get("enabled"):
                        api_key = plat_cfg.get("api_key")
                        is_enabled = True
                except: pass

        if not is_enabled or not api_key:
            raise HTTPException(status_code=403, detail="AI Extraction is disabled or API Key is missing. Please configure it in Settings.")

        from ..services.ai_service import AIService
        ai_service = AIService(api_key=api_key)

        content = await file.read()
        filename = file.filename.lower()
        extracted_text = ""
        extracted_json = None

        if filename.endswith(".pdf"):
            extracted_text = extract_text_from_pdf(content)
            if not extracted_text:
                raise HTTPException(status_code=400, detail="No text found in document.")
            extracted_json = ai_service.extract_patient_details(extracted_text)
        elif filename.endswith((".png", ".jpg", ".jpeg", ".webp")):
            mime_type = file.content_type or "image/jpeg"
            extracted_json = ai_service.extract_patient_details_from_image(content, mime_type)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format.")

        if not extracted_json:
            raise HTTPException(status_code=500, detail="AI extraction failed.")

        return extracted_json
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.info(f"[ERROR] Extraction API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
    
    # Check if the file is stuck in draft/ or drafts/ prefix in S3 and migrate it
    if "draft/" in s3_key or "drafts/" in s3_key or "draft_backup/" in s3_key:
        success, msg = StorageService.migrate_s3_draft_to_final(db, file_id)
        if not success:
            f.upload_status = 'confirmed'
            db.commit()
            return {"status": "partial", "message": f"Confirmed, but migration error: {msg}"}
        
        try:
            from ..audit import log_audit
            log_audit(db, current_user.user_id, "FILE_CONFIRMED", f"Confirmed (S3 Move): {f.filename}", hospital_id=current_user.hospital_id)
            db.commit()
        except: pass

        return {"status": "success", "message": "File confirmed and moved to final storage. OCR is running in background."}


    # Case 3: Already in final storage
    from ..audit import log_audit
    log_audit(db, current_user.user_id, "FILE_CONFIRMED", f"Confirmed: {f.filename}", hospital_id=current_user.hospital_id)
    
    f.upload_status = 'confirmed'
    f.processing_stage = 'completed' # Explicitly set to completed as OCR is skipped
    db.commit()
    # background_tasks.add_task(run_manual_ocr_task, file_id) # Temporarily disabled automatic OCR

    return {"status": "success", "message": "File confirmed and published. (Automatic OCR is currently disabled)."}

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
    try:
        from ..audit import log_audit
        log_audit(db, current_user.user_id, "FILE_DRAFT_DISCARDED", f"Discarded draft: {filename}", hospital_id=current_user.hospital_id)
    except: pass
    
    db.delete(f)
    db.commit()

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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Decrypt and stream file to browser using disk-based buffering for memory efficiency.
    Requires standard Authorization header with Bearer token.
    """
    import tempfile
    from fastapi.responses import FileResponse
    
    is_platform = current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]
    
    query = db.query(PDFFile).join(Patient).filter(PDFFile.file_id == file_id)
    if not is_platform:
        query = query.filter(Patient.hospital_id == current_user.hospital_id)
        
    pdf_file = query.first()
    if not pdf_file:
         raise HTTPException(status_code=404, detail="File not found")
    
    # Audit Log
    try:
        from ..audit import log_audit
        log_audit(db, current_user.user_id, "VIEW_DOCUMENT", f"Viewed file: {pdf_file.filename}", hospital_id=current_user.hospital_id)
    except Exception as e:
        logger.info(f"Audit log failed: {e}")

    s3_manager = S3Manager()
    
    # Check if file is in Glacier
    obj_info = s3_manager.get_object_info(pdf_file.s3_key)
    if obj_info and obj_info.get("IsGlacier"):
        restore_status = obj_info.get("Restore", "")
        if not restore_status or 'ongoing-request="true"' in restore_status:
            raise HTTPException(
                status_code=403, 
                detail="This file is archived in Glacier (Cold Storage). Please request 'Retrieval' to view it."
            )

    # DISK-BASED SERVING TO PREVENT OOM
    # Create temp files for handling large encryption blobs
    temp_dir = tempfile.gettempdir()
    encrypted_temp_path = os.path.join(temp_dir, f"enc_{file_id}_{os.urandom(4).hex()}")
    decrypted_temp_path = os.path.join(temp_dir, f"dec_{file_id}_{pdf_file.filename}")

    try:
        # 1. Download to disk
        logger.info(f"[DOWNLOAD] Downloading {pdf_file.s3_key} to temp disk...")
        success = s3_manager.download_to_temp_cache(pdf_file.s3_key, encrypted_temp_path)
        if not success:
            raise HTTPException(status_code=404, detail="Physical file not found in storage")

        # 2. Decrypt from disk to disk
        logger.info(f"[DECRYPT] Decrypting {pdf_file.filename} (Disk-to-Disk)...")
        with open(encrypted_temp_path, 'rb') as f_enc:
            enc_data = f_enc.read()
            dec_data = decrypt_data(enc_data)
            with open(decrypted_temp_path, 'wb') as f_dec:
                f_dec.write(dec_data)
        
        # Cleanup encrypted temp immediately
        if os.path.exists(encrypted_temp_path):
            os.remove(encrypted_temp_path)

        # 3. Read into memory and stream ? avoids Windows FileResponse + background_tasks race
        with open(decrypted_temp_path, 'rb') as f:
            file_bytes = f.read()

        # Cleanup both temp files immediately after reading
        for p in [encrypted_temp_path, decrypted_temp_path]:
            try:
                if os.path.exists(p):
                    os.remove(p)
            except Exception:
                pass

        from fastapi.responses import Response as FastAPIResponse
        media_type = "application/pdf" if pdf_file.filename.lower().endswith(".pdf") else "application/octet-stream"
        return FastAPIResponse(
            content=file_bytes,
            media_type=media_type,
            headers={"Content-Disposition": f'inline; filename="{pdf_file.filename}"'}
        )

    except Exception as e:
        # Cleanup on failure
        for p in [encrypted_temp_path, decrypted_temp_path]:
            if os.path.exists(p):
                try: os.remove(p)
                except: pass
        import traceback
        err_detail = traceback.format_exc()
        logger.info(f"[ERROR] serve_file Error for {file_id}: {e}")
        logger.info(f"[ERROR] Traceback: {err_detail}")
        raise HTTPException(status_code=500, detail=f"Failed to serve file: {str(e)}")

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
        
    # Send immediate Initiation Email
    from ..services.email_service import EmailService
    EmailService.send_retrieval_initiated_email(
        email=current_user.email,
        patient_name=pdf_file.patient.full_name,
        filename=pdf_file.filename,
        hospital_name=pdf_file.patient.hospital.legal_name
    )

    # Trigger monitoring task (Passing requester's email for final delivery)
    background_tasks.add_task(monitor_restoration_and_email, file_id, current_user.email)
    
    return {
        "status": "success", 
        "message": f"Restoration ({tier}) initiated. Once complete, the file will be sent to {current_user.email}."
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
        # Check every 60s for 6 hours (Standard retrieval limit). 
        for _ in range(360): 
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
        db.rollback()
        logger.info(f"[ERROR] monitor_restoration error: {e}")
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
    logger.info(f"[DELETE] DELETE request for file_id: {file_id}")
    
    # Get the file
    db_file = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Authorization check
    patient = db.query(Patient).filter(Patient.record_id == db_file.record_id, Patient.is_deleted == False).first()
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
                logger.info(f"[OK] Deleted legacy local file: {location}")
            except Exception as e:
                logger.info(f"[WARN] Failed to delete local file: {e}")

        # Always try S3 deletion if key exists (Normal flow)
        if db_file.s3_key:
             s3_manager.delete_file(db_file.s3_key)

    except Exception as e:
        logger.info(f"[WARN] Failed to delete from storage: {e}")
    
    # Update storage usage
    file_size_mb = db_file.file_size_mb
    usage = db.query(BandwidthUsage).filter(
        BandwidthUsage.hospital_id == patient.hospital_id
    ).first()
    if usage:
        usage.used_mb = max(0, usage.used_mb - file_size_mb)
    
    # Delete from database
    # Delete from database
    db.delete(db_file)
    
    try:
        from ..audit import log_audit
        log_audit(db, current_user.user_id, "FILE_DELETED", f"Deleted file {file_id}", hospital_id=patient.hospital_id)
    except: pass
    
    db.commit()
    
    logger.info(f"[OK] File {file_id} deleted successfully")
    
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
    confirm_mlc_delete: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a patient and all associated files. MLC files require confirm_mlc_delete=True."""
    # Authorization
    is_platform = current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]
    
    # Eager load files to ensure we can clean them up
    patient = db.query(Patient).options(joinedload(Patient.files)).filter(Patient.record_id == patient_id, Patient.is_deleted == False).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if not is_platform and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # MLC Safeguard: Cannot delete MLC files without explicit confirmation
    if patient.patient_category == "MLC" and not confirm_mlc_delete:
        raise HTTPException(
            status_code=400, 
            detail="CRITICAL: This is a Medico-Legal Case (MLC) record. Deletion is restricted. "
                   "If you are certain, please provide the 'confirm_mlc_delete' confirmation."
        )

    try:
        # DB Deletion (Soft Delete to preserve relational integrity and move to recycle bin)
        from sqlalchemy.sql import func
        patient.is_deleted = True
        patient.deleted_at = func.now()
        
        from ..audit import log_audit
        audit_msg = f"Moved patient to recycle bin: {patient.full_name} (MRD: {patient.patient_u_id})"
        if patient.patient_category == "MLC":
            audit_msg = f"CRITICAL ACTION: {audit_msg} [MLC REMOVAL]"
            
        log_audit(db, current_user.user_id, "PATIENT_SOFT_DELETED", audit_msg, hospital_id=current_user.hospital_id)
        
        db.commit()
    except Exception as e:
        db.rollback()
        logger.info(f"Delete Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete patient.")

    return {"status": "success", "message": "Patient moved to recycle bin successfully"}

@router.post("/files/{file_id}/request-download")
def request_file_download(
    request: Request,
    file_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    SuperAdmin: Immediate direct download link.
    Hospital User: Email delivery as attachment (From info@), limit 5 per lifetime.
    """
    pdf_file = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
    if not pdf_file:
        raise HTTPException(status_code=404, detail="File not found")
        
    # Check permissions
    is_platform = current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]
    if not is_platform and pdf_file.patient.hospital_id != current_user.hospital_id:
         raise HTTPException(status_code=403, detail="Not authorized")

    # Case 1: SuperAdmin / Platform Staff -> Direct Download URL
    if is_platform:
        from ..core.config import settings
        # Extract token from Authorization header to pass it to the direct link
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.replace('Bearer ', '') if 'Bearer ' in auth_header else None
        
        base_url = f"{settings.BACKEND_URL}/patients/files/{file_id}/serve"
        url = f"{base_url}?token={token}" if token else base_url
        
        # Audit Log
        try:
            from ..audit import log_audit
            log_audit(db, current_user.user_id, "FILE_LINK_GENERATED", f"Generated direct link for {pdf_file.filename}", hospital_id=pdf_file.patient.hospital_id)
            db.commit()
        except: pass

        return {
            "status": "direct",
            "message": "Authorized for direct download.",
            "url": url
        }

    # Case 2: Hospital User (MRD/Staff) -> Email Delivery
    # Enforce 5-request lifetime limit
    if pdf_file.download_request_count is None:
        pdf_file.download_request_count = 0
        
    if pdf_file.download_request_count >= 5:
        raise HTTPException(
            status_code=403, 
            detail="Security Limit: Download requests for this file have reached the maximum limit of 5. Please contact support."
        )

    # Prepare Audit & delivery info
    hospital = pdf_file.patient.hospital
    admin_email = hospital.email
    client_ip = request.client.host if request.client else "Unknown"
    
    # Fetch and Decrypt File for Attachment
    s3_manager = S3Manager()
    encrypted_bytes = s3_manager.get_file_bytes(pdf_file.s3_key)
    if not encrypted_bytes:
        raise HTTPException(status_code=404, detail="Physical file not found in storage")
        
    try:
        decrypted_bytes = decrypt_data(encrypted_bytes)
    except Exception as e:
        logger.info(f"Decryption failed for delivery: {e}")
        raise HTTPException(status_code=500, detail="Secure processing failed for document delivery")

    # Send Secure Email
    success = EmailService.send_download_delivery_email(
        recipient_email=current_user.email,
        admin_email=admin_email,
        hospital_name=hospital.legal_name,
        patient_name=pdf_file.patient.full_name,
        mrd_id=pdf_file.patient.patient_u_id,
        filename=pdf_file.filename,
        requester_name=current_user.full_name,
        ip_address=client_ip,
        file_content=decrypted_bytes
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to deliver file via secure email.")
    
    # Increment count and commit (Lifetime Tracking)
    pdf_file.download_request_count += 1
    db.commit()
    
    remaining = 5 - pdf_file.download_request_count
    
    # Audit Log
    try:
        from ..audit import log_audit
        log_audit(db, current_user.user_id, "FILE_EMAILED", f"Emailed file {pdf_file.filename} to {current_user.email}", hospital_id=hospital.hospital_id)
        db.commit() # Ensure log is saved even if return happens
    except Exception as e:
        logger.info(f"Audit log error: {e}")

    return {
        "status": "email_delivered", 
        "message": f"Medical record delivered successfully to {current_user.email}. Hospital admin ({admin_email}) CC'd.",
        "remaining_requests": remaining
    }


class AssignDoctorRequest(BaseModel):
    profile_id: int

@router.post("/{patient_id}/assign-doctor")
def assign_doctor(patient_id: int, request: AssignDoctorRequest, db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.MANAGE_PATIENTS))):
    patient = db.query(Patient).filter(Patient.record_id == patient_id, Patient.hospital_id == current_user.hospital_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    from ..models import DoctorProfile, PatientDoctorAssignment
    doctor = db.query(DoctorProfile).filter(DoctorProfile.profile_id == request.profile_id, DoctorProfile.hospital_id == current_user.hospital_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    existing = db.query(PatientDoctorAssignment).filter(
        PatientDoctorAssignment.patient_id == patient_id,
        PatientDoctorAssignment.doctor_profile_id == request.profile_id
    ).first()
    
    if existing:
        return {"message": "Doctor already assigned"}
        
    assignment = PatientDoctorAssignment(patient_id=patient_id, doctor_profile_id=request.profile_id)
    db.add(assignment)
    db.commit()
    return {"message": "Doctor assigned successfully"}

@router.delete("/{patient_id}/unassign-doctor/{profile_id}")
def unassign_doctor(patient_id: int, profile_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_permission(Permission.MANAGE_PATIENTS))):
    from ..models import PatientDoctorAssignment
    # Check patient access implicitly
    patient = db.query(Patient).filter(Patient.record_id == patient_id, Patient.hospital_id == current_user.hospital_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    assignment = db.query(PatientDoctorAssignment).filter(
        PatientDoctorAssignment.patient_id == patient_id,
        PatientDoctorAssignment.doctor_profile_id == profile_id
    ).first()
    
    if assignment:
        db.delete(assignment)
        db.commit()
        return {"message": "Doctor unassigned successfully"}
    return {"message": "Doctor not assigned"}


# ==========================================
# RECYCLE BIN ENDPOINTS
# ==========================================

@router.get("/recycle-bin/list")
def get_recycled_patients(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Get list of soft-deleted patients (Recycle Bin)"""
    is_platform = current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]
    query = db.query(Patient).filter(Patient.is_deleted == True)
    
    if not is_platform:
        query = query.filter(Patient.hospital_id == current_user.hospital_id)
        
    recycled = query.all()
    
    result = []
    for p in recycled:
        days_left = 90
        if p.deleted_at:
            from datetime import datetime, timezone
            delta = datetime.now(timezone.utc) - p.deleted_at
            days_left = max(0, 90 - delta.days)
            
        result.append({
            "record_id": p.record_id,
            "patient_u_id": p.patient_u_id,
            "uhid": p.uhid,
            "full_name": p.full_name,
            "deleted_at": p.deleted_at,
            "days_until_permanent_deletion": days_left
        })
        
    return result

@router.post("/{patient_id}/restore")
def restore_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Restore a patient from the recycle bin"""
    is_platform = current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]
    patient = db.query(Patient).filter(Patient.record_id == patient_id, Patient.is_deleted == True).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found in recycle bin")
        
    if not is_platform and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    patient.is_deleted = False
    patient.deleted_at = None
    
    from ..audit import log_audit
    log_audit(db, current_user.user_id, "PATIENT_RESTORED", f"Restored patient: {patient.full_name}", hospital_id=current_user.hospital_id)
    
    db.commit()
    return {"message": "Patient restored successfully"}

@router.delete("/{patient_id}/permanent")
def delete_patient_permanently(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Permanently delete a patient and their files (S3 & Local). SuperAdmin or authorized staff."""
    is_platform = current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]
    # We require the user to have permission to delete, even if it's in the bin
    patient = db.query(Patient).options(joinedload(Patient.files)).filter(Patient.record_id == patient_id, Patient.is_deleted == True).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found in recycle bin")
        
    if not is_platform and patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        # Clean up S3 Files physically
        from ..services.s3_handler import S3Manager
        import os
        s3_manager = S3Manager()
        files_deleted_count = 0
        
        if patient.files:
            for f in patient.files:
                if f.s3_key:
                    s3_manager.delete_file(f.s3_key)
                    if f.storage_path and f.storage_path != f.s3_key and os.path.isabs(f.storage_path):
                         try:
                             if os.path.exists(f.storage_path): os.remove(f.storage_path)
                         except: pass
                    files_deleted_count += 1
        
        logger.info(f"[PERMANENT DELETE] Removed {files_deleted_count} S3 files for patient {patient_id}")
        
        # Manual Cascade Delete to avoid ForeignKeyViolations
        from sqlalchemy import text
        tables_to_nullify = {
            "operation_theaters": "current_patient_id",
            "medical_equipments": "current_patient_id",
            "rfid_cards": "patient_id",
            "inventory_logs": "patient_id"
        }
        for t, col in tables_to_nullify.items():
            db.execute(text(f"UPDATE {t} SET {col} = NULL WHERE {col} = :pid"), {"pid": patient_id})
            
        # Delete sub-items that don't have patient_id directly but link to tables that do
        sub_tables_to_delete = [
            "DELETE FROM patient_invoice_items WHERE invoice_id IN (SELECT invoice_id FROM patient_invoices WHERE patient_id = :pid)",
            "DELETE FROM prescriptions WHERE visit_id IN (SELECT visit_id FROM opd_visits WHERE patient_id = :pid)",
            "DELETE FROM dental_treatment_phases WHERE plan_id IN (SELECT plan_id FROM dental_treatment_plans WHERE patient_id = :pid)",
            "DELETE FROM dental_treatment_phases WHERE treatment_id IN (SELECT treatment_id FROM dental_treatments WHERE patient_id = :pid)",
            "DELETE FROM periodontal_measurements WHERE exam_id IN (SELECT exam_id FROM periodontal_exams WHERE patient_id = :pid)"
        ]
        for query in sub_tables_to_delete:
            db.execute(text(query), {"pid": patient_id})
            
        tables_to_delete = {
            "pdf_files": "record_id",
            "patient_diagnoses": "record_id",
            "patient_procedures": "record_id",
            "dental_patients": "main_patient_id",
            "dental_appointments": "patient_id",
            "dental_3d_scans": "patient_id",
            "dental_treatment_plans": "patient_id",
            "periodontal_exams": "patient_id",
            "ortho_records": "patient_id",
            "communication_logs": "patient_id",
            "ent_patients": "patient_id",
            "audiometry_tests": "patient_id",
            "ent_examinations": "patient_id",
            "ent_surgeries": "patient_id",
            "opd_patients": "patient_id",
            "opd_visits": "patient_id",
            "appointments": "patient_id",
            "insurance_claims": "patient_id",
            "dental_lab_orders": "patient_id",
            "ipd_admissions": "patient_id",
            "dental_treatments": "patient_id",
            "patient_invoices": "patient_id",
            "patient_doctor_assignments": "patient_id",
            "qa_issues": "record_id"
        }
        for t, col in tables_to_delete.items():
            db.execute(text(f"DELETE FROM {t} WHERE {col} = :pid"), {"pid": patient_id})
        s3_manager = S3Manager()
        files_deleted_count = 0
        
        if patient.files:
            for f in patient.files:
                if f.s3_key:
                    s3_manager.delete_file(f.s3_key)
                    if f.storage_path and f.storage_path != f.s3_key and os.path.isabs(f.storage_path):
                         try:
                             if os.path.exists(f.storage_path): os.remove(f.storage_path)
                         except: pass
                    files_deleted_count += 1
        
        logger.info(f"[PERMANENT DELETE] Removed {files_deleted_count} S3 files for patient {patient_id}")
        
        from ..audit import log_audit
        log_audit(db, current_user.user_id, "PATIENT_PERMANENTLY_DELETED", f"Permanently deleted patient: {patient.full_name}", hospital_id=current_user.hospital_id)
        
        db.delete(patient)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Permanent Delete Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to permanently delete patient.")
        
    return {"message": "Patient permanently deleted"}

@router.post("/recycle-bin/cleanup")
def cleanup_recycle_bin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Automatically delete patients older than 90 days in the recycle bin."""
    # Only platform admins can run this system-wide cleanup, or it cleans up for the hospital
    is_platform = current_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF]
    
    from datetime import datetime, timedelta, timezone
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=90)
    
    query = db.query(Patient).filter(
        Patient.is_deleted == True,
        Patient.deleted_at <= cutoff_date
    )
    
    if not is_platform:
        query = query.filter(Patient.hospital_id == current_user.hospital_id)
        
    patients_to_delete = query.all()
    deleted_count = 0
    
    from ..services.s3_handler import S3Manager
    import os
    s3_manager = S3Manager()
    
    for patient in patients_to_delete:
        try:
            # Eager load files or just query them
            files = db.query(PDFFile).filter(PDFFile.patient_id == patient.record_id).all()
            for f in files:
                if f.s3_key:
                    s3_manager.delete_file(f.s3_key)
                    if f.storage_path and f.storage_path != f.s3_key and os.path.isabs(f.storage_path):
                         try:
                             if os.path.exists(f.storage_path): os.remove(f.storage_path)
                         except: pass
            
            # Manual Cascade Delete to avoid ForeignKeyViolations
            from sqlalchemy import text
            tables_to_nullify = {
                "operation_theaters": "current_patient_id",
                "medical_equipments": "current_patient_id",
                "rfid_cards": "patient_id",
                "inventory_logs": "patient_id"
            }
            for t, col in tables_to_nullify.items():
                db.execute(text(f"UPDATE {t} SET {col} = NULL WHERE {col} = :pid"), {"pid": patient.record_id})
                
            sub_tables_to_delete = [
                "DELETE FROM patient_invoice_items WHERE invoice_id IN (SELECT invoice_id FROM patient_invoices WHERE patient_id = :pid)",
                "DELETE FROM prescriptions WHERE visit_id IN (SELECT visit_id FROM opd_visits WHERE patient_id = :pid)",
                "DELETE FROM dental_treatment_phases WHERE plan_id IN (SELECT plan_id FROM dental_treatment_plans WHERE patient_id = :pid)",
                "DELETE FROM dental_treatment_phases WHERE treatment_id IN (SELECT treatment_id FROM dental_treatments WHERE patient_id = :pid)",
                "DELETE FROM periodontal_measurements WHERE exam_id IN (SELECT exam_id FROM periodontal_exams WHERE patient_id = :pid)"
            ]
            for query in sub_tables_to_delete:
                db.execute(text(query), {"pid": patient.record_id})
                
            tables_to_delete = {
                "pdf_files": "record_id",
                "patient_diagnoses": "record_id",
                "patient_procedures": "record_id",
                "dental_patients": "main_patient_id",
                "dental_appointments": "patient_id",
                "dental_3d_scans": "patient_id",
                "dental_treatment_plans": "patient_id",
                "periodontal_exams": "patient_id",
                "ortho_records": "patient_id",
                "communication_logs": "patient_id",
                "ent_patients": "patient_id",
                "audiometry_tests": "patient_id",
                "ent_examinations": "patient_id",
                "ent_surgeries": "patient_id",
                "opd_patients": "patient_id",
                "opd_visits": "patient_id",
                "appointments": "patient_id",
                "insurance_claims": "patient_id",
                "dental_lab_orders": "patient_id",
                "ipd_admissions": "patient_id",
                "dental_treatments": "patient_id",
                "patient_invoices": "patient_id",
                "patient_doctor_assignments": "patient_id",
                "qa_issues": "record_id"
            }
            for t, col in tables_to_delete.items():
                db.execute(text(f"DELETE FROM {t} WHERE {col} = :pid"), {"pid": patient.record_id})

            db.delete(patient)
            deleted_count += 1
        except Exception as e:
            logger.error(f"Error auto-deleting patient {patient.record_id}: {e}")
            
    db.commit()
    
    from ..audit import log_audit
    log_audit(db, current_user.user_id, "RECYCLE_BIN_CLEANUP", f"Auto-deleted {deleted_count} patients older than 90 days.", hospital_id=current_user.hospital_id)
    
    return {"message": f"Successfully cleaned up {deleted_count} patients"}
