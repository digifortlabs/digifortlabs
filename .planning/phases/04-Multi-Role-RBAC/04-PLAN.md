# Phase 4 Plan: Role-Based Access Control (RBAC) Implementation

## Goal
Integrate 3 distinct user levels (Platform Admin, Hospital Admin, Hospital Staff) with dynamic sidebar navigation, dashboard views, and registration permissions.

## User Review Required
> [!IMPORTANT]
> This plan assumes that `superadmin` and `website_admin` are equivalent to "Platform Admin", while `hospital_admin` is the "Hospital Admin", and `mrd_staff`/`website_staff` are "Hospital Staff". If there are additional roles or different mappings required, please specify.

## Proposed Changes

### Global Layout & Navigation
#### [MODIFY] [Sidebar.tsx](file:///d:/Website/DIGIFORTLABS/frontend/src/components/Sidebar.tsx)
- **Role-Based Grouping**:
  - **Platform Admin Section**: "Manage Clients", "Global Billing", "System Logs".
  - **Hospital Admin Section**: "Hospital Settings", "Staff Management", "Financials".
  - **Staff Section**: "Patient Records", "Draft Queue", "Appointments".
- **Conditional Trigger**:
  - Only show the "Add New Patient" button for Hospital Admin and Staff roles.

### Dashboard Command Center
#### [MODIFY] [page.tsx](file:///d:/Website/DIGIFORTLABS/frontend/src/app/dashboard/page.tsx)
- **Dynamic Hero Section**:
  - Platform Admin: Hero shows "Global Telemetry" and "Client Distribution".
  - Hospital Admin: Hero shows "Operational Performance" and "Staff Productivity".
  - Staff: Hero shows "Pending Tasks" and "Recent Records".
- **Metric Scoping**:
  - Ensure `MetricCard` values are scoped to the active role (Platform vs. Hospital).

### Route Protection & Redirection
#### [MODIFY] [layout.tsx](file:///d:/Website/DIGIFORTLABS/frontend/src/app/dashboard/layout.tsx)
- Add basic role-based route guarding to prevent Staff from accessing `/dashboard/organizations` even if they type the URL.

## Execution Waves

### Wave 1: Sidebar & Navigation Scoping
- Task 1: Audit `Sidebar.tsx` and consolidate links into role-based blocks.
- Task 2: Hide "Add Patient" trigger from Platform Admins.

### Wave 2: Dashboard Hero & Metric Customization
- Task 3: Refactor `CommandCenter` component in `page.tsx` to switch views based on role.
- Task 4: Standardize `isDetailedView` logic to align with Hospital Admin requirements.

### Wave 3: Security & Route Guarding
- Task 5: Implement client-side route protection in `DashboardLayout`.

## Verification Plan

### Automated Verification
- Verify that `localStorage.getItem('userRole')` correctly influences the DOM structure.
- Run `npm run build` to ensure type safety.

### Manual Verification
- Log in as Platform Admin: Verify "Manage Clients" is visible and "Add Patient" is hidden.
- Log in as Hospital Admin: Verify "System Audit" and "Hospital Settings" are visible.
- Log in as Staff: Verify "Patient Records" is visible and "Manage Clients" is hidden.
