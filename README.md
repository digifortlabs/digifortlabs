# THE DIGIFORT LABS - AIO Data Processor

## Key Features (Pilot Phase)
- **Hybrid Storage**: Unified view of Physical Boxes (Warehouse) and Digital Files (Cloud).
- **Physical Warehouse**: Track box locations, check-in/out status, and request physical retrievals.
- **Smart Analytics**: "Space Saved" calculator showing ROI from digitization.
- **OCR Search**: Search functionality for document content (e.g., "Pneumonia").
- **Security**: JWT Authentication for Hospital Admins.

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
DIGIFORT LABS operates on a **Modular B2B Multi-Tenant SaaS Architecture**. The platform is designed to serve as an "All-In-One (AIO) Data Processor" for varied industries (Hospitals, Dental, Accounting, Legal, Corporate) using a core backbone combined with specialized module tables.

### 1. Technology Stack
- **Backend:** FastAPI (Python) - Port 8001
- **Database:** PostgreSQL (Live via AWS) / SQLite (Local Dev fallback)
  - **Core Tables**: `organizations` (historically `hospitals`), `users`, `entity_records` (historically `patients`), `pdf_files`.
  - **Modular Tables**: Domain-specific tables plug into the Core (e.g., `custom_entities` for Dental, which link to `organizations`).
- **Frontend:** Next.js 15 + React 19 + Tailwind CSS - Port 3000

### 2. AIO Modular System
When a new Organization registers, they are assigned to a specific **Specialty** (e.g., Dental, Law Firm, Accounting).
- **Database Strategy**: We NEVER dynamically generate new tables per user or rename core tables. Instead, we use predefined specialized tables (e.g., `custom_entities`, `accounting_ledgers`) that activate based on the Organization's `enabled_modules` JSON field (e.g., `["core", "dental"]`).
- **Frontend Strategy**: The Next.js frontend uses generic terminology (driven by `useTerminology`) and dynamically shows/hides Sidebar routes based on the active Specialty/`enabled_modules`. The core backend schemas handle generic routing, while specialized modules hit dedicated API routers (e.g., `/dental`).

### 3. Login & Role Structure
Authentication uses JWT Bearer Tokens and involves multiple hierarchy layers:
- **`superadmin`**: Digifort Labs owners. Can view and manage *all* registered organizations and module configurations.
- **`hospital_admin` / `org_admin`**: The Admin user of a specific purchased platform instance. They can manage their own organization's settings and add staff.
- **Staff Roles** (`hospital_staff`, `warehouse_manager`): Restricted access to standard operational features (uploading files, moving physical boxes).

> **Full Documentation**: See [handoff.md](./handoff.md) for deeper historical architecture, security details, and roadmap.
