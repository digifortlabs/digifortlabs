# Technical Documentation - DIGIFORT LABS

## 1. Project Repository Structure
```text
/DIGIFORTLABS
├── backend/            # FastAPI application
│   ├── app/
│   │   ├── models.py   # SQLAlchemy database models
│   │   ├── routers/    # API endpoint definitions (auth, patients, dental, accounting, etc.)
│   │   ├── services/   # Business logic (ai_service, email_service, storage_service, icd11)
│   │   └── database.py # Connection logic & session management
│   ├── main.py         # Entry point & automated migrations
│   └── celery_app.py   # Background task worker
├── frontend/           # Next.js 16 application
│   ├── src/
│   │   ├── app/        # Dashboard, Login, and Global Pages
│   │   ├── components/ # Reusable React components
│   │   ├── context/    # Global State (Auth, Terminology)
│   │   └── hooks/      # useTerminology, useAuth
├── local_scanner/      # (Optional) Tool for local document ingest
└── docker-compose.yml  # Local stack orchestration
```

## 2. Backend Implementation (FastAPI)
- **Framework**: FastAPI with Pydantic for request/response validation.
- **ORM**: SQLAlchemy for database abstraction.
- **Authentication**: JWT Bearer Tokens. The `auth.py` router manages token creation and verification.
- **API Port**: 8000
- **Background Jobs**: Celery + Redis for OCR processing and long-running tasks.
- **Key Services**:
  - `StorageService`: Manages uploads to AWS S3 and tracks file metadata.
  - `AiService`: Extracts text and summaries using Google Gemini. Now supports dynamic configuration: pulls API keys per-tenant from the database, falling back to a global platform-level API key if none is set.
  - `Icd11Service`: Retrieves medical coding information internally.
  - `EmailService`: Manages outbound transitional communications.

## 3. Frontend Implementation (Next.js)
- **Framework**: Next.js 16.1 (React 19.2) with App Router.
- **Styling**: Tailwind CSS for responsive, modern UI, utilizing Shadcn/Radix UI.
- **Dynamic Content**:
  - `useTerminology()`: Hook that translates generic IDs into specialty-specific labels (e.g., `Patient` -> `Client` for Accounting).
  - Terminology definitions are managed in a central registry (likely `constants` or a DB-driven context).
- **State Management**: React Context API for lightweight, built-in state.

## 4. Database Schema Guidelines
### Core Backbone Tables (Legacy Names preserved for stability)
- `hospitals` (Logical: `Organizations`): Stores organization metadata, `specialty`, and `enabled_modules`.
- `patients` (Logical: `EntityRecords`): Stores the primary data subject for any organization.
- `pdf_files`: Stores digital file metadata and links to the `entity_record`.

### Adding a New Module (e.g., Legal)
1. **Model**: Create `legal_models.py` in `backend/app/models/`.
2. **Schema**: Use `ForeignKey` to link the new table back to `hospitals.id` or `patients.id`.
3. **Migration**: Ensure `run_migrations()` in `main.py` is updated if specific column additions are needed for existing tables.
4. **Frontend**: Add a new folder in `frontend/src/app/dashboard/legal` and update sidebar logic.

## 5. Development Environment Setup
### Backend
1. Initialize venv: `python -m venv .venv`
2. Install deps: `pip install -r backend/requirements.txt`
3. Set `.env`: Copy from [.env.example](file:///d:/Website/DIGIFORTLABS/.env.example) and set credentials (`DATABASE_URL`, `REDIS_URL`, `AWS_*`).
4. Start API: `uvicorn app.main:app --port 8000 --reload`
5. Start Worker: `celery -A app.celery_app worker --loglevel=info`

### Frontend
1. Install deps: `npm install`
2. Start Dev: `npm run dev` (Access at `http://localhost:3000`)
