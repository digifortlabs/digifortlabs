# Hospital Registration Form Documentation

## Overview
Complete specification for hospital registration form fields, validation rules, and data collection requirements for DIGIFORT LABS platform.

---

## Registration Form Structure

### Multi-Step Form Flow
1. **Basic Information** (Step 1)
2. **Contact & Location** (Step 2)
3. **Admin User Setup** (Step 3)
4. **Module Selection** (Step 4)
5. **Pricing Configuration** (Step 5 - Super Admin Only)
6. **Review & Submit** (Step 6)

---

## Step 1: Basic Information

### Hospital/Organization Details

#### 1. Hospital Name
- **Field Name**: `hospital_name`
- **Type**: Text input
- **Required**: Yes
- **Validation**: 
  - Minimum 3 characters
  - Maximum 200 characters
  - No special characters except spaces, hyphens, apostrophes
- **Example**: "Apollo Hospitals", "Dr. Smith's Dental Clinic"

#### 2. Organization Type
- **Field Name**: `organization_type`
- **Type**: Dropdown select
- **Required**: Yes
- **Options**:
  - Hospital (Multi-specialty)
  - Clinic (General)
  - Dental Clinic
  - ENT Clinic
  - Diagnostic Center
  - Nursing Home
  - Medical College
  - Corporate Office
  - Law Firm
  - Other
- **Default**: Hospital

#### 3. Registration Number
- **Field Name**: `registration_number`
- **Type**: Text input
- **Required**: No
- **Validation**: Alphanumeric, max 50 characters
- **Example**: "MH-MUM-12345", "REG/2020/001"
- **Description**: Government registration/license number

#### 4. Established Year
- **Field Name**: `established_year`
- **Type**: Number input
- **Required**: No
- **Validation**: 
  - Between 1900 and current year
  - 4-digit year format
- **Example**: 1995, 2010

---

## Step 2: Contact & Location

### Contact Information

#### 5. Primary Email
- **Field Name**: `email`
- **Type**: Email input
- **Required**: Yes
- **Validation**: 
  - Valid email format
  - Unique (not already registered)
  - Domain verification (optional)
- **Example**: "admin@apollohospital.com"
- **Note**: Used for login and official communication

#### 6. Secondary Email
- **Field Name**: `secondary_email`
- **Type**: Email input
- **Required**: No
- **Validation**: Valid email format
- **Example**: "billing@apollohospital.com"

#### 7. Primary Phone
- **Field Name**: `phone`
- **Type**: Phone input with country code
- **Required**: Yes
- **Validation**: 
  - Valid phone format
  - 10-15 digits
  - Country code prefix
- **Example**: "+91-9876543210", "+91-22-12345678"

#### 8. Alternate Phone
- **Field Name**: `alternate_phone`
- **Type**: Phone input
- **Required**: No
- **Validation**: Same as primary phone
- **Example**: "+91-9876543211"

#### 9. Landline
- **Field Name**: `landline`
- **Type**: Text input
- **Required**: No
- **Validation**: 10-15 digits with optional area code
- **Example**: "022-12345678"

### Address Details

#### 10. Address Line 1
- **Field Name**: `address_line1`
- **Type**: Text input
- **Required**: Yes
- **Validation**: Max 200 characters
- **Example**: "123, MG Road, Andheri West"

#### 11. Address Line 2
- **Field Name**: `address_line2`
- **Type**: Text input
- **Required**: No
- **Validation**: Max 200 characters
- **Example**: "Near Metro Station, Landmark Building"

#### 12. City
- **Field Name**: `city`
- **Type**: Text input
- **Required**: Yes
- **Validation**: Max 100 characters
- **Example**: "Mumbai", "Bangalore"

#### 13. State/Province
- **Field Name**: `state`
- **Type**: Dropdown select
- **Required**: Yes
- **Options**: List of Indian states/UTs or international provinces
- **Example**: "Maharashtra", "Karnataka"

#### 14. Postal/ZIP Code
- **Field Name**: `postal_code`
- **Type**: Text input
- **Required**: Yes
- **Validation**: 
  - 6 digits for India
  - Alphanumeric for international
- **Example**: "400058", "560001"

#### 15. Country
- **Field Name**: `country`
- **Type**: Dropdown select
- **Required**: Yes
- **Default**: "India"
- **Options**: List of countries
- **Example**: "India", "United States"

#### 16. Google Maps Location (Optional)
- **Field Name**: `google_maps_url`
- **Type**: URL input
- **Required**: No
- **Validation**: Valid URL format
- **Example**: "https://goo.gl/maps/xyz123"

---

## Step 3: Admin User Setup

### Primary Administrator Account

#### 17. Admin Full Name
- **Field Name**: `admin_full_name`
- **Type**: Text input
- **Required**: Yes
- **Validation**: 
  - Minimum 3 characters
  - Maximum 100 characters
  - Letters and spaces only
- **Example**: "Dr. Rajesh Kumar", "John Smith"

#### 18. Admin Email
- **Field Name**: `admin_email`
- **Type**: Email input
- **Required**: Yes
- **Validation**: 
  - Valid email format
  - Can be same as hospital email or different
- **Example**: "rajesh.kumar@apollohospital.com"
- **Note**: Used for admin login

#### 19. Admin Phone
- **Field Name**: `admin_phone`
- **Type**: Phone input
- **Required**: Yes
- **Validation**: Valid phone format
- **Example**: "+91-9876543210"

#### 20. Admin Designation
- **Field Name**: `admin_designation`
- **Type**: Text input
- **Required**: No
- **Validation**: Max 100 characters
- **Example**: "Chief Medical Officer", "Hospital Administrator", "Director"

#### 21. Admin Password
- **Field Name**: `password`
- **Type**: Password input
- **Required**: Yes
- **Validation**: 
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character
- **Example**: "SecurePass@123"

#### 22. Confirm Password
- **Field Name**: `confirm_password`
- **Type**: Password input
- **Required**: Yes
- **Validation**: Must match password field
- **Example**: "SecurePass@123"

---

## Step 4: Module Selection

### Available Modules

#### 23. Core Module (MRD)
- **Field Name**: `modules.core`
- **Type**: Checkbox (disabled, always selected)
- **Required**: Yes (mandatory)
- **Description**: Medical Record Digitization with physical and digital archival

#### 24. Hospital Management System (HMS)
- **Field Name**: `modules.hms`
- **Type**: Checkbox
- **Required**: No
- **Features**: Patient admissions, bed management, lab integration, pharmacy

#### 25. Dental OPD Module
- **Field Name**: `modules.dental`
- **Type**: Checkbox
- **Required**: No
- **Features**: Tooth chart, treatment planning, 3D scans, dental imaging

#### 26. ENT OPD Module
- **Field Name**: `modules.ent`
- **Type**: Checkbox
- **Required**: No
- **Features**: Audiometry, ENT examinations, surgery scheduling

#### 27. Clinic OPD Module
- **Field Name**: `modules.clinic`
- **Type**: Checkbox
- **Required**: No
- **Features**: Multi-specialty OPD, EHR, prescription management

#### 28. Pharma Medical Module
- **Field Name**: `modules.pharma`
- **Type**: Checkbox
- **Required**: No
- **Features**: Drug inventory, prescription processing, safety systems

#### 29. Accounting Module
- **Field Name**: `modules.accounting`
- **Type**: Checkbox
- **Required**: No
- **Features**: Invoice generation, expense tracking, GST compliance

#### 30. Inventory Module
- **Field Name**: `modules.inventory`
- **Type**: Checkbox
- **Required**: No
- **Features**: Stock management, reorder alerts, consumption tracking

---

## Step 5: Pricing Configuration (Super Admin Only)

### MRD Pricing

#### 31. MRD Pricing Model
- **Field Name**: `pricing.mrd.pricing_model`
- **Type**: Radio buttons
- **Required**: Yes
- **Options**:
  - Per File (flat rate per file)
  - Per Page (rate per page)
  - Flat Monthly (fixed monthly fee)
- **Default**: Per File

#### 32. Base Rate per File
- **Field Name**: `pricing.mrd.base_rate_per_file`
- **Type**: Number input (currency)
- **Required**: If pricing_model = "per_file"
- **Validation**: Positive number, max 2 decimal places
- **Example**: 100, 120, 150
- **Currency**: ₹ (INR)

#### 33. Page Threshold
- **Field Name**: `pricing.mrd.page_threshold`
- **Type**: Number input
- **Required**: If pricing_model = "per_file" or "per_page"
- **Validation**: Positive integer
- **Example**: 40, 50, 60
- **Description**: Files exceeding this page count use per-page pricing

#### 34. Rate per Page (Standard)
- **Field Name**: `pricing.mrd.rate_per_page_standard`
- **Type**: Number input (currency)
- **Required**: If pricing_model = "per_page"
- **Validation**: Positive number, max 2 decimal places
- **Example**: 1.00, 1.20, 1.50

#### 35. Rate per Page (Premium)
- **Field Name**: `pricing.mrd.rate_per_page_premium`
- **Type**: Number input (currency)
- **Required**: No
- **Validation**: Positive number, max 2 decimal places
- **Example**: 1.50, 1.80, 2.00
- **Description**: Premium rate for faster OCR processing

#### 36. Bulk Discount Tiers
- **Field Name**: `pricing.mrd.bulk_discount_tiers`
- **Type**: Dynamic array of objects
- **Required**: No
- **Structure**: 
  ```json
  [
    {"min_files": 1000, "discount_percent": 10},
    {"min_files": 5000, "discount_percent": 15}
  ]
  ```
- **Fields per tier**:
  - Minimum Files (number)
  - Discount Percent (number, 0-100)

### Module Subscription Pricing

#### 37. HMS Annual Price
- **Field Name**: `pricing.modules.hms`
- **Type**: Number input (currency)
- **Required**: If HMS module selected
- **Validation**: Positive number
- **Example**: 30000, 35000, 40000

#### 38. Dental Annual Price
- **Field Name**: `pricing.modules.dental`
- **Type**: Number input (currency)
- **Required**: If Dental module selected
- **Example**: 25000, 28000, 30000

#### 39. ENT Annual Price
- **Field Name**: `pricing.modules.ent`
- **Type**: Number input (currency)
- **Required**: If ENT module selected
- **Example**: 25000, 28000, 30000

#### 40. Clinic Annual Price
- **Field Name**: `pricing.modules.clinic`
- **Type**: Number input (currency)
- **Required**: If Clinic module selected
- **Example**: 20000, 22000, 25000

#### 41. Pharma Annual Price
- **Field Name**: `pricing.modules.pharma`
- **Type**: Number input (currency)
- **Required**: If Pharma module selected
- **Example**: 20000, 22000, 25000

#### 42. Accounting Annual Price
- **Field Name**: `pricing.modules.accounting`
- **Type**: Number input (currency)
- **Required**: If Accounting module selected
- **Example**: 15000, 18000, 20000

#### 43. Inventory Annual Price
- **Field Name**: `pricing.modules.inventory`
- **Type**: Number input (currency)
- **Required**: If Inventory module selected
- **Example**: 10000, 12000, 15000

### Additional Pricing Settings

#### 44. Data Retention Period
- **Field Name**: `pricing.retention_years`
- **Type**: Number input
- **Required**: Yes
- **Validation**: Positive integer, typically 5-10
- **Default**: 5
- **Example**: 5, 7, 10
- **Description**: Years of guaranteed data retention

#### 45. Pricing Effective Date
- **Field Name**: `pricing.effective_date`
- **Type**: Date picker
- **Required**: Yes
- **Default**: Today's date
- **Validation**: Cannot be in the past
- **Example**: "2025-02-01"

#### 46. Pricing Notes
- **Field Name**: `pricing.notes`
- **Type**: Textarea
- **Required**: No
- **Validation**: Max 500 characters
- **Example**: "Premium pricing for enterprise client with 10,000+ files/month. Negotiated on 2025-01-15."

---

## Step 6: Review & Submit

### Additional Information

#### 47. Expected Monthly Volume
- **Field Name**: `expected_monthly_volume`
- **Type**: Number input
- **Required**: No
- **Validation**: Positive integer
- **Example**: 500, 2000, 10000
- **Description**: Estimated number of files to be uploaded per month

#### 48. Number of Users
- **Field Name**: `expected_users`
- **Type**: Number input
- **Required**: No
- **Validation**: Positive integer
- **Example**: 5, 20, 100
- **Description**: Expected number of staff users

#### 49. Storage Requirements
- **Field Name**: `storage_requirements`
- **Type**: Dropdown select
- **Required**: No
- **Options**:
  - Small (<100 GB)
  - Medium (100-500 GB)
  - Large (500 GB - 2 TB)
  - Enterprise (>2 TB)
- **Default**: Medium

#### 50. Special Requirements
- **Field Name**: `special_requirements`
- **Type**: Textarea
- **Required**: No
- **Validation**: Max 1000 characters
- **Example**: "Need integration with existing HIS system. Require custom reports for regulatory compliance."

#### 51. Terms & Conditions
- **Field Name**: `accept_terms`
- **Type**: Checkbox
- **Required**: Yes
- **Validation**: Must be checked to proceed
- **Label**: "I accept the Terms & Conditions and Privacy Policy"

#### 52. Marketing Communications
- **Field Name**: `accept_marketing`
- **Type**: Checkbox
- **Required**: No
- **Default**: Unchecked
- **Label**: "I agree to receive marketing communications and product updates"

---

## Form Validation Rules

### Client-Side Validation
- Real-time validation on field blur
- Display error messages below fields
- Disable submit button until all required fields valid
- Show field-level error indicators (red border)

### Server-Side Validation
- Re-validate all fields on submission
- Check email uniqueness
- Verify phone number format
- Validate pricing logic (e.g., premium rate > standard rate)
- Ensure at least core module selected

### Error Messages
- **Empty required field**: "[Field name] is required"
- **Invalid email**: "Please enter a valid email address"
- **Invalid phone**: "Please enter a valid phone number"
- **Password mismatch**: "Passwords do not match"
- **Weak password**: "Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character"
- **Email exists**: "This email is already registered. Please use a different email or login."
- **Invalid pricing**: "Premium rate must be higher than standard rate"

---

## Form Submission Flow

### 1. Client-Side Processing
- Validate all fields
- Show loading spinner
- Disable submit button
- Prepare JSON payload

### 2. API Request
- POST to `/api/hospitals/register-with-modules`
- Include JWT token (for super admin)
- Send complete form data as JSON

### 3. Server-Side Processing
- Validate request data
- Check email uniqueness
- Hash admin password
- Create hospital record
- Create admin user record
- Store custom pricing
- Generate JWT token
- Send welcome email

### 4. Success Response
- Display success message
- Show hospital ID
- Provide login credentials
- Redirect to login page (or dashboard if auto-login)

### 5. Error Handling
- Display error message
- Highlight problematic fields
- Allow user to correct and resubmit
- Log error for debugging

---

## Sample Form Data (JSON)

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

---

## UI/UX Recommendations

### Form Layout
- Use multi-step wizard with progress indicator
- Group related fields in sections
- Use clear labels and placeholders
- Provide inline help text for complex fields
- Show character count for text areas

### Visual Design
- Clean, professional appearance
- Consistent spacing and alignment
- Use icons for field types (email, phone, etc.)
- Color-coded sections (blue for info, green for modules, orange for pricing)
- Responsive design for mobile/tablet

### User Experience
- Auto-save draft (optional)
- Allow going back to previous steps
- Show summary before final submission
- Provide estimated completion time
- Offer live chat support during registration

### Accessibility
- Proper label associations
- Keyboard navigation support
- Screen reader friendly
- High contrast mode
- Error announcements

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Status**: Complete Field Specification  
**Owner**: DIGIFORT LABS Development Team
