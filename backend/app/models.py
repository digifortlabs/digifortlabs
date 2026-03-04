import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
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
    WEBSITE_ADMIN = "website_admin"

class Permission(str, enum.Enum):
    # Platform
    MANAGE_HOSPITALS = "manage_hospitals"
    MANAGE_PLATFORM_SETTINGS = "manage_platform_settings"
    VIEW_ALL_AUDITS = "view_all_audits"
    
    # Hospital Admin
    MANAGE_HOSPITAL_USERS = "manage_hospital_users"
    MANAGE_HOSPITAL_SETTINGS = "manage_hospital_settings"
    VIEW_HOSPITAL_REPORTS = "view_hospital_reports"
    
    # Hospital Operations
    MANAGE_PATIENTS = "manage_patients"
    UPLOAD_RECORDS = "upload_records"
    VIEW_RECORDS = "view_records"
    DELETE_RECORDS = "delete_records"
    MANAGE_PHYSICAL_STORAGE = "manage_physical_storage"

ROLE_PERMISSIONS = {
    UserRole.SUPER_ADMIN: [p for p in Permission],
    UserRole.PLATFORM_STAFF: [
        Permission.MANAGE_HOSPITALS, Permission.VIEW_ALL_AUDITS,
        Permission.VIEW_RECORDS
    ],
    UserRole.WAREHOUSE_MANAGER: [
        Permission.MANAGE_PHYSICAL_STORAGE, Permission.VIEW_RECORDS
    ],
    UserRole.HOSPITAL_ADMIN: [
        Permission.MANAGE_HOSPITAL_USERS, Permission.MANAGE_HOSPITAL_SETTINGS,
        Permission.VIEW_HOSPITAL_REPORTS, Permission.MANAGE_PATIENTS,
        Permission.UPLOAD_RECORDS, Permission.VIEW_RECORDS, Permission.DELETE_RECORDS,
        Permission.MANAGE_PHYSICAL_STORAGE
    ],
    UserRole.HOSPITAL_STAFF: [
        Permission.MANAGE_PATIENTS, Permission.UPLOAD_RECORDS, Permission.VIEW_RECORDS,
        Permission.MANAGE_PHYSICAL_STORAGE
    ],
    UserRole.WEBSITE_ADMIN: []
}

class Hospital(Base):
    __tablename__ = "hospitals"

    hospital_id = Column(Integer, primary_key=True, index=True)
    legal_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False) # Contact Email
    hashed_password = Column(String, nullable=True) # Legacy/Not used for Auth
    subscription_tier = Column(String, default="Standard")
    hospital_type = Column(String, default="Private") # Government, Private, Teaching, etc.
    specialty = Column(String, default="General") # General, Dental, etc.
    terminology = Column(JSON, default=dict) # {"patient": "Client", "hospital": "Clinic"}
    enabled_modules = Column(JSON, default=list) # e.g. ["core", "dental", "accounting"]
    ai_settings = Column(JSON, default=lambda: {"enabled": False, "api_key": ""}) # Per-tenant AI config
    is_active = Column(Boolean, default=True)
    
    # Profile Details (Post-Registration, Optional)
    director_name = Column(String, nullable=True)
    registration_number = Column(String, nullable=True)
    established_year = Column(Integer, nullable=True)
    address = Column(String, nullable=True)
    address_line2 = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    country = Column(String, default="India")
    phone = Column(String, nullable=True)
    alternate_phone = Column(String, nullable=True)
    secondary_email = Column(String, nullable=True)
    landline = Column(String, nullable=True)
    google_maps_url = Column(Text, nullable=True)
    
    # Billing Configuration (Legacy/Simple)
    price_per_file = Column(Float, default=100.0) 
    included_pages = Column(Integer, default=20) 
    price_per_extra_page = Column(Float, default=1.0) 
    
    # Custom Pricing & Usage (New System)
    custom_pricing = Column(JSON, default=dict) # Complex pricing structure
    pricing_effective_date = Column(DateTime, nullable=True)
    pricing_notes = Column(Text, nullable=True)
    
    # Operational Metrics
    expected_monthly_volume = Column(Integer, nullable=True)
    expected_users = Column(Integer, nullable=True)
    storage_requirements = Column(String, nullable=True) # Small, Medium, Large, Enterprise
    special_requirements = Column(Text, nullable=True)
    accept_marketing = Column(Boolean, default=False)
    
    # Custom User Limits
    max_users = Column(Integer, default=2) 
    per_user_price = Column(Float, default=0.0) 
    
    # Advanced Billing
    registration_fee = Column(Float, default=1000.0)
    is_reg_fee_paid = Column(Boolean, default=False)
    gst_number = Column(String, nullable=True)
    
    # Banking Details
    bank_name = Column(String, nullable=True)
    bank_account_no = Column(String, nullable=True)
    bank_ifsc = Column(String, nullable=True)
    
    pan_number = Column(String, nullable=True) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    users = relationship("User", back_populates="hospital")
    patients = relationship("Patient", back_populates="hospital")
    inventory = relationship("PhysicalRack", back_populates="hospital")
    audit_logs = relationship("AuditLog", back_populates="hospital")
    invoices = relationship("Invoice", back_populates="hospital")

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    role = Column(String, default=UserRole.HOSPITAL_STAFF) # Refer to UserRole enum
    hashed_password = Column(String, nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False) # For email verification
    
    # Auth & Security Tracking
    locked_until = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    current_session_id = Column(String, nullable=True)
    last_active_at = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    previous_login_at = Column(DateTime(timezone=True), nullable=True)
    force_password_change = Column(Boolean, default=False)
    
    known_devices = Column(Text, default="[]") # JSON list of known devices
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    hospital = relationship("Hospital", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user")
    qa_entries = relationship("QAEntry", back_populates="reviewer")

class Patient(Base):
    __tablename__ = "patients"

    record_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    patient_u_id = Column(String, index=True, nullable=False) # MRD NUMBER
    
    __table_args__ = (
        UniqueConstraint('hospital_id', 'patient_u_id', name='uq_hospital_patient_mrd'),
    )
    uhid = Column(String, index=True, nullable=True) # Alternate ID
    full_name = Column(String, nullable=False)
    gender = Column(String, nullable=True)
    age = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    admission_date = Column(DateTime, nullable=True)
    discharge_date = Column(DateTime, nullable=True)
    total_bill_amount = Column(Float, nullable=True)
    diagnosis = Column(Text, nullable=True)
    is_deleted = Column(Boolean, default=False)
    
    # Storage linkage
    physical_box_id = Column(Integer, ForeignKey("physical_boxes.box_id"), nullable=True)
    
    patient_category = Column(String, default="STANDARD") # STANDARD, MLC, BIRTH, DEATH
    
    # Detailed Demographics & Medical
    address = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)
    email_id = Column(String, nullable=True)
    aadhaar_number = Column(String, nullable=True)
    dob = Column(DateTime, nullable=True)
    
    doctor_name = Column(String, nullable=True)
    weight = Column(String, nullable=True)
    operative_notes = Column(Text, nullable=True)
    mediclaim = Column(String, nullable=True)
    medical_summary = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)
    specialty_data = Column(JSON, default=dict) # Dental specific data etc.
    
    mother_record_id = Column(Integer, nullable=True) # Linked record for infants
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    hospital = relationship("Hospital", back_populates="patients")
    files = relationship("PDFFile", back_populates="patient", cascade="all, delete-orphan")
    diagnoses = relationship("PatientDiagnosis")
    procedures = relationship("PatientProcedure")
    box = relationship("PhysicalBox", back_populates="patients")

    @property
    def box_label(self):
        return self.box.label if self.box else None

    @property
    def box_location_code(self):
        return self.box.location_code if self.box else None

    @property
    def mother_details(self):
        return None # Placeholder

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
    record_id = Column(Integer, ForeignKey("patients.record_id"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False) # Key in S3 or local path
    file_size = Column(Integer, nullable=True) # In bytes
    page_count = Column(Integer, nullable=True)
    upload_status = Column(String, default="pending") # pending, processing, completed, error, confirmed
    processing_stage = Column(String, default="raw_upload") # draft, analyzing, completed
    processing_progress = Column(Integer, default=0)
    
    encryption_key = Column(String, nullable=True) # If encrypted
    s3_key = Column(String, nullable=True) # Final location in S3
    storage_path = Column(String, nullable=True) # Full URI or local file path
    
    ocr_text = Column(Text, nullable=True)
    is_searchable = Column(Boolean, default=False)
    
    is_paid = Column(Boolean, default=False) # Link to invoicing
    
    # Tracking
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Storage linkage
    box_id = Column(Integer, ForeignKey("physical_boxes.box_id"), nullable=True)
    
    # Billing captures (Historical)
    price_per_file = Column(Float, default=100.0)
    included_pages = Column(Integer, default=20)
    price_per_extra_page = Column(Float, default=1.0)
    file_size_mb = Column(Float, default=0.0)
    
    payment_date = Column(DateTime(timezone=True), nullable=True)
    tags = Column(String, nullable=True) # comma separated
    download_request_count = Column(Integer, default=0)
    
    # Relationships
    patient = relationship("Patient", back_populates="files")
    box = relationship("PhysicalBox", back_populates="files")
    extraction_data = relationship("AIExtraction", back_populates="file", uselist=False)

class AIExtraction(Base):
    """Stores metadata extracted by Google Gemini / OCR."""
    __tablename__ = "ai_extractions"
    extraction_id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("pdf_files.file_id"), nullable=False)
    
    raw_json = Column(Text, nullable=True) # Full response
    extracted_text = Column(Text, nullable=True) # Full OCR text
    confidence_score = Column(Float, default=0.0)
    
    # Specific fields mapped
    visit_type = Column(String, nullable=True) # IPD / OPD
    doctor_name = Column(String, nullable=True)
    summary = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    file = relationship("PDFFile", back_populates="extraction_data")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=True, index=True)
    action = Column(String, nullable=False) # LOGIN, UPLOAD, VIEW_RECORD, DOWNLOAD, etc.
    module = Column(String, nullable=True) # AUTH, PATIENTS, BILLING
    target_id = Column(String, nullable=True) # ID of the object changed
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
    hospital = relationship("Hospital", back_populates="audit_logs")

class SystemSetting(Base):
    __tablename__ = "system_settings"
    id = Column(Integer, primary_key=True)
    key = Column(String, unique=True, index=True)
    value = Column(String)
    description = Column(String, nullable=True)

class Warehouse(Base):
    __tablename__ = "warehouses"
    warehouse_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    location = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    racks = relationship("PhysicalRack", back_populates="warehouse")

class PhysicalRack(Base):
    __tablename__ = "physical_racks"
    rack_id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.warehouse_id"), nullable=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=True)
    label = Column(String, nullable=False) # e.g., RACK-A1-01
    aisle = Column(Integer, default=1)
    capacity = Column(Integer, default=500)
    total_rows = Column(Integer, default=5)
    total_columns = Column(Integer, default=10)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    warehouse = relationship("Warehouse", back_populates="racks")
    hospital = relationship("Hospital", back_populates="inventory")
    boxes = relationship("PhysicalBox", back_populates="rack")

class PhysicalBox(Base):
    __tablename__ = "physical_boxes"
    box_id = Column(Integer, primary_key=True, index=True)
    rack_id = Column(Integer, ForeignKey("physical_racks.rack_id"), nullable=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    label = Column(String, unique=True, nullable=False) # e.g., BX-1002
    location_code = Column(String, nullable=True)
    status = Column(String, default="OPEN") # OPEN, CLOSED
    is_open = Column(Boolean, default=False)
    capacity = Column(Integer, default=100)
    category = Column(String, default="GENERAL") # GENERAL, MLC, BIRTH, DEATH
    rack_row = Column(Integer, nullable=True)
    rack_column = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    sealed_date = Column(DateTime, nullable=True)
    
    rack = relationship("PhysicalRack", back_populates="boxes")
    hospital = relationship("Hospital")
    files = relationship("PDFFile", back_populates="box")
    patients = relationship("Patient", back_populates="box")

class PhysicalMovementLog(Base):
    __tablename__ = "physical_movement_logs"
    log_id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String, nullable=False) # CHECK-IN, CHECK-OUT
    uhid = Column(String, nullable=False)
    patient_name = Column(String, nullable=True)
    destination = Column(String, nullable=True)
    performed_by_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    status = Column(String, default="Success")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class FileRequest(Base):
    __tablename__ = "file_requests"
    request_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    box_id = Column(Integer, ForeignKey("physical_boxes.box_id"), nullable=False)
    requester_name = Column(String, nullable=False)
    status = Column(String, default="Pending") # Pending, Completed, Rejected
    request_date = Column(DateTime(timezone=True), server_default=func.now())
    processed_date = Column(DateTime, nullable=True)
    
    hospital = relationship("Hospital")
    box = relationship("PhysicalBox")

class QAEntry(Base):
    __tablename__ = "qa_entries"
    qa_id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("pdf_files.file_id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    status = Column(String, default="pending") # pending, approved, rejected
    comments = Column(String, nullable=True)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    reviewer = relationship("User", back_populates="qa_entries")

class Invoice(Base):
    __tablename__ = "invoices"
    invoice_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    invoice_number = Column(String, unique=True, index=True, nullable=False)
    total_amount = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0)
    gst_rate = Column(Float, default=18.0)
    status = Column(String, default="PENDING") # PENDING, PAID, CANCELLED
    bill_date = Column(DateTime, server_default=func.now())
    due_date = Column(DateTime, nullable=True)
    payment_date = Column(DateTime, nullable=True)
    payment_method = Column(String, nullable=True)
    transaction_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    hospital = relationship("Hospital", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    item_id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.invoice_id"), nullable=False)
    file_id = Column(Integer, ForeignKey("pdf_files.file_id"), nullable=True)
    
    description = Column(String, nullable=False)
    hsn_code = Column(String, default="998311")
    amount = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    
    invoice = relationship("Invoice", back_populates="items")
    pdf_file = relationship("PDFFile")

class AccountingVendor(Base):
    __tablename__ = "accounting_vendors"
    vendor_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True) # COURIER, STATIONERY, IT
    gst_number = Column(String, nullable=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    contact_person = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

class AccountingExpense(Base):
    __tablename__ = "accounting_expenses"
    expense_id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("accounting_vendors.vendor_id"), nullable=True)
    voucher_number = Column(String, index=True)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    date = Column(DateTime, server_default=func.now())
    payment_status = Column(String, default="UNPAID") # PAID, UNPAID
    payment_method = Column(String, default="Cash") 
    reference_number = Column(String, nullable=True) 
    tax_amount = Column(Float, default=0.0)
    description = Column(String, nullable=True)

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
    company_name = Column(String, default="Digifort Labs")
    company_address = Column(String, default="Vapi, Gujarat, India")
    company_gst = Column(String, nullable=True)
    company_pan = Column(String, nullable=True)
    company_phone = Column(String, nullable=True)
    company_email = Column(String, default="info@digifortlabs.com")
    company_website = Column(String, default="www.digifortlabs.com")
    
    # Company Bank Details
    company_bank_name = Column(String, nullable=True)
    company_bank_acc = Column(String, nullable=True)
    company_bank_ifsc = Column(String, nullable=True)
    company_bank_branch = Column(String, nullable=True)
    
    # Prefix Settings
    invoice_prefix = Column(String, default="INV")
    invoice_prefix_nongst = Column(String, default="BOS") # Bill of Supply
    receipt_prefix = Column(String, default="RCPT")
    expense_prefix = Column(String, default="EXP")
    
    # Counters
    next_invoice_number = Column(Integer, default=1)
    next_invoice_number_nongst = Column(Integer, default=1) # Separate counter for Non-GST
    next_receipt_number = Column(Integer, default=1)
    next_expense_number = Column(Integer, default=1)
    
    # Format choice (e.g. PREFIX/FY/NUMBER)
    number_format = Column(String, default="{prefix}/{fy}/{number:04d}")
    
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class AvailableInvoiceNumber(Base):
    """
    Cache table for available invoice numbers from deleted invoices.
    Enables O(1) gap filling instead of O(n) loop through all numbers.
    """
    __tablename__ = "available_invoice_numbers"
    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, nullable=False, index=True)
    invoice_type = Column(String, nullable=False)  # 'gst' or 'nongst'
    financial_year = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint('number', 'invoice_type', 'financial_year', name='uix_available_invoice'),
    )

class BandwidthUsage(Base):
    __tablename__ = "bandwidth_usage"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    month_year = Column(String, index=True) # e.g. "2026-01"
    used_mb = Column(Float, default=0.0)
    quota_limit_mb = Column(Float, default=1000.0)
    
    __table_args__ = (
        UniqueConstraint('hospital_id', 'month_year', name='uix_hospital_month_bandwidth'),
    )

class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"
    otp_id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    otp_code = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False)
    attempt_count = Column(Integer, default=0)  # Tracks failed verification attempts
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class QAIssue(Base):
    __tablename__ = "qa_issues"
    issue_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    filename = Column(String, nullable=True)
    issue_type = Column(String, nullable=False) # 'data_error', 'image_blur', etc.
    details = Column(Text, nullable=True)
    severity = Column(String, default="medium") # 'low', 'medium', 'high', 'critical'
    status = Column(String, default="open") # 'open', 'resolved', 'ignored'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    hospital = relationship("Hospital")

class InventoryItem(Base):
    __tablename__ = "inventory_items"
    item_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, default="Consumables")
    unit_price = Column(Float, default=0.0)
    reorder_point = Column(Integer, default=10)
    unit = Column(String, default="units") # 'pcs', 'boxes', 'rolls'
    current_stock = Column(Integer, default=0)
    last_updated = Column(DateTime, onupdate=func.now())

class InventoryLog(Base):
    __tablename__ = "inventory_logs"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory_items.item_id"), nullable=False)
    change_type = Column(String, nullable=False) # 'IN', 'OUT', 'ADJUST'
    quantity = Column(Integer, nullable=False)
    description = Column(String, nullable=True)
    performed_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    item = relationship("InventoryItem")
    user = relationship("User")

class ICD11Code(Base):
    __tablename__ = "icd11_codes"
    code = Column(String, primary_key=True, index=True)
    description = Column(String, nullable=False)
    chapter = Column(String, nullable=True)

class PatientDiagnosis(Base):
    __tablename__ = "patient_diagnoses"
    diagnosis_id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("patients.record_id"), nullable=False)
    code = Column(String, ForeignKey("icd11_codes.code"), nullable=False)
    notes = Column(Text, nullable=True)
    diagnosed_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    diagnosed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    icd_code = relationship("ICD11Code")
    doctor = relationship("User")

class ICD11ProcedureCode(Base):
    __tablename__ = "icd11_procedure_codes"
    code = Column(String, primary_key=True, index=True)
    description = Column(String, nullable=False)

class PatientProcedure(Base):
    __tablename__ = "patient_procedures"
    procedure_id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("patients.record_id"), nullable=False)
    code = Column(String, ForeignKey("icd11_procedure_codes.code"), nullable=False)
    notes = Column(Text, nullable=True)
    performed_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    performed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    procedure_code = relationship("ICD11ProcedureCode")
    doctor = relationship("User")


class DentalPatient(Base):
    __tablename__ = "dental_patients"

    patient_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    # Link to main patient record if they exist there, otherwise can be standalone
    main_patient_id = Column(Integer, ForeignKey("patients.record_id"), nullable=True) 
    
    # Identifiers
    uhid = Column(String, nullable=True)
    opd_number = Column(String, nullable=True)
    registration_date = Column(DateTime(timezone=True), server_default=func.now())
    
    full_name = Column(String, nullable=False)
    date_of_birth = Column(DateTime, nullable=True)
    gender = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    chief_complaint = Column(Text, nullable=True)
    
    # Clinical Details (JSON for flexibility)
    clinical_data = Column(JSON, default=dict) # Chief complaints, structured medical history
    habits = Column(JSON, default=dict) # Smoking, Tobacco, Alcohol, Brushing habits
    
    medical_history = Column(Text, nullable=True) # Legacy/Backup
    allergies = Column(Text, nullable=True) # e.g., "Penicillin"
    medications = Column(Text, nullable=True) # e.g., "Aspirin 50mg"
    prescriptions = Column(JSON, default=list) # List of prescribed medications
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    hospital = relationship("Hospital")
    # removed appointments = relationship("DentalAppointment", ...)
    treatments = relationship("DentalTreatment", back_populates="patient", cascade="all, delete-orphan")
    treatment_plans = relationship("TreatmentPlan", back_populates="patient", cascade="all, delete-orphan")
    scans = relationship("Dental3DScan", back_populates="patient", cascade="all, delete-orphan")
    periodontal_exams = relationship("PeriodontalExam", back_populates="patient", cascade="all, delete-orphan")
    insurance_claims = relationship("InsuranceClaim", back_populates="patient", cascade="all, delete-orphan")
    lab_orders = relationship("DentalLabOrder", back_populates="patient", cascade="all, delete-orphan")
    ortho_records = relationship("OrthoRecord", back_populates="patient", cascade="all, delete-orphan")
    communications = relationship("CommunicationLog", back_populates="patient", cascade="all, delete-orphan")

# --- Centralized Appointments ---

class Department(Base):
    __tablename__ = "departments"
    department_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    name = Column(String, nullable=False) # e.g., "Dental", "General", "Ortho"
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"
    profile_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, unique=True)
    department_id = Column(Integer, ForeignKey("departments.department_id"), nullable=False)
    specialization = Column(String, nullable=True) # e.g., "Endodontist"
    consultation_fee = Column(Float, default=0.0)
    
    user = relationship("User", backref="doctor_profile")
    department = relationship("Department")

class DoctorSchedule(Base):
    __tablename__ = "doctor_schedules"
    schedule_id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    day_of_week = Column(Integer, nullable=False) # 0=Monday, 6=Sunday
    start_time = Column(String, nullable=False) # e.g., "09:00"
    end_time = Column(String, nullable=False) # e.g., "17:00"
    slot_duration_minutes = Column(Integer, default=30)
    is_active = Column(Boolean, default=True)

class Appointment(Base):
    __tablename__ = "appointments"
    appointment_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.record_id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.department_id"), nullable=False)
    
    appointment_date = Column(DateTime(timezone=True), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    
    status = Column(String, default="Scheduled") # Scheduled, Arrived, In-Consultation, Completed, Cancelled, No-Show
    reason_for_visit = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    hospital = relationship("Hospital")
    patient = relationship("Patient")
    doctor = relationship("User")
    department = relationship("Department")




class TreatmentPlan(Base):
    __tablename__ = "dental_treatment_plans"

    plan_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("dental_patients.patient_id"), nullable=False)
    
    name = Column(String, nullable=False) # e.g. "Full Mouth Rehabilitation"
    status = Column(String, default="proposed") # proposed, accepted, completed, rejected
    priority = Column(String, default="normal") # low, normal, high, urgent
    
    estimated_cost = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    patient = relationship("DentalPatient", back_populates="treatment_plans")
    phases = relationship("TreatmentPhase", back_populates="plan", cascade="all, delete-orphan")

class TreatmentPhase(Base):
    __tablename__ = "dental_treatment_phases"

    phase_id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("dental_treatment_plans.plan_id"), nullable=False)
    
    name = Column(String, nullable=False) # e.g. "Phase 1: Infection Control"
    phase_order = Column(Integer, default=1)
    status = Column(String, default="pending") # pending, in-progress, completed
    estimated_duration_days = Column(Integer, nullable=True) 
    
    plan = relationship("TreatmentPlan", back_populates="phases")
    treatments = relationship("DentalTreatment", back_populates="phase", cascade="all")

class DentalTreatment(Base):
    __tablename__ = "dental_treatments"

    treatment_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("dental_patients.patient_id"), nullable=False)
    
    tooth_number = Column(Integer, nullable=True) # 1-32 (Universal Numbering System)
    treatment_type = Column(String, nullable=False) # e.g., "Extraction", "Filling"
    description = Column(Text, nullable=True)
    cost = Column(Float, default=0.0)
    
    status = Column(String, default="planned") # planned, in-progress, completed
    date_performed = Column(DateTime(timezone=True), nullable=True)

    phase_id = Column(Integer, ForeignKey("dental_treatment_phases.phase_id"), nullable=True)

    patient = relationship("DentalPatient", back_populates="treatments")
    phase = relationship("TreatmentPhase", back_populates="treatments")


class Dental3DScan(Base):
    __tablename__ = "dental_3d_scans"

    scan_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("dental_patients.patient_id"), nullable=False)
    
    scan_type = Column(String, nullable=True) # e.g., "Intraoral", "CBCT", "Model"
    file_path = Column(String, nullable=False) # Path to S3 or local storage
    file_name = Column(String, nullable=False)
    
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)

    patient = relationship("DentalPatient", back_populates="scans")

class LoginOTP(Base):
    __tablename__ = "login_otps"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    device_id = Column(String, nullable=False, index=True)
    otp_code = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")

class PeriodontalExam(Base):
    __tablename__ = "periodontal_exams"

    exam_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("dental_patients.patient_id"), nullable=False)
    dentist_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    
    exam_date = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)
    
    # Summary stats
    overall_plaque_score = Column(Float, nullable=True)
    overall_bleeding_score = Column(Float, nullable=True)

    patient = relationship("DentalPatient", back_populates="periodontal_exams")
    measurements = relationship("PeriodontalMeasurement", back_populates="exam", cascade="all, delete-orphan")

class PeriodontalMeasurement(Base):
    __tablename__ = "periodontal_measurements"

    measurement_id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("periodontal_exams.exam_id"), nullable=False)
    
    tooth_number = Column(Integer, nullable=False) # 1-32
    
    # 6-point measurements for Pocket Depth (PD)
    # Bucal/Labial: Disto-buccal, Mid-buccal, Mesio-buccal
    # Lingual/Palatal: Disto-lingual, Mid-lingual, Mesio-lingual
    pd_db = Column(Integer, default=0)
    pd_b = Column(Integer, default=0)
    pd_mb = Column(Integer, default=0)
    pd_dl = Column(Integer, default=0)
    pd_l = Column(Integer, default=0)
    pd_ml = Column(Integer, default=0)
    
    # 6-point measurements for Gingival Margin (GM)
    gm_db = Column(Integer, default=0)
    gm_b = Column(Integer, default=0)
    gm_mb = Column(Integer, default=0)
    gm_dl = Column(Integer, default=0)
    gm_l = Column(Integer, default=0)
    gm_ml = Column(Integer, default=0)
    
    # Bleeding on Probing (BOP) - stored as bitmask or boolean flags
    bop_db = Column(Boolean, default=False)
    bop_b = Column(Boolean, default=False)
    bop_mb = Column(Boolean, default=False)
    bop_dl = Column(Boolean, default=False)
    bop_l = Column(Boolean, default=False)
    bop_ml = Column(Boolean, default=False)

    exam = relationship("PeriodontalExam", back_populates="measurements")

# --- Final Phase 2 Dental Features ---

class InsuranceProvider(Base):
    __tablename__ = "insurance_providers"
    provider_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    name = Column(String, nullable=False) # e.g., Star Health
    contact_email = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    portal_url = Column(String, nullable=True)
    
    claims = relationship("InsuranceClaim", back_populates="provider")

class InsuranceClaim(Base):
    __tablename__ = "insurance_claims"
    claim_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("dental_patients.patient_id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("insurance_providers.provider_id"), nullable=False)
    
    policy_number = Column(String, nullable=False)
    claim_amount = Column(Float, nullable=False)
    approved_amount = Column(Float, nullable=True)
    status = Column(String, default="pending") # pending, approved, rejected, paid
    submitted_date = Column(DateTime(timezone=True), server_default=func.now())
    resolved_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    
    patient = relationship("DentalPatient", back_populates="insurance_claims")
    provider = relationship("InsuranceProvider", back_populates="claims")

class DentalLab(Base):
    __tablename__ = "dental_labs"
    lab_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    name = Column(String, nullable=False)
    contact_person = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    
    orders = relationship("DentalLabOrder", back_populates="lab")

class DentalLabOrder(Base):
    __tablename__ = "dental_lab_orders"
    order_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("dental_patients.patient_id"), nullable=False)
    lab_id = Column(Integer, ForeignKey("dental_labs.lab_id"), nullable=False)
    dentist_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    
    appliance_type = Column(String, nullable=False) # e.g., Crown, Bridge, Denture
    tooth_number = Column(String, nullable=True) # e.g., "14, 15", or "Upper Arch"
    shade = Column(String, nullable=True) # e.g., A2, B1
    instructions = Column(Text, nullable=True)
    
    sent_date = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=True)
    received_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, default="sent") # sent, received, fitted, returned
    
    patient = relationship("DentalPatient", back_populates="lab_orders")
    lab = relationship("DentalLab", back_populates="orders")
    dentist = relationship("User")

class OrthoRecord(Base):
    __tablename__ = "ortho_records"
    record_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("dental_patients.patient_id"), nullable=False)
    dentist_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    
    visit_date = Column(DateTime(timezone=True), server_default=func.now())
    appliance_type = Column(String, nullable=False) # Braces, Aligners, Retainers
    upper_wire = Column(String, nullable=True) # e.g., 014 NiTi
    lower_wire = Column(String, nullable=True)
    elastics = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    next_visit_tasks = Column(Text, nullable=True)
    
    patient = relationship("DentalPatient", back_populates="ortho_records")
    dentist = relationship("User")

class CommunicationLog(Base):
    __tablename__ = "communication_logs"
    log_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("dental_patients.patient_id"), nullable=False)
    
    comm_type = Column(String, nullable=False) # SMS, Email, WhatsApp
    category = Column(String, nullable=False) # Reminder, Post-Op, Marketing
    message_content = Column(Text, nullable=False)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="sent") # sent, failed, delivered
    
    patient = relationship("DentalPatient", back_populates="communications")

class DentalInventoryItem(Base):
    """Specific inventory tracking tailored for dental supplies"""
    __tablename__ = "dental_inventory_items"
    item_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    
    name = Column(String, index=True, nullable=False) # e.g., Composite A2, Lidocaine 2%
    category = Column(String, default="Consumables") # Consumables, Instruments, Materials
    sku_code = Column(String, nullable=True)
    
    current_stock = Column(Integer, default=0)
    reorder_point = Column(Integer, default=5)
    unit_of_measure = Column(String, default="boxes") # boxes, pieces, packs
    expiry_date = Column(DateTime, nullable=True)
    
    last_restocked = Column(DateTime(timezone=True), nullable=True)
    
    transactions = relationship("DentalInventoryTransaction", back_populates="item", cascade="all, delete-orphan")

class DentalInventoryTransaction(Base):
    __tablename__ = "dental_inventory_transactions"
    txn_id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("dental_inventory_items.item_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    
    change_type = Column(String, nullable=False) # IN (Restock), OUT (Consumed)
    quantity = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    item = relationship("DentalInventoryItem", back_populates="transactions")
    user = relationship("User")

# ---------------------------------------------------------------------------------------------------------
# Phase 3: ENT OPD Module Models
# ---------------------------------------------------------------------------------------------------------

class ENTPatient(Base):
    __tablename__ = "ent_patients"
    ent_patient_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.record_id"), nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    
    chief_complaint = Column(Text, nullable=True)
    ent_history = Column(JSON, default={})
    allergies = Column(JSON, default=[])
    family_ent_history = Column(JSON, default={})
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    patient = relationship("Patient")
    hospital = relationship("Hospital")


class AudiometryTest(Base):
    __tablename__ = "audiometry_tests"
    test_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.record_id"), nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    audiologist_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    
    test_type = Column(String, nullable=False) # Pure Tone, Speech, Impedance
    results = Column(JSON, default={})
    hearing_loss_degree = Column(String, nullable=True)
    recommendations = Column(Text, nullable=True)
    
    test_date = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient")
    audiologist = relationship("User")


class ENTExamination(Base):
    __tablename__ = "ent_examinations"
    exam_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.record_id"), nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    examiner_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    
    examination_data = Column(JSON, default={"otoscopy": {}, "rhinoscopy": {}, "laryngoscopy": {}})
    findings = Column(Text, nullable=True)
    
    exam_date = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient")
    examiner = relationship("User")


class ENTSurgery(Base):
    __tablename__ = "ent_surgeries"
    surgery_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.record_id"), nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    surgeon_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    
    procedure_code = Column(String, nullable=True)
    surgery_type = Column(String, nullable=False)
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    anesthesia_type = Column(String, nullable=True)
    
    pre_op_notes = Column(Text, nullable=True)
    post_op_notes = Column(Text, nullable=True)
    status = Column(String, default="scheduled") # scheduled, completed, cancelled
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient")
    surgeon = relationship("User")


# ---------------------------------------------------------------------------------------------------------
# Phase 4: Clinic OPD Module Models
# ---------------------------------------------------------------------------------------------------------

class OPDPatient(Base):
    __tablename__ = "opd_patients"
    opd_patient_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.record_id"), nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    
    blood_group = Column(String, nullable=True)
    allergies = Column(Text, nullable=True)
    chronic_conditions = Column(JSON, default={})
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    patient = relationship("Patient")
    hospital = relationship("Hospital")
    visits = relationship("OPDVisit", back_populates="opd_patient")

class OPDVisit(Base):
    __tablename__ = "opd_visits"
    visit_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.record_id"), nullable=False)
    opd_patient_id = Column(Integer, ForeignKey("opd_patients.opd_patient_id"), nullable=True) # Added foreign key
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    
    visit_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Vitals
    temperature = Column(Float, nullable=True)
    blood_pressure = Column(String, nullable=True)
    pulse_rate = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)
    
    # Clinical
    chief_complaint = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=True)
    treatment = Column(Text, nullable=True)
    
    # Billing
    consultation_fee = Column(Float, default=0.0)
    is_paid = Column(Boolean, default=False)
    
    patient = relationship("Patient")
    doctor = relationship("User")
    opd_patient = relationship("OPDPatient", back_populates="visits")
    prescriptions = relationship("Prescription", back_populates="visit")

class Prescription(Base):
    __tablename__ = "prescriptions"
    prescription_id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("opd_visits.visit_id"), nullable=False)
    
    medicine_name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    frequency = Column(String, nullable=False)
    duration = Column(String, nullable=False)
    instructions = Column(Text, nullable=True)
    
    visit = relationship("OPDVisit", back_populates="prescriptions")

# ---------------------------------------------------------------------------------------------------------
# Phase 5: Pharma Medical Module Models
# ---------------------------------------------------------------------------------------------------------

class PharmaMedicine(Base):
    __tablename__ = "pharma_medicines"
    medicine_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    
    medicine_name = Column(String, nullable=False, index=True)
    generic_name = Column(String, nullable=True)
    brand_name = Column(String, nullable=True)
    manufacturer = Column(String, nullable=True)
    
    category = Column(String, nullable=True)
    drug_class = Column(String, nullable=True)
    schedule = Column(String, nullable=True)
    
    form = Column(String, nullable=True)
    strength = Column(String, nullable=True)
    pack_size = Column(Integer, default=1)
    
    mrp = Column(Float, nullable=False)
    purchase_price = Column(Float, nullable=False)
    selling_price = Column(Float, nullable=False)
    gst_rate = Column(Float, default=12.0)
    
    current_stock = Column(Integer, default=0)
    reorder_level = Column(Integer, default=10)
    
    requires_prescription = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PharmaStock(Base):
    __tablename__ = "pharma_stock"
    stock_id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("pharma_medicines.medicine_id"), nullable=False)
    
    batch_number = Column(String, nullable=False)
    manufacturing_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=False)
    
    quantity_received = Column(Integer, nullable=False)
    quantity_remaining = Column(Integer, nullable=False)
    
    supplier_name = Column(String, nullable=True)
    supplier_invoice = Column(String, nullable=True)
    purchase_date = Column(DateTime, nullable=True)
    
    purchase_price_per_unit = Column(Float, nullable=False)
    selling_price_per_unit = Column(Float, nullable=False)
    
    medicine = relationship("PharmaMedicine")

class PharmaSale(Base):
    __tablename__ = "pharma_sales"
    sale_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    sale_date = Column(DateTime(timezone=True), server_default=func.now())
    
    customer_name = Column(String, nullable=True)
    customer_phone = Column(String, nullable=True)
    prescription_number = Column(String, nullable=True)
    doctor_name = Column(String, nullable=True)
    
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    gst_amount = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    
    payment_method = Column(String, default="cash")
    payment_status = Column(String, default="paid")
    
    items = relationship("PharmaSaleItem", back_populates="sale")

class PharmaSaleItem(Base):
    __tablename__ = "pharma_sale_items"
    item_id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("pharma_sales.sale_id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("pharma_medicines.medicine_id"), nullable=False)
    stock_id = Column(Integer, ForeignKey("pharma_stock.stock_id"), nullable=False)
    
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    gst_rate = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    
    sale = relationship("PharmaSale", back_populates="items")

class PharmaExpiry(Base):
    __tablename__ = "pharma_expiry_alerts"
    alert_id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("pharma_stock.stock_id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("pharma_medicines.medicine_id"), nullable=False)
    
    expiry_date = Column(DateTime, nullable=False)
    days_to_expiry = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)
    alert_status = Column(String, default="pending")

# ---------------------------------------------------------------------------------------------------------
# Phase 6: Law Firm Module Models
# ---------------------------------------------------------------------------------------------------------

class LegalClient(Base):
    __tablename__ = "legal_clients"
    client_id = Column(Integer, primary_key=True, index=True)
    firm_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    client_number = Column(String, unique=True, index=True, nullable=False)
    
    client_type = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    company_name = Column(String, nullable=True)
    
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    
    pan_number = Column(String, nullable=True)
    gst_number = Column(String, nullable=True)
    
    registration_date = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    cases = relationship("LegalCase", back_populates="client")

class LegalCase(Base):
    __tablename__ = "legal_cases"
    case_id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("legal_clients.client_id"), nullable=False)
    firm_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    
    case_number = Column(String, unique=True, index=True, nullable=False)
    case_title = Column(String, nullable=False)
    case_type = Column(String, nullable=False)
    
    court_name = Column(String, nullable=True)
    court_location = Column(String, nullable=True)
    judge_name = Column(String, nullable=True)
    
    petitioner = Column(String, nullable=True)
    respondent = Column(String, nullable=True)
    
    filing_date = Column(DateTime, nullable=True)
    status = Column(String, default="Filed")
    priority = Column(String, default="medium")
    
    primary_lawyer_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    team_members = Column(JSON, default=[])
    
    case_summary = Column(Text, nullable=True)
    legal_issues = Column(Text, nullable=True)
    
    client = relationship("LegalClient", back_populates="cases")
    hearings = relationship("CaseHearing", back_populates="case")
    documents = relationship("CaseDocument", back_populates="case")

class CaseHearing(Base):
    __tablename__ = "case_hearings"
    hearing_id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("legal_cases.case_id"), nullable=False)
    
    hearing_date = Column(DateTime, nullable=False)
    hearing_type = Column(String, nullable=False)
    
    court_room = Column(String, nullable=True)
    judge_name = Column(String, nullable=True)
    outcome = Column(Text, nullable=True)
    next_hearing_date = Column(DateTime, nullable=True)
    
    lawyer_attended = Column(Boolean, default=False)
    client_attended = Column(Boolean, default=False)
    
    notes = Column(Text, nullable=True)
    
    case = relationship("LegalCase", back_populates="hearings")

class CaseDocument(Base):
    __tablename__ = "case_documents"
    document_id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("legal_cases.case_id"), nullable=False)
    
    document_type = Column(String, nullable=False)
    document_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    
    uploaded_date = Column(DateTime(timezone=True), server_default=func.now())
    uploaded_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    
    is_confidential = Column(Boolean, default=False)
    
    case = relationship("LegalCase", back_populates="documents")

class LegalBilling(Base):
    __tablename__ = "legal_billing"
    bill_id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("legal_cases.case_id"), nullable=False)
    client_id = Column(Integer, ForeignKey("legal_clients.client_id"), nullable=False)
    
    bill_date = Column(DateTime, nullable=False)
    
    consultation_fee = Column(Float, default=0.0)
    court_fee = Column(Float, default=0.0)
    documentation_fee = Column(Float, default=0.0)
    other_charges = Column(Float, default=0.0)
    
    subtotal = Column(Float, nullable=False)
    gst_amount = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    
    paid_amount = Column(Float, default=0.0)
    balance = Column(Float, nullable=False)
    payment_status = Column(String, default="pending")

# ---------------------------------------------------------------------------------------------------------
# Phase 7: Corporate Module Models
# ---------------------------------------------------------------------------------------------------------

class CorporateEmployee(Base):
    __tablename__ = "corporate_employees"
    employee_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    employee_code = Column(String, unique=True, index=True, nullable=False)
    
    full_name = Column(String, nullable=False)
    dob = Column(DateTime, nullable=True)
    gender = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    
    designation = Column(String, nullable=True)
    department = Column(String, nullable=True)
    joining_date = Column(DateTime, nullable=True)
    employment_type = Column(String, default="Permanent")
    
    basic_salary = Column(Float, nullable=True)
    allowances = Column(JSON, default={})
    
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    documents = relationship("EmployeeDocument", back_populates="employee")
    attendance = relationship("Attendance", back_populates="employee")

class EmployeeDocument(Base):
    __tablename__ = "employee_documents"
    document_id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("corporate_employees.employee_id"), nullable=False)
    
    document_type = Column(String, nullable=False)
    document_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    
    employee = relationship("CorporateEmployee", back_populates="documents")

class Attendance(Base):
    __tablename__ = "attendance"
    attendance_id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("corporate_employees.employee_id"), nullable=False)
    
    date = Column(DateTime, nullable=False)
    check_in = Column(DateTime, nullable=True)
    check_out = Column(DateTime, nullable=True)
    
    status = Column(String, default="Present")
    work_hours = Column(Float, default=0.0)
    
    employee = relationship("CorporateEmployee", back_populates="attendance")

class CorporateProject(Base):
    __tablename__ = "corporate_projects"
    project_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    
    project_name = Column(String, nullable=False)
    project_code = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    status = Column(String, default="Planning")
    
    budget = Column(Float, nullable=True)
    spent = Column(Float, default=0.0)
    
    team_members = Column(JSON, default=[])
    
    tasks = relationship("ProjectTask", back_populates="project")

class ProjectTask(Base):
    __tablename__ = "project_tasks"
    task_id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("corporate_projects.project_id"), nullable=False)
    
    task_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    assigned_to = Column(Integer, ForeignKey("corporate_employees.employee_id"), nullable=True)
    priority = Column(String, default="medium")
    status = Column(String, default="todo")
    
    due_date = Column(DateTime, nullable=True)
    completed_date = Column(DateTime, nullable=True)
    
    project = relationship("CorporateProject", back_populates="tasks")

# ---------------------------------------------------------------------------------------------------------
# Phase 8: HMS (Hospital Management System) Module Models
# ---------------------------------------------------------------------------------------------------------

class Ward(Base):
    __tablename__ = "wards"
    ward_id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    
    ward_name = Column(String, nullable=False)
    ward_type = Column(String, nullable=False)
    total_beds = Column(Integer, nullable=False)
    occupied_beds = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    beds = relationship("Bed", back_populates="ward")

class Bed(Base):
    __tablename__ = "beds"
    bed_id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.ward_id"), nullable=False)
    
    bed_number = Column(String, nullable=False)
    is_occupied = Column(Boolean, default=False)
    
    ward = relationship("Ward", back_populates="beds")

class IPDAdmission(Base):
    __tablename__ = "ipd_admissions"
    admission_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.record_id"), nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
    
    admission_date = Column(DateTime(timezone=True), nullable=False)
    discharge_date = Column(DateTime(timezone=True), nullable=True)
    
    ward_id = Column(Integer, ForeignKey("wards.ward_id"), nullable=False)
    bed_id = Column(Integer, ForeignKey("beds.bed_id"), nullable=False)
    
    admitting_doctor_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    diagnosis = Column(Text, nullable=True)
    treatment_plan = Column(Text, nullable=True)
    
    status = Column(String, default="admitted")
    
    patient = relationship("Patient")
    ward = relationship("Ward")
    bed = relationship("Bed")
    doctor = relationship("User")
