# Directory Structure

**Analysis Date:** 2026-05-11

## Root Layout

```text
.
├── backend/            # Python/FastAPI Backend
├── frontend/           # Next.js Frontend
├── information/        # Project documentation and resources
├── local_scanner/      # Local scanner utility (likely for hardware integration)
├── .planning/          # GSD Planning and State tracking
├── .git/               # Version control
├── .gitignore          # Git exclusion rules
├── docker-compose.yml  # Container orchestration (assumed)
└── README.md           # Project entry point
```

## Backend Structure (`backend/`)

```text
backend/
├── alembic/            # Database migration scripts
│   └── versions/       # Individual migration files
├── app/                # Main application source
│   ├── core/           # Config, security, and global settings
│   ├── middleware/     # FastAPI middleware (CORS, Auth, etc.)
│   ├── models/         # Pydantic schemas (if separate)
│   ├── models.py       # SQLAlchemy ORM models (monolith file)
│   ├── routers/        # API route handlers
│   ├── services/       # Business logic and external integrations
│   │   ├── scanner/    # Document scanning and OCR logic
│   │   └── ...         # AI, Storage, Email, etc.
│   ├── seeds/          # Initial database data
│   ├── tests/          # Pytest suite
│   ├── main.py         # Application entry point
│   └── database.py     # Database session and engine setup
├── scripts/            # Utility and maintenance scripts
├── pyproject.toml      # Project metadata and tool config
└── requirements.txt    # Python dependencies
```

## Frontend Structure (`frontend/`)

```text
frontend/
├── public/             # Static assets (images, fonts)
├── src/                # Frontend source code
│   ├── app/            # Next.js App Router pages and layouts
│   │   ├── (auth)/     # Authentication routes
│   │   ├── dashboard/  # Main dashboard modules (HMS, Dental, Records, etc.)
│   │   ├── api/        # Next.js API routes (if any)
│   │   └── layout.tsx  # Root layout
│   ├── components/     # Reusable React components
│   │   ├── dashboard/  # Dashboard-specific components
│   │   ├── ui/         # Shadcn/UI primitive components
│   │   └── ...         # Feature-specific components (Scanner, Auth, etc.)
│   ├── hooks/          # Custom React hooks (assumed)
│   ├── lib/            # Utility functions and shared logic (assumed)
│   ├── types/          # TypeScript definitions
│   └── context/        # React Context providers (assumed)
├── next.config.mjs     # Next.js configuration
├── package.json        # Frontend dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## Key Locations

- **Database Models**: `backend/app/models.py`
- **API Routes**: `backend/app/routers/`
- **Business Logic**: `backend/app/services/`
- **Dashboard UI**: `frontend/src/app/dashboard/`
- **Common UI**: `frontend/src/components/ui/`
- **Scanner Logic**: `backend/app/services/scanner/` and `frontend/src/components/Scanner/`

---

*Structure analysis: 2026-05-11*
*Update when moving major directories or adding new top-level modules*
