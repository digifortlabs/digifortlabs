# Project Structure

## Directory Organization

### Root Level
```
DIGIFORTLABS/
├── backend/              # FastAPI Python backend application
├── frontend/             # Next.js React frontend application
├── local_scanner/        # Windows desktop scanner application
├── docs/                 # Project documentation
├── .amazonq/             # Amazon Q AI assistant rules and memory bank
├── docker-compose.yml    # Multi-container orchestration
├── nginx.conf.template   # Reverse proxy configuration
└── *.pem                 # SSH keys for deployment (not in version control)
```

## Backend Structure (`backend/`)

### Core Application (`backend/app/`)
```
app/
├── main.py              # FastAPI application entry point, middleware, router registration
├── database.py          # SQLAlchemy engine, session management, database connection
├── models.py            # SQLAlchemy ORM models (Hospital, Patient, User, etc.)
├── utils.py             # Shared utility functions and helpers
├── audit.py             # Audit logging functionality
├── celery_app.py        # Celery task queue configuration
├── core/                # Core configuration and shared logic
│   ├── config.py        # Environment settings, AWS config, JWT secrets
│   ├── logging_config.py # Structured logging setup
│   └── security.py      # Password hashing, JWT token generation/validation
├── routers/             # API endpoint definitions (FastAPI routers)
│   ├── auth.py          # Login, logout, password reset, OTP verification
│   ├── hospitals.py     # Hospital CRUD, settings management
│   ├── patients.py      # Patient records, document upload, search
│   ├── users.py         # User management, role assignment
│   ├── storage.py       # Physical box management, retrieval requests
│   ├── accounting.py    # Invoice, receipt, expense management
│   ├── inventory.py     # Inventory items, stock tracking
│   ├── dental.py        # Dental-specific patient and treatment management
│   ├── scanner.py       # Document scanning service integration
│   ├── stats.py         # Analytics and dashboard metrics
│   ├── qa.py            # Quality assurance issue tracking
│   └── ...              # Additional specialized routers
├── services/            # Business logic layer
│   ├── storage_service.py    # Physical/digital storage operations
│   ├── ocr_service.py        # OCR processing with Tesseract/Gemini
│   ├── accounting_service.py # Invoice numbering, financial calculations
│   └── scanner/              # Document scanning and processing
│       ├── scanner_app.py    # Scanner service main logic
│       └── pyimagesearch/    # Image processing utilities
├── middleware/          # Custom FastAPI middleware
│   ├── security.py      # Rate limiting, security headers
│   └── bandwidth.py     # Bandwidth usage tracking
├── scripts/             # Utility scripts
├── seeds/               # Database seed data
└── tests/               # Unit and integration tests
```

### Supporting Directories
```
backend/
├── keys/                # RSA keys for JWT signing (private_key.pem, public_key.pem)
├── local_storage/       # Local file storage fallback (when AWS S3 unavailable)
│   └── drafts/          # Temporary upload staging area
├── logs/                # Application logs
│   ├── activity.log     # User activity logs
│   ├── auth.log         # Authentication events
│   └── system.log       # System-level logs
├── maintenance_scripts/ # Database migration and maintenance utilities
└── tools/               # Additional utility tools
```

### Configuration Files
- `requirements.txt` - Python dependencies
- `pyproject.toml` - Python project metadata
- `.env` / `.env.example` - Environment variables
- `gunicorn_conf.py` - Production WSGI server configuration
- `Dockerfile` - Container image definition

## Frontend Structure (`frontend/`)

### Source Code (`frontend/src/`)
```
src/
├── app/                 # Next.js 15 App Router pages
│   ├── layout.tsx       # Root layout with providers
│   ├── page.tsx         # Landing page
│   ├── login/           # Authentication pages
│   ├── dashboard/       # Main application dashboard
│   ├── patients/        # Patient management pages
│   ├── storage/         # Physical storage management
│   ├── accounting/      # Financial management pages
│   ├── inventory/       # Inventory management
│   ├── dental/          # Dental practice pages
│   ├── admin/           # Admin configuration pages
│   └── sitemap.ts       # SEO sitemap generation
├── components/          # Reusable React components
│   ├── ui/              # Base UI components (buttons, dialogs, forms)
│   ├── PatientForm.tsx  # Patient data entry
│   ├── DocumentViewer.tsx # PDF/document display
│   └── ...              # Feature-specific components
├── lib/                 # Utility libraries
│   ├── api.ts           # Axios API client configuration
│   └── utils.ts         # Helper functions
├── hooks/               # Custom React hooks
└── config/              # Frontend configuration
```

### Static Assets (`frontend/public/`)
- `logo/` - Brand assets
- `DigifortScanner_Setup.exe` - Desktop scanner installer
- `favicon.ico`, `*.svg` - Icons and graphics

### Configuration Files
- `package.json` - Node.js dependencies and scripts
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript compiler settings
- `tailwind.config.js` - Tailwind CSS configuration
- `eslint.config.mjs` - Code linting rules
- `Dockerfile` - Container image definition

## Desktop Scanner (`local_scanner/`)
```
local_scanner/
├── scanner_app.py       # Main PyQt5 scanner application
├── register_protocol.py # Custom URL protocol handler (digifort://)
├── requirements.txt     # Python dependencies
├── BUILD_EXE.bat        # PyInstaller build script
├── setup.iss            # Inno Setup installer configuration
└── *.spec               # PyInstaller specifications
```

## Core Components and Relationships

### Backend Architecture
1. **API Layer** (`routers/`) - Handles HTTP requests, validates input, returns responses
2. **Service Layer** (`services/`) - Contains business logic, orchestrates operations
3. **Data Layer** (`models.py`, `database.py`) - ORM models and database interactions
4. **Security Layer** (`core/security.py`, `middleware/`) - Authentication, authorization, rate limiting
5. **Background Tasks** (`celery_app.py`) - Asynchronous OCR processing, video conversion

### Frontend Architecture
1. **Page Components** (`app/`) - Next.js routes and page layouts
2. **UI Components** (`components/`) - Reusable React components
3. **API Client** (`lib/api.ts`) - Centralized backend communication
4. **State Management** - React hooks and context for local state

### Data Flow
```
User → Frontend (Next.js) → API (FastAPI) → Service Layer → Database (SQLite/PostgreSQL)
                                          ↓
                                    AWS S3 / Local Storage
                                          ↓
                                    Celery Workers (OCR)
```

## Architectural Patterns

### Backend Patterns
- **Layered Architecture**: Clear separation between routers, services, and data access
- **Dependency Injection**: Database sessions passed as dependencies to route handlers
- **Repository Pattern**: SQLAlchemy ORM abstracts database operations
- **Middleware Pipeline**: Security, rate limiting, bandwidth tracking applied globally
- **Background Processing**: Celery for long-running tasks (OCR, video processing)

### Frontend Patterns
- **Server-Side Rendering**: Next.js App Router with React Server Components
- **Component Composition**: Reusable UI components built with Radix UI primitives
- **API Abstraction**: Centralized Axios client with interceptors for auth tokens
- **Responsive Design**: Tailwind CSS utility-first styling

### Security Patterns
- **JWT Authentication**: Stateless token-based auth with RSA signing
- **Role-Based Access Control**: User roles (admin, staff, viewer) enforced at API level
- **Rate Limiting**: Per-endpoint request throttling
- **Audit Logging**: All sensitive operations logged to database
- **CORS Protection**: Whitelist-based origin validation

### Database Patterns
- **Single Database**: All hospitals share one database with tenant isolation via `hospital_id`
- **Soft Deletes**: Records marked as deleted rather than physically removed
- **Audit Trails**: Timestamps and user tracking on all modifications
- **Optimistic Locking**: Version fields for concurrent update detection
