# Module Registration System Documentation

## Overview
Flexible module selection system allowing hospitals to choose specific features during registration with automatic pricing calculation. Supports both full platform access and custom module selection.

---

## Business Requirements

### Registration Scenarios
1. **Full Platform**: All modules (MRD + HMS + Dental + ENT + Clinic + Pharma + Accounting + Inventory)
2. **Custom Selection**: Specific modules only (e.g., MRD + Dental)
3. **Core Only**: Just Medical Record Digitization (MRD)

### Pricing Structure

#### MRD Module (Core - Required)
**Custom Pricing Model** (Configurable per Hospital):
- Pricing is set individually for each hospital based on negotiation
- Super Admin can configure custom rates in hospital settings
- Default pricing structure (can be overridden):
  - Base rate per file
  - Page threshold for bulk files
  - Rate per page for files exceeding threshold
  - Premium rate option for faster processing

**What's Included in MRD**:
- Physical file storage and tracking (warehouse management)
- Digital PDF upload and archival
- OCR text extraction and search
- Configurable data retention period
- Patient record management
- Box check-in/check-out system
- Analytics dashboard

#### Add-on Modules (Annual Subscription)
**Custom Pricing** (Configurable per Hospital):
- Each module price can be customized during hospital registration
- Super Admin sets pricing based on hospital size, volume, and negotiation
- Default pricing (reference only):
  - HMS (Hospital Management): ₹30,000/year
  - Dental OPD: ₹25,000/year
  - ENT OPD: ₹25,000/year
  - Clinic OPD: ₹20,000/year
  - Pharma Medical: ₹20,000/year
  - Accounting: ₹15,000/year
  - Inventory: ₹10,000/year

**Note**: All pricing is customizable. Super Admin must set rates before hospital registration.

---

## System Architecture

### Database Schema
**Existing Structure**:
- `hospitals.enabled_modules` JSON field stores active modules
- Format: `["core", "hms", "dental"]`

**New Fields Required**:
- `hospitals.custom_pricing` JSON field stores hospital-specific pricing
- Format:
```json
{
  "mrd": {
    "pricing_model": "per_file" | "per_page" | "flat_monthly",
    "base_rate_per_file": 100,
    "page_threshold": 40,
    "rate_per_page_standard": 1.00,
    "rate_per_page_premium": 1.50,
    "bulk_discount_tiers": [
      {"min_files": 1000, "discount_percent": 10},
      {"min_files": 5000, "discount_percent": 15}
    ]
  },
  "modules": {
    "hms": 30000,
    "dental": 25000,
    "ent": 25000,
    "clinic": 20000,
    "pharma": 20000,
    "accounting": 15000,
    "inventory": 10000
  },
  "retention_years": 5,
  "notes": "Custom pricing negotiated on 2025-01-15"
}
```

### Module Configuration File
**Location**: `backend/app/core/modules.py`

**Purpose**: Central registry of all available modules with metadata

**Structure**:
```
AVAILABLE_MODULES = {
    "module_id": {
        "name": "Display Name",
        "price": annual_cost,
        "required": boolean,
        "description": "Brief description",
        "features": ["Feature 1", "Feature 2"]
    }
}
```

**Functions**:
- `validate_module_selection(modules: List[str])` - Ensures core included, all IDs valid
- `calculate_total_price(modules: List[str])` - Computes annual cost
- `get_module_features(module_id: str)` - Returns feature list

---

## API Endpoints

### 1. Get Available Modules
**Endpoint**: `GET /api/modules/available`  
**Auth**: None (public)  
**Purpose**: Fetch modules for registration page

**Response**:
```json
{
  "modules": [
    {
      "id": "core",
      "name": "Medical Record Digitization (MRD)",
      "pricing_model": "custom",
      "default_pricing": {
        "base_rate_per_file": 100,
        "page_threshold": 40,
        "rate_per_page_standard": 1.00,
        "rate_per_page_premium": 1.50
      },
      "required": true,
      "description": "Customizable pricing - Contact admin for rates",
      "features": ["Physical Storage", "Digital Archival", "OCR Search", "Warehouse Management", "Custom Retention Period"]
    },
    {
      "id": "hms",
      "name": "Hospital Management System",
      "pricing_model": "custom_annual",
      "default_price": 30000,
      "required": false,
      "description": "Custom pricing available",
      "features": ["Patient Admissions", "Bed Management", "Lab Integration", "Pharmacy System"]
    }
  ],
  "note": "Pricing shown is default. Actual pricing will be customized during registration."
}
```

### 2. Register Hospital with Modules
**Endpoint**: `POST /api/hospitals/register-with-modules`  
**Auth**: Super Admin only (not public)

**Complete Request Payload** (52 fields):
```json
{
  "hospital_name": "Apollo Hospitals Mumbai",
  "organization_type": "Hospital",
  "registration_number": "MH-MUM-12345",
  "established_year": 1995,
  "email": "admin@apollomumbai.com",
  "secondary_email": "billing@apollomumbai.com",
  "phone": "+91-9876543210",
  "alternate_phone": "+91-9876543211",
  "landline": "022-12345678",
  "address_line1": "123, MG Road, Andheri West",
  "address_line2": "Near Metro Station",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postal_code": "400058",
  "country": "India",
  "google_maps_url": "https://goo.gl/maps/xyz123",
  "admin_full_name": "Dr. Rajesh Kumar",
  "admin_email": "rajesh.kumar@apollomumbai.com",
  "admin_phone": "+91-9876543210",
  "admin_designation": "Chief Medical Officer",
  "password": "SecurePass@123",
  "confirm_password": "SecurePass@123",
  "selected_modules": ["core", "hms", "dental"],
  "custom_pricing": {
    "mrd": {
      "pricing_model": "per_file",
      "base_rate_per_file": 120,
      "page_threshold": 50,
      "rate_per_page_standard": 1.20,
      "rate_per_page_premium": 1.80,
      "bulk_discount_tiers": [
        {"min_files": 1000, "discount_percent": 10},
        {"min_files": 5000, "discount_percent": 15}
      ]
    },
    "modules": {
      "hms": 35000,
      "dental": 28000
    },
    "retention_years": 7,
    "effective_date": "2025-02-01",
    "notes": "Premium pricing for enterprise client"
  },
  "expected_monthly_volume": 2000,
  "expected_users": 50,
  "storage_requirements": "Large",
  "special_requirements": "Need integration with existing HIS system",
  "accept_terms": true,
  "accept_marketing": false
}
```

**Field Details**: See [Hospital_Registration_Form.md](./Hospital_Registration_Form.md) for complete field specifications
```

**Validation Rules**:
- `hospital_name`: Required, 3-200 characters
- `organization_type`: Required, must be valid option
- `email`: Required, valid format, unique
- `phone`: Required, valid format with country code
- `address_line1`, `city`, `state`, `postal_code`, `country`: Required
- `admin_full_name`: Required, 3-100 characters
- `admin_email`: Required, valid format
- `password`: Required, min 8 chars (1 uppercase, 1 lowercase, 1 number, 1 special char)
- `confirm_password`: Must match password
- `selected_modules`: Must include "core", all IDs must exist
- `custom_pricing`: Required if super admin, validate pricing logic
- `accept_terms`: Must be true

**Response**:
```json
{
  "hospital_id": 123,
  "hospital_name": "Apollo Hospital",
  "enabled_modules": ["core", "hms", "dental"],
  "custom_pricing": {
    "mrd": {
      "base_rate_per_file": 120,
      "page_threshold": 50,
      "rate_per_page_standard": 1.20
    },
    "modules": {
      "hms": 35000,
      "dental": 28000
    }
  },
  "annual_subscription_cost": 63000,
  "mrd_cost_model": "Pay-per-file (custom rates)",
  "access_token": "eyJ...",
  "message": "Hospital registered with custom pricing"
}
```

**Errors**:
- 400: Invalid module selection
- 409: Email already exists
- 422: Validation errors

### 3. Update Hospital Modules (Future)
**Endpoint**: `PATCH /api/hospitals/{hospital_id}/modules`  
**Auth**: Admin only

**Request**:
```json
{
  "add_modules": ["pharma"],
  "remove_modules": ["inventory"]
}
```

**Rules**:
- Cannot remove "core"
- Pro-rated billing for mid-cycle changes
- Requires admin authentication

---

## Frontend Components

### 1. ModuleSelector Component
**Location**: `frontend/src/components/ModuleSelector.tsx`

**Features**:
- Grid layout with module cards
- Checkbox selection (core disabled/pre-selected)
- Feature list expansion
- Real-time price calculation
- "Select All" / "Deselect All" actions

**Props**:
```typescript
interface ModuleSelectorProps {
  selectedModules: string[];
  onModuleToggle: (moduleId: string) => void;
  modules: Module[];
}
```

**State**:
- `selectedModules`: Array of selected IDs
- `totalPrice`: Computed from selection
- `modules`: Fetched from API

### 2. PricingSummary Component
**Location**: `frontend/src/components/PricingSummary.tsx`

**Display**:
- Selected modules with individual prices
- Subtotal calculation
- GST 18% breakdown
- Total annual cost (highlighted)
- Monthly equivalent

**Behavior**:
- Sticky position on desktop
- Collapsible on mobile
- Updates in real-time

### 3. Registration Page
**Location**: `frontend/src/app/register/page.tsx`

**Multi-Step Flow** (6 Steps):
1. **Basic Information**: Hospital name, organization type, registration number, established year
2. **Contact & Location**: Emails, phones, complete address details
3. **Admin User Setup**: Admin credentials and contact information
4. **Module Selection**: Choose required modules with feature preview
5. **Pricing Configuration** (Super Admin only): Set custom pricing for MRD and modules
6. **Review & Submit**: Final review with terms acceptance

**Complete Field List**: See [Hospital_Registration_Form.md](./Hospital_Registration_Form.md) for detailed field specifications (52 fields total)

**Validation**:
- Client-side: Real-time validation on field blur
- Server-side: Re-validate all fields on submission
- Core module required (cannot be deselected)
- Email uniqueness check
- Password strength requirements
- Confirmation dialog before final submission

---

## User Experience Flow

### Registration Journey

**Step 1: Basic Information**
- Hospital name (required)
- Organization type dropdown (Hospital, Clinic, Dental, ENT, etc.)
- Registration number (optional)
- Established year (optional)

**Step 2: Contact & Location**
- Primary email (required, unique)
- Secondary email (optional)
- Primary phone (required)
- Alternate phone & landline (optional)
- Complete address (line 1, line 2, city, state, postal code, country)
- Google Maps URL (optional)

**Step 3: Admin User Setup**
- Admin full name (required)
- Admin email (required, can differ from hospital email)
- Admin phone (required)
- Admin designation (optional)
- Password & confirm password (required, min 8 chars with complexity)

**Step 4: Module Selection**
- Core MRD module (pre-selected, locked)
- Optional modules with checkboxes:
  - HMS (Hospital Management System)
  - Dental OPD
  - ENT OPD
  - Clinic OPD
  - Pharma Medical
  - Accounting
  - Inventory
- Feature list expansion on hover/click
- Real-time pricing summary (if pricing configured)

**Step 5: Pricing Configuration** (Super Admin Only)
- MRD pricing model selection (per_file, per_page, flat_monthly)
- Base rate per file (₹)
- Page threshold for bulk files
- Rate per page - standard & premium (₹)
- Bulk discount tiers (dynamic array)
- Individual module annual prices (₹)
- Data retention period (years)
- Pricing effective date
- Pricing notes (textarea)

**Step 6: Review & Submit**
- Expected monthly volume (optional)
- Number of users (optional)
- Storage requirements dropdown (optional)
- Special requirements (textarea, optional)
- Terms & conditions acceptance (required checkbox)
- Marketing communications opt-in (optional checkbox)
- Final summary display
- Submit button with loading state

**Post-Submission**:
- Success message with hospital ID
- Email verification sent to admin email
- Welcome email with login credentials
- Redirect to login page (or auto-login to dashboard)

---

## Module Activation Logic

### On Registration
1. Validate selected modules
2. Ensure "core" included
3. Calculate total price
4. Create hospital with `enabled_modules`
5. Generate JWT with module access
6. Send confirmation email

### On Login
1. Fetch hospital record
2. Read `enabled_modules`
3. Include in JWT payload
4. Frontend filters features
5. Backend validates access

### Access Control

**Backend Middleware**:
- `require_module(module_id)` decorator
- Checks hospital's enabled modules
- Returns 403 if not active

**Frontend Guards**:
- Sidebar filtered by modules
- Direct URL blocked with redirect
- Feature flags based on availability

---

## Pricing Examples

### Example 1: MRD Only (Small Clinic)
**Modules**: Core MRD only  
**Usage**: 500 IPD files/year (average 30 pages each)  
**Cost**: 500 × ₹100 = **₹50,000/year** (usage-based)  
**Use Case**: Small clinic with moderate patient volume

### Example 2: MRD with Large Files
**Modules**: Core MRD only  
**Usage**: 300 files/year (average 60 pages each)  
**Calculation**:
- 300 files × 60 pages = 18,000 pages
- 18,000 × ₹1.00 = **₹18,000/year**  
**Use Case**: Clinic with comprehensive medical records

### Example 3: Dental Clinic with Add-on
**Modules**: MRD + Dental OPD  
**Usage**: 400 files/year (average 25 pages)  
**Cost**: 
- MRD: 400 × ₹100 = ₹40,000
- Dental Module: ₹25,000
- **Total**: **₹65,000/year**  
**Use Case**: Dental practice with specialized features

### Example 4: Multi-Specialty Hospital
**Modules**: MRD + HMS + Dental + ENT + Pharma  
**Usage**: 2,000 files/year (average 35 pages)  
**Cost**:
- MRD: 2,000 × ₹100 = ₹200,000
- HMS: ₹30,000
- Dental: ₹25,000
- ENT: ₹25,000
- Pharma: ₹20,000
- **Total**: **₹300,000/year**  
**Use Case**: Large hospital with multiple departments

### Example 5: High-Volume Enterprise
**Modules**: All 8 modules  
**Usage**: 5,000 files/year (mix of sizes)  
**Breakdown**:
- 3,000 files ≤40 pages: 3,000 × ₹100 = ₹300,000
- 2,000 files >40 pages (avg 80 pages): 160,000 pages × ₹1.00 = ₹160,000
- MRD Total: ₹460,000
- All Add-on Modules: ₹145,000
- **Grand Total**: **₹605,000/year**  
**Use Case**: Large healthcare organization with high digitization volume

---

## Implementation Checklist

## Implementation Checklist

### Backend Tasks
- [ ] Create `backend/app/core/modules.py` with AVAILABLE_MODULES
- [ ] Add validation functions (validate_module_selection, calculate_subscription_cost)
- [ ] Create `/api/modules/available` endpoint with usage-based pricing info
- [ ] Update `/api/hospitals/register-with-modules` endpoint to accept all 52 fields
- [ ] Implement field validation for all registration fields
- [ ] Add database fields: `organization_type`, `registration_number`, `established_year`, `secondary_email`, `alternate_phone`, `landline`, `address_line2`, `google_maps_url`, `admin_designation`, `expected_monthly_volume`, `expected_users`, `storage_requirements`, `special_requirements`, `accept_marketing`
- [ ] Implement `require_module()` middleware decorator
- [ ] Add module access validation to protected routes
- [ ] **Create MRD usage tracking system**:
  - [ ] Track file uploads per hospital
  - [ ] Calculate page count for pricing
  - [ ] Generate monthly usage invoices
  - [ ] Apply bulk discounts automatically
  - [ ] Store usage history in database
- [ ] Send welcome email with credentials
- [ ] Send email verification link

### Frontend Tasks
- [ ] Create `ModuleSelector.tsx` component with feature preview
- [ ] Create `PricingSummary.tsx` component with real-time calculation
- [ ] Create multi-step registration form (6 steps):
  - [ ] Step 1: Basic Information form
  - [ ] Step 2: Contact & Location form
  - [ ] Step 3: Admin User Setup form
  - [ ] Step 4: Module Selection with checkboxes
  - [ ] Step 5: Pricing Configuration (super admin only)
  - [ ] Step 6: Review & Submit with summary
- [ ] Implement progress indicator for multi-step form
- [ ] Add client-side validation for all 52 fields
- [ ] Add real-time validation on field blur
- [ ] Display field-level error messages
- [ ] Add password strength indicator
- [ ] Implement "Save Draft" functionality (optional)
- [ ] Add module-based sidebar filtering
- [ ] Implement feature flags based on enabled_modules
- [ ] Add loading states and error handling
- [ ] Create success page with hospital ID display
- [ ] Add responsive design for mobile/tablet

### Database Tasks
- [ ] Update `hospitals` table schema:
  - [ ] Add `organization_type` VARCHAR(50)
  - [ ] Add `registration_number` VARCHAR(50)
  - [ ] Add `established_year` INTEGER
  - [ ] Add `secondary_email` VARCHAR(255)
  - [ ] Add `alternate_phone` VARCHAR(20)
  - [ ] Add `landline` VARCHAR(20)
  - [ ] Add `address_line2` VARCHAR(200)
  - [ ] Add `google_maps_url` TEXT
  - [ ] Add `expected_monthly_volume` INTEGER
  - [ ] Add `expected_users` INTEGER
  - [ ] Add `storage_requirements` VARCHAR(50)
  - [ ] Add `special_requirements` TEXT
  - [ ] Add `accept_marketing` BOOLEAN DEFAULT FALSE
  - [ ] Add `custom_pricing` JSONB
  - [ ] Add `pricing_effective_date` DATE
  - [ ] Add `pricing_notes` TEXT
- [ ] Update `users` table schema:
  - [ ] Add `designation` VARCHAR(100) for admin users
- [ ] Update existing hospitals to have ["core"] if enabled_modules is null
- [ ] Seed AVAILABLE_MODULES reference data
- [ ] **Create usage tracking tables**:
  - [ ] `mrd_usage_logs` table (hospital_id, file_id, page_count, cost, timestamp)
  - [ ] `monthly_invoices` table (hospital_id, month, file_count, total_pages, total_cost)
  - [ ] `pricing_history` table (hospital_id, custom_pricing, effective_date, updated_by)
  - [ ] Add indexes for efficient billing queries

### Testing Tasks
- [ ] Unit tests for pricing calculation
- [ ] Integration tests for registration flow
- [ ] E2E tests for module selection UI
- [ ] Validation tests for access control
- [ ] Edge cases: invalid modules, missing core

---

## Security Considerations

### Module Access Validation
- Always validate on backend (never trust frontend)
- Include enabled_modules in JWT claims
- Re-validate on every protected route
- Log unauthorized access attempts

### Pricing Integrity
- Server-side calculation only
- Never accept price from frontend
- Validate module IDs against registry
- Prevent price manipulation

### Registration Security
- Rate limit: 5 attempts per IP per hour
- Email verification required
- Strong password enforcement
- CAPTCHA for bot prevention (future)

---

## Future Enhancements

### Bundle Pricing
- **"Starter Package"** (MRD usage-based only): Pay-per-file, no subscription
- **"Healthcare Suite"** (MRD + HMS + Dental + ENT + Clinic): ₹100,000/year subscription + MRD usage (save ₹20,000)
- **"Complete Platform"** (All 8 modules): ₹130,000/year subscription + MRD usage (save ₹35,000)
- **"Enterprise Plus"** (All modules + Premium Support + Bulk Discounts): Custom pricing

**Bulk Usage Discounts for MRD**:
- 1,000-5,000 files/year: 10% discount on per-file rate
- 5,000-10,000 files/year: 15% discount
- 10,000+ files/year: 20% discount + dedicated account manager

### Trial Periods
- 30-day free trial for any 2 modules
- Auto-conversion to paid
- Credit card required but not charged

### Module Upgrades
- Mid-cycle additions with pro-rated billing
- Downgrade restrictions (data retention)
- Upgrade incentives (multi-module discounts)

### Usage-Based Pricing
- Base fee + per-user charges
- Storage limits per tier
- API call limits

### Payment Integration
- Razorpay/Stripe integration
- Automatic recurring billing
- Invoice generation
- Payment failure handling

---

## Developer Guide

### Adding a New Module

1. **Update Module Registry** (`modules.py`):
   - Add entry to AVAILABLE_MODULES
   - Set price, description, features

2. **Create Module Router** (`backend/app/routers/`):
   - Create new router file
   - Add module-specific endpoints
   - Apply `require_module()` decorator

3. **Register Router** (`main.py`):
   - Import and include router
   - Add to API documentation

4. **Create Frontend Pages** (`frontend/src/app/`):
   - Create module directory
   - Add page components
   - Implement module features

5. **Update Navigation**:
   - Add route to sidebar
   - Add module icon
   - Update route guards

6. **Update Documentation**:
   - Add to Module_Master_Plan.md
   - Create module-specific docs
   - Update pricing tables

### Module Naming Conventions
- **Backend ID**: lowercase_underscore (e.g., `dental_opd`)
- **Frontend Route**: lowercase-hyphen (e.g., `/dental-opd`)
- **Display Name**: Title Case (e.g., "Dental OPD")
- **Database Value**: lowercase_underscore (matches backend)

---

## Support Scenarios

### Common Issues

**Module Not Appearing**:
- Check `enabled_modules` in database
- Verify JWT token includes module
- Clear browser cache/cookies

**Access Denied Errors**:
- Validate hospital has module enabled
- Check JWT token claims
- Verify middleware applied correctly

**Pricing Discrepancies**:
- Audit AVAILABLE_MODULES pricing
- Check calculation logic
- Verify no client-side manipulation

**Module Upgrade Requests**:
- Use admin panel to update enabled_modules
- Calculate pro-rated charges
- Send confirmation email

---

## Monitoring & Analytics

### Track Metrics
- Most popular module combinations
- Module activation rates
- Pricing tier distribution
- Trial-to-paid conversion
- Module upgrade frequency
- Revenue per module

### Alerts
- Failed registration attempts
- Unauthorized module access
- Payment failures
- Module activation errors

---

**Document Version**: 1.0  
**Created**: January 2026  
**Status**: Design Complete - Ready for Implementation  
**Owner**: DIGIFORT LABS Development Team


---

## MRD Usage-Based Billing System

### Pricing Logic

#### File Upload Pricing Calculation
```
IF file_pages <= 40:
    cost = ₹100 (flat rate)
ELSE:
    cost = file_pages × ₹1.00 (standard OCR)
    OR
    cost = file_pages × ₹1.50 (premium OCR with faster processing)
```

#### Example Calculations
- **20-page file**: ₹100
- **40-page file**: ₹100
- **50-page file**: 50 × ₹1.00 = ₹50 (standard) or 50 × ₹1.50 = ₹75 (premium)
- **100-page file**: 100 × ₹1.00 = ₹100 (standard) or 100 × ₹1.50 = ₹150 (premium)

### Usage Tracking System

#### On File Upload
1. Count PDF pages automatically
2. Calculate cost based on pricing logic
3. Log to `mrd_usage_logs` table
4. Update hospital's monthly usage counter
5. Display cost to user before confirming upload

#### Monthly Billing Cycle
1. Aggregate all file uploads for the month
2. Calculate total cost with bulk discounts applied
3. Generate invoice with itemized breakdown
4. Email invoice to hospital admin
5. Process payment (manual/automatic)

### Bulk Discount Tiers

| Monthly File Volume | Discount | Effective Rate per File (≤40 pages) |
|---------------------|----------|--------------------------------------|
| 1-999 files         | 0%       | ₹100                                 |
| 1,000-4,999 files   | 10%      | ₹90                                  |
| 5,000-9,999 files   | 15%      | ₹85                                  |
| 10,000+ files       | 20%      | ₹80                                  |

**Note**: Discounts apply to entire monthly volume, not tiered.

### Database Schema for Usage Tracking

#### `mrd_usage_logs` Table
```sql
CREATE TABLE mrd_usage_logs (
    log_id SERIAL PRIMARY KEY,
    hospital_id INTEGER REFERENCES hospitals(hospital_id),
    file_id INTEGER REFERENCES pdf_files(file_id),
    patient_id INTEGER REFERENCES patients(patient_id),
    page_count INTEGER NOT NULL,
    pricing_tier VARCHAR(20), -- 'flat_rate', 'standard_per_page', 'premium_per_page'
    cost_per_unit DECIMAL(10,2),
    total_cost DECIMAL(10,2) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    billed_in_month VARCHAR(7), -- 'YYYY-MM' format
    invoice_id INTEGER REFERENCES monthly_invoices(invoice_id)
);
```

#### `monthly_invoices` Table
```sql
CREATE TABLE monthly_invoices (
    invoice_id SERIAL PRIMARY KEY,
    hospital_id INTEGER REFERENCES hospitals(hospital_id),
    billing_month VARCHAR(7) NOT NULL, -- 'YYYY-MM'
    total_files INTEGER NOT NULL,
    total_pages INTEGER NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    bulk_discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    subscription_cost DECIMAL(10,2) DEFAULT 0, -- Add-on modules
    gst_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2) NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
    payment_date DATE,
    payment_method VARCHAR(50),
    notes TEXT
);
```

### API Endpoints for Usage Tracking

#### 1. Calculate File Upload Cost (Pre-Upload)
**Endpoint**: `POST /api/mrd/calculate-cost`  
**Auth**: Required  
**Purpose**: Show cost before user confirms upload

**Request**:
```json
{
  "page_count": 65,
  "pricing_tier": "standard"
}
```

**Response**:
```json
{
  "page_count": 65,
  "pricing_tier": "standard_per_page",
  "rate_per_page": 1.00,
  "total_cost": 65.00,
  "message": "This file will cost ₹65.00 (65 pages × ₹1.00/page)"
}
```

#### 2. Get Monthly Usage Summary
**Endpoint**: `GET /api/mrd/usage/{hospital_id}/monthly?month=2025-01`  
**Auth**: Admin only  
**Purpose**: View current month's usage and projected cost

**Response**:
```json
{
  "hospital_id": 123,
  "billing_month": "2025-01",
  "files_uploaded": 1250,
  "total_pages": 45000,
  "subtotal": 112500,
  "bulk_discount": 10,
  "discount_amount": 11250,
  "total_mrd_cost": 101250,
  "subscription_modules_cost": 55000,
  "projected_total": 156250,
  "files_by_tier": {
    "flat_rate": 800,
    "standard_per_page": 400,
    "premium_per_page": 50
  }
}
```

#### 3. Generate Invoice
**Endpoint**: `POST /api/mrd/invoices/generate`  
**Auth**: Admin/System  
**Purpose**: Create monthly invoice (automated on 1st of each month)

**Request**:
```json
{
  "hospital_id": 123,
  "billing_month": "2025-01"
}
```

**Response**:
```json
{
  "invoice_id": 456,
  "invoice_number": "INV-2025-01-123",
  "hospital_name": "Apollo Hospital",
  "billing_month": "2025-01",
  "line_items": [
    {
      "description": "MRD Usage - 1,250 files",
      "quantity": 1250,
      "rate": 90,
      "amount": 112500
    },
    {
      "description": "Bulk Discount (10%)",
      "amount": -11250
    },
    {
      "description": "HMS Module Subscription",
      "amount": 30000
    },
    {
      "description": "Dental Module Subscription",
      "amount": 25000
    }
  ],
  "subtotal": 156250,
  "gst_18_percent": 28125,
  "total_amount": 184375,
  "due_date": "2025-02-15",
  "payment_status": "pending"
}
```

### Frontend Components for Usage Tracking

#### 1. Upload Cost Preview Component
**Location**: `frontend/src/components/UploadCostPreview.tsx`

**Features**:
- Shows cost calculation before upload
- Displays pricing tier (flat/per-page)
- Option to select standard vs premium OCR
- Confirmation dialog with cost breakdown

#### 2. Usage Dashboard Component
**Location**: `frontend/src/app/dashboard/usage/page.tsx`

**Features**:
- Current month usage statistics
- Cost breakdown by pricing tier
- Projected monthly bill
- Historical usage charts
- Bulk discount progress bar

#### 3. Invoice Management Page
**Location**: `frontend/src/app/dashboard/invoices/page.tsx`

**Features**:
- List of all invoices (paid/pending)
- Download invoice PDF
- Payment history
- Usage details per invoice

### Automated Billing Workflow

#### Monthly Invoice Generation (Automated)
**Trigger**: Cron job on 1st of each month at 00:00 IST

**Process**:
1. Query all hospitals with MRD usage in previous month
2. Calculate total files, pages, and costs
3. Apply bulk discounts based on volume
4. Add subscription costs for enabled modules
5. Calculate GST (18%)
6. Generate invoice record in database
7. Create PDF invoice document
8. Email invoice to hospital admin
9. Send payment reminder if previous invoices unpaid

#### Payment Processing
**Manual Payment**:
- Admin marks invoice as paid in system
- Upload payment receipt
- Update payment date and method

**Automatic Payment** (Future):
- Razorpay/Stripe integration
- Auto-charge on file upload (prepaid credits)
- Monthly auto-debit for subscription + usage

### Cost Optimization Tips for Hospitals

#### Reduce MRD Costs
1. **Batch uploads**: Upload files in bulk to reach discount tiers faster
2. **Standard OCR**: Use standard pricing (₹1/page) unless premium speed needed
3. **File consolidation**: Combine related documents to stay under 40-page threshold
4. **Archive old files**: Move inactive files to cold storage (future feature)

#### Volume Projections
- **Small Clinic** (50 files/month): ~₹5,000/month
- **Medium Hospital** (500 files/month): ~₹50,000/month
- **Large Hospital** (2,000 files/month): ~₹180,000/month (with 10% discount)
- **Enterprise** (10,000 files/month): ~₹800,000/month (with 20% discount)

---

**Document Version**: 2.0  
**Last Updated**: January 2025  
**Status**: Usage-Based Pricing Model - Ready for Implementation  
**Owner**: DIGIFORT LABS Development Team


---

## Custom Pricing Management System

### Super Admin Pricing Configuration

#### Pricing Configuration Interface
**Location**: `frontend/src/app/admin/pricing/configure/page.tsx`

**Features**:
- Set custom MRD pricing per hospital
- Configure module subscription costs
- Define bulk discount tiers
- Set retention period
- Add pricing notes/justification

#### Pricing Templates
**Pre-defined Templates** (Quick Start):
1. **Small Clinic**: Low volume, basic pricing
2. **Medium Hospital**: Standard pricing with moderate discounts
3. **Large Enterprise**: Premium pricing with bulk discounts
4. **Custom**: Fully customizable from scratch

### API Endpoints for Pricing Management

#### 1. Get Hospital Pricing
**Endpoint**: `GET /api/admin/hospitals/{hospital_id}/pricing`  
**Auth**: Super Admin only

**Response**:
```json
{
  "hospital_id": 123,
  "hospital_name": "Apollo Hospital",
  "custom_pricing": {
    "mrd": {
      "pricing_model": "per_file",
      "base_rate_per_file": 120,
      "page_threshold": 50,
      "rate_per_page_standard": 1.20,
      "rate_per_page_premium": 1.80,
      "bulk_discount_tiers": [
        {"min_files": 1000, "discount_percent": 10},
        {"min_files": 5000, "discount_percent": 15}
      ]
    },
    "modules": {
      "hms": 35000,
      "dental": 28000
    },
    "retention_years": 7,
    "notes": "Premium pricing for enterprise client",
    "effective_date": "2025-01-15",
    "last_updated": "2025-01-15T10:30:00Z",
    "updated_by": "superadmin@digifort.com"
  }
}
```

#### 2. Update Hospital Pricing
**Endpoint**: `PUT /api/admin/hospitals/{hospital_id}/pricing`  
**Auth**: Super Admin only

**Request**:
```json
{
  "custom_pricing": {
    "mrd": {
      "pricing_model": "per_page",
      "base_rate_per_file": 150,
      "page_threshold": 30,
      "rate_per_page_standard": 2.00,
      "rate_per_page_premium": 2.50
    },
    "modules": {
      "hms": 40000,
      "dental": 30000,
      "pharma": 25000
    },
    "retention_years": 10,
    "notes": "Updated pricing after contract renewal"
  },
  "effective_date": "2025-02-01"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Pricing updated successfully",
  "hospital_id": 123,
  "effective_date": "2025-02-01",
  "pricing_history_id": 456
}
```

#### 3. Get Pricing Templates
**Endpoint**: `GET /api/admin/pricing/templates`  
**Auth**: Super Admin only

**Response**:
```json
{
  "templates": [
    {
      "id": "small_clinic",
      "name": "Small Clinic",
      "description": "For clinics with <500 files/month",
      "pricing": {
        "mrd": {
          "base_rate_per_file": 80,
          "page_threshold": 40,
          "rate_per_page_standard": 0.80
        },
        "modules": {
          "hms": 20000,
          "dental": 18000
        }
      }
    },
    {
      "id": "enterprise",
      "name": "Large Enterprise",
      "description": "For hospitals with >5000 files/month",
      "pricing": {
        "mrd": {
          "base_rate_per_file": 150,
          "page_threshold": 50,
          "rate_per_page_standard": 1.50,
          "bulk_discount_tiers": [
            {"min_files": 5000, "discount_percent": 20}
          ]
        },
        "modules": {
          "hms": 50000,
          "dental": 40000
        }
      }
    }
  ]
}
```

### Database Schema for Custom Pricing

#### Update `hospitals` Table
```sql
ALTER TABLE hospitals 
ADD COLUMN custom_pricing JSONB,
ADD COLUMN pricing_effective_date DATE,
ADD COLUMN pricing_notes TEXT;
```

#### Create `pricing_history` Table
```sql
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

### Pricing Calculation Logic

#### On File Upload
```python
def calculate_file_cost(hospital_id, page_count, pricing_tier='standard'):
    # Fetch hospital's custom pricing
    pricing = get_hospital_pricing(hospital_id)
    
    if page_count <= pricing['mrd']['page_threshold']:
        cost = pricing['mrd']['base_rate_per_file']
    else:
        if pricing_tier == 'premium':
            rate = pricing['mrd']['rate_per_page_premium']
        else:
            rate = pricing['mrd']['rate_per_page_standard']
        cost = page_count * rate
    
    return cost
```

#### Monthly Billing with Bulk Discounts
```python
def calculate_monthly_bill(hospital_id, month):
    pricing = get_hospital_pricing(hospital_id)
    usage = get_monthly_usage(hospital_id, month)
    
    # Calculate base MRD cost
    mrd_cost = sum([log['cost'] for log in usage['files']])
    
    # Apply bulk discount
    file_count = len(usage['files'])
    discount_percent = 0
    for tier in pricing['mrd'].get('bulk_discount_tiers', []):
        if file_count >= tier['min_files']:
            discount_percent = tier['discount_percent']
    
    discount_amount = mrd_cost * (discount_percent / 100)
    mrd_final = mrd_cost - discount_amount
    
    # Add module subscriptions
    module_cost = sum([
        pricing['modules'].get(module, 0) 
        for module in usage['enabled_modules']
    ])
    
    total = mrd_final + module_cost
    gst = total * 0.18
    
    return {
        'mrd_cost': mrd_cost,
        'discount': discount_amount,
        'mrd_final': mrd_final,
        'module_cost': module_cost,
        'subtotal': total,
        'gst': gst,
        'total': total + gst
    }
```

### Frontend Components

#### 1. Pricing Configuration Form
**Location**: `frontend/src/components/admin/PricingConfigForm.tsx`

**Fields**:
- MRD Pricing Model (dropdown: per_file, per_page, flat_monthly)
- Base Rate per File (number input)
- Page Threshold (number input)
- Rate per Page - Standard (number input)
- Rate per Page - Premium (number input)
- Bulk Discount Tiers (dynamic array)
- Module Prices (individual inputs for each module)
- Retention Years (number input)
- Effective Date (date picker)
- Notes (textarea)

#### 2. Pricing History View
**Location**: `frontend/src/app/admin/hospitals/{id}/pricing-history/page.tsx`

**Features**:
- Timeline of pricing changes
- Compare pricing versions
- View who made changes and when
- Revert to previous pricing (with confirmation)

#### 3. Pricing Calculator
**Location**: `frontend/src/components/admin/PricingCalculator.tsx`

**Features**:
- Input expected monthly volume
- Calculate projected costs
- Compare different pricing models
- Show ROI for hospital

### Pricing Negotiation Workflow

#### Step 1: Initial Contact
- Hospital contacts sales team
- Provide estimated monthly volume
- Discuss required modules

#### Step 2: Pricing Proposal
- Super Admin creates custom pricing
- Generate pricing proposal document
- Email to hospital for review

#### Step 3: Negotiation
- Hospital reviews and negotiates
- Super Admin adjusts pricing
- Multiple iterations possible

#### Step 4: Finalization
- Hospital accepts pricing
- Super Admin creates account with custom pricing
- Contract signed (offline)
- Account activated

#### Step 5: Periodic Review
- Quarterly/Annual pricing review
- Adjust based on actual usage
- Update pricing in system
- Maintain pricing history

### Pricing Audit & Compliance

#### Audit Trail
- All pricing changes logged in `pricing_history`
- Track who made changes and when
- Store reason for pricing changes
- Maintain contract references

#### Reporting
- Revenue by hospital
- Average pricing per module
- Discount analysis
- Pricing trend over time

#### Compliance
- Ensure pricing consistency within tiers
- Flag unusual pricing (too high/low)
- Require approval for large discounts
- Document all custom pricing decisions

---

**Document Version**: 3.0  
**Last Updated**: January 2026  
**Status**: Custom Pricing Model - Ready for Implementation  
**Owner**: DIGIFORT LABS Development Team
