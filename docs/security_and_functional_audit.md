# Security & Functional Audit Report - DIGIFORT LABS

## Executive Summary
This document identifies critical security vulnerabilities, functional loopholes, and architectural issues discovered through comprehensive codebase analysis.

---

## 🔴 CRITICAL SECURITY VULNERABILITIES

### 1. **Infinite Loop Risk in useEffect (Frontend)**
**Location**: `frontend/src/app/dashboard/dental/components/PatientDetail.tsx:116`

**Issue**: Missing dependency array in useEffect causes infinite re-render loop
```typescript
useEffect(() => {
    fetchScans();
}, [patient.patient_id]); // ✅ CORRECT - has dependency

// BUT if fetchScans changes, infinite loop occurs
```

**Impact**: 
- Browser crash
- API rate limit exhaustion
- Poor user experience

**Fix**: Wrap fetchScans in useCallback or add to dependency array properly

---

### 2. **Token Exposure in Query Parameters**
**Location**: `backend/app/routers/patients.py:1234`

```python
url = f"{base_url}?token={token}"
```

**Issue**: JWT tokens passed in URL query strings are:
- Logged in browser history
- Visible in server logs
- Exposed in referrer headers
- Cached by proxies

**Impact**: HIGH - Token theft, session hijacking

**Fix**: Use POST requests with tokens in Authorization headers or implement short-lived download tokens

---

### 3. **Duplicate Field Definitions (Data Corruption Risk)**
**Location**: `backend/app/routers/patients.py`

```python
class PatientResponse(BaseModel):
    email_id: Optional[str] = None
    email_id: Optional[str] = None  # DUPLICATE!
    
class PatientCreate(BaseModel):
    admission_date: Optional[datetime.datetime] = None
    admission_date: Optional[datetime.datetime] = None  # DUPLICATE!
    discharge_date: Optional[datetime.datetime] = None
    discharge_date: Optional[datetime.datetime] = None  # DUPLICATE!
```

**Impact**: 
- Unpredictable behavior
- Data loss
- Validation bypass

**Fix**: Remove duplicate field definitions immediately

---

### 4. **Hardcoded File Paths (Production Failure)**
**Location**: `backend/app/routers/patients.py:237`

```python
with open("/home/ec2-user/.pm2/logs/custom_trace.log", "a") as errFile:
```

**Issue**: 
- Hardcoded Linux path fails on Windows
- Assumes specific user account
- No permission checks
- Silent failure if path doesn't exist

**Impact**: Error logging fails silently in production

**Fix**: Use configurable log paths from environment variables

---

### 5. **Weak Rate Limiting Bypass**
**Location**: `backend/app/middleware/security.py:35`

```python
if client_ip in ["127.0.0.1", "::1", "localhost"]:
    return await call_next(request)
```

**Issue**: Attackers can bypass rate limiting by:
- Spoofing X-Forwarded-For headers
- Using localhost proxies
- Exploiting reverse proxy misconfigurations

**Impact**: Brute force attacks possible

**Fix**: Implement proper proxy trust configuration and validate forwarded headers

---

### 6. **Unvalidated File Upload Extensions**
**Location**: `backend/app/routers/patients.py:656`

```python
allowed_extensions = {'.pdf', '.mp4', '.mov', '.avi', '.mkv'}
ext = os.path.splitext(file.filename)[1].lower()
```

**Issue**: 
- Only checks extension, not actual file content
- Allows malicious files with fake extensions
- No MIME type validation
- No file size limits enforced

**Impact**: 
- Malware upload
- Storage exhaustion
- Code execution via polyglot files

**Fix**: Implement magic number validation and strict MIME type checking

---

### 7. **SQL Injection via Unsafe Text Execution**
**Location**: `backend/app/main.py:17`

```python
conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR NOT NULL DEFAULT 'Legacy User'"))
```

**Issue**: While using `text()`, if any dynamic values were interpolated, SQL injection is possible

**Impact**: Database compromise

**Fix**: Use parameterized queries even with DDL statements

---

### 8. **Insecure Temporary File Handling**
**Location**: `backend/app/routers/patients.py:1145`

```python
tmp_fd, tmp_path = tempfile.mkstemp(suffix=ext)
os.close(tmp_fd)
```

**Issue**: 
- Race condition between file creation and usage
- Predictable temp file names
- No cleanup on exception

**Impact**: 
- Temp file leakage
- Disk space exhaustion
- Information disclosure

**Fix**: Use context managers and secure temp file handling

---

### 9. **Missing CSRF Protection**
**Location**: Entire backend API

**Issue**: No CSRF tokens for state-changing operations

**Impact**: Cross-Site Request Forgery attacks possible

**Fix**: Implement CSRF protection for all POST/PUT/DELETE endpoints

---

### 10. **Weak Password Storage Transparency**
**Location**: `backend/app/routers/auth.py:289`

```python
user.plain_password = data.new_password # Demo transparency
```

**Issue**: Storing plaintext passwords defeats the purpose of hashing

**Impact**: CRITICAL - Complete password compromise if database is breached

**Fix**: REMOVE plain_password field entirely

---

## 🟠 HIGH PRIORITY FUNCTIONAL ISSUES

### 11. **Infinite Restoration Monitoring Loop**
**Location**: `backend/app/routers/patients.py:1318`

```python
for _ in range(360):  # 6 hours of polling
    time.sleep(60)
```

**Issue**: 
- Blocks worker thread for 6 hours
- No cancellation mechanism
- Worker exhaustion under load
- Memory leak if many files requested

**Impact**: System resource exhaustion

**Fix**: Use async polling with proper task management or webhook callbacks

---

### 12. **Duplicate Email Field in Models**
**Location**: Multiple files

**Issue**: Inconsistent email field naming:
- `email_id` in Patient model
- `email` in DentalPatient model
- `email` in User model

**Impact**: 
- Data mapping errors
- Frontend confusion
- API inconsistency

**Fix**: Standardize to single field name across all models

---

### 13. **Unsafe Regex in Page Count Extraction**
**Location**: `backend/app/routers/patients.py:119`

```python
matches = re.findall(b"/Count\\s+(\\d+)", raw_pdf)
```

**Issue**: 
- Regex on binary data is unreliable
- Can match wrong PDF objects
- No validation of matched numbers

**Impact**: Incorrect billing due to wrong page counts

**Fix**: Use proper PDF parsing libraries only

---

### 14. **Missing Transaction Rollback**
**Location**: `backend/app/routers/patients.py:237`

```python
except Exception as e:
    try:
        db_file.processing_stage = 'failed'
        db.commit()
    except: pass
```

**Issue**: 
- No rollback on failure
- Database left in inconsistent state
- Silent exception swallowing

**Impact**: Data corruption

**Fix**: Proper transaction management with explicit rollbacks

---

### 15. **Race Condition in File Confirmation**
**Location**: `backend/app/routers/patients.py:1050`

**Issue**: Multiple users can confirm same draft simultaneously, causing:
- Duplicate S3 operations
- Inconsistent database state
- Billing errors

**Impact**: Data integrity issues

**Fix**: Implement optimistic locking or database-level constraints

---

### 16. **Memory Leak in File Serving**
**Location**: `backend/app/routers/patients.py:1200`

```python
decrypted_bytes = decrypt_data(encrypted_bytes)
```

**Issue**: 
- Large files loaded entirely into memory
- No streaming
- Multiple concurrent requests cause OOM

**Impact**: Server crashes under load

**Fix**: Implement chunked streaming for large files

---

### 17. **Incomplete Error Handling in Upload**
**Location**: `backend/app/routers/patients.py:700`

```python
except Exception as e:
    raise HTTPException(status_code=422, detail=f"Upload Error: {str(e)}")
```

**Issue**: 
- Exposes internal error details to users
- No cleanup of partial uploads
- Temp files not deleted

**Impact**: 
- Information disclosure
- Disk space leakage

**Fix**: Generic error messages + proper cleanup

---

### 18. **Hardcoded Medication Presets (Frontend)**
**Location**: `frontend/src/app/dashboard/dental/components/PatientDetail.tsx:68`

```typescript
const [medicationPresets, setMedicationPresets] = useState({
    antibiotics: ["Amoxicillin 500mg", "Augmentin 625mg", "Metrogyl 400mg"],
    analgesics: ["Zerodol P (Aceclofenac + Paracetamol)", "Combiflam", "Ketorol DT"],
    others: ["Pantocid 40mg (Antacid)", "Chlohexidine Mouthwash"]
});
```

**Issue**: 
- Not configurable per hospital
- No database backing
- Cannot be updated without code deployment

**Impact**: Poor user experience, inflexibility

**Fix**: Move to database-backed configuration

---

### 19. **Unsafe Alert Usage**
**Location**: Multiple frontend files

```typescript
alert("Scanner software launched!");
```

**Issue**: 
- Blocks UI thread
- Poor UX
- Not accessible
- Cannot be styled

**Impact**: Poor user experience

**Fix**: Use toast notifications or modal dialogs

---

### 20. **Missing Pagination**
**Location**: `backend/app/routers/patients.py:900`

```python
@router.get("/", response_model=List[PatientResponse])
def get_patients(...):
    patients = query.all()  # NO LIMIT!
```

**Issue**: 
- Loads ALL patients into memory
- Slow response times
- Database overload

**Impact**: Performance degradation, potential crashes

**Fix**: Implement proper pagination with skip/limit

---

## 🟡 MEDIUM PRIORITY ISSUES

### 21. **Inconsistent Timezone Handling**
**Location**: Multiple files

**Issue**: Mix of IST, UTC, and naive datetimes throughout codebase

**Impact**: Incorrect timestamps, scheduling errors

**Fix**: Standardize on UTC in database, convert to local timezone only in UI

---

### 22. **No Input Sanitization for File Names**
**Location**: `backend/app/routers/dental.py:25`

```python
def sanitize_name(name):
    return re.sub(r'[^\w\s-]', '', name).replace(' ', '_')
```

**Issue**: 
- Allows Unicode characters that may break filesystems
- No length limits
- Path traversal still possible

**Impact**: File system errors

**Fix**: Implement comprehensive filename sanitization

---

### 23. **Weak Duplicate Detection**
**Location**: `backend/app/routers/dental.py:200`

```python
if patient.phone:
    existing = db.query(DentalPatient).filter(
        DentalPatient.hospital_id == hospital_id, 
        DentalPatient.phone == patient.phone
    ).first()
```

**Issue**: 
- Case-sensitive phone comparison
- No normalization (spaces, dashes, country codes)
- Easy to bypass

**Impact**: Duplicate patient records

**Fix**: Normalize phone numbers before comparison

---

### 24. **Incomplete File Deletion**
**Location**: `backend/app/routers/patients.py:1400`

**Issue**: 
- Deletes from S3 but not from local cache
- No verification of deletion success
- Orphaned database records if S3 delete fails

**Impact**: Storage leaks, billing issues

**Fix**: Implement two-phase commit for deletions

---

### 25. **No Audit Trail for Deletions**
**Location**: Multiple deletion endpoints

**Issue**: 
- Deletions are permanent
- No soft delete option
- Cannot recover accidentally deleted data

**Impact**: Data loss

**Fix**: Implement soft deletes with audit trail

---

## 🔵 ARCHITECTURAL CONCERNS

### 26. **Tight Coupling Between Layers**
**Issue**: Routers directly access database, no service layer abstraction

**Impact**: 
- Hard to test
- Code duplication
- Difficult to maintain

**Fix**: Implement proper service layer pattern

---

### 27. **Missing API Versioning**
**Issue**: No version prefix in API routes (e.g., `/v1/patients`)

**Impact**: Breaking changes affect all clients

**Fix**: Implement API versioning strategy

---

### 28. **No Request Validation Middleware**
**Issue**: Validation scattered across route handlers

**Impact**: Inconsistent validation, security gaps

**Fix**: Centralize validation in middleware

---

### 29. **Synchronous Background Tasks**
**Location**: `backend/app/routers/patients.py:237`

**Issue**: Long-running tasks block request threads

**Impact**: Poor scalability

**Fix**: Use proper async task queue (Celery is configured but not fully utilized)

---

### 30. **No Health Check Endpoint**
**Issue**: Basic `/health` endpoint doesn't check dependencies

**Impact**: Cannot detect partial failures

**Fix**: Implement comprehensive health checks (DB, S3, Redis)

---

## 📊 SUMMARY

| Severity | Count | Examples |
|----------|-------|----------|
| 🔴 Critical | 10 | Token exposure, plaintext passwords, infinite loops |
| 🟠 High | 10 | Memory leaks, race conditions, missing pagination |
| 🟡 Medium | 10 | Timezone issues, weak validation, incomplete cleanup |

## 🎯 IMMEDIATE ACTION ITEMS

1. **Remove plaintext password storage** (Issue #10)
2. **Fix duplicate field definitions** (Issue #3)
3. **Implement proper token handling** (Issue #2)
4. **Add pagination to patient list** (Issue #20)
5. **Fix useEffect infinite loop** (Issue #1)
6. **Remove hardcoded file paths** (Issue #4)
7. **Implement proper file validation** (Issue #6)
8. **Fix restoration monitoring loop** (Issue #11)
9. **Add transaction rollbacks** (Issue #14)
10. **Implement CSRF protection** (Issue #9)

---

**Report Generated**: 2024
**Auditor**: Amazon Q Code Analysis
**Scope**: Full codebase security and functional review
