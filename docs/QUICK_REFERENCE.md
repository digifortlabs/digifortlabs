# DIGIFORT LABS - Quick Reference Guide
**Last Updated**: January 2025  
**Version**: 4.0

---

## 🎯 PROJECT STATUS AT A GLANCE

### Overall Completion
- **Backend**: 100% ✅
- **Frontend**: 40% 🟡
- **Database**: 100% ✅
- **Overall**: 60% 🟡

### Module Status
| Module | Status | Production Ready |
|--------|--------|------------------|
| MRD | 100% ✅ | Ready Now |
| Dental OPD | 40% 🟡 | 45 days |
| ENT OPD | 30% 🟡 | 60 days |
| Clinic OPD | 25% 🟡 | 35 days |
| Pharma Manufacturers | 25% 🟡 | 50 days |
| Legal | 25% 🟡 | 55 days |
| Corporate | 25% 🟡 | 65 days |
| HMS | 25% 🟡 | 112 days |

---

## 🚀 QUICK START

### Development Setup
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# Frontend
cd frontend
npm install
npm run dev

# Full Stack (Docker)
docker-compose up -d
```

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/digifort
SECRET_KEY=your-secret-key
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
REDIS_URL=redis://localhost:6379

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8001
```

---

## 📡 API ENDPOINTS

### Authentication
```
POST   /auth/login              # User login
POST   /auth/logout             # User logout
POST   /auth/refresh            # Refresh token
POST   /auth/reset-password     # Password reset
```

### MRD Module (Patients)
```
GET    /patients                # List all patients
POST   /patients                # Create patient
GET    /patients/{id}           # Get patient details
PUT    /patients/{id}           # Update patient
DELETE /patients/{id}           # Delete patient
GET    /patients/search         # Search patients
POST   /patients/{id}/upload    # Upload document
```

### Dental Module
```
POST   /dental/patients         # Register dental patient
GET    /dental/patients         # List dental patients
POST   /dental/treatments       # Add treatment
GET    /dental/treatments/{id}  # Get treatments
POST   /dental/3d-scans         # Upload 3D scan
GET    /dental/appointments     # List appointments
```

### ENT Module
```
POST   /ent/patients            # Register ENT patient
GET    /ent/patients            # List ENT patients
POST   /ent/audiometry          # Record audiometry test
GET    /ent/audiometry/{id}     # Get test results
POST   /ent/surgeries           # Schedule surgery
GET    /ent/surgeries/calendar  # Surgery calendar
```

### Clinic OPD Module
```
POST   /clinic/patients         # Register OPD patient
GET    /clinic/patients         # List OPD patients
POST   /clinic/visits           # Record visit
GET    /clinic/visits/{id}      # Get patient visits
POST   /clinic/prescriptions    # Add prescription
GET    /clinic/stats            # Clinic statistics
```

### Pharma Manufacturers Module
```
POST   /pharma/medicines        # Add medicine product
GET    /pharma/medicines        # List medicine catalog
POST   /pharma/stock            # Add production batch
GET    /pharma/stock/expiring   # Expiring batches
POST   /pharma/sales            # Record B2B sale
GET    /pharma/stats            # Manufacturing statistics
```

### Legal Module
```
POST   /legal/clients           # Register client
GET    /legal/clients           # List clients
POST   /legal/cases             # Create case
GET    /legal/cases             # List cases
POST   /legal/hearings          # Schedule hearing
GET    /legal/hearings/upcoming # Upcoming hearings
```

### Corporate Module
```
POST   /corporate/employees     # Register employee
GET    /corporate/employees     # List employees
POST   /corporate/attendance    # Mark attendance
GET    /corporate/attendance/{id} # Attendance records
POST   /corporate/projects      # Create project
GET    /corporate/projects      # List projects
```

### HMS Module
```
POST   /hms/wards               # Create ward
GET    /hms/wards               # List wards
POST   /hms/beds                # Add bed
GET    /hms/beds/available      # Available beds
POST   /hms/admissions          # Admit patient
GET    /hms/admissions          # List admissions
```

---

## 🗄️ DATABASE MODELS

### Core Models
- **Hospital**: Multi-tenant organization
- **User**: Authentication and roles
- **AuditLog**: Activity tracking

### MRD Module
- **Patient**: Patient records
- **PDFFile**: Document storage
- **PhysicalBox**: Warehouse boxes
- **PhysicalRack**: Storage locations

### Dental Module
- **DentalPatient**: Dental records
- **DentalTreatment**: Procedures
- **Dental3DScan**: 3D imaging
- **TreatmentPlan**: Planning

### ENT Module
- **ENTPatient**: ENT records
- **AudiometryTest**: Hearing tests
- **ENTExamination**: Examinations
- **ENTSurgery**: Surgery scheduling

### Clinic Module
- **OPDPatient**: OPD registration
- **OPDVisit**: Visit management
- **Prescription**: Prescriptions

### Pharma Manufacturers Module
- **PharmaMedicine**: Medicine product catalog
- **PharmaStock**: Production batch inventory
- **PharmaSale**: B2B sales to distributors
- **PharmaSaleItem**: Sale line items

### Legal Module
- **LegalClient**: Client management
- **LegalCase**: Case tracking
- **CaseHearing**: Hearing schedule
- **CaseDocument**: Documents

### Corporate Module
- **CorporateEmployee**: Employee records
- **EmployeeDocument**: Documents
- **Attendance**: Time tracking
- **CorporateProject**: Projects

### HMS Module
- **Ward**: Ward management
- **Bed**: Bed allocation
- **IPDAdmission**: Patient admissions

---

## 🔐 AUTHENTICATION

### User Roles
- **super_admin**: Platform-wide access
- **hospital_admin**: Hospital management
- **hospital_staff**: Day-to-day operations
- **warehouse_manager**: Physical storage
- **viewer**: Read-only access

### JWT Token Structure
```json
{
  "sub": "user@example.com",
  "role": "hospital_admin",
  "hospital_id": 1,
  "session_id": "uuid",
  "exp": 1234567890
}
```

### Protected Routes
```python
from app.routers.auth import get_current_user

@router.get("/protected")
def protected_route(
    current_user: User = Depends(get_current_user)
):
    return {"user": current_user.email}
```

---

## 📁 PROJECT STRUCTURE

```
DIGIFORTLABS/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── database.py          # DB connection
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── routers/             # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── patients.py      # MRD
│   │   │   ├── dental.py
│   │   │   ├── ent.py
│   │   │   ├── clinic.py
│   │   │   ├── pharma.py
│   │   │   ├── legal.py
│   │   │   ├── corporate.py
│   │   │   └── hms.py
│   │   ├── services/            # Business logic
│   │   └── core/                # Config
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js pages
│   │   │   ├── dashboard/
│   │   │   │   ├── patients/    # MRD
│   │   │   │   ├── dental/
│   │   │   │   └── ...
│   │   ├── components/          # React components
│   │   └── lib/                 # Utilities
│   └── package.json
└── docs/                        # Documentation
```

---

## 🛠️ TECH STACK

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL / SQLite
- **ORM**: SQLAlchemy
- **Auth**: JWT with RSA keys
- **Tasks**: Celery + Redis
- **OCR**: Tesseract + Google Gemini
- **Storage**: AWS S3

### Frontend
- **Framework**: Next.js 15
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Components**: Radix UI
- **HTTP**: Axios
- **Charts**: Recharts

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions (planned)

---

## 📊 KEY METRICS

### Performance
- API Response: <2s
- File Upload: <30s
- Search: <1s
- Uptime: 99.8%

### Scale
- Hospitals: 3 active
- Patients: 2,500+
- Documents: 15,000+
- OCR Accuracy: 95%+

---

## 🔧 COMMON TASKS

### Create New Patient
```python
POST /patients
{
  "full_name": "John Doe",
  "date_of_birth": "1990-01-01",
  "gender": "Male",
  "phone_number": "1234567890",
  "address": "123 Main St"
}
```

### Upload Document
```python
POST /patients/{id}/upload
Content-Type: multipart/form-data
file: <PDF file>
```

### Search Patients
```python
GET /patients/search?q=john&hospital_id=1
```

### Generate Invoice
```python
POST /accounting/invoices
{
  "patient_id": 1,
  "items": [...],
  "gst_applicable": true
}
```

---

## 🐛 TROUBLESHOOTING

### Backend Not Starting
```bash
# Check database connection
psql -U user -d digifort -h localhost

# Check Redis
redis-cli ping

# View logs
docker-compose logs backend
```

### Frontend Build Errors
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Database Migration Issues
```bash
# Run migrations
python backend/maintenance_scripts/migrate_db.py

# Check schema
python backend/maintenance_scripts/check_db_schema.py
```

---

## 📚 DOCUMENTATION

### Full Documentation
- [PROJECT_STATUS_REPORT.md](./PROJECT_STATUS_REPORT.md)
- [MODULE_IMPLEMENTATION_STATUS.md](./MODULE_IMPLEMENTATION_STATUS.md)
- [FEATURE_IMPLEMENTATION_ROADMAP.md](./FEATURE_IMPLEMENTATION_ROADMAP.md)
- [MRD_module.md](./MRD_module.md)

### Module-Specific Docs
- [Dental_OPD_module.md](./Dental_OPD_module.md)
- [ENT_OPD_module.md](./ENT_OPD_module.md)
- [Clinic_OPD_module.md](./Clinic_OPD_module.md)
- [Pharma_Medical_module.md](./Pharma_Medical_module.md)
- [Law_Firm_module.md](./Law_Firm_module.md)
- [Corporate_module.md](./Corporate_module.md)
- [HMS_module.md](./HMS_module.md)

---

## 🎯 NEXT STEPS

### Immediate (This Week)
1. Deploy MRD to production
2. Test all API endpoints
3. Performance optimization
4. Security audit

### Short-term (This Month)
1. Complete Clinic OPD frontend
2. Complete Pharma frontend
3. Complete ENT frontend
4. Enhance Dental frontend

### Long-term (This Quarter)
1. Launch all 8 modules
2. Onboard 50+ clients
3. Achieve ₹22L/month revenue
4. Expand to new industries

---

**Document Version**: 4.0  
**Last Updated**: January 2025  
**Maintained By**: DIGIFORT LABS Team
