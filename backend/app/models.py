import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "website_admin"
    PLATFORM_STAFF = "website_staff"
    HOSPITAL_ADMIN = "hospital_admin"
    MRD_STAFF = "mrd_staff"
    DATA_UPLOADER = "data_uploader"

class Hospital(Base):
    __tablename__ = "hospitals"

    hospital_id = Column(Integer, primary_key=True, index=True)
    legal_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False) # Contact Email
    hashed_password = Column(String, nullable=True) # Legacy/Not used for Auth
    subscription_tier = Column(String, default="Standard")
    hospital_type = Column(String, default="Private") # Government, Private, Teaching, etc.
    is_active = Column(Boolean, default=True)
    
    # Profile Details (Post-Registration, Optional)
    director_name = Column(String, nullable=True)
    registration_number = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    
    # Billing Configuration (INR)
    price_per_file = Column(Float, default=100.0) # Base price per file
    included_pages = Column(Integer, default=20) # Pages included in base price
    price_per_extra_page = Column(Float, default=1.0) # Charge per page above limit
    
    # Stores JSON string of changes pending approval
    pending_updates = Column(String, nullable=True)

    last_sync_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patients = relationship("Patient", back_populates="hospital")
    bandwidth_usage = relationship("BandwidthUsage", back_populates="hospital")
    users = relationship("User", back_populates="hospital")

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    plain_password = Column(String, nullable=True) # FOR DEMO VISIBILITY ONLY
    role = Column(String) # UserRole value
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=True) # Null for Super Admin
    
    last_active_at = Column(DateTime, nullable=True)
    current_session_id = Column(String, nullable=True) # For preventing multiple device logins
    force_password_change = Column(Boolean, default=False)
    
    # Account Lockout Fields
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    hospital = relationship("Hospital", back_populates="users")

class Patient(Base):
    __tablename__ = "patients"

    record_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"))
    patient_u_id = Column(String, index=True, nullable=False) # MRD ID (Unique per Hospital)
    uhid = Column(String, index=True, nullable=True) # Patient Permanent ID
    full_name = Column(String)
    dob = Column(DateTime, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    address = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)
    email_id = Column(String, nullable=True)
    aadhaar_number = Column(String, nullable=True) # New Field
    discharge_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    hospital = relationship("Hospital", back_populates="patients")
    files = relationship("PDFFile", back_populates="patient")
    physical_box_id = Column(Integer, ForeignKey("physical_boxes.box_id"), nullable=True)
    box = relationship("PhysicalBox", back_populates="patients")

    __table_args__ = (UniqueConstraint('hospital_id', 'patient_u_id', name='_hospital_mrd_uc'),)

    @property
    def box_label(self):
        return self.box.label if self.box else None

    @property
    def box_location_code(self):
        return self.box.location_code if self.box else None

    @property
    def price_per_file(self):
        return self.hospital.price_per_file if self.hospital else 100.0

    @property
    def included_pages(self):
        return self.hospital.included_pages if self.hospital else 20

    @property
    def price_per_extra_page(self):
        return self.hospital.price_per_extra_page if self.hospital else 1.0

class PDFFile(Base):
    __tablename__ = "pdf_files"

    file_id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("patients.record_id"))
    s3_key = Column(String, nullable=False)
    file_size = Column(Integer) # In bytes
    page_count = Column(Integer, default=0) # Total pages in PDF
    filename = Column(String) # Original filename
    storage_path = Column(String) # S3 Key or Local Path
    ocr_text = Column(String, nullable=True) # Extracted text content
    tags = Column(String, nullable=True) # Manual keywords (comma separated)
    is_searchable = Column(Boolean, default=False)
    
    # Deletion Workflow: 'none' -> 'requested' -> 'hospital_approved' -> [DELETED]
    is_deletion_pending = Column(Boolean, default=False)
    deletion_step = Column(String, default="none")
    
    # Upload Workflow: 'draft' (MRD Buffer) -> 'confirmed' (Visible)
    upload_status = Column(String, default="confirmed")
    
    # Historical Billing (Captured at upload time)
    price_per_file = Column(Float, default=100.0)
    included_pages = Column(Integer, default=20)
    price_per_extra_page = Column(Float, default=1.0)
    
    # Progress Tracking
    processing_stage = Column(String, default="queued") # queued, compressing, encrypting, uploading, completed, failed
    processing_progress = Column(Integer, default=0) # 0-100
    
    upload_date = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="files")
    temp_access = relationship("TempAccessCache", back_populates="file")

    @property
    def file_size_mb(self):
        if self.file_size:
            return float(self.file_size) / (1024 * 1024)
        return 0.0

class TempAccessCache(Base):
    __tablename__ = "temp_access_cache"

    access_id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("pdf_files.file_id"))
    local_path = Column(String)
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    expiry_timestamp = Column(DateTime(timezone=True), nullable=False)

    file = relationship("PDFFile", back_populates="temp_access")

class BandwidthUsage(Base):
    __tablename__ = "bandwidth_usage"

    usage_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"))
    month_year = Column(String, nullable=False) # e.g. "2024-01"
    used_mb = Column(Float, default=0.0)
    quota_limit_mb = Column(Float, default=1000.0)

    hospital = relationship("Hospital", back_populates="bandwidth_usage")
    
    __table_args__ = (UniqueConstraint('hospital_id', 'month_year', name='_hospital_month_uc'),)

class PhysicalBox(Base):
    __tablename__ = "physical_boxes"

    box_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"))
    label = Column(String, unique=True, index=True) # e.g. "BOX-2024-A001"
    location_code = Column(String) # e.g. "WH-1-RACK-4-SHELF-2"
    status = Column(String, default="In Storage") # In Storage, Checked Out, Destroyed
    capacity = Column(Integer, default=50) # Average 50 files per box (User Request)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Link to Rack (Optional initially for backward compatibility)
    rack_id = Column(Integer, ForeignKey("physical_racks.rack_id"), nullable=True) 
    rack_row = Column(Integer, nullable=True) # Row position (1-indexed)
    rack_column = Column(Integer, nullable=True) # Column position (1-indexed)
    rack = relationship("PhysicalRack", back_populates="boxes")

    hospital = relationship("Hospital", back_populates="boxes")
    patients = relationship("Patient", back_populates="box")
    requests = relationship("FileRequest", back_populates="box")

class FileRequest(Base):
    __tablename__ = "file_requests"

    request_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"))
    box_id = Column(Integer, ForeignKey("physical_boxes.box_id"))
    requester_name = Column(String) # e.g. "Dr. Smith"
    status = Column(String, default="Pending") # Pending, In Transit, Delivered
    request_date = Column(DateTime(timezone=True), server_default=func.now())

    box = relationship("PhysicalBox", back_populates="requests")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=True)
    action = Column(String) # e.g. "FILE_UPLOADED", "FILE_DELETED"
    details = Column(String) 
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    hospital = relationship("Hospital")

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True) # e.g. "maintenance_mode", "announcement"
    value = Column(String)

# Add relationship back to Hospital (boxes was likely not in class)
Hospital.boxes = relationship("PhysicalBox", back_populates="hospital")

class PhysicalMovementLog(Base):
    __tablename__ = "physical_movement_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    box_id = Column(Integer, ForeignKey("physical_boxes.box_id"), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    action_type = Column(String) # CHECK-IN, CHECK-OUT
    uhid = Column(String) 
    patient_name = Column(String)
    destination = Column(String)
    status = Column(String, default="Success")
    
    box = relationship("PhysicalBox")

class QAIssue(Base):
    __tablename__ = "qa_issues"

    issue_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=True)
    filename = Column(String)
    issue_type = Column(String) # e.g. "Missing Page", "Blurry", "Corruption"
    details = Column(String)
    severity = Column(String, default="medium") # high, medium, low
    status = Column(String, default="open") # open, resolved, ignored
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    hospital = relationship("Hospital")


class PhysicalRack(Base):
    __tablename__ = "physical_racks"

    rack_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"))
    label = Column(String, index=True) # e.g. "Rack-A"
    aisle = Column(Integer) # 1, 2, 3...
    capacity = Column(Integer, default=100)
    
    # Grid Dimensions (Default 5x10 = 50)
    total_rows = Column(Integer, default=5)
    total_columns = Column(Integer, default=10)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    boxes = relationship("PhysicalBox", back_populates="rack")

    hospital = relationship("Hospital")
    boxes = relationship("PhysicalBox", back_populates="rack")



class ICD11Code(Base):
    __tablename__ = "icd11_codes"

    code = Column(String, primary_key=True, index=True)
    description = Column(String, nullable=False)
    chapter = Column(String, nullable=True)

class PatientDiagnosis(Base):
    __tablename__ = "patient_diagnoses"

    diagnosis_id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("patients.record_id"))
    code = Column(String, ForeignKey("icd11_codes.code"))
    notes = Column(String, nullable=True)
    diagnosed_at = Column(DateTime(timezone=True), server_default=func.now())
    diagnosed_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    patient = relationship("Patient", back_populates="diagnoses")
    icd_code = relationship("ICD11Code")
    doctor = relationship("User")


class ICD11ProcedureCode(Base):
    __tablename__ = "icd11_procedure_codes"

    code = Column(String, primary_key=True, index=True)
    description = Column(String, nullable=False)

class PatientProcedure(Base):
    __tablename__ = "patient_procedures"

    procedure_id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("patients.record_id"))
    code = Column(String, ForeignKey("icd11_procedure_codes.code"))
    notes = Column(String, nullable=True)
    performed_at = Column(DateTime(timezone=True), server_default=func.now())
    performed_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    patient = relationship("Patient", back_populates="procedures")
    procedure_code = relationship("ICD11ProcedureCode")
    doctor = relationship("User")

# Add relationship back to Patient
Patient.diagnoses = relationship("PatientDiagnosis", back_populates="patient")
Patient.procedures = relationship("PatientProcedure", back_populates="patient")


class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"

    otp_id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    otp_code = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


