import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "superadmin"
    PLATFORM_STAFF = "superadmin_staff"
    WAREHOUSE_MANAGER = "warehouse_manager"
    HOSPITAL_ADMIN = "hospital_admin"
    HOSPITAL_STAFF = "hospital_staff"

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
    
    # Advanced Billing
    registration_fee = Column(Float, default=1000.0)
    is_reg_fee_paid = Column(Boolean, default=False)
    gst_number = Column(String, nullable=True)
    
    # Banking Details
    bank_name = Column(String, nullable=True)
    bank_account_no = Column(String, nullable=True)
    bank_ifsc = Column(String, nullable=True)
    
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
    age = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    address = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)
    email_id = Column(String, nullable=True)
    aadhaar_number = Column(String, nullable=True) # New Field
    # Categories: STANDARD, MLC, BIRTH, DEATH
    patient_category = Column(String, default="STANDARD", index=True)
    admission_date = Column(DateTime, nullable=True)
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
    ocr_text = Column(Text, nullable=True) # Full extracted text
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

    # Payment Status
    is_paid = Column(Boolean, default=False)
    payment_date = Column(DateTime, nullable=True)
    
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
    
    # Auto-Naming Sequence Tracker
    last_box_seq = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    boxes = relationship("PhysicalBox", back_populates="rack")

    hospital = relationship("Hospital")

class PhysicalBox(Base):
    __tablename__ = "physical_boxes"

    box_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"))
    label = Column(String, unique=True, index=True) # e.g. "BOX-2024-A001"
    location_code = Column(String) # e.g. "WH-1-RACK-4-SHELF-2"
    status = Column(String, default="OPEN") # OPEN, CLOSED, ARCHIVED, DESTROYED
    is_open = Column(Boolean, default=True) # True = Accepting files
    capacity = Column(Integer, default=100) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Link to Rack
    rack_id = Column(Integer, ForeignKey("physical_racks.rack_id"), nullable=True) 
    rack_row = Column(Integer, nullable=True) # Row position (1-indexed)
    rack_column = Column(Integer, nullable=True) # Column position (1-indexed)
    rack = relationship("PhysicalRack", back_populates="boxes")

    hospital = relationship("Hospital", back_populates="boxes")
    patients = relationship("Patient", back_populates="box")
    requests = relationship("FileRequest", back_populates="box")



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


class Invoice(Base):
    __tablename__ = "invoices"

    invoice_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"))
    invoice_number = Column(String, unique=True, index=True, nullable=False) # e.g. INV-2026-0001
    total_amount = Column(Float, nullable=False)
    gst_rate = Column(Float, default=18.0) # 18% GST standard
    tax_amount = Column(Float, default=0.0)
    
    status = Column(String, default="PENDING") # PENDING, PAID, CANCELLED
    transaction_id = Column(String, nullable=True)
    payment_method = Column(String, nullable=True) # Cash, Bank Transfer, Online
    
    bill_date = Column(DateTime(timezone=True), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    payment_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    hospital = relationship("Hospital")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    item_id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.invoice_id"))
    file_id = Column(Integer, ForeignKey("pdf_files.file_id"), nullable=True)
    amount = Column(Float, nullable=False) # Taxable Value (Net after discount)
    discount = Column(Float, default=0.0) # Discount amount
    description = Column(String, nullable=True)
    hsn_code = Column(String, nullable=True) # HSN for products, SAC for services

    invoice = relationship("Invoice", back_populates="items")
    pdf_file = relationship("PDFFile") # Relationship to the specific file billed


class AccountingVendor(Base):
    __tablename__ = "accounting_vendors"
    vendor_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    contact_person = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    gst_number = Column(String, nullable=True)
    category = Column(String, nullable=True) # IT, HR, Operations, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AccountingExpense(Base):
    __tablename__ = "accounting_expenses"
    expense_id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0)
    category = Column(String, nullable=True) # Salary, Rent, Electricity, Server, etc.
    date = Column(DateTime(timezone=True), server_default=func.now())
    payment_method = Column(String, nullable=True) # Cash, Bank, UPI
    vendor_id = Column(Integer, ForeignKey("accounting_vendors.vendor_id"), nullable=True)
    reference_number = Column(String, nullable=True) # Invoice/Bill Number from Vendor
    
    vendor = relationship("AccountingVendor")

class AccountingTransaction(Base):
    """
    Unified Ledger Table: Stores every financial movement (Voucher).
    Follows double-entry concepts: 
    - Debit: Increase in Assets (Receivables) or Expenses.
    - Credit: Increase in Liabilities (Payables) or Revenue.
    """
    __tablename__ = "accounting_transactions"
    transaction_id = Column(Integer, primary_key=True, index=True)
    
    # Party linkage
    party_type = Column(String, nullable=False) # HOSPITAL, VENDOR, INTERNAL
    party_id = Column(Integer, nullable=True) # Link to hospital_id or vendor_id
    
    # Voucher details
    voucher_type = Column(String, nullable=False) # INVOICE, RECEIPT, PAYMENT, EXPENSE
    voucher_id = Column(Integer, nullable=True) # ID of the source Invoice or Expense record
    voucher_number = Column(String, index=True, nullable=True) # INV-..., EXP-...
    
    debit = Column(Float, default=0.0) # Positive for money due from Party
    credit = Column(Float, default=0.0) # Positive for money received/owing to Party
    
    description = Column(String, nullable=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AccountingConfig(Base):
    __tablename__ = "accounting_config"
    config_id = Column(Integer, primary_key=True, index=True)
    
    # Financial Year Settings
    current_fy = Column(String, default="2025-26") # e.g. 2025-26
    
    # Company Identity
    company_gst = Column(String, nullable=True)
    
    # Prefix Settings
    invoice_prefix = Column(String, default="INV")
    receipt_prefix = Column(String, default="RCPT")
    expense_prefix = Column(String, default="EXP")
    
    # Counters
    next_invoice_number = Column(Integer, default=1)
    next_receipt_number = Column(Integer, default=1)
    next_expense_number = Column(Integer, default=1)
    
    # Format choice (e.g. PREFIX/FY/NUMBER)
    number_format = Column(String, default="{prefix}/{fy}/{number:04d}")
    
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
