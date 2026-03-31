# DIGIFORT LABS - Developer Handoff & Architecture

## Core Vision
DIGIFORT LABS is transitioning from a "Hospital PDF Archival Platform" to a **Complete AIO Data Processor**. The goal is a highly flexible, B2B Multi-Tenant SaaS that allows different types of organizations (Hospitals, Accountants, Law Firms, Corporations) to securely digitize files and extract key data using AI/OCR, tailored to their industry.

## Architectural Decision Log (ADL)

### 1. The Modular Paradigm
**Observation**: We cannot dynamically create PostgreSQL schemas per user or blindly rename core tables (like `hospitals`) in the live database without risking critical crashes and deployment failures.
**Action**: We are adopting a **Modular Add-On Architecture**.
- **The Core Backbone**: The `hospitals`, `patients`, and `pdf_files` tables act as the immutable core structure for all industries.
- **The Engine**: New organizations receive a `specialty` string (e.g., "Dental", "Accounting") and an `enabled_modules` JSON array (e.g., `["core", "accounting"]`).
- **The UI Reaction**: The Next.js frontend checks `enabled_modules` to dynamically reroute from standard `patients` UI into specialized routing (e.g., `/dashboard/dental` or `/dashboard/accounting`).
- **Data Extensibility**: Complex new industries will get highly tailored PostgreSQL tables (e.g., `custom_entities` or `accounting_ledgers`) that safely `FOREIGN KEY` link back to the core `hospitals.org_id`. This mimics enterprise ERPs like Salesforce and SAP.

## Backend Technical Details (FastAPI)
- **Port**: 8001
- **Database Connection**: `app/database.py` handles switching between SQLite local and PostgreSQL production.
- **Live Auto-Migrations**: Missing columns (like `enabled_modules`) are appended safely at startup inside `app/main.py` via `run_migrations()`.
- **Security**: JWT Bearer Tokens. Pydantic models validate all incoming requests.
- **Current Core Renaming Map** (We use these logically in code, even if the DB tables retain legacy names):
  - `Hospital` -> `Organization`
  - `Patient` -> `EntityRecord`
  - `DentalPatient` -> `CustomEntity`
  - `hospital_id` -> `org_id`

## Frontend Technical Details (Next.js 15)
- **Port**: 3000
- **Terminology UI Hook**: `useTerminology()` in the frontend context universally replaces hardcoded text (like "Patient") with the user's custom terminology (like "Client").
- **Admin Dashboard Route**: `/dashboard/organizations` (The Super Admin page where new clients are registered).

## Next Steps for AI Agent
1. When asked to implement a new feature for a new industry (like "Legal"), check if it can utilize standard 'core' structures.
2. If it requires highly complex data, build a new Module:
   - Create a new `{industry}_models.py` schema table.
   - Inject the new string into `enabled_modules` during registration in `hospital_mgmt`.
   - Build a specialized Next.js dashboard route.
