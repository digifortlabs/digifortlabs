# DIGIFORT LABS - Audit Status Tracker

**Last Updated**: 2024  
**Total Issues**: 105  
**Fixed**: 8  
**Remaining**: 97  

---

## ✅ FIXED ISSUES (8)

### Security Middleware
- ✅ **Rate Limiting Implemented** - RateLimitMiddleware active with 60 req/min general, 15 req/min auth
- ✅ **Security Headers Added** - SecurityHeadersMiddleware implements X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, CSP
- ✅ **Bandwidth Tracking** - BandwidthMiddleware implemented (though has issues #30, #31)

### Infrastructure
- ✅ **Health Check Endpoint** - `/health` endpoint exists
- ✅ **Global Exception Handler** - Catches all exceptions, logs to system_error_logs table
- ✅ **CORS Configuration** - Properly configured with production domains
- ✅ **API Documentation** - Disabled in production (docs_url=None when ENVIRONMENT=production)
- ✅ **Request Size Limits** - 100MB limit configured

---

## 🔴 CRITICAL ISSUES REQUIRING IMMEDIATE ACTION (22)

### Issue #1: PLAINTEXT PASSWORD STORAGE
**Status**: ❌ NOT FIXED  
**Location**: `backend/app/models.py:95`, `backend/app/routers/auth.py:289`, `backend/app/routers/users.py:multiple`  
**Evidence**: 
```python
# models.py
plain_password = Column(String, nullable=True)

# users.py:156
plain_password=user.password  # Still being set

# users.py:62
class UserResponse(BaseModel):
    plain_password: Optional[str] = None  # Exposed in API
```

**How to Fix**:

**Step 1: Remove from Database Model**
```python
# File: backend/app/models.py
class User(Base):
    # DELETE THIS LINE:
    # plain_password = Column(String, nullable=True)
    
    # Keep only hashed_password
    hashed_password = Column(String, nullable=False)
```

**Step 2: Create Migration Script**
```python
# File: backend/maintenance_scripts/remove_plain_password.py
from sqlalchemy import text
from app.database import engine

def remove_plain_password_column():
    with engine.connect() as conn:
        # Drop the column
        conn.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS plain_password"))
        conn.commit()
        print("✅ Removed plain_password column")

if __name__ == "__main__":
    remove_plain_password_column()
```

**Step 3: Remove from API Response**
```python
# File: backend/app/routers/users.py
class UserResponse(BaseModel):
    user_id: int
    email: str
    full_name: Optional[str] = None
    role: UserRole
    hospital_id: Optional[int] = None
    hospital: Optional[HospitalMini] = None
    # DELETE THIS LINE:
    # plain_password: Optional[str] = None
```

**Step 4: Remove All Assignments**
```python
# File: backend/app/routers/users.py
# Line 156 - DELETE:
# plain_password=user.password,

# Line 189 - DELETE:
# target_user.plain_password = data.password

# Line 107 - DELETE:
# current_user.plain_password = None

# File: backend/app/routers/auth.py
# Line 289 - DELETE:
# user.plain_password = data.new_password
```

**Step 5: Update Password Change Logic**
```python
# File: backend/app/routers/users.py
@router.post("/change-password")
def change_password(data: PasswordChange, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from ..utils import verify_password
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    import uuid
    current_user.hashed_password = get_password_hash(data.new_password)
    # REMOVE: current_user.plain_password = None
    current_user.force_password_change = False
    current_user.current_session_id = str(uuid.uuid4())
    db.commit()
    return {"message": "Password updated successfully"}
```

**Step 6: Run Migration**
```bash
cd backend
python maintenance_scripts/remove_plain_password.py
```

**Verification**:
```bash
# Check database
psql -d digifortlabs -c "\d users" | grep plain_password
# Should return nothing

# Check code
grep -r "plain_password" backend/app/
# Should only find in old migration files
```

---

### Issue #20: PLAINTEXT PASSWORD IN DATABASE MODEL
**Status**: ❌ NOT FIXED (Duplicate of #1)  
**Merge with Issue #1**

---

### Issue #47: PLAINTEXT PASSWORD IN API RESPONSE
**Status**: ❌ NOT FIXED (Duplicate of #1)  
**Merge with Issue #1**

---

### Issue #2: TOKEN EXPOSURE IN URL QUERY PARAMETERS
**Status**: ❌ NOT FIXED  
**Location**: `backend/app/routers/patients.py:1234`  

**How to Fix**:

**Option 1: Use Authorization Header (Recommended)**
```python
# File: backend/app/routers/patients.py
@router.get("/download/{file_id}")
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Token from header
):
    # Verify user has access to this file
    file = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
    if not file:
        raise HTTPException(404, "File not found")
    
    # Check permissions
    if current_user.hospital_id != file.patient.hospital_id:
        raise HTTPException(403, "Access denied")
    
    # Return file
    return FileResponse(file.storage_path)
```

**Option 2: Short-Lived Download Tokens**
```python
# File: backend/app/utils.py
def create_download_token(file_id: int, user_id: int) -> str:
    """Create short-lived token (5 minutes) for file download"""
    data = {
        "file_id": file_id,
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=5)
    }
    return jwt.encode(data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_download_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(401, "Invalid or expired download token")

# File: backend/app/routers/patients.py
@router.post("/request-download/{file_id}")
def request_download(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate short-lived download token"""
    file = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
    if not file:
        raise HTTPException(404, "File not found")
    
    if current_user.hospital_id != file.patient.hospital_id:
        raise HTTPException(403, "Access denied")
    
    download_token = create_download_token(file_id, current_user.user_id)
    return {"download_url": f"/patients/download/{file_id}?token={download_token}"}

@router.get("/download/{file_id}")
def download_file(file_id: int, token: str, db: Session = Depends(get_db)):
    """Download file with short-lived token"""
    payload = verify_download_token(token)
    
    if payload["file_id"] != file_id:
        raise HTTPException(403, "Token mismatch")
    
    file = db.query(PDFFile).filter(PDFFile.file_id == file_id).first()
    if not file:
        raise HTTPException(404, "File not found")
    
    return FileResponse(file.storage_path)
```

**Frontend Update**:
```typescript
// File: frontend/src/lib/api.ts
export async function downloadFile(fileId: number) {
    // Step 1: Request download token
    const response = await apiFetch(`/patients/request-download/${fileId}`, {
        method: 'POST'
    });
    
    // Step 2: Use token to download (expires in 5 minutes)
    window.open(response.download_url, '_blank');
}
```

---

### Issue #4: MISSING CSRF PROTECTION
**Status**: ❌ NOT FIXED  
**Location**: Entire API  

**How to Fix**:

**Step 1: Install CSRF Library**
```bash
pip install fastapi-csrf-protect
```

**Step 2: Configure CSRF Protection**
```python
# File: backend/app/core/config.py
class Settings:
    # ... existing settings
    CSRF_SECRET_KEY: str = os.getenv("CSRF_SECRET_KEY", os.urandom(32).hex())
```

**Step 3: Add CSRF Middleware**
```python
# File: backend/app/main.py
from fastapi_csrf_protect import CsrfProtect
from fastapi_csrf_protect.exceptions import CsrfProtectError
from pydantic import BaseModel

class CsrfSettings(BaseModel):
    secret_key: str = settings.CSRF_SECRET_KEY
    cookie_samesite: str = "lax"
    cookie_secure: bool = settings.ENVIRONMENT == "production"
    cookie_httponly: bool = True

@CsrfProtect.load_config
def get_csrf_config():
    return CsrfSettings()

@app.exception_handler(CsrfProtectError)
def csrf_protect_exception_handler(request: Request, exc: CsrfProtectError):
    return JSONResponse(
        status_code=403,
        content={"detail": "CSRF token validation failed"}
    )
```

**Step 4: Protect State-Changing Endpoints**
```python
# File: backend/app/routers/patients.py
from fastapi_csrf_protect import CsrfProtect

@router.post("/")
def create_patient(
    patient: PatientCreate,
    csrf_protect: CsrfProtect = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    csrf_protect.validate_csrf(request)  # Validate CSRF token
    # ... rest of logic

@router.put("/{record_id}")
def update_patient(
    record_id: int,
    patient: PatientUpdate,
    csrf_protect: CsrfProtect = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    csrf_protect.validate_csrf(request)
    # ... rest of logic

@router.delete("/{record_id}")
def delete_patient(
    record_id: int,
    csrf_protect: CsrfProtect = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    csrf_protect.validate_csrf(request)
    # ... rest of logic
```

**Step 5: Frontend - Get CSRF Token**
```typescript
// File: frontend/src/lib/api.ts
export async function getCsrfToken(): Promise<string> {
    const response = await fetch(`${API_URL}/csrf-token`, {
        credentials: 'include'
    });
    const data = await response.json();
    return data.csrf_token;
}

export async function apiFetch(endpoint: string, options: any = {}) {
    const token = localStorage.getItem('token');
    const csrfToken = await getCsrfToken();
    
    const headers = {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include'
    });
    
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
}
```

**Step 6: Add CSRF Token Endpoint**
```python
# File: backend/app/routers/auth.py
@router.get("/csrf-token")
def get_csrf_token(csrf_protect: CsrfProtect = Depends()):
    """Generate CSRF token for client"""
    csrf_token, signed_token = csrf_protect.generate_csrf_tokens()
    response = JSONResponse({"csrf_token": csrf_token})
    csrf_protect.set_csrf_cookie(signed_token, response)
    return response
```

**Alternative: Double Submit Cookie Pattern (Simpler)**
```python
# File: backend/app/middleware/csrf.py
import secrets
from starlette.middleware.base import BaseHTTPMiddleware

class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip for GET, HEAD, OPTIONS
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return await call_next(request)
        
        # Get CSRF token from cookie and header
        csrf_cookie = request.cookies.get("csrf_token")
        csrf_header = request.headers.get("X-CSRF-Token")
        
        if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
            return JSONResponse(
                status_code=403,
                content={"detail": "CSRF validation failed"}
            )
        
        return await call_next(request)

# File: backend/app/main.py
from .middleware.csrf import CSRFMiddleware
app.add_middleware(CSRFMiddleware)

# Generate token on login
@router.post("/token")
async def login(...):
    # ... existing login logic
    
    csrf_token = secrets.token_urlsafe(32)
    response = JSONResponse({"access_token": access_token, "token_type": "bearer"})
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,  # Must be readable by JS
        secure=settings.ENVIRONMENT == "production",
        samesite="lax"
    )
    return response
```

---

### Issue #15: TOKENS IN LOCALSTORAGE
**Status**: ❌ NOT FIXED  
**Location**: `frontend/src/app/login/page.tsx`  

**How to Fix**:

**Step 1: Backend - Set HttpOnly Cookie**
```python
# File: backend/app/routers/auth.py
from fastapi.responses import JSONResponse

@router.post("/token")
async def login_for_access_token(
    request: Request,
    background_tasks: BackgroundTasks,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    # ... existing authentication logic ...
    
    access_token = create_access_token(data=token_data, expires_delta=expires_delta)
    
    # Create response
    response = JSONResponse({
        "message": "Login successful",
        "user": {
            "email": user.email,
            "role": user.role,
            "hospital_name": user.hospital.legal_name if user.hospital else None
        }
    })
    
    # Set HttpOnly cookie (NOT accessible via JavaScript)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,  # CRITICAL: Prevents XSS attacks
        secure=settings.ENVIRONMENT == "production",  # HTTPS only in production
        samesite="lax",  # CSRF protection
        max_age=30 * 24 * 60 * 60,  # 30 days
        path="/"
    )
    
    db.commit()
    return response
```

**Step 2: Update get_current_user to Read Cookie**
```python
# File: backend/app/routers/auth.py
from fastapi import Cookie

def get_current_user(
    access_token: str = Cookie(None),  # Read from cookie
    db: Session = Depends(get_db)
):
    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )
    
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials"
    )
    
    try:
        payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        session_id: str = payload.get("session_id")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # ... rest of validation logic
```

**Step 3: Frontend - Remove localStorage**
```typescript
// File: frontend/src/app/login/page.tsx
const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch(`${API_URL}/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
            credentials: 'include'  // CRITICAL: Send cookies
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }

        const data = await response.json();
        
        // REMOVE THESE LINES:
        // localStorage.setItem('token', data.access_token);
        // localStorage.setItem('userEmail', email);
        
        // Store only non-sensitive data
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userRole', data.user.role);
        
        router.push('/dashboard');
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
};
```

**Step 4: Update API Client**
```typescript
// File: frontend/src/config/api.ts
export async function apiFetch(endpoint: string, options: any = {}) {
    // REMOVE: const token = localStorage.getItem('token');
    
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_URL}${path}`;

    const headers = {
        'Content-Type': 'application/json',
        // REMOVE: Authorization header
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'  // CRITICAL: Send cookies with every request
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.detail || `API Error: ${response.status}`);
        (error as any).status = response.status;
        throw error;
    }

    if (response.status === 204) return null;
    return response.json();
}
```

**Step 5: Update Logout**
```python
# File: backend/app/routers/auth.py
@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Invalidate session
    current_user.current_session_id = None
    db.commit()
    
    # Clear cookie
    response = JSONResponse({"message": "Logged out successfully"})
    response.delete_cookie(key="access_token", path="/")
    return response
```

```typescript
// File: frontend/src/app/dashboard/page.tsx
const handleLogout = async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    localStorage.clear();
    router.push('/login');
};
```

**Step 6: Update CORS for Credentials**
```python
# File: backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,  # CRITICAL: Allow cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Verification**:
```bash
# Check browser DevTools > Application > Cookies
# Should see: access_token with HttpOnly flag

# Check localStorage
# Should NOT contain: token or access_token
```

---

### Issue #21: HARDCODED SECRET KEY IN CONFIG
**Status**: ❌ NOT FIXED  
**Location**: `backend/app/core/config.py:35`  
```python
SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-this-in-prod")
```
**Action Required**: Fail fast if SECRET_KEY not set in production

---

### Issue #26: SQL INJECTION IN RAW TEXT EXECUTION
**Status**: ⚠️ PARTIALLY FIXED  
**Location**: `backend/app/main.py:17-90`  
**Current State**: Still using text() for migrations but values are hardcoded (safe for now)  
**Action Required**: Migrate to Alembic for proper database migrations

---

### Issue #28: NO DATABASE BACKUP STRATEGY
**Status**: ❌ NOT FIXED  
**Action Required**: Implement daily automated backups to S3 with 7-day retention

---

### Issue #31: HOSPITAL_ID FROM HEADER (SPOOFABLE)
**Status**: ❌ NOT FIXED  
**Location**: `backend/app/middleware/bandwidth.py:19`  
**Action Required**: Extract hospital_id from JWT token instead of header

---

### Issue #33: WEAK CONTENT SECURITY POLICY
**Status**: ⚠️ PARTIALLY FIXED  
**Location**: `backend/app/middleware/security.py:76`  
**Current State**: CSP exists but allows 'unsafe-inline' and 'unsafe-eval'  
**Action Required**: Implement strict CSP with nonce-based inline scripts

---

### Issue #39: DOCKER COMPOSE NETWORK MODE HOST
**Status**: ❌ NOT FIXED  
**Location**: `docker-compose.yml:8`  
**Action Required**: Use bridge network with explicit port mapping

---

### Issue #46: BROKEN ROLE-BASED ACCESS CONTROL
**Status**: ❌ NOT FIXED  
**Location**: `backend/app/routers/users.py:multiple`  
**Critical Sub-Issues**:
- Hospital Admins can escalate to SUPER_ADMIN (no role validation)
- Inconsistent permission checks
- No resource-level permissions
- Cross-hospital access possible

**Action Required**: Implement proper RBAC with permission decorators

---

### Issue #48: NO AUDIT LOG FOR ROLE CHANGES
**Status**: ❌ NOT FIXED  
**Action Required**: Log all role changes with old/new values

---

### Issue #49: SESSION NOT INVALIDATED ON ROLE CHANGE
**Status**: ❌ NOT FIXED  
**Action Required**: Regenerate session_id when role changes

---

### Issue #50: NO RATE LIMITING ON PASSWORD RESET
**Status**: ❌ NOT FIXED  
**Action Required**: Limit to 3 OTP requests per hour per email

---

### Issue #51: OTP BRUTE FORCE VULNERABILITY
**Status**: ❌ NOT FIXED  
**Action Required**: 
- Limit to 5 attempts per OTP
- Increase OTP length to 8 digits
- Add exponential backoff

---

### Issue #55: NO MULTI-FACTOR AUTHENTICATION
**Status**: ❌ NOT FIXED  
**Action Required**: Implement TOTP-based MFA for admins

---

### Issue #56: SUPER ADMIN 30-DAY TOKEN
**Status**: ❌ NOT FIXED  
**Location**: `backend/app/routers/auth.py:217`  
**Action Required**: Reduce to 24 hours, implement refresh tokens

---

### Issue #60: AUDIT LOG LOSES ATTRIBUTION
**Status**: ❌ NOT FIXED  
**Location**: `backend/app/routers/users.py:28`  
**Action Required**: Keep user_id, implement soft deletes

---

### Issue #81-89: GDPR/HIPAA COMPLIANCE GAPS
**Status**: ❌ NOT FIXED  
**Action Required**: 
- Implement consent management
- Create DSAR process
- Add privacy policy
- Create HIPAA documentation
- Implement data retention policies

---

## 🟠 HIGH PRIORITY ISSUES (18)

### Issue #5: WEAK FILE UPLOAD VALIDATION
**Status**: ❌ NOT FIXED  
**Action Required**: Implement magic number validation

### Issue #11: INFINITE LOOP IN useEffect
**Status**: ❌ NOT FIXED  
**Action Required**: Memoize fetchScans function

### Issue #19: DUPLICATE FIELD DEFINITIONS
**Status**: ❌ NOT FIXED  
**Action Required**: Remove duplicate fields in Pydantic models

### Issue #23: SMTP CREDENTIALS IN PLAINTEXT
**Status**: ❌ NOT FIXED  
**Action Required**: Use AWS Secrets Manager

### Issue #24: NO RATE LIMITING ON EMAIL SENDING
**Status**: ❌ NOT FIXED  
**Action Required**: Implement per-user email rate limits

### Issue #25: BCC TO COMPANY EMAIL
**Status**: ❌ NOT FIXED  
**Action Required**: Remove BCC or make opt-in

### Issue #27: DATABASE CONNECTION POOL TOO SMALL
**Status**: ❌ NOT FIXED  
**Current**: pool_size=5, max_overflow=10  
**Action Required**: Increase to pool_size=20, max_overflow=30

### Issue #30: BANDWIDTH MIDDLEWARE BYPASSED
**Status**: ❌ NOT FIXED  
**Action Required**: Track PUT, PATCH, DELETE methods

### Issue #36: NO TOKEN REFRESH MECHANISM
**Status**: ❌ NOT FIXED  
**Action Required**: Implement refresh token rotation

### Issue #37: MISSING API REQUEST VALIDATION
**Status**: ❌ NOT FIXED  
**Action Required**: Use apiFetch wrapper consistently

### Issue #41: MISSING VOLUME BACKUPS
**Status**: ❌ NOT FIXED  
**Action Required**: Implement Docker volume backup to S3

### Issue #42: NO LOG ROTATION
**Status**: ❌ NOT FIXED  
**Action Required**: Implement logrotate

### Issue #43: MISSING MONITORING
**Status**: ❌ NOT FIXED  
**Action Required**: Implement Prometheus + Grafana

### Issue #52: MAINTENANCE MODE BYPASS
**Status**: ❌ NOT FIXED  
**Action Required**: Check maintenance before authentication

### Issue #53: KNOWN DEVICES AS JSON STRING
**Status**: ❌ NOT FIXED  
**Action Required**: Use proper JSON column type

### Issue #57: NO PERMISSION HIERARCHY
**Status**: ❌ NOT FIXED  
**Action Required**: Define clear permission matrix

### Issue #58: MISSING PERMISSION DECORATORS
**Status**: ❌ NOT FIXED  
**Action Required**: Create reusable permission decorators

### Issue #59: NO RESOURCE-LEVEL PERMISSIONS
**Status**: ❌ NOT FIXED  
**Action Required**: Implement resource-level ACLs

---

## 🟡 MEDIUM PRIORITY ISSUES (30)

Issues #6, #7, #8, #9, #10, #12, #13, #14, #16, #17, #18, #22, #29, #32, #34, #35, #38, #44, #45, #54, #61-78

---

## 🔵 LOW PRIORITY ISSUES (20)

Issues #79-80, #90-105

---

## 📊 PROGRESS METRICS

| Category | Total | Fixed | Remaining | % Complete |
|----------|-------|-------|-----------|------------|
| Critical | 22 | 0 | 22 | 0% |
| High | 18 | 0 | 18 | 0% |
| Medium | 30 | 5 | 25 | 17% |
| Low | 20 | 3 | 17 | 15% |
| **TOTAL** | **90** | **8** | **82** | **9%** |

---

## 🎯 RECOMMENDED FIX ORDER

### Week 1 (Critical - Must Fix)
1. Remove plaintext passwords (#1, #20, #47)
2. Fix RBAC privilege escalation (#46)
3. Move tokens to HttpOnly cookies (#15)
4. Implement CSRF protection (#4)
5. Fix hospital_id spoofing (#31)
6. Add database backups (#28)
7. Validate SECRET_KEY in production (#21)
8. Fix Docker network mode (#39)

### Week 2-3 (High Priority)
9. Implement file magic number validation (#5)
10. Fix infinite loop in useEffect (#11)
11. Add OTP rate limiting (#50, #51)
12. Implement MFA for admins (#55)
13. Add audit logs for role changes (#48)
14. Invalidate sessions on role change (#49)
15. Remove duplicate fields (#19)
16. Increase DB connection pool (#27)

### Week 4-6 (Medium Priority)
17. Implement token refresh (#36)
18. Add monitoring (#43)
19. Implement log rotation (#42)
20. Create permission decorators (#58)
21. Migrate to Alembic (#26)
22. Implement secrets management (#23)

### Week 7-12 (Low Priority + Compliance)
23. GDPR compliance workflows (#81-89)
24. Code refactoring (#73-80)
25. Performance optimization (#66-72)
26. Documentation (#90-105)

---

## 📝 NOTES

- **Plaintext Password Issue**: This is the #1 critical vulnerability affecting the entire platform
- **RBAC Issues**: Multiple related issues (#46-49, #57-60) should be fixed together
- **Authentication Issues**: Issues #50, #51, #55, #56 form a cohesive authentication security upgrade
- **Infrastructure**: Issues #28, #39, #41, #42, #43 should be addressed as infrastructure improvements
- **Compliance**: Issues #81-89 require legal/compliance team involvement

---

**Next Review Date**: [To be scheduled after Phase 1 completion]


## 🔧 DETAILED FIX INSTRUCTIONS FOR REMAINING CRITICAL ISSUES

### Issue #21: HARDCODED SECRET KEY - DETAILED FIX

**Step 1: Add Production Validation**
```python
# File: backend/app/core/config.py
import sys

class Settings:
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    
    def __init__(self):
        if self.ENVIRONMENT == "production":
            if not self.SECRET_KEY or self.SECRET_KEY == "super-secret-key-change-this-in-prod":
                print("❌ CRITICAL: SECRET_KEY not set in production!")
                sys.exit(1)
        
        if not self.SECRET_KEY:
            print("⚠️ WARNING: Using default SECRET_KEY in development")
            self.SECRET_KEY = "dev-secret-key-not-for-production"
```

**Step 2: Generate Keys**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

### Issue #28: DATABASE BACKUP - COMPLETE SOLUTION

```python
# File: backend/maintenance_scripts/backup_database.py
import os, boto3, subprocess
from datetime import datetime, timedelta
from app.core.config import settings

def backup_to_s3():
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = f"digifortlabs_backup_{timestamp}.sql"
    
    # Create dump
    pg_dump_cmd = ["pg_dump", "-h", settings.POSTGRES_SERVER, "-U", settings.POSTGRES_USER, 
                   "-d", settings.POSTGRES_DB, "-F", "c", "-f", backup_file]
    env = os.environ.copy()
    env["PGPASSWORD"] = settings.POSTGRES_PASSWORD
    subprocess.run(pg_dump_cmd, env=env, check=True)
    
    # Upload to S3
    s3 = boto3.client('s3', aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                      aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)
    s3.upload_file(backup_file, settings.AWS_BUCKET_NAME, f"backups/database/{backup_file}")
    os.remove(backup_file)
    
    # Delete old backups (7 days)
    cutoff = datetime.now() - timedelta(days=7)
    response = s3.list_objects_v2(Bucket=settings.AWS_BUCKET_NAME, Prefix='backups/database/')
    for obj in response.get('Contents', []):
        if obj['LastModified'].replace(tzinfo=None) < cutoff:
            s3.delete_object(Bucket=settings.AWS_BUCKET_NAME, Key=obj['Key'])

if __name__ == "__main__":
    backup_to_s3()
```

**Cron Job**: `0 2 * * * cd /path/to/backend && python maintenance_scripts/backup_database.py`

---

### Issue #31: HOSPITAL_ID SPOOFING FIX

```python
# File: backend/app/middleware/bandwidth.py
def get_hospital_from_token(request: Request) -> Optional[int]:
    """Extract hospital_id from JWT token"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("hospital_id")
    except:
        return None

class BandwidthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method not in ["POST", "GET", "PUT", "PATCH", "DELETE"]:
            return await call_next(request)
        
        # FIXED: Get hospital_id from JWT token
        hospital_id = get_hospital_from_token(request)
        
        if not hospital_id:
            return await call_next(request)
        
        # ... rest of bandwidth tracking logic
```

---

### Issue #46: RBAC FIX - COMPLETE IMPLEMENTATION

```python
# File: backend/app/core/permissions.py
from enum import Enum
from fastapi import HTTPException, Depends
from ..models import User, UserRole
from ..routers.auth import get_current_user

class Permission(str, Enum):
    # User Management
    CREATE_USER = "create_user"
    UPDATE_USER = "update_user"
    DELETE_USER = "delete_user"
    VIEW_USERS = "view_users"
    
    # Role Management
    ASSIGN_ROLE = "assign_role"
    ASSIGN_ADMIN_ROLE = "assign_admin_role"
    ASSIGN_SUPER_ADMIN_ROLE = "assign_super_admin_role"

# Permission Matrix
ROLE_PERMISSIONS = {
    UserRole.SUPER_ADMIN: [
        Permission.CREATE_USER,
        Permission.UPDATE_USER,
        Permission.DELETE_USER,
        Permission.VIEW_USERS,
        Permission.ASSIGN_ROLE,
        Permission.ASSIGN_ADMIN_ROLE,
        Permission.ASSIGN_SUPER_ADMIN_ROLE,
    ],
    UserRole.HOSPITAL_ADMIN: [
        Permission.CREATE_USER,
        Permission.UPDATE_USER,
        Permission.DELETE_USER,
        Permission.VIEW_USERS,
        Permission.ASSIGN_ROLE,  # Can only assign staff roles
    ],
    UserRole.HOSPITAL_STAFF: [
        Permission.VIEW_USERS,  # Can only view themselves
    ],
}

def has_permission(user: User, permission: Permission) -> bool:
    """Check if user has specific permission"""
    return permission in ROLE_PERMISSIONS.get(user.role, [])

def require_permission(permission: Permission):
    """Decorator to require specific permission"""
    def decorator(current_user: User = Depends(get_current_user)):
        if not has_permission(current_user, permission):
            raise HTTPException(403, f"Permission denied: {permission}")
        return current_user
    return decorator

def can_manage_user(current_user: User, target_user: User) -> bool:
    """Check if current_user can manage target_user"""
    # Super Admin can manage anyone
    if current_user.role == UserRole.SUPER_ADMIN:
        return True
    
    # Hospital Admin can manage users in their hospital (except other admins)
    if current_user.role == UserRole.HOSPITAL_ADMIN:
        if current_user.hospital_id != target_user.hospital_id:
            return False
        if target_user.role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF, UserRole.HOSPITAL_ADMIN]:
            return False
        return True
    
    # Users can only manage themselves
    return current_user.user_id == target_user.user_id

def validate_role_assignment(current_user: User, new_role: UserRole):
    """Validate if current_user can assign new_role"""
    # Super Admin can assign any role
    if current_user.role == UserRole.SUPER_ADMIN:
        return True
    
    # Hospital Admin cannot assign platform-level roles
    if current_user.role == UserRole.HOSPITAL_ADMIN:
        if new_role in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_STAFF, UserRole.HOSPITAL_ADMIN]:
            raise HTTPException(403, "Cannot assign platform-level or admin roles")
        return True
    
    raise HTTPException(403, "Insufficient permissions to assign roles")
```

**Update users.py**:
```python
# File: backend/app/routers/users.py
from ..core.permissions import require_permission, Permission, can_manage_user, validate_role_assignment

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.DELETE_USER))
):
    target_user = db.query(User).filter(User.user_id == user_id).first()
    if not target_user:
        raise HTTPException(404, "User not found")
    
    # Check if current_user can manage target_user
    if not can_manage_user(current_user, target_user):
        raise HTTPException(403, "Cannot delete this user")
    
    # Soft delete
    target_user.is_active = False
    db.commit()
    
    log_audit(db, current_user.user_id, "USER_DELETED", f"Deleted user: {target_user.email}")
    return {"message": "User deleted"}

@router.patch("/{user_id}")
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.UPDATE_USER))
):
    target_user = db.query(User).filter(User.user_id == user_id).first()
    if not target_user:
        raise HTTPException(404, "User not found")
    
    if not can_manage_user(current_user, target_user):
        raise HTTPException(403, "Cannot update this user")
    
    # Role change validation
    if data.role:
        validate_role_assignment(current_user, data.role)
        
        # Log role change
        old_role = target_user.role
        target_user.role = data.role
        log_audit(db, current_user.user_id, "ROLE_CHANGED", 
                  f"Changed {target_user.email} role from {old_role} to {data.role}")
        
        # Invalidate session on role change
        target_user.current_session_id = str(uuid.uuid4())
    
    if data.password:
        target_user.hashed_password = get_password_hash(data.password)
        target_user.current_session_id = str(uuid.uuid4())
    
    db.commit()
    return {"message": "User updated"}
```

---

### Issue #50 & #51: OTP RATE LIMITING & BRUTE FORCE FIX

```python
# File: backend/app/models.py
class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"
    otp_id = Column(Integer, primary_key=True)
    email = Column(String, index=True)
    otp_code = Column(String)  # Increase to 8 digits
    expires_at = Column(DateTime(timezone=True))
    is_used = Column(Boolean, default=False)
    attempt_count = Column(Integer, default=0)  # NEW
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# File: backend/app/routers/auth.py
from datetime import datetime, timedelta
from collections import defaultdict

# Rate limiting storage
otp_request_tracker = defaultdict(list)

@router.post("/request-password-reset")
async def request_password_reset(request: PasswordResetRequest, db: Session = Depends(get_db)):
    email = request.email.lower()
    
    # Rate limiting: 3 requests per hour
    now = datetime.now(IST)
    otp_request_tracker[email] = [t for t in otp_request_tracker[email] if now - t < timedelta(hours=1)]
    
    if len(otp_request_tracker[email]) >= 3:
        raise HTTPException(429, "Too many OTP requests. Try again in 1 hour.")
    
    otp_request_tracker[email].append(now)
    
    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user:
        return {"message": "If this email is registered, you will receive an OTP shortly."}
    
    # Invalidate previous OTPs
    db.query(PasswordResetOTP).filter(
        func.lower(PasswordResetOTP.email) == email,
        PasswordResetOTP.is_used == False
    ).update({PasswordResetOTP.is_used: True})
    
    # Generate 8-digit OTP
    otp_code = str(random.randint(10000000, 99999999))
    expires_at = datetime.now(IST) + timedelta(minutes=10)
    
    otp_entry = PasswordResetOTP(
        email=user.email,
        otp_code=otp_code,
        expires_at=expires_at,
        attempt_count=0
    )
    db.add(otp_entry)
    db.commit()
    
    EmailService.send_otp_email(user.email, otp_code)
    return {"message": "If this email is registered, you will receive an OTP shortly."}

@router.post("/reset-password")
async def reset_password(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    email = data.email.lower()
    
    otp_entry = db.query(PasswordResetOTP).filter(
        func.lower(PasswordResetOTP.email) == email,
        PasswordResetOTP.otp_code == data.otp,
        PasswordResetOTP.is_used == False,
        PasswordResetOTP.expires_at > datetime.now(IST)
    ).first()
    
    if not otp_entry:
        raise HTTPException(400, "Invalid or expired OTP")
    
    # Check attempt count (max 5 attempts)
    if otp_entry.attempt_count >= 5:
        otp_entry.is_used = True
        db.commit()
        raise HTTPException(429, "Too many failed attempts. Request a new OTP.")
    
    # Increment attempt count
    otp_entry.attempt_count += 1
    db.commit()
    
    # Verify OTP
    if otp_entry.otp_code != data.otp:
        raise HTTPException(400, f"Invalid OTP. {5 - otp_entry.attempt_count} attempts remaining.")
    
    # Update password
    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user:
        raise HTTPException(404, "User not found")
    
    user.hashed_password = get_password_hash(data.new_password)
    user.locked_until = None
    user.failed_login_attempts = 0
    otp_entry.is_used = True
    
    db.commit()
    return {"message": "Password updated successfully"}
```

---

### Issue #39: DOCKER NETWORK FIX

```yaml
# File: docker-compose.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
    ports:
      - "8001:8001"  # Explicit port mapping
    networks:
      - digifort-net  # Use bridge network
    environment:
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      - local_storage:/app/local_storage

  worker:
    build:
      context: ./backend
    command: celery -A app.celery_app worker --loglevel=info
    networks:
      - digifort-net
    environment:
      - DATABASE_URL=${DATABASE_URL}

  frontend:
    build:
      context: ./frontend
    ports:
      - "3000:3000"
    networks:
      - digifort-net

  db:
    image: postgres:13-alpine
    ports:
      - "5432:5432"
    networks:
      - digifort-net
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    networks:
      - digifort-net

networks:
  digifort-net:
    driver: bridge

volumes:
  postgres_data:
  local_storage:
```

---

**End of Detailed Fix Instructions**
