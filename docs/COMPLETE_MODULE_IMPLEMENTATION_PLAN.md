# DIGIFORT LABS - Complete Multi-Industry Implementation Plan
## 8 Module Universal Platform

**Vision**: One platform for all industries - Healthcare, Legal, Pharma, Corporate

---

## 🎯 MODULE OVERVIEW

| # | Module | Industry | Priority | Status | Duration |
|---|--------|----------|----------|--------|----------|
| 1 | MRD | Healthcare | HIGH | 85% ✅ | 3 weeks |
| 2 | Dental OPD | Healthcare | HIGH | 40% 🟡 | 8 weeks |
| 3 | ENT OPD | Healthcare | MEDIUM | 0% 🔴 | 6 weeks |
| 4 | Clinic OPD | Healthcare | MEDIUM | 0% 🔴 | 8 weeks |
| 5 | Pharma Medical | Pharmaceutical | MEDIUM | 0% 🔴 | 10 weeks |
| 6 | Law Firm | Legal | LOW | 0% 🔴 | 12 weeks |
| 7 | Corporate | Business | LOW | 0% 🔴 | 10 weeks |
| 8 | HMS | Healthcare | LOW | 0% 🔴 | 16 weeks |

**Total Timeline**: 82 weeks (~19 months)

---

## 📊 PHASE 1: MRD (Medical Records Department) - 3 Weeks
**Status**: 85% Complete | **Remaining**: 18 days

### Completed Features ✅
- Patient record management with MRD numbers
- PDF archival with OCR processing  
- Physical warehouse tracking
- Multi-tenant isolation
- Audit logging
- HttpOnly cookie authentication
- Database backups automated
- OTP security enhancements
- Docker network security

### Critical Fixes Remaining (4)
1. **Hardcoded Secret Key** - 1 day
2. **Hospital ID Spoofing** - 1 day  
3. **CSRF Protection** - 3 days
4. **RBAC System** - 5 days

**Total Remaining**: 18 days to production-ready

**See**: `docs/MRD_module.md` for detailed status

---

## 📊 PHASE 2: DENTAL OPD - 8 Weeks
**Status**: 40% Complete | **Start**: Week 13

### Database Schema (Already Exists)
```python
# backend/app/models.py
class DentalPatient(Base):
    patient_id, hospital_id, uhid, full_name, dob, phone, email
    chief_complaint, medical_history, allergies, medications
    
class DentalAppointment(Base):
    appointment_id, patient_id, doctor_name, start_time, end_time
    status, purpose, notes
    
class DentalTreatment(Base):
    treatment_id, patient_id, tooth_number (1-32)
    treatment_type, description, cost, status, date_performed
    
class Dental3DScan(Base):
    scan_id, patient_id, scan_type, file_path, uploaded_at
```

### New Features (Weeks 13-20)
- Enhanced treatment planning
- Tooth chart visualization
- X-ray integration
- Revenue analytics

---

## 📊 PHASE 3: ENT OPD - 6 Weeks
**Status**: 0% | **Start**: Week 21

### Database Schema
```python
# File: backend/app/models.py

class ENTPatient(Base):
    """ENT (Ear, Nose, Throat) patient records"""
    __tablename__ = "ent_patients"
    
    patient_id = Column(Integer, primary_key=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"))
    ent_number = Column(String, unique=True, index=True)
    registration_date = Column(DateTime, server_default=func.now())
    
    # Demographics
    full_name = Column(String, nullable=False)
    age = Column(Integer)
    gender = Column(String)
    phone = Column(String)
    email = Column(String)
    
    # ENT Specific
    chief_complaint = Column(Text)
    hearing_status = Column(JSON)  # {"left_ear": "normal", "right_ear": "impaired"}
    allergies = Column(Text)
    previous_surgeries = Column(JSON)
    
    # Relationships
    appointments = relationship("ENTAppointment", back_populates="patient")
    examinations = relationship("ENTExamination", back_populates="patient")
    audiometry_tests = relationship("AudiometryTest", back_populates="patient")

class ENTAppointment(Base):
    """ENT appointments"""
    __tablename__ = "ent_appointments"
    
    appointment_id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("ent_patients.patient_id"))
    doctor_id = Column(Integer, ForeignKey("users.user_id"))
    appointment_date = Column(DateTime)
    appointment_type = Column(String)  # consultation, follow-up, surgery
    status = Column(String, default="scheduled")
    notes = Column(Text)
    
    patient = relationship("ENTPatient", back_populates="appointments")

class ENTExamination(Base):
    """ENT examination records"""
    __tablename__ = "ent_examinations"
    
    examination_id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("ent_patients.patient_id"))
    examination_date = Column(DateTime, server_default=func.now())
    
    # Ear Examination
    ear_findings = Column(JSON)  # {"left": "normal", "right": "infection"}
    tympanic_membrane = Column(String)
    
    # Nose Examination
    nasal_findings = Column(JSON)
    septum_deviation = Column(Boolean, default=False)
    
    # Throat Examination
    throat_findings = Column(JSON)
    tonsils_condition = Column(String)
    
    # Diagnosis & Treatment
    diagnosis = Column(Text)
    treatment_plan = Column(Text)
    medications = Column(JSON)
    
    patient = relationship("ENTPatient", back_populates="examinations")

class AudiometryTest(Base):
    """Hearing test results"""
    __tablename__ = "audiometry_tests"
    
    test_id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("ent_patients.patient_id"))
    test_date = Column(DateTime, server_default=func.now())
    
    # Test Results (frequency in Hz, threshold in dB)
    left_ear_results = Column(JSON)  # {"250Hz": 20, "500Hz": 25, ...}
    right_ear_results = Column(JSON)
    
    # Interpretation
    left_ear_status = Column(String)  # normal, mild loss, moderate loss, severe loss
    right_ear_status = Column(String)
    recommendations = Column(Text)
    
    # Report
    report_file_path = Column(String)
    
    patient = relationship("ENTPatient", back_populates="audiometry_tests")
```

### API Endpoints
```python
# File: backend/app/routers/ent.py
router = APIRouter(prefix="/ent", tags=["ent"])

@router.post("/patients")
def register_ent_patient(patient: ENTPatientCreate, db: Session, current_user: User):
    """Register new ENT patient"""
    pass

@router.post("/examinations")
def create_examination(exam: ENTExaminationCreate, db: Session, current_user: User):
    """Record ENT examination"""
    pass

@router.post("/audiometry")
def record_audiometry_test(test: AudiometryTestCreate, db: Session, current_user: User):
    """Record hearing test results"""
    pass
```

### Features
- ENT patient management
- Ear/Nose/Throat examination records
- Audiometry test tracking
- Surgery scheduling
- Prescription management

---

## 📊 PHASE 4: CLINIC OPD - 8 Weeks
**Status**: 0% | **Start**: Week 27

### Database Schema
```python
class OPDPatient(Base):
    """General outpatient records"""
    __tablename__ = "opd_patients"
    
    patient_id = Column(Integer, primary_key=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"))
    opd_number = Column(String, unique=True, index=True)
    
    # Demographics
    full_name = Column(String, nullable=False)
    age = Column(Integer)
    gender = Column(String)
    phone = Column(String)
    blood_group = Column(String)
    
    # Medical
    allergies = Column(Text)
    chronic_conditions = Column(JSON)
    
    visits = relationship("OPDVisit", back_populates="patient")

class OPDVisit(Base):
    """OPD visit records"""
    __tablename__ = "opd_visits"
    
    visit_id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("opd_patients.patient_id"))
    visit_date = Column(DateTime, server_default=func.now())
    doctor_id = Column(Integer, ForeignKey("users.user_id"))
    
    # Vitals
    temperature = Column(Float)
    blood_pressure = Column(String)
    pulse_rate = Column(Integer)
    weight = Column(Float)
    
    # Clinical
    chief_complaint = Column(Text)
    diagnosis = Column(Text)
    treatment = Column(Text)
    
    # Billing
    consultation_fee = Column(Float)
    is_paid = Column(Boolean, default=False)
    
    patient = relationship("OPDPatient", back_populates="visits")
    prescriptions = relationship("Prescription", back_populates="visit")

class Prescription(Base):
    __tablename__ = "prescriptions"
    
    prescription_id = Column(Integer, primary_key=True)
    visit_id = Column(Integer, ForeignKey("opd_visits.visit_id"))
    
    medicine_name = Column(String)
    dosage = Column(String)
    frequency = Column(String)
    duration = Column(String)
    instructions = Column(Text)
    
    visit = relationship("OPDVisit", back_populates="prescriptions")
```

### Features
- OPD patient registration
- Visit management
- Vitals recording
- Prescription generation
- Queue management
- Billing integration

---

## 📊 PHASE 5: PHARMA MEDICAL - 10 Weeks
**Status**: 0% | **Start**: Week 35

### Database Schema
```python
class PharmaMedicine(Base):
    """Medicine master data"""
    __tablename__ = "pharma_medicines"
    
    medicine_id = Column(Integer, primary_key=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"))
    
    # Medicine Details
    medicine_name = Column(String, nullable=False, index=True)
    generic_name = Column(String)
    brand_name = Column(String)
    manufacturer = Column(String)
    
    # Classification
    category = Column(String)  # Antibiotic, Painkiller, etc.
    drug_class = Column(String)
    schedule = Column(String)  # H, H1, X (controlled substances)
    
    # Packaging
    form = Column(String)  # Tablet, Syrup, Injection
    strength = Column(String)  # 500mg, 10ml
    pack_size = Column(Integer)
    
    # Pricing
    mrp = Column(Float)
    purchase_price = Column(Float)
    selling_price = Column(Float)
    gst_rate = Column(Float, default=12.0)
    
    # Inventory
    current_stock = Column(Integer, default=0)
    reorder_level = Column(Integer, default=10)
    
    # Regulatory
    requires_prescription = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)

class PharmaStock(Base):
    """Stock/Batch tracking"""
    __tablename__ = "pharma_stock"
    
    stock_id = Column(Integer, primary_key=True)
    medicine_id = Column(Integer, ForeignKey("pharma_medicines.medicine_id"))
    
    # Batch Details
    batch_number = Column(String, nullable=False)
    manufacturing_date = Column(Date)
    expiry_date = Column(Date, nullable=False)
    
    # Quantity
    quantity_received = Column(Integer)
    quantity_remaining = Column(Integer)
    
    # Supplier
    supplier_name = Column(String)
    supplier_invoice = Column(String)
    purchase_date = Column(Date)
    
    # Pricing
    purchase_price_per_unit = Column(Float)
    selling_price_per_unit = Column(Float)

class PharmaSale(Base):
    """Sales transactions"""
    __tablename__ = "pharma_sales"
    
    sale_id = Column(Integer, primary_key=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"))
    sale_date = Column(DateTime, server_default=func.now())
    
    # Customer
    customer_name = Column(String)
    customer_phone = Column(String)
    prescription_number = Column(String)
    doctor_name = Column(String)
    
    # Billing
    subtotal = Column(Float)
    discount = Column(Float, default=0)
    gst_amount = Column(Float)
    total_amount = Column(Float)
    
    # Payment
    payment_method = Column(String)  # Cash, Card, UPI
    payment_status = Column(String, default="paid")
    
    items = relationship("PharmaSaleItem", back_populates="sale")

class PharmaSaleItem(Base):
    """Individual items in a sale"""
    __tablename__ = "pharma_sale_items"
    
    item_id = Column(Integer, primary_key=True)
    sale_id = Column(Integer, ForeignKey("pharma_sales.sale_id"))
    medicine_id = Column(Integer, ForeignKey("pharma_medicines.medicine_id"))
    stock_id = Column(Integer, ForeignKey("pharma_stock.stock_id"))
    
    quantity = Column(Integer)
    unit_price = Column(Float)
    discount = Column(Float, default=0)
    gst_rate = Column(Float)
    total_price = Column(Float)
    
    sale = relationship("PharmaSale", back_populates="items")

class PharmaExpiry(Base):
    """Expiry tracking"""
    __tablename__ = "pharma_expiry_alerts"
    
    alert_id = Column(Integer, primary_key=True)
    stock_id = Column(Integer, ForeignKey("pharma_stock.stock_id"))
    medicine_id = Column(Integer, ForeignKey("pharma_medicines.medicine_id"))
    
    expiry_date = Column(Date)
    days_to_expiry = Column(Integer)
    quantity = Column(Integer)
    alert_status = Column(String)  # pending, acknowledged, disposed
```

### Features
- Medicine inventory management
- Batch & expiry tracking
- POS (Point of Sale) system
- Prescription validation
- GST billing
- Stock alerts
- Supplier management
- Sales analytics

---

## 📊 PHASE 6: LAW FIRM - 12 Weeks
**Status**: 0% | **Start**: Week 45

### Database Schema
```python
class LegalClient(Base):
    """Law firm clients"""
    __tablename__ = "legal_clients"
    
    client_id = Column(Integer, primary_key=True)
    firm_id = Column(Integer, ForeignKey("hospitals.hospital_id"))  # Reuse hospitals table
    client_number = Column(String, unique=True, index=True)
    
    # Client Details
    client_type = Column(String)  # Individual, Corporate
    full_name = Column(String, nullable=False)
    company_name = Column(String)
    
    # Contact
    phone = Column(String)
    email = Column(String)
    address = Column(Text)
    
    # Business
    pan_number = Column(String)
    gst_number = Column(String)
    
    registration_date = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    cases = relationship("LegalCase", back_populates="client")

class LegalCase(Base):
    """Legal cases"""
    __tablename__ = "legal_cases"
    
    case_id = Column(Integer, primary_key=True)
    client_id = Column(Integer, ForeignKey("legal_clients.client_id"))
    firm_id = Column(Integer, ForeignKey("hospitals.hospital_id"))
    
    # Case Details
    case_number = Column(String, unique=True, index=True)
    case_title = Column(String, nullable=False)
    case_type = Column(String)  # Civil, Criminal, Corporate, Family, etc.
    
    # Court Details
    court_name = Column(String)
    court_location = Column(String)
    judge_name = Column(String)
    
    # Parties
    petitioner = Column(String)
    respondent = Column(String)
    
    # Status
    filing_date = Column(Date)
    status = Column(String)  # Filed, Pending, Hearing, Closed, Won, Lost
    priority = Column(String, default="medium")  # low, medium, high, urgent
    
    # Assignment
    primary_lawyer_id = Column(Integer, ForeignKey("users.user_id"))
    team_members = Column(JSON)  # List of user_ids
    
    # Description
    case_summary = Column(Text)
    legal_issues = Column(Text)
    
    client = relationship("LegalClient", back_populates="cases")
    hearings = relationship("CaseHearing", back_populates="case")
    documents = relationship("CaseDocument", back_populates="case")

class CaseHearing(Base):
    """Court hearings"""
    __tablename__ = "case_hearings"
    
    hearing_id = Column(Integer, primary_key=True)
    case_id = Column(Integer, ForeignKey("legal_cases.case_id"))
    
    hearing_date = Column(DateTime, nullable=False)
    hearing_type = Column(String)  # First Hearing, Arguments, Final Hearing
    
    # Details
    court_room = Column(String)
    judge_name = Column(String)
    outcome = Column(Text)
    next_hearing_date = Column(DateTime)
    
    # Attendance
    lawyer_attended = Column(Boolean, default=False)
    client_attended = Column(Boolean, default=False)
    
    notes = Column(Text)
    
    case = relationship("LegalCase", back_populates="hearings")

class CaseDocument(Base):
    """Legal documents"""
    __tablename__ = "case_documents"
    
    document_id = Column(Integer, primary_key=True)
    case_id = Column(Integer, ForeignKey("legal_cases.case_id"))
    
    document_type = Column(String)  # Petition, Affidavit, Evidence, Order, Judgment
    document_name = Column(String, nullable=False)
    file_path = Column(String)
    
    uploaded_date = Column(DateTime, server_default=func.now())
    uploaded_by = Column(Integer, ForeignKey("users.user_id"))
    
    is_confidential = Column(Boolean, default=False)
    
    case = relationship("LegalCase", back_populates="documents")

class LegalBilling(Base):
    """Legal fee billing"""
    __tablename__ = "legal_billing"
    
    bill_id = Column(Integer, primary_key=True)
    case_id = Column(Integer, ForeignKey("legal_cases.case_id"))
    client_id = Column(Integer, ForeignKey("legal_clients.client_id"))
    
    bill_date = Column(Date)
    
    # Charges
    consultation_fee = Column(Float, default=0)
    court_fee = Column(Float, default=0)
    documentation_fee = Column(Float, default=0)
    other_charges = Column(Float, default=0)
    
    subtotal = Column(Float)
    gst_amount = Column(Float)
    total_amount = Column(Float)
    
    # Payment
    paid_amount = Column(Float, default=0)
    balance = Column(Float)
    payment_status = Column(String, default="pending")
```

### Features
- Client management
- Case tracking
- Hearing calendar
- Document management
- Billing & invoicing
- Task management
- Time tracking
- Deadline reminders

---

## 📊 PHASE 7: CORPORATE - 10 Weeks
**Status**: 0% | **Start**: Week 57

### Database Schema
```python
class CorporateEmployee(Base):
    """Employee records"""
    __tablename__ = "corporate_employees"
    
    employee_id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("hospitals.hospital_id"))
    employee_code = Column(String, unique=True, index=True)
    
    # Personal
    full_name = Column(String, nullable=False)
    dob = Column(Date)
    gender = Column(String)
    phone = Column(String)
    email = Column(String)
    address = Column(Text)
    
    # Employment
    designation = Column(String)
    department = Column(String)
    joining_date = Column(Date)
    employment_type = Column(String)  # Permanent, Contract, Intern
    
    # Salary
    basic_salary = Column(Float)
    allowances = Column(JSON)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    documents = relationship("EmployeeDocument", back_populates="employee")
    attendance = relationship("Attendance", back_populates="employee")

class EmployeeDocument(Base):
    """Employee documents"""
    __tablename__ = "employee_documents"
    
    document_id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("corporate_employees.employee_id"))
    
    document_type = Column(String)  # Resume, ID Proof, Certificates, Contracts
    document_name = Column(String)
    file_path = Column(String)
    upload_date = Column(DateTime, server_default=func.now())
    
    employee = relationship("CorporateEmployee", back_populates="documents")

class Attendance(Base):
    """Daily attendance"""
    __tablename__ = "attendance"
    
    attendance_id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("corporate_employees.employee_id"))
    
    date = Column(Date, nullable=False)
    check_in = Column(DateTime)
    check_out = Column(DateTime)
    
    status = Column(String)  # Present, Absent, Half-day, Leave
    work_hours = Column(Float)
    
    employee = relationship("CorporateEmployee", back_populates="attendance")

class CorporateProject(Base):
    """Project management"""
    __tablename__ = "corporate_projects"
    
    project_id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("hospitals.hospital_id"))
    
    project_name = Column(String, nullable=False)
    project_code = Column(String, unique=True)
    description = Column(Text)
    
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String)  # Planning, Active, On-hold, Completed
    
    budget = Column(Float)
    spent = Column(Float, default=0)
    
    team_members = Column(JSON)  # List of employee_ids
    
    tasks = relationship("ProjectTask", back_populates="project")

class ProjectTask(Base):
    """Project tasks"""
    __tablename__ = "project_tasks"
    
    task_id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("corporate_projects.project_id"))
    
    task_name = Column(String, nullable=False)
    description = Column(Text)
    
    assigned_to = Column(Integer, ForeignKey("corporate_employees.employee_id"))
    priority = Column(String, default="medium")
    status = Column(String, default="todo")  # todo, in-progress, review, done
    
    due_date = Column(Date)
    completed_date = Column(Date)
    
    project = relationship("CorporateProject", back_populates="tasks")
```

### Features
- Employee management
- Document archival
- Attendance tracking
- Leave management
- Project management
- Task tracking
- Payroll integration
- Performance reviews

---

## 📊 PHASE 8: HMS (Hospital Management System) - 16 Weeks
**Status**: 0% | **Start**: Week 67

### Database Schema
```python
class IPDAdmission(Base):
    """In-patient admissions"""
    __tablename__ = "ipd_admissions"
    
    admission_id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("patients.patient_id"))
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"))
    
    admission_date = Column(DateTime)
    discharge_date = Column(DateTime)
    
    # Bed allocation
    ward_id = Column(Integer, ForeignKey("wards.ward_id"))
    bed_id = Column(Integer, ForeignKey("beds.bed_id"))
    
    # Medical
    admitting_doctor_id = Column(Integer, ForeignKey("users.user_id"))
    diagnosis = Column(Text)
    treatment_plan = Column(Text)
    
    status = Column(String)  # admitted, discharged, transferred

class Ward(Base):
    __tablename__ = "wards"
    
    ward_id = Column(Integer, primary_key=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"))
    ward_name = Column(String)  # ICU, General, Private
    ward_type = Column(String)
    total_beds = Column(Integer)
    occupied_beds = Column(Integer, default=0)

class Bed(Base):
    __tablename__ = "beds"
    
    bed_id = Column(Integer, primary_key=True)
    ward_id = Column(Integer, ForeignKey("wards.ward_id"))
    bed_number = Column(String)
    is_occupied = Column(Boolean, default=False)
```

### Features
- IPD management
- Bed allocation
- OT scheduling
- Pharmacy integration
- Lab integration
- Billing system
- Discharge summary
- Complete HMS

---

## 🏗️ IMPLEMENTATION STRATEGY

### Module Activation System
```python
# File: backend/app/models.py
class Hospital(Base):
    specialty = Column(String)  # MRD, Dental, ENT, Clinic, Pharma, Law, Corporate, HMS
    enabled_modules = Column(JSON, default=["core"])
    # Example: ["core", "mrd", "dental", "ent"]
```

### Dynamic Routing
```python
# File: backend/app/main.py
# Conditional router inclusion based on module
if "dental" in hospital.enabled_modules:
    app.include_router(dental.router)
if "ent" in hospital.enabled_modules:
    app.include_router(ent.router)
# ... etc
```

---

## 📅 COMPLETE TIMELINE

| Phase | Module | Weeks | Start | End |
|-------|--------|-------|-------|-----|
| 1 | MRD | 12 | 1 | 12 |
| 2 | Dental OPD | 8 | 13 | 20 |
| 3 | ENT OPD | 6 | 21 | 26 |
| 4 | Clinic OPD | 8 | 27 | 34 |
| 5 | Pharma Medical | 10 | 35 | 44 |
| 6 | Law Firm | 12 | 45 | 56 |
| 7 | Corporate | 10 | 57 | 66 |
| 8 | HMS | 16 | 67 | 82 |

**Total**: 82 weeks (~19 months)

---

## 🎯 PRICING STRATEGY

| Module | Base Price | Per User | Storage |
|--------|-----------|----------|---------|
| MRD | ₹10,000/mo | ₹500 | 100GB |
| Dental OPD | ₹8,000/mo | ₹400 | 50GB |
| ENT OPD | ₹7,000/mo | ₹400 | 50GB |
| Clinic OPD | ₹6,000/mo | ₹300 | 30GB |
| Pharma | ₹12,000/mo | ₹600 | 20GB |
| Law Firm | ₹15,000/mo | ₹800 | 200GB |
| Corporate | ₹20,000/mo | ₹1,000 | 500GB |
| HMS | ₹50,000/mo | ₹2,000 | 1TB |

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Total Modules**: 8  
**Total Duration**: 82 weeks
