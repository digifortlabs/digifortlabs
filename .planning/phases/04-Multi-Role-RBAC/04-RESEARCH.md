# Phase 4 Research: User Roles & RBAC

## Current Role Implementation
The system currently uses a `userRole` string stored in `localStorage` and optionally provided by the backend in session state.

### Identified Roles:
- `superadmin`: Full platform access.
- `website_admin`: Alias for platform-level administrative tasks.
- `hospital_admin`: Administrative access scoped to a single tenant/hospital.
- `mrd_staff`: Medical Records Department staff (clinical data entry).
- `website_staff`: General staff access.
- `data_uploader`: Specialized role for file ingestion.

### Current Gaps:
1. **Sidebar Clutter**: Many links are visible to all roles, creating a confusing experience for Staff.
2. **Dashboard Ambiguity**: The main dashboard tries to show everything to everyone, with some conditional logic that is inconsistent.
3. **Registration Permission**: The "Add Patient" trigger is global, but only certain roles should be able to create records.

## Proposed Mapping
- **Platform Admin** = `superadmin` | `website_admin`
- **Hospital Admin** = `hospital_admin`
- **Hospital Staff** = `mrd_staff` | `website_staff` | `data_uploader`

## Navigation Analysis
- **Manage Clients**: Platforms Admins only.
- **System Audit**: Platform Admins (All logs) & Hospital Admins (Hospital logs).
- **Billing Intelligence**: Platform Admins (Global) & Hospital Admins (Invoices).
- **Patient Records**: Hospital Admin & Staff only.
- **Draft Queue**: Staff only (primarily `mrd_staff`).

## Dashboard Components
The `page.tsx` needs to be partitioned:
- `GlobalHero`: For Platform Admins.
- `HospitalHero`: For Hospital Admins.
- `ClinicalHero`: For Staff.
