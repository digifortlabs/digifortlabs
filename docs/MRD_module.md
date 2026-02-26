# MRD Module - Medical Records Digitization
## Status: 85% Complete ✅

**Last Updated**: January 2025  
**Target Completion**: 18 days remaining  

---

## 📊 COMPLETION OVERVIEW

| Component | Status | Progress |
|-----------|--------|----------|
| Core Features | ✅ Complete | 100% |
| Pricing System | 🟡 Design Complete | 0% |
| Registration System | 🟡 Design Complete | 0% |
| Security Foundation | 🟡 85% Complete | 85% |
| Critical Fixes | 🔴 4 Remaining | 75% |
| Production Ready | 🟡 Pending | 85% |

---

## 💰 PRICING MODEL

### Custom Usage-Based Pricing
**Model**: Fully customizable per hospital by Super Admin

#### MRD Pricing Options
- **Per File**: Flat rate per file (e.g., ₹100/file for files ≤40 pages)
- **Per Page**: Rate per page for large files (e.g., ₹1.00-1.50/page for files >40 pages)
- **Flat Monthly**: Fixed monthly fee regardless of volume
- **Hybrid**: Combination of above models

#### What's Included
- Physical file storage and warehouse tracking
- Digital PDF upload and archival
- OCR text extraction and search
- Configurable data retention period (5-10 years)
- Patient record management
- Box check-in/check-out system
- Analytics dashboard
- Monthly usage reports and invoicing

#### Bulk Discount Tiers (Configurable)
- 1,000-5,000 files/month: 10% discount
- 5,000-10,000 files/month: 15% discount
- 10,000+ files/month: 20% discount + dedicated account manager

**Note**: All pricing is negotiable and set individually per hospital. See [Module_Registration_System.md](./Module_Registration_System.md) for complete pricing documentation.

---

## 🏥 HOSPITAL REGISTRATION

### Registration Process
**Access**: Super Admin only (not public self-registration)

#### Multi-Step Registration Form (6 Steps)
1. **Basic Information**: Hospital name, type, registration number, established year
2. **Contact & Location**: Emails, phones, complete address
3. **Admin User Setup**: Admin credentials and contact info
4. **Module Selection**: Choose MRD + optional add-on modules
5. **Pricing Configuration**: Set custom pricing rates and discounts
6. **Review & Submit**: Final review with terms acceptance

**Total Fields**: 52 fields capturing complete hospital profile

**See**: [Hospital_Registration_Form.md](./Hospital_Registration_Form.md) for complete field specifications

### Database Schema Updates Required

#### New `hospitals` Table Fields
```sql
ALTER TABLE hospitals ADD COLUMN:
- organization_type VARCHAR(50)
- registration_number VARCHAR(50)
- established_year INTEGER
- secondary_email VARCHAR(255)
- alternate_phone VARCHAR(20)
- landline VARCHAR(20)
- address_line2 VARCHAR(200)
- google_maps_url TEXT
- expected_monthly_volume INTEGER
- expected_users INTEGER
- storage_requirements VARCHAR(50)
- special_requirements TEXT
- accept_marketing BOOLEAN DEFAULT FALSE
- custom_pricing JSONB
- pricing_effective_date DATE
- pricing_notes TEXT
```

#### New Tables Required
```sql
-- Usage tracking for billing
CREATE TABLE mrd_usage_logs (
    log_id SERIAL PRIMARY KEY,
    hospital_id INTEGER REFERENCES hospitals(hospital_id),
    file_id INTEGER REFERENCES pdf_files(file_id),
    patient_id INTEGER REFERENCES patients(patient_id),
    page_count INTEGER NOT NULL,
    pricing_tier VARCHAR(20),
    cost_per_unit DECIMAL(10,2),
    total_cost DECIMAL(10,2) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    billed_in_month VARCHAR(7),
    invoice_id INTEGER
);

-- Monthly invoices
CREATE TABLE monthly_invoices (
    invoice_id SERIAL PRIMARY KEY,
    hospital_id INTEGER REFERENCES hospitals(hospital_id),
    billing_month VARCHAR(7) NOT NULL,
    total_files INTEGER NOT NULL,
    total_pages INTEGER NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    bulk_discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    subscription_cost DECIMAL(10,2) DEFAULT 0,
    gst_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2) NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_date DATE,
    payment_method VARCHAR(50),
    notes TEXT
);

-- Pricing history for audit trail
CREATE TABLE pricing_history (
    history_id SERIAL PRIMARY KEY,
    hospital_id INTEGER REFERENCES hospitals(hospital_id),
    custom_pricing JSONB NOT NULL,
    effective_date DATE NOT NULL,
    end_date DATE,
    updated_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT NOW(),
    notes TEXT
);
```

---

## ✅ COMPLETED FEATURES

### Core Functionality (100%)
- ✅ Patient record management with MRD numbers
- ✅ PDF document archival with OCR processing
- ✅ Physical warehouse box tracking
- ✅ Multi-tenant hospital isolation
- ✅ Comprehensive audit logging
- ✅ Search functionality (patient records + OCR content)
- ✅ File upload and storage (S3 + local fallback)
- ✅ Invoice generation and billing
- ✅ User management with role-based access
- ✅ Dashboard analytics and reporting

### Security Improvements (85%)
- ✅ **Plaintext Password Storage** - FIXED
  - Removed `plain_password` column completely
  - Only `hashed_password` used throughout system
- ✅ **HttpOnly Cookie Authentication** - FIXED
  - JWT tokens stored in secure HttpOnly cookies
  - No more localStorage token exposure
  - XSS attack vector eliminated
- ✅ **Docker Network Security** - FIXED
  - Bridge network instead of host mode
  - Proper port mapping implemented
- ✅ **OTP Security** - ENHANCED
  - 8-digit OTP codes (vs 6-digit)
  - Rate limiting: 3 requests per hour
  - Brute force protection: 5 attempts max
  - Attempt count tracking
- ✅ **Database Backups** - AUTOMATED
  - Daily automated backups via Docker
  - 30-day retention policy
  - PostgreSQL dump format

### Infrastructure (90%)
- ✅ Production Docker Compose setup
- ✅ PostgreSQL database with migrations
- ✅ Redis for background tasks
- ✅ Celery worker for OCR processing
- ✅ AWS S3 integration with local fallback
- ✅ Email service for notifications
- ✅ Rate limiting middleware
- ✅ Security headers middleware
- ✅ Bandwidth tracking middleware

---

## 🔴 CRITICAL ISSUES REMAINING (4)

### 1. Hardcoded Secret Key
**Priority**: Critical  
**Effort**: 1 day  
**Location**: `backend/app/core/config.py:32`

```python
# Current (Vulnerable)
SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-this-in-prod")

# Fix Required
def __init__(self):
    if self.ENVIRONMENT == "production" and self.IS_UNSAFE_SECRET_KEY:
        raise ValueError("SECRET_KEY must be set in production!")
```

### 2. Hospital ID Spoofing
**Priority**: Critical  
**Effort**: 1 day  
**Location**: `backend/app/middleware/bandwidth.py:20`

```python
# Current (Vulnerable)
hospital_id = getattr(request.state, "hospital_id", None)

# Fix Required
def get_hospital_from_jwt(request: Request) -> Optional[int]:
    token = request.cookies.get("access_token") or request.headers.get("Authorization")
    if not token:
        return None
    token = token.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("hospital_id")
    except:
        return None
```

### 3. CSRF Protection Missing
**Priority**: High  
**Effort**: 3 days  
**Status**: Not implemented

```bash
# Installation Required
pip install fastapi-csrf-protect

# Implementation Required
- CSRF middleware
- Token generation endpoint
- Frontend token handling
```

### 4. RBAC System Incomplete
**Priority**: High  
**Effort**: 5 days  
**Status**: Basic checks exist, need comprehensive system

```python
# Required Implementation
class Permission(str, Enum):
    CREATE_USER = "create_user"
    UPDATE_USER = "update_user"
    DELETE_USER = "delete_user"

def require_permission(permission: Permission):
    def decorator(current_user: User = Depends(get_current_user)):
        if not has_permission(current_user, permission):
            raise HTTPException(403, f"Permission denied: {permission}")
        return current_user
    return decorator
```

---

## 🟡 PENDING IMPLEMENTATION (New Features)

### 13. Custom Pricing System
**Priority**: High  
**Effort**: 3 days  
**Status**: Design complete, implementation pending

**Backend Tasks**:
- Create `backend/app/core/modules.py` with AVAILABLE_MODULES registry
- Add pricing management API endpoints:
  - `GET /api/admin/hospitals/{id}/pricing`
  - `PUT /api/admin/hospitals/{id}/pricing`
  - `GET /api/admin/pricing/templates`
- Implement pricing calculation functions
- Add database fields: `custom_pricing`, `pricing_effective_date`, `pricing_notes`
- Create `pricing_history` table for audit trail

**Frontend Tasks**:
- Build pricing configuration form (`PricingConfigForm.tsx`)
- Create pricing history view
- Add pricing calculator tool
- Implement pricing templates selector

### 14. Hospital Registration System
**Priority**: High  
**Effort**: 4 days  
**Status**: Design complete, implementation pending

**Backend Tasks**:
- Update `POST /api/hospitals/register-with-modules` to accept 52 fields
- Add validation for all registration fields
- Add database fields: `organization_type`, `registration_number`, `established_year`, `secondary_email`, `alternate_phone`, `landline`, `address_line2`, `google_maps_url`, `expected_monthly_volume`, `expected_users`, `storage_requirements`, `special_requirements`, `accept_marketing`
- Send welcome email with credentials
- Send email verification link

**Frontend Tasks**:
- Create 6-step registration form:
  - Step 1: Basic Information (4 fields)
  - Step 2: Contact & Location (12 fields)
  - Step 3: Admin User Setup (6 fields)
  - Step 4: Module Selection (8 fields)
  - Step 5: Pricing Configuration (16 fields)
  - Step 6: Review & Submit (6 fields)
- Add progress indicator
- Implement real-time validation
- Add password strength indicator
- Create success page with hospital ID

### 15. Usage Tracking & Billing System
**Priority**: High  
**Effort**: 3 days  
**Status**: Design complete, implementation pending

**Backend Tasks**:
- Create `mrd_usage_logs` table
- Create `monthly_invoices` table
- Implement usage logging on file upload
- Calculate cost based on custom pricing
- Generate monthly invoices automatically (cron job)
- Apply bulk discounts
- Calculate GST (18%)
- Send invoice emails

**Frontend Tasks**:
- Build usage dashboard showing:
  - Current month usage statistics
  - Cost breakdown by pricing tier
  - Projected monthly bill
  - Historical usage charts
  - Bulk discount progress bar
- Create invoice management page
- Add invoice PDF download
- Display payment history

**API Endpoints Required**:
- `POST /api/mrd/calculate-cost` - Calculate file upload cost
- `GET /api/mrd/usage/{hospital_id}/monthly` - Get monthly usage
- `POST /api/mrd/invoices/generate` - Generate invoice
- `GET /api/mrd/invoices/{invoice_id}` - Get invoice details
- `GET /api/mrd/invoices/{hospital_id}/list` - List all invoices

---

## 🟡 MEDIUM PRIORITY ENHANCEMENTS (8)

### 16. File Upload Security
- Magic number validation
- File type verification
- Malware scanning integration

### 17. Multi-Factor Authentication
### 17. Multi-Factor Authentication
- TOTP-based MFA for admins
- QR code generation
- Backup codes system

### 18. Advanced Search Features
- Full-text search optimization
- Search result highlighting
- Advanced filtering options

### 8. Performance Optimizations
- Database query optimization
- Connection pool tuning
- Caching layer implementation

### 9. Monitoring & Alerting
- System health monitoring
- Error tracking integration
- Performance metrics dashboard

### 10. Compliance Features
- GDPR compliance tools
- HIPAA documentation
- Data retention policies

### 11. API Rate Limiting
- Per-endpoint rate limits
- User-specific quotas
- Abuse prevention

### 12. Session Management
- Token refresh mechanism
- Session timeout handling
- Concurrent session limits

---

## 📈 COMPLETION TIMELINE

### Phase 1: Critical Security Fixes (Week 1)
- **Day 1**: Fix hardcoded secret key validation
- **Day 2**: Fix hospital ID spoofing in middleware
- **Day 3-5**: Implement CSRF protection

### Phase 2: RBAC System (Week 2-3)
- **Day 6-10**: Complete RBAC permission system
- **Day 11-12**: Add permission decorators
- **Day 13-15**: Test and validate all endpoints

### Phase 3: Pricing & Registration (Week 3-4)
- **Day 16-18**: Implement custom pricing system
  - Create `modules.py` configuration
  - Add pricing management API endpoints
  - Build pricing configuration UI
- **Day 19-22**: Build registration system
  - Create 6-step registration form
  - Implement all 52 field validations
  - Add database schema changes
- **Day 23-25**: Usage tracking & billing
  - Implement usage logging on file upload
  - Create monthly invoice generation
  - Build usage dashboard

### Phase 4: Final Polish (Week 4)
- **Day 26-27**: File upload security enhancements
- **Day 28**: Final testing and documentation

**Total Timeline**: 28 days (4 weeks)

---

## 🎯 SUCCESS CRITERIA

### Production Readiness Checklist
- [ ] All 4 critical security issues resolved
- [ ] RBAC system fully implemented
- [ ] Custom pricing system operational
- [ ] Hospital registration form complete (52 fields)
- [ ] Usage tracking and billing system active
- [ ] File upload security enhanced
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Documentation completed

### Security Standards
- [ ] No hardcoded secrets in production
- [ ] CSRF protection active
- [ ] JWT tokens in HttpOnly cookies only
- [ ] Hospital data isolation verified
- [ ] Role-based permissions enforced
- [ ] Audit logging comprehensive
- [ ] Pricing data encrypted and secure

### Pricing & Billing Standards
- [ ] Custom pricing configurable per hospital
- [ ] Usage tracking accurate and real-time
- [ ] Monthly invoices generated automatically
- [ ] Bulk discounts applied correctly
- [ ] Pricing history maintained for audit
- [ ] GST calculations accurate (18%)

### Performance Targets
- [ ] Page load times < 2 seconds
- [ ] File upload processing < 30 seconds
- [ ] Search results < 1 second
- [ ] 99.9% uptime achieved
- [ ] Database queries optimized
- [ ] Invoice generation < 5 seconds

---

## 🔧 TECHNICAL DEBT

### Code Quality
- Remove duplicate code in routers
- Standardize error handling
- Improve type hints coverage
- Add comprehensive unit tests

### Documentation
- API documentation completion
- Deployment guide updates
- Security configuration guide
- User manual updates

---

## 📊 METRICS & KPIs

### Current Performance
- **Uptime**: 99.5%
- **Average Response Time**: 1.2s
- **File Processing**: 25s average
- **Search Performance**: 0.8s average
- **Security Score**: 85/100

### Target Performance (100% Complete)
- **Uptime**: 99.9%
- **Average Response Time**: <1s
- **File Processing**: <20s
- **Search Performance**: <0.5s
- **Security Score**: 95/100

---

## 🚀 POST-COMPLETION ROADMAP

### Phase 2: Dental OPD Module (40% Complete)
- Enhanced treatment planning
- Tooth chart visualization
- 3D scan integration
- Revenue analytics

### Phase 3: ENT OPD Module (0% Complete)
- ENT patient management
- Audiometry test tracking
- Surgery scheduling
- Prescription management

### Platform Expansion
- Multi-industry support
- Advanced AI features
- Mobile applications
- Third-party integrations

---

**Next Review**: After critical fixes completion  
**Estimated Production Date**: 18 days from current date


---

## 📋 IMPLEMENTATION SUMMARY

### What's Missing (To Be Implemented)

#### 1. Custom Pricing System (3 days)
- Backend: `modules.py`, pricing API endpoints, calculation logic
- Frontend: Pricing configuration form, history view, calculator
- Database: `custom_pricing` field, `pricing_history` table

#### 2. Hospital Registration (4 days)
- Backend: 52-field registration endpoint, validation, email notifications
- Frontend: 6-step registration form with progress indicator
- Database: 13 new fields in hospitals table

#### 3. Usage Tracking & Billing (3 days)
- Backend: Usage logging, invoice generation, bulk discounts
- Frontend: Usage dashboard, invoice management
- Database: `mrd_usage_logs`, `monthly_invoices` tables
- API: 5 new endpoints for cost calculation and invoicing

**Total Additional Work**: 10 days
**Updated Timeline**: 28 days total (18 existing + 10 new)

### Documentation Complete
- ✅ [Module_Registration_System.md](./Module_Registration_System.md) - Complete system design
- ✅ [Hospital_Registration_Form.md](./Hospital_Registration_Form.md) - All 52 fields specified
- ✅ MRD_module.md - Updated with pricing and registration sections

---

**Document Version**: 2.0  
**Last Updated**: January 2025  
**Next Steps**: Begin implementation of custom pricing system
