# Development Guidelines

## Code Quality Standards

### Python Backend Standards

#### Import Organization
- Standard library imports first
- Third-party imports second (FastAPI, SQLAlchemy, etc.)
- Local application imports last (relative imports with `..`)
- Use explicit relative imports: `from ..core.config import settings`
- Group imports logically, separate with blank lines

Example from `auth.py`:
```python
import uuid
import random
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..core.config import settings
from ..database import get_db
from ..models import User, UserRole
```

#### Code Formatting
- Use 4 spaces for indentation (Python standard)
- Maximum line length: ~120 characters (flexible for readability)
- Use blank lines to separate logical sections within functions
- Add blank line before return statements in complex functions

#### Naming Conventions
- **Variables/Functions**: `snake_case` (e.g., `get_current_user`, `access_token`)
- **Classes**: `PascalCase` (e.g., `PasswordResetRequest`, `UserRole`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `REDIS_URL`, `IST`)
- **Private attributes**: Prefix with single underscore `_internal_method`
- **Database models**: Singular nouns (e.g., `User`, `Hospital`, `Patient`)

#### Documentation Standards
- Use docstrings for complex functions and classes
- Inline comments for non-obvious logic only
- Prefer self-documenting code over excessive comments
- Use print statements with emoji prefixes for logging: `print(f"🔐 [AUTH] Login attempt for: {email}")`

### TypeScript Frontend Standards

#### Import Organization
- React/Next.js imports first
- Third-party library imports second
- Local component imports third
- Type imports last (if separated)
- Use `@/` path alias for src directory imports

Example from `sitemap.ts`:
```typescript
import { MetadataRoute } from 'next'
```

#### Code Formatting
- Use 2 spaces for indentation (JavaScript/TypeScript standard)
- Semicolons required at end of statements
- Single quotes for strings (configurable)
- Trailing commas in multi-line objects/arrays

#### Naming Conventions
- **Variables/Functions**: `camelCase` (e.g., `baseUrl`, `uploadFile`)
- **Components**: `PascalCase` (e.g., `PatientForm`, `DocumentViewer`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_URL`)
- **Types/Interfaces**: `PascalCase` (e.g., `MetadataRoute`)
- **Files**: Match component name or use kebab-case for utilities

## Structural Conventions

### Backend Architecture Patterns

#### Router Structure
- One router per domain entity (auth, patients, hospitals, etc.)
- Use `APIRouter` with tags for OpenAPI grouping
- Define Pydantic models for request/response validation at top of file
- Route handlers should be thin - delegate to service layer for complex logic

Example pattern:
```python
router = APIRouter(tags=["auth"])

class RequestModel(BaseModel):
    field: str

@router.post("/endpoint")
async def handler(data: RequestModel, db: Session = Depends(get_db)):
    # Validate, call service, return response
    pass
```

#### Dependency Injection
- Use FastAPI `Depends()` for database sessions: `db: Session = Depends(get_db)`
- Use `Depends(oauth2_scheme)` for authentication
- Chain dependencies for role-based access control
- Database sessions automatically closed by FastAPI

#### Database Session Management
- Always use `db: Session = Depends(get_db)` in route handlers
- Commit explicitly after modifications: `db.commit()`
- Use `db.refresh(obj)` to reload object after commit
- Query with case-insensitive filters: `func.lower(User.email) == func.lower(email)`

#### Error Handling
- Raise `HTTPException` with appropriate status codes
- Use semantic status codes: 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)
- Include descriptive `detail` messages
- Log errors before raising exceptions
- Global exception handler in `main.py` catches unhandled errors

Example:
```python
if not user:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found"
    )
```

### Frontend Architecture Patterns

#### Component Structure
- Use functional components with hooks (no class components)
- Server Components by default in Next.js App Router
- Add `'use client'` directive only when needed (state, effects, browser APIs)
- Co-locate related components in feature directories

#### API Communication
- Centralize API calls in `lib/api.ts`
- Use `fetch` API for HTTP requests
- Include error handling in API functions
- Use environment variables for API URL: `process.env.NEXT_PUBLIC_API_URL`

Example:
```typescript
export async function uploadFile(file: File, patientId: number) {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${API_URL}/patients/${patientId}/upload`, {
        method: 'POST',
        body: formData,
    });
    
    if (!res.ok) {
        throw new Error('Upload failed');
    }
    
    return res.json();
}
```

#### State Management
- Use React hooks for local state (`useState`, `useEffect`)
- Context API for shared state across components
- No external state management library (Redux, Zustand) currently used

## Textual Standards

### Logging Conventions
- Use emoji prefixes for visual categorization:
  - 🔐 `[AUTH]` - Authentication events
  - 🐘 `[DB]` - Database operations
  - ⚠️ `[WARNING]` - Warnings
  - ❌ `[ERROR]` - Errors
  - ✅ `[SUCCESS]` - Success messages
  - 🔥 `[CRITICAL]` - Critical failures

Example:
```python
print(f"🔐 [AUTH] Login attempt for: {form_data.username}")
print(f"✅ Auto-migrations completed successfully.")
```

### Error Messages
- User-facing: Clear, actionable, non-technical
- Internal logs: Detailed with context and stack traces
- Security-sensitive: Generic messages to prevent information leakage

Example:
```python
# User-facing (generic)
raise HTTPException(
    status_code=401,
    detail="Incorrect username or password"
)

# Internal log (detailed)
log_audit(db, None, "LOGIN_FAILED", f"User not found: {form_data.username}")
```

### API Response Format
- Success: Return data directly or wrapped in `{"message": "...", "data": {...}}`
- Error: FastAPI automatically formats as `{"detail": "error message"}`
- Lists: Return array directly or wrapped in `{"items": [...], "total": count}`

## Practices Followed Throughout Codebase

### Security Practices

#### Authentication & Authorization
- JWT tokens with RSA signing (private/public key pair)
- Tokens include: `sub` (email), `role`, `hospital_id`, `session_id`
- Session validation: Single active session per user (except super admin)
- Password hashing with bcrypt via passlib
- Account lockout after 6 failed login attempts (30 minutes)
- Device tracking with email alerts for new devices

#### Input Validation
- Pydantic models validate all request bodies
- Case-insensitive email lookups: `func.lower(User.email)`
- SQL injection prevention via SQLAlchemy ORM (parameterized queries)
- File upload validation (size, type, content)

#### Audit Logging
- Log all authentication events (login, logout, password reset)
- Log sensitive operations (user creation, role changes, data access)
- Store in `audit_logs` table with user_id, action, details, timestamp
- Use `log_audit(db, user_id, action, details)` helper function

### Database Practices

#### Timezone Handling
- Use timezone-aware datetimes: `datetime.now(IST)` where `IST = timezone(timedelta(hours=5, minutes=30))`
- Store timestamps with timezone: `Column(DateTime(timezone=True))`
- Convert naive datetimes to aware: `dt.replace(tzinfo=IST)`
- Compare aware datetimes only

#### Auto-Migration Pattern
- Run schema migrations on startup in `main.py`
- Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for PostgreSQL compatibility
- Provide default values for NOT NULL columns
- Wrap in try-except to allow app to start even if migrations fail

Example:
```python
def run_migrations():
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR NOT NULL DEFAULT 'Legacy User'"))
        conn.commit()
```

#### Query Optimization
- Use indexes on frequently queried columns (email, hospital_id)
- Eager load relationships when needed: `.options(joinedload(User.hospital))`
- Use `func.count()` for counting instead of loading all records
- Set query timeouts in connection config

### Configuration Management

#### Environment Variables
- Load with `python-dotenv`: `load_dotenv()`
- Access via `os.getenv("KEY", "default_value")`
- Centralize in `core/config.py` as `Settings` class
- Never commit `.env` files - provide `.env.example` template

#### Settings Pattern
```python
class Settings:
    PROJECT_NAME: str = "THE DIGIFORT LABS"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./digifortlabs.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-in-prod")

settings = Settings()
```

### Production Configuration

#### Gunicorn Setup
- Worker count: `multiprocessing.cpu_count() * 2 + 1`
- Worker class: `uvicorn.workers.UvicornWorker` (ASGI support)
- Timeout: 120 seconds for long-running requests
- Bind to `0.0.0.0:8001` for container networking

#### CORS Configuration
- Whitelist specific origins in production
- Always include production domain and localhost for development
- Add CORS middleware LAST in middleware stack
- Manually add CORS headers in exception handlers

Example:
```python
cors_origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
if "https://digifortlabs.com" not in cors_origins:
    cors_origins.append("https://digifortlabs.com")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Background Task Patterns

#### Celery Configuration
- Redis as broker and result backend
- JSON serialization for tasks
- UTC timezone for consistency
- Include task modules in `include` parameter

Example:
```python
celery_app = Celery(
    "worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.services.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
```

#### Async Background Tasks
- Use FastAPI `BackgroundTasks` for lightweight operations
- Use Celery for heavy operations (OCR, video processing)
- Startup tasks with `@app.on_event("startup")` and `asyncio.create_task()`

### API Design Patterns

#### RESTful Conventions
- Use HTTP verbs semantically: GET (read), POST (create), PUT/PATCH (update), DELETE (remove)
- Resource-based URLs: `/patients/{id}`, `/hospitals/{id}/users`
- Plural nouns for collections: `/patients`, `/hospitals`
- Nested resources for relationships: `/patients/{id}/documents`

#### Response Patterns
- 200 OK: Successful GET/PUT/PATCH
- 201 Created: Successful POST with resource creation
- 204 No Content: Successful DELETE
- 400 Bad Request: Validation errors
- 401 Unauthorized: Missing/invalid authentication
- 403 Forbidden: Insufficient permissions
- 404 Not Found: Resource doesn't exist
- 500 Internal Server Error: Unexpected server errors

#### Pagination Pattern (when implemented)
```python
# Query parameters: ?skip=0&limit=20
@router.get("/items")
def list_items(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    items = db.query(Item).offset(skip).limit(limit).all()
    total = db.query(func.count(Item.id)).scalar()
    return {"items": items, "total": total, "skip": skip, "limit": limit}
```

## Internal API Usage Patterns

### Database Query Patterns

#### Basic CRUD Operations
```python
# Create
new_user = User(email="test@example.com", hashed_password=hash_pw("password"))
db.add(new_user)
db.commit()
db.refresh(new_user)

# Read
user = db.query(User).filter(User.email == "test@example.com").first()
users = db.query(User).filter(User.hospital_id == 1).all()

# Update
user.full_name = "New Name"
db.commit()

# Delete (soft delete preferred)
user.is_deleted = True
db.commit()
```

#### Case-Insensitive Queries
```python
from sqlalchemy import func

user = db.query(User).filter(
    func.lower(User.email) == func.lower(email_input)
).first()
```

#### Relationship Loading
```python
# Lazy loading (default)
user = db.query(User).filter(User.id == 1).first()
hospital = user.hospital  # Triggers separate query

# Eager loading
from sqlalchemy.orm import joinedload

user = db.query(User).options(joinedload(User.hospital)).filter(User.id == 1).first()
hospital = user.hospital  # No additional query
```

### Authentication Patterns

#### Token Creation
```python
from ..utils import create_access_token

token_data = {
    "sub": user.email,
    "role": user.role,
    "hospital_id": user.hospital_id,
    "session_id": str(uuid.uuid4())
}

access_token = create_access_token(
    data=token_data,
    expires_delta=timedelta(days=30)  # Optional, defaults to 30 minutes
)
```

#### Protected Routes
```python
from ..routers.auth import get_current_user

@router.get("/protected")
def protected_route(current_user: User = Depends(get_current_user)):
    return {"user": current_user.email}
```

#### Role-Based Access
```python
def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.post("/admin-only")
def admin_route(current_user: User = Depends(require_admin)):
    # Only admins can access
    pass
```

### File Upload Pattern
```python
from fastapi import UploadFile, File

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Read file content
    content = await file.read()
    
    # Save to S3 or local storage
    # Process with OCR if needed
    
    return {"filename": file.filename, "size": len(content)}
```

## Frequently Used Code Idioms

### Conditional Database Commit
```python
try:
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
except Exception as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=str(e))
```

### Timezone-Aware Datetime
```python
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))
now = datetime.now(IST)

# Convert naive to aware
if dt.tzinfo is None:
    dt = dt.replace(tzinfo=IST)
```

### Safe JSON Parsing
```python
import json

try:
    data = json.loads(json_string)
except json.JSONDecodeError:
    data = {}  # Fallback to empty dict
```

### Environment-Based Configuration
```python
import os

if os.getenv("ENVIRONMENT") == "production":
    # Production-specific logic
    docs_url = None
else:
    # Development-specific logic
    docs_url = "/docs"
```

### Middleware Pattern
```python
@app.middleware("http")
async def custom_middleware(request: Request, call_next):
    # Pre-processing
    start_time = time.time()
    
    # Call next middleware/route
    response = await call_next(request)
    
    # Post-processing
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    return response
```

## Popular Annotations

### FastAPI Route Decorators
```python
@router.get("/items/{item_id}", response_model=ItemResponse)
@router.post("/items", status_code=201)
@router.put("/items/{item_id}")
@router.delete("/items/{item_id}", status_code=204)
```

### Pydantic Model Annotations
```python
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str | None = None
```

### SQLAlchemy Model Annotations
```python
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitals.hospital_id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    hospital = relationship("Hospital", back_populates="users")
```

### Type Hints
```python
from typing import Optional, List, Dict, Any

def process_data(
    items: List[Dict[str, Any]],
    user_id: Optional[int] = None
) -> Dict[str, Any]:
    return {"processed": len(items)}
```

### Async/Await
```python
@router.post("/async-endpoint")
async def async_handler(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Async operations
    result = await some_async_function()
    
    # Background task
    background_tasks.add_task(send_email, "user@example.com")
    
    return {"result": result}
```
