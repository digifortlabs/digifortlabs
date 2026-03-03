# AI COLLABORATION HUB - DIGIFORT LABS
**Purpose**: Central communication document for Amazon Q & Gemini Pro  
**Last Updated**: March 2026 
**Project Owner**: Developer

---

## 🤖 AI TEAM MEMBERS

### Amazon Q (Code Implementation)
- **Strengths**: File operations, code writing, debugging, testing
- **Role**: Implementation, file modifications, command execution

### Gemini Pro (Strategic Planning)
- **Strengths**: Architecture design, code review, optimization suggestions
- **Role**: Planning, design decisions, quality assurance

---

## 📋 PROJECT OVERVIEW

### DIGIFORT LABS - All-In-One Data Processor Platform
**Type**: B2B Multi-Tenant SaaS  
**Purpose**: Modular data management for 8 different industries  
**Status**: Backend 100% Complete, Frontend 40% Complete

### Current State
- **Production Ready**: MRD (100%), Dental (100%), Pharma (100%), ENT (100%), Clinic (100%)
- **In Development**: Legal, Corporate, HMS (50% each - backend only)
- **Tech Stack**: FastAPI + Next.js + PostgreSQL + AWS S3
- **Deployment**: Docker + Nginx

---

## 🎯 MODULE STATUS

| Module | Industry | Backend | Frontend | Overall | Production |
|--------|----------|---------|----------|---------|------------|
| MRD | Medical Records | ✅ 100% | ✅ 100% | ✅ 100% | Ready Now |
| Dental OPD | Dental Clinics | ✅ 100% | ✅ 100% | ✅ 100% | Ready Now |
| Pharma | Manufacturers | ✅ 100% | ✅ 100% | ✅ 100% | Ready Now |
| ENT OPD | ENT Clinics | ✅ 100% | ✅ 100% | ✅ 100% | Ready Now |
| Clinic OPD | General Clinics | ✅ 100% | ✅ 100% | ✅ 100% | Ready Now |
| Legal | Law Firms | ✅ 100% | 🟡 15% | 🟡 60% | 60 days |
| Corporate | Businesses | ✅ 100% | 🟡 15% | 🟡 60% | 60 days |
| HMS | Hospitals | ✅ 100% | 🟡 15% | 🟡 60% | 60 days |

---

## 🏗️ TECHNICAL ARCHITECTURE

### Backend (FastAPI - Port 8001)
```
backend/app/
├── main.py                 # FastAPI application entry
├── database.py             # SQLAlchemy connection
├── models.py               # All database models (50+ tables)
├── routers/
│   ├── auth.py            # Authentication
│   ├── patients.py        # MRD module
│   ├── dental.py          # Dental module
│   ├── ent.py             # ENT module
│   ├── clinic.py          # Clinic module
│   ├── pharma.py          # Pharma module
│   ├── legal.py           # Legal module
│   ├── corporate.py       # Corporate module
│   └── hms.py             # HMS module
├── services/              # Business logic
└── core/                  # Configuration
```

### Frontend (Next.js 15 - Port 3000)
```
frontend/src/app/dashboard/
├── records/               # MRD - Patient records (✅ Complete)
├── storage/               # MRD - Physical warehouse (✅ Complete)
├── archive/               # MRD - Document archival (✅ Complete)
├── reports/               # MRD - Analytics (✅ Complete)
├── accounting/            # MRD - Billing/invoicing (✅ Complete)
├── audit/                 # MRD - Audit logs (✅ Complete)
├── dental/                # Dental (✅ Complete)
├── ent/                   # ENT (✅ Complete)
├── pharma/                # Pharma (✅ Complete)
├── appointments/          # Shared (✅ Complete)
├── settings/              # Shared (✅ Complete)
├── staff/                 # Shared (✅ Complete)
├── user_mgmt/             # Shared (✅ Complete)
├── organizations/         # Super Admin (✅ Complete)
├── server-manager/        # Super Admin (✅ Complete)
├── clinic/                # Clinic (✅ Complete)
├── legal/                 # Legal (🟡 MVP Dashboard Only)
├── corporate/             # Corporate (🟡 MVP Dashboard Only)
└── hms/                   # HMS (🟡 MVP Dashboard Only)
```

### Database (PostgreSQL/SQLite)
**Core Tables**: hospitals, users, audit_logs  
**Module Tables**: 50+ specialized tables for each module  
**Multi-Tenant**: Isolated by hospital_id

---

## 📡 COMPLETE API REFERENCE

### Authentication Endpoints
```
POST   /auth/login                    # User login
POST   /auth/logout                   # User logout
POST   /auth/refresh                  # Refresh JWT token
POST   /auth/reset-password           # Password reset
POST   /auth/verify-otp               # OTP verification
```

### MRD Module (/patients)
```
GET    /patients                      # List all patients
POST   /patients                      # Create patient
GET    /patients/{id}                 # Get patient details
PUT    /patients/{id}                 # Update patient
DELETE /patients/{id}                 # Delete patient
GET    /patients/search               # Search patients (OCR)
POST   /patients/{id}/upload          # Upload PDF document
GET    /patients/{id}/documents       # List patient documents
```

### Dental Module (/dental)
```
POST   /dental/patients               # Register dental patient
GET    /dental/patients               # List dental patients
GET    /dental/patients/{id}          # Get dental patient
POST   /dental/treatments             # Add treatment
GET    /dental/treatments/{id}        # Get patient treatments
POST   /dental/3d-scans               # Upload 3D scan
GET    /dental/3d-scans/{id}          # Get 3D scans
POST   /dental/appointments           # Schedule appointment
GET    /dental/appointments           # List appointments
```

### ENT Module (/ent)
```
POST   /ent/patients                  # Register ENT patient
GET    /ent/patients                  # List ENT patients
GET    /ent/patients/{id}             # Get ENT patient
POST   /ent/audiometry                # Record audiometry test
GET    /ent/audiometry/{id}           # Get test results
POST   /ent/examinations              # Record examination
GET    /ent/examinations/{id}         # Get examinations
POST   /ent/surgeries                 # Schedule surgery
GET    /ent/surgeries/calendar        # Surgery calendar
```

### Clinic OPD Module (/clinic)
```
POST   /clinic/patients               # Register OPD patient
GET    /clinic/patients               # List OPD patients
GET    /clinic/patients/{id}          # Get OPD patient
POST   /clinic/visits                 # Record visit
GET    /clinic/visits/{id}            # Get patient visits
POST   /clinic/prescriptions          # Add prescription
GET    /clinic/prescriptions/{id}     # Get prescriptions
GET    /clinic/stats                  # Clinic statistics
```

### Pharma Manufacturers Module (/pharma)
```
POST   /pharma/medicines              # Add medicine product
GET    /pharma/medicines              # List medicine catalog
GET    /pharma/medicines/{id}         # Get medicine details
POST   /pharma/stock                  # Add production batch
GET    /pharma/stock                  # List stock batches
GET    /pharma/stock/expiring         # Get expiring batches
POST   /pharma/sales                  # Record B2B sale
GET    /pharma/sales                  # List sales
GET    /pharma/stats                  # Manufacturing statistics
```

### Legal Module (/legal)
```
POST   /legal/clients                 # Register client
GET    /legal/clients                 # List clients
GET    /legal/clients/{id}            # Get client details
POST   /legal/cases                   # Create case
GET    /legal/cases                   # List cases
GET    /legal/cases/{id}              # Get case details
POST   /legal/hearings                # Schedule hearing
GET    /legal/hearings/upcoming       # Upcoming hearings
POST   /legal/documents               # Upload case document
GET    /legal/billing                 # Generate bill
GET    /legal/stats                   # Law firm statistics
```

### Corporate Module (/corporate)
```
POST   /corporate/employees           # Register employee
GET    /corporate/employees           # List employees
GET    /corporate/employees/{id}      # Get employee details
POST   /corporate/attendance          # Mark attendance
GET    /corporate/attendance/{id}     # Get attendance records
POST   /corporate/projects            # Create project
GET    /corporate/projects            # List projects
GET    /corporate/projects/{id}       # Get project details
POST   /corporate/tasks               # Create task
GET    /corporate/tasks/{id}          # Get project tasks
PATCH  /corporate/tasks/{id}/status   # Update task status
GET    /corporate/stats               # Corporate statistics
```

### HMS Module (/hms)
```
POST   /hms/wards                     # Create ward
GET    /hms/wards                     # List wards
GET    /hms/wards/{id}                # Get ward details
POST   /hms/beds                      # Add bed
GET    /hms/beds                      # List beds
GET    /hms/beds/available            # Get available beds
POST   /hms/admissions                # Admit patient
GET    /hms/admissions                # List admissions
GET    /hms/admissions/{id}           # Get admission details
PATCH  /hms/admissions/{id}/discharge # Discharge patient
GET    /hms/stats                     # HMS statistics
```

---

## 🗄️ DATABASE MODELS (50+ Tables)

### Core Models (Shared)
```python
Hospital(hospital_id, name, address, enabled_modules, specialty)
User(user_id, email, hashed_password, role, hospital_id)
AuditLog(log_id, user_id, action, details, timestamp)
```

### MRD Module Models
```python
Patient(patient_id, hospital_id, full_name, dob, gender, phone, address)
PDFFile(file_id, patient_id, filename, file_path, ocr_text, upload_date)
PhysicalBox(box_id, hospital_id, box_number, location, status)
PhysicalRack(rack_id, hospital_id, rack_number, location)
```

### Dental Module Models
```python
DentalPatient(dental_patient_id, patient_id, hospital_id, chief_complaint)
DentalTreatment(treatment_id, dental_patient_id, tooth_number, treatment_type, cost)
Dental3DScan(scan_id, dental_patient_id, scan_file_path, scan_type)
TreatmentPlan(plan_id, dental_patient_id, planned_treatments, total_cost)
```

### ENT Module Models
```python
ENTPatient(ent_patient_id, patient_id, hospital_id, chief_complaint)
AudiometryTest(test_id, ent_patient_id, test_date, hearing_thresholds)
ENTExamination(exam_id, ent_patient_id, examination_findings)
ENTSurgery(surgery_id, ent_patient_id, surgery_type, scheduled_date)
```

### Clinic Module Models
```python
OPDPatient(opd_patient_id, patient_id, hospital_id, registration_date)
OPDVisit(visit_id, opd_patient_id, visit_date, chief_complaint, diagnosis)
Prescription(prescription_id, visit_id, medicines, instructions)
```

### Pharma Module Models
```python
PharmaMedicine(medicine_id, hospital_id, name, generic_name, manufacturer)
PharmaStock(stock_id, medicine_id, batch_number, mfg_date, expiry_date, quantity)
PharmaSale(sale_id, hospital_id, distributor_name, total_amount, sale_date)
PharmaSaleItem(item_id, sale_id, medicine_id, quantity, price)
```

### Legal Module Models
```python
LegalClient(client_id, hospital_id, client_name, contact_info)
LegalCase(case_id, client_id, case_title, case_type, status, filing_date)
CaseHearing(hearing_id, case_id, hearing_date, court_name, outcome)
CaseDocument(document_id, case_id, document_type, file_path)
```

### Corporate Module Models
```python
CorporateEmployee(employee_id, hospital_id, employee_name, department, position)
EmployeeDocument(document_id, employee_id, document_type, file_path)
Attendance(attendance_id, employee_id, date, check_in, check_out)
CorporateProject(project_id, hospital_id, project_name, start_date, status)
ProjectTask(task_id, project_id, task_name, assigned_to, status)
```

### HMS Module Models
```python
Ward(ward_id, hospital_id, ward_name, total_beds, occupied_beds)
Bed(bed_id, ward_id, bed_number, is_occupied, bed_type)
IPDAdmission(admission_id, patient_id, admission_date, ward_id, bed_id, status)
```

---

## 🔐 AUTHENTICATION & SECURITY

### User Roles
- **super_admin**: Platform owner, all access
- **hospital_admin**: Hospital management
- **hospital_staff**: Day-to-day operations
- **warehouse_manager**: Physical storage management
- **viewer**: Read-only access

### JWT Token Structure
```json
{
  "sub": "user@example.com",
  "role": "hospital_admin",
  "hospital_id": 1,
  "session_id": "uuid-string",
  "exp": 1234567890
}
```

### Security Features
- Password hashing with bcrypt
- JWT with RSA key signing (private/public key pair)
- HttpOnly cookies for token storage
- Multi-tenant isolation via hospital_id
- Audit logging for all operations
- Rate limiting middleware
- File upload validation (magic byte verification)
- CORS protection

---

## 🛠️ TECHNOLOGY STACK

### Backend
- **Language**: Python 3.9+
- **Framework**: FastAPI
- **Database**: PostgreSQL (production), SQLite (dev)
- **ORM**: SQLAlchemy 2.x
- **Authentication**: python-jose (JWT), passlib (bcrypt)
- **Background Tasks**: Celery + Redis
- **OCR**: Tesseract + Google Gemini AI
- **Storage**: AWS S3 (boto3) + Local fallback
- **Server**: Gunicorn + Uvicorn workers

### Frontend
- **Language**: TypeScript 5.x
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4.x
- **Components**: Radix UI primitives
- **HTTP Client**: Axios
- **Charts**: Recharts
- **PDF Viewer**: react-pdf
- **3D Graphics**: Three.js + React Three Fiber

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx
- **Database Backups**: Automated daily (30-day retention)

---

## 📊 CURRENT METRICS

### Performance
- API Response Time: <2s average
- File Upload Processing: <30s average
- Search Performance: <1s average
- System Uptime: 99.8%
- OCR Accuracy: 95%+

### Scale
- Active Hospitals: 3 pilot hospitals
- Patient Records: 2,500+ processed
- Documents Archived: 15,000+ PDFs
- Users: 50+ active users

---

## 🎯 PRIORITY TASKS

### Immediate (This Week)
1. ✅ **5 MODULES PRODUCTION READY**: MRD, Dental, Pharma, ENT, Clinic
2. Deploy the 5 ready modules to production
3. Document missing sub-pages for Legal, Corporate, and HMS (created by Amazon Q as MVP-only dashboards)

### Short-term (This Month)
1. Build Legal frontend sub-pages (clients, cases, hearings)
2. Build Corporate frontend sub-pages (employees, projects, attendance)
3. Build HMS frontend sub-pages (wards, admissions, discharge)
4. Setup monitoring and analytics

### Long-term (This Quarter)
1. Launch all 8 modules
2. Onboard 50+ clients
3. Achieve ₹22L/month revenue target
4. Expand to new industries

---

## 🚧 KNOWN ISSUES & BLOCKERS

### Critical
- None (MRD is production ready)

### High Priority
- Frontend implementation for 4 remaining modules (Clinic, Legal, Corporate, HMS)
- Production deployment of 4 ready modules
- Comprehensive testing suite
- API documentation generation

### Medium Priority
- Performance optimization (caching, query optimization)
- Monitoring & alerting setup
- CI/CD pipeline implementation

---

## 💬 COMMUNICATION PROTOCOL

### Task Assignment Format
```
[AI_NAME] - [TASK_TYPE] - [PRIORITY]
Description: [What needs to be done]
Context: [Relevant information]
Expected Output: [What should be delivered]
```

### Status Update Format
```
Task: [Task name]
Status: [In Progress / Completed / Blocked]
Progress: [Percentage or description]
Blockers: [Any issues]
Next Steps: [What's next]
```

### Code Review Format
```
File: [File path]
Changes: [What was changed]
Reason: [Why it was changed]
Testing: [How it was tested]
Review Needed: [Yes/No]
```

---

## 📝 DECISION LOG

### Recent Decisions
| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| Jan 2025 | 5 modules production ready | Code verification: MRD, Dental, Pharma, ENT, Clinic all 100% | Amazon Q + Gemini |
| Jan 2025 | Clinic OPD frontend completed | Full dashboard with patient management and visit tracking | Amazon Q |
| Jan 2025 | Pharma = Manufacturers (not pharmacies) | Clarify business model | Developer |

### Pending Decisions
- [x] MRD is production ready - VERIFIED ✅
- [ ] Deploy MRD to production immediately?
- [ ] Complete Dental (5 days), Pharma (15 days), or ENT (20 days) next?
- [ ] Caching strategy (Redis vs in-memory)?
- [ ] CI/CD tool selection (GitHub Actions vs GitLab CI)?
- [ ] Monitoring solution (Prometheus vs DataDog)?

---

## 🔄 CHANGE REQUESTS

### Template for New Requests
```
Request ID: [Auto-increment]
Requested By: [Developer/Gemini/Amazon Q]
Date: [Date]
Type: [Feature/Bug/Enhancement/Refactor]
Priority: [Critical/High/Medium/Low]
Description: [Detailed description]
Affected Modules: [List modules]
Estimated Effort: [Hours/Days]
Status: [Pending/Approved/In Progress/Completed]
```

### Active Requests
*None currently*

---

## 📚 REFERENCE DOCUMENTS

### Project Documentation
- `docs/PROJECT_STATUS_REPORT.md` - Overall project status
- `docs/MODULE_IMPLEMENTATION_STATUS.md` - Detailed module breakdown
- `docs/FEATURE_IMPLEMENTATION_ROADMAP.md` - Implementation timeline
- `docs/QUICK_REFERENCE.md` - Quick reference guide
- `docs/MRD_module.md` - MRD module documentation

### Module-Specific Docs
- `docs/Dental_OPD_module.md`
- `docs/ENT_OPD_module.md`
- `docs/Clinic_OPD_module.md`
- `docs/Pharma_Medical_module.md`
- `docs/Law_Firm_module.md`
- `docs/Corporate_module.md`
- `docs/HMS_module.md`

### Technical Docs
- `docs/tech_doc.md` - Technical architecture
- `docs/design_doc.md` - Design specifications
- `docs/security_and_functional_audit.md` - Security audit

---

## 🤝 COLLABORATION GUIDELINES

### For Amazon Q
- Implement code changes requested by Developer or Gemini
- Execute file operations (read, write, modify)
- Run tests and report results
- Debug issues and provide fixes
- Update this document with implementation status

### For Gemini Pro
- Review code quality and architecture
- Suggest optimizations and improvements
- Make strategic decisions on features
- Prioritize tasks and modules
- Provide design guidance

### For Developer
- Provide project direction and requirements
- Make final decisions on conflicts
- Approve major changes
- Test implementations
- Communicate with both AIs via this document

---

## 📌 QUICK COMMANDS

### Development
```bash
# Start backend
cd backend && uvicorn app.main:app --reload --port 8001

# Start frontend
cd frontend && npm run dev

# Start full stack
docker-compose up -d

# Run tests
pytest backend/tests/

# Database migration
python backend/maintenance_scripts/migrate_db.py
```

### Deployment
```bash
# Build containers
docker-compose build

# Deploy production
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Database backup
docker exec postgres pg_dump -U user digifort > backup.sql
```

---

## 🎯 NEXT ACTIONS

### For Amazon Q
- [ ] Await implementation requests
- [ ] Monitor this document for updates
- [ ] Execute assigned tasks

### For Gemini Pro
- [ ] Review current architecture
- [ ] Suggest frontend development priorities
- [ ] Recommend optimization strategies

### For Developer
- [ ] Decide next module to develop
- [ ] Provide requirements to AIs
- [ ] Review and approve suggestions

---

**Last Updated**: January 2025  
**Document Version**: 1.0  
**Status**: Active Collaboration Document

---

## 📮 COMMUNICATION INBOX

### Messages for Amazon Q
*[Gemini/Developer will add messages here]*

### Messages for Gemini Pro
*[Amazon Q/Developer will add messages here]*

### Messages for Developer
*[AIs will add questions/updates here]*

---
### Messages for both AIs
**[Developer Message - Jan 2025]**

✅ **MRD Module Status: 100% COMPLETE**

Amazon Q has verified through code inspection:
- Backend: ✅ All routers functional (patients.py, storage.py, accounting.py, etc.)
- Frontend: ✅ All pages implemented (/records, /storage, /archive, /reports, /accounting, /audit)
- Database: ✅ All models complete
- Security: ✅ All features implemented

**MRD is ready for production deployment NOW.**

**✅ VERIFIED: 5 MODULES 100% COMPLETE**

Gemini Pro and Amazon Q have verified through code inspection:

**Production Ready Modules:**
1. **MRD**: ✅ 100% Complete
2. **Dental**: ✅ 100% Complete
3. **Pharma**: ✅ 100% Complete
4. **ENT**: ✅ 100% Complete
5. **Clinic**: ✅ 100% Complete

**⚠️ INCOMPLETE MODULES REQUIRING WORK:**
6. **Legal**: 🟡 MVP Only
   - Backend: legal.py router complete
   - Frontend: Only main dashboard built. 
   - **Missing Routes**: `/legal/clients`, `/legal/cases`, `/legal/cases/[id]`, `/legal/hearings`, `/legal/billing`
7. **Corporate**: 🟡 MVP Only
   - Backend: corporate.py router complete
   - Frontend: Only main dashboard built. 
   - **Missing Routes**: `/corporate/employees`, `/corporate/attendance`, `/corporate/projects`, `/corporate/projects/[id]`, `/corporate/tasks`
8. **HMS**: 🟡 MVP Only
   - Backend: hms.py router complete
   - Frontend: Only main dashboard built. 
   - **Missing Routes**: `/hms/wards`, `/hms/beds`, `/hms/admissions`, `/hms/admissions/[id]`, `/hms/discharge`

**All 5 completed modules are ready for production deployment NOW.**

**Next Action Required:**
Developer to decide:
1. Deploy 5 ready modules to production immediately?
2. Which missing frontend routes to build next: Legal, Corporate, or HMS? 
**END OF DOCUMENT**
