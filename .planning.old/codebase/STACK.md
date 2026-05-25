# Technology Stack

**Analysis Date:** 2026-05-11

## Languages

**Primary:**
- TypeScript 5.x - Frontend application code (Next.js)
- Python >=3.8 - Backend application code (FastAPI)

**Secondary:**
- JavaScript - Configuration files (ESLint, PostCSS, etc.)
- SQL - Database migrations and queries (SQLAlchemy/Alembic)

## Runtime

**Environment:**
- Node.js 20.x - Frontend runtime
- Python 3.10+ - Backend runtime
- Docker - Infrastructure containerization (detected Dockerfiles)

**Package Manager:**
- npm (package.json, package-lock.json present)
- pip (requirements.txt, pyproject.toml present)

## Frameworks

**Core:**
- Next.js 16.x - Frontend framework
- React 19.x - UI library
- FastAPI - Backend web framework

**Styling:**
- Tailwind CSS 4.x - Utility-first CSS framework
- Radix UI - Primitive UI components
- Framer Motion / Lucide React - Animations and icons

**Testing:**
- Jest / React Testing Library - Frontend unit and integration tests
- Pytest - Backend testing

**Build/Dev:**
- SWC / Next.js Compiler - Frontend bundling
- Ruff - Python linting and formatting
- Alembic - Database migrations

## Key Dependencies

**Critical:**
- SQLAlchemy - Backend ORM
- Celery / Redis - Asynchronous task processing
- Three.js / @react-three/fiber - 3D rendering
- Google Generative AI - AI/LLM integration
- OpenCV / Pytesseract - Computer vision and OCR

**Infrastructure:**
- Axios - HTTP client for frontend
- Boto3 - AWS SDK for Python
- Pydantic - Data validation for backend

## Configuration

**Environment:**
- `.env` files - Environment variable management
- `pyproject.toml` / `alembic.ini` - Backend configuration
- `next.config.mjs` / `tsconfig.json` - Frontend configuration

## Platform Requirements

**Development:**
- Windows/macOS/Linux
- Python 3.8+
- Node.js 20+
- Docker (optional but recommended)

**Production:**
- Dockerized containers
- Likely AWS (given boto3 and deploy scripts)

---

*Stack analysis: 2026-05-11*
*Update after major dependency changes*
