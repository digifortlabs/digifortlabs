# THE DIGIFORT LABS - AIO Data Processor

## Key Features (Current Status)
- **8 Specialized Modules**: MRD, Dental OPD, ENT OPD, Clinic OPD, Pharma, Legal, Corporate, HMS
- **Backend Complete**: 100% API implementation across all modules
- **Frontend Complete**: 100% UI implementation across all modules
- **Hybrid Storage**: Unified view of Physical Boxes (Warehouse) and Digital Files (Cloud)
- **Smart Analytics**: "Space Saved" calculator showing ROI from digitization
- **OCR Search**: Search functionality for document content (e.g., "Pneumonia")
- **Multi-Tenant Security**: JWT Authentication with role-based access control
- **Production Ready**: ALL 8 modules ready for production deployment

## Prerequisites
- Python 3.9+
- Node.js 18+
- SQLite (Included via Python)

## Quick Start (Production)
Run the automated start script for Windows:
```bash
start_production.bat
```
*(See `handoff.md` for detailed manual setup)*


## Architecture (AIO Modular Design)
DIGIFORT LABS operates on a **Modular B2B Multi-Tenant SaaS Architecture**. The platform is designed to serve as an "All-In-One (AIO) Data Processor" for varied industries (Hospitals, Dental, ENT, Clinics, Pharma, Legal, Corporate) using a core backbone combined with specialized module tables.

### Implementation Status
- **Backend**: 100% Complete ✅ (All 8 modules)
- **Frontend**: 100% Complete ✅ (All 8 modules)
- **Database**: All models implemented ✅
- **API Endpoints**: All functional with authentication ✅

### 1. Technology Stack
- **Backend:** FastAPI (Python) - Port 8001
- **Database:** PostgreSQL (Live via AWS) / SQLite (Local Dev fallback)
  - **Core Tables**: `organizations` (historically `hospitals`), `users`, `entity_records` (historically `patients`), `pdf_files`.
  - **Modular Tables**: Domain-specific tables plug into the Core (e.g., `custom_entities` for Dental, which link to `organizations`).
- **Frontend:** Next.js 15 + React 19 + Tailwind CSS - Port 3000

### 2. AIO Modular System
When a new Organization registers, they are assigned to a specific **Specialty** (e.g., Dental, ENT, Clinic, Pharma, Legal, Corporate, HMS).
- **Database Strategy**: We use predefined specialized tables for each module that activate based on the Organization's `enabled_modules` JSON field (e.g., `["core", "mrd", "dental", "ent"]`).
- **Backend Strategy**: Each module has its own dedicated router (`/dental`, `/ent`, `/clinic`, `/pharma`, `/legal`, `/corporate`, `/hms`) with full CRUD operations.
- **Frontend Strategy**: The Next.js frontend dynamically shows/hides Sidebar routes based on the active `enabled_modules`. Each module has its own frontend pages under `/dashboard/{module}/`.

### Available Modules
- **MRD**: Medical Records Department (100% complete)
- **Dental OPD**: Dental practice management (100% complete)
- **ENT OPD**: ENT clinic with audiometry (100% complete)
- **Clinic OPD**: General clinic operations (100% complete)
- **Pharma**: Pharmacy inventory & POS (100% complete)
- **Legal**: Law firm case management (100% complete)
- **Corporate**: Employee & project management (100% complete)
- **HMS**: Hospital management system (100% complete)

### 3. Login & Role Structure
Authentication uses JWT Bearer Tokens and involves multiple hierarchy layers:
- **`superadmin`**: Digifort Labs owners. Can view and manage *all* registered organizations and module configurations.
- **`hospital_admin` / `org_admin`**: The Admin user of a specific purchased platform instance. They can manage their own organization's settings and add staff.
- **Staff Roles** (`hospital_staff`, `warehouse_manager`): Restricted access to standard operational features (uploading files, moving physical boxes).

> **Full Documentation**: See [docs/](./docs/) folder for complete implementation status, roadmaps, and technical details.
> - [FEATURE_IMPLEMENTATION_ROADMAP.md](./docs/FEATURE_IMPLEMENTATION_ROADMAP.md) - Complete module status
> - [MODULE_IMPLEMENTATION_STATUS.md](./docs/MODULE_IMPLEMENTATION_STATUS.md) - Detailed progress report
> - [QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md) - API endpoints and usage
