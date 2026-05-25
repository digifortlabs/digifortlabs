# Project: Digifort Labs - Unified Module Reports

## What This Is
A unified reports module that aggregates analytics, statistics, and trends from all system modules (HMS, Dental, ENT, Clinics, Staff, Accounting, Inventory, Audit, Appointments, and Records) into a single, cohesive dashboard under the Reports Center, complete with visual charts and CSV export capabilities.

## Core Value
To provide hospital administrators and superadmins with a single-pane-of-glass reporting dashboard to monitor operations, financials, patient flows, and storage/inventory utilization.

## Requirements

### Validated
- ✓ Basic PDF archival and retrieval system - existing
- ✓ Basic OCR and AI data extraction - existing
- ✓ Basic AWS S3 integration - existing
- ✓ High-Density PDF Compression - existing
- ✓ Async background processing with Celery/Redis - existing
- ✓ Basic Reports Center with Clinical, Inventory, and Audit tabs - existing

### Active
- [ ] **Consolidated Reporting APIs**: Implement backend routes to aggregate report metrics for HMS, Dental, ENT, Clinics, Staff, Accounting, Inventory, Audit, Appointments, and Records.
- [ ] **Unified Reports Dashboard**: Build a high-fidelity, interactive Next.js dashboard UI displaying visual trends, charts, and summary cards.
- [ ] **Advanced Filtering & CSV Export**: Support filtering by date ranges, hospital/client IDs, and search terms, along with full data export capabilities for all reports.

### Out of Scope
- Automated email subscription dispatch for reports (priority is on-demand dashboard and CSV downloads).
- Real-time live dashboard sync via WebSockets (restricting to manual refresh / pull-based).

## Context
- **Existing Stack**: FastAPI (Python), Next.js 16 (App Router), SQLAlchemy, Postgres/SQLite, Tailwind CSS (Vanilla CSS/Tailwind mixed in UI components).
- **Current State**: There is a basic Reports Center with Clinical, Inventory, and Audit tabs. We need to expand this to a comprehensive unified dashboard compiling all modules (accounting, dental, appointments, HMS, staff, etc.).

## Constraints
- **Tech Stack Compatibility**: Must fit seamlessly into the existing Next.js App Router and FastAPI framework.
- **Role-based Access Control**: Access to reports must respect user roles (Super Admin has full access, Hospital Admin has access to own hospital's data, staff has restricted views).

## Key Decisions
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Unified API Router | Consolidating report generation inside a dedicated reports backend router for easier maintenance. | — Pending |
| Recharts for Visualization | Recharts is already imported in the project and is perfect for rendering interactive bar/line/pie charts. | — Pending |
| CSV Export | Quickest and most portable way for admin users to ingest data in Excel or spreadsheet tools. | — Pending |

## Evolution
This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-22 after initialization*
