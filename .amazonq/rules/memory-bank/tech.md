# Technology Stack

## Programming Languages

### Backend
- **Python 3.9+** - Primary backend language
  - Type hints used throughout for better IDE support
  - Async/await for concurrent operations

### Frontend
- **TypeScript 5.x** - Strongly typed JavaScript
  - Strict mode enabled for type safety
  - React 19.2.3 with TypeScript definitions

### Desktop Application
- **Python 3.9+** - PyQt5-based Windows application
  - Compiled to .exe using PyInstaller

## Backend Technology Stack

### Core Framework
- **FastAPI** - Modern async web framework
  - Automatic OpenAPI documentation
  - Pydantic for request/response validation
  - Native async/await support

### Web Server
- **Uvicorn** - ASGI server for development
- **Gunicorn** - Production WSGI server with Uvicorn workers
  - Configuration in `gunicorn_conf.py`

### Database
- **SQLAlchemy 2.x** - ORM and database toolkit
  - Declarative models in `models.py`
  - Session management with dependency injection
- **SQLite** - Development database (file-based)
- **PostgreSQL** - Production database (via psycopg2-binary)

### Authentication & Security
- **python-jose[cryptography]** - JWT token generation/validation
  - RSA key pair signing (keys in `backend/keys/`)
- **passlib[bcrypt]** - Password hashing
  - bcrypt==3.2.2 pinned for stability
- **email-validator** - Email format validation
- **dnspython** - DNS-based email verification

### Cloud Services
- **boto3** - AWS SDK for Python
  - S3 for document storage
  - Configurable via environment variables

### Background Processing
- **Celery** - Distributed task queue
  - Redis as message broker
  - Used for OCR processing, video conversion

### Document Processing
- **pypdf** - PDF manipulation and text extraction
- **pytesseract** - OCR engine wrapper (Tesseract)
- **pdf2image** - Convert PDF pages to images for OCR
- **Pillow** - Image processing library
- **opencv-python-headless** - Computer vision operations
- **numpy** - Numerical operations for image processing
- **scipy** - Scientific computing utilities
- **pylsd-nova** - Line segment detection

### AI/ML
- **google-generativeai** - Google Gemini AI integration
  - Advanced OCR and document understanding

### Video Processing
- **moviepy** - Video editing and conversion
- **imageio-ffmpeg** - FFmpeg wrapper for video codecs

### File Handling
- **python-multipart** - Multipart form data parsing (file uploads)

### Configuration
- **python-dotenv** - Environment variable management from .env files
- **pydantic[email]** - Settings management and validation

### Testing
- **pytest** - Testing framework
- **pytest-asyncio** - Async test support
- **httpx** - Async HTTP client for testing
- **requests** - Synchronous HTTP client

### Code Quality
- **ruff** - Fast Python linter and formatter
  - Replaces flake8, black, isort

## Frontend Technology Stack

### Core Framework
- **Next.js 16.1.6** - React framework with App Router
  - Server-side rendering (SSR)
  - Static site generation (SSG)
  - API routes (not used, backend is separate)
- **React 19.2.3** - UI library
- **React DOM 19.2.3** - React renderer

### Styling
- **Tailwind CSS 4.x** - Utility-first CSS framework
  - Custom configuration in `tailwind.config.js`
  - PostCSS processing
- **@tailwindcss/postcss** - Tailwind PostCSS plugin
- **class-variance-authority** - Component variant management
- **clsx** - Conditional className utility
- **tailwind-merge** - Merge Tailwind classes intelligently

### UI Components
- **Radix UI** - Headless component primitives
  - @radix-ui/react-dialog - Modal dialogs
  - @radix-ui/react-label - Form labels
  - @radix-ui/react-slot - Component composition
  - @radix-ui/react-tabs - Tab navigation
  - @radix-ui/react-toast - Toast notifications
- **lucide-react** - Icon library (0.562.0)

### Data Visualization
- **recharts 3.6.0** - Chart library for analytics dashboard

### Document Handling
- **react-pdf 10.3.0** - PDF viewer component
- **jspdf 4.0.0** - PDF generation in browser

### 3D Visualization
- **three 0.182.0** - 3D graphics library
- **@react-three/fiber 9.5.0** - React renderer for Three.js
- **@react-three/drei 10.7.7** - Three.js helpers and abstractions
- **@types/three** - TypeScript definitions

### Media Capture
- **react-webcam 7.2.0** - Webcam access component
- **html5-qrcode 2.3.8** - QR code scanning
- **react-qr-code 2.0.18** - QR code generation

### Image Processing
- **browser-image-compression 2.0.2** - Client-side image compression

### HTTP Client
- **axios 1.6.0** - Promise-based HTTP client
  - Configured in `src/lib/api.ts`
  - Interceptors for auth tokens

### Utilities
- **date-fns 4.1.0** - Date manipulation and formatting

### Development Tools
- **TypeScript 5.x** - Type checking
- **ESLint 9.x** - Code linting
  - eslint-config-next - Next.js-specific rules
- **Jest 30.2.0** - Testing framework
  - @testing-library/react - React component testing
  - @testing-library/jest-dom - DOM matchers
  - jest-environment-jsdom - Browser environment simulation
  - ts-jest - TypeScript support for Jest

## Desktop Scanner Stack

### GUI Framework
- **PyQt5** - Cross-platform GUI toolkit
  - Native Windows look and feel

### Image Capture
- **opencv-python** - Webcam/scanner access
- **Pillow** - Image processing

### Packaging
- **PyInstaller** - Python to .exe compiler
  - Specification files: `DigifortScanner.spec`, `RegisterProtocol.spec`
- **Inno Setup** - Windows installer creator
  - Configuration: `setup.iss`

## Build Systems & Package Managers

### Backend
- **pip** - Python package installer
  - Dependencies in `requirements.txt`
- **pyproject.toml** - Modern Python project metadata

### Frontend
- **npm** - Node.js package manager
  - Dependencies in `package.json`
  - Lock file: `package-lock.json`

### Desktop
- **pip** - Python dependencies
- **PyInstaller** - Executable builder
- **Inno Setup** - Installer builder

## Development Commands

### Backend Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8001

# Run with Gunicorn (production-like)
gunicorn app.main:app -c gunicorn_conf.py

# Run tests
pytest

# Lint code
ruff check .

# Format code
ruff format .
```

### Frontend Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run tests
npm test
```

### Database Management
```bash
# Create initial data
python backend/create_initial_data.py

# Run migrations
python backend/maintenance_scripts/migrate_db.py

# Check database schema
python backend/maintenance_scripts/check_db_schema.py
```

### Desktop Scanner Build
```bash
# Build executable
BUILD_EXE.bat

# Creates: dist/DigifortScanner.exe
# Installer: Output/DigifortScanner_Setup.exe
```

## Environment Configuration

### Backend Environment Variables (.env)
```
DATABASE_URL=sqlite:///./digifortlabs.db
SECRET_KEY=<jwt-secret>
AWS_ACCESS_KEY_ID=<aws-key>
AWS_SECRET_ACCESS_KEY=<aws-secret>
AWS_REGION=ap-south-1
S3_BUCKET_NAME=<bucket-name>
ENVIRONMENT=development
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=<google-ai-key>
```

### Frontend Environment Variables (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## Deployment Stack

### Containerization
- **Docker** - Container runtime
  - Backend Dockerfile: Multi-stage Python build
  - Frontend Dockerfile: Node.js build + production server
- **Docker Compose** - Multi-container orchestration
  - Services: backend, frontend, redis, postgres

### Reverse Proxy
- **Nginx** - HTTP server and reverse proxy
  - Configuration: `nginx.conf.template`
  - SSL/TLS termination
  - Static file serving
  - Request routing to backend/frontend

### Production Database
- **PostgreSQL** - Relational database
  - Managed via Docker or AWS RDS

### Message Broker
- **Redis** - In-memory data store
  - Celery task queue backend
  - Rate limiting storage

## Version Requirements

### Minimum Versions
- Python 3.9+
- Node.js 18+
- PostgreSQL 12+ (production)
- Redis 6+ (for Celery)

### Pinned Versions (Critical)
- bcrypt==3.2.2 (compatibility with passlib)
- React 19.2.3 (latest stable)
- Next.js 16.1.6 (App Router features)
