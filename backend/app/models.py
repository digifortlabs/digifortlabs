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
    
    pan_number = Column(String, nullable=True) # Required for GST
    
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
    last_active_at = Column(DateTime, nullable=True)
    force_password_change = Column(Boolean, default=False)
    plain_password = Column(String, nullable=True) # Demo transparency
    
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
    patient_u_id = Column(String, unique=True, index=True, nullable=False) # MRD NUMBER
    uhid = Column(String, index=True, nullable=True) # Alternate ID
    full_name = Column(String, nullable=False)
    gender = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
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
    
    mother_record_id = Column(Integer, nullable=True) # Linked record for infants
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    hospital = relationship("Hospital", back_populates="patients")
    files = relationship("PDFFile", back_populates="patient", cascade="all, delete-orphan")
    diagnoses = relationship("PatientDiagnosis")
    procedures = relationship("PatientProcedure")

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
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=True)
    action = Column(String, nullable=False) # LOGIN, UPLOAD, VIEW_RECORD, DOWNLOAD, etc.
    module = Column(String, nullable=True) # AUTH, PATIENTS, BILLING
    target_id = Column(String, nullable=True) # ID of the object changed
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

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
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"), nullable=False)
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
    rack_row = Column(Integer, nullable=True)
    rack_column = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    sealed_date = Column(DateTime, nullable=True)
    
    rack = relationship("PhysicalRack", back_populates="boxes")
    hospital = relationship("Hospital")
    files = relationship("PDFFile", back_populates="box")

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
    company_gst = Column(String, nullable=True)
    
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
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    otp_code = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
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
