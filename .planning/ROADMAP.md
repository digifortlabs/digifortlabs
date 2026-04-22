# Roadmap: Digifort Labs

## Overview
This roadmap outlines the journey from a modernized administrative interface to a stabilized, highly reliable clinical reporting platform. We move from visual refinements (Phase 1) to functional stability (Phase 2) and finally to deployment excellence (Phase 3).

## Phases
- [ ] **Phase 1: Command Center UI Finalization** - Complete the high-density modernization of administrative modules.
- [x] **Phase 2: Data Reliability & Stability** - Resolve patient data retrieval bugs and ensure robust error handling.
- [ ] **Phase 3: Deployment Autopilot** - Establish a seamless synchronization pipeline between local and live environments.
- [ ] **Phase 4: Role-Based Access Control (RBAC)** - Implement and verify distinct user experiences for Platform Admins, Hospital Admins, and Staff.

## Phase Details

### Phase 1: Command Center UI Finalization
**Goal**: Finalize the "Command Center" aesthetic across the Client Registry, Audit Logs, and Billing Intelligence modules.
**Depends on**: Nothing
**Requirements**: Platform Admin Modernization
**Success Criteria**:
  1. Administrative modules follow the high-density, professional aesthetic.
  2. Legacy UI clutter is completely removed from Client Registry.
  3. Billing Intelligence page provides high-level telemetry insights.
**Plans**: 3 plans

Plans:
- [ ] 01-01: Audit and unify Client Registry styles.
- [ ] 01-02: Modernize Audit Logs with high-density layouts.
- [ ] 01-03: Finalize Billing Intelligence dashboard components.

### Phase 2: Data Reliability & Stability
**Status:** Completed
**Goal**: Resolve systemic retrieval errors and stabilize the clinical data pipeline.
**Depends on**: Phase 1
**Requirements**: Patient Data Reliability
**Success Criteria**:
  1. Patients' listing endpoint consistently returns 200 OK.
  2. Date filtering for laboratory results handles all valid ISO formats.
  3. System error logs are easily accessible for future debugging.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Fix 500 error on patient data listing.
- [ ] 02-02: Implement robust date filtering logic in the backend.

### Phase 3: Deployment Autopilot
**Status:** In Progress
**Goal**: Automate the sync between local code and AWS production environments.
**Depends on**: Phase 2
**Requirements**: Deployment Autopilot, Global Telemetry
**Success Criteria**:
  1. Developers can sync local code to live server with a single command.
  2. Live module health is visible via a "Billboard" telemetry view.
  3. Security credentials and PEM files are managed securely during sync.
**Plans**: 2 plans

Plans:
- [ ] 03-01: Refine `fetch_live_code.ps1` and `deploy.sh` for parity.
- [ ] 03-02: Implement live billboard monitoring (telemetry).

### Phase 4: Role-Based Access Control (RBAC)
**Goal**: Implement and verify role-based navigation and content isolation for Platform Admin, Hospital Admin, and Hospital Staff.
**Depends on**: Phase 1
**Requirements**: Multi-Role RBAC
**Success Criteria**:
  1. Platform Admin can manage global telemetry and client registry.
  2. Hospital Admin can manage their specific hospital's staff and billing.
  3. Hospital Staff can only access patient records and clinical modules.
**Plans**: 3 plans

Plans:
- [ ] 04-01: Audit and map current `userRole` usage across Navbar and Sidebar.
- [ ] 04-02: Implement role-based route protection and redirection.
- [ ] 04-03: Customize Command Center dashboard views based on active role.

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. UI Finalization | 0/3 | Not started | - |
| 2. Data Reliability | 0/2 | Not started | - |
| 3. Deployment Autopilot| 0/2 | Not started | - |
| 4. Role-Based RBAC | 0/3 | Not started | - |


---
*Last updated: 2026-04-22 after initialization*
