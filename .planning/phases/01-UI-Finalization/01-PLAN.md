# Phase 1 Plan: Command Center UI Finalization

## Goal
Finalize the high-density "Command Center" aesthetic and deactivate dormant modules (Pharma, Law, Corp) across all administrative modules.

## User Review Required
> [!IMPORTANT]
> This plan will hide the Pharma, Law, and Corporate modules from the UI. If these are needed for existing clients, they will only be accessible via direct URL (if logic persists) or by re-enabling code.

## Proposed Changes

### Global Layout & Navigation
#### [MODIFY] [Sidebar.tsx](file:///d:/Website/DIGIFORTLABS/frontend/src/components/Sidebar.tsx)
- Hide links for Pharma Manufacturing, Corporate Portal, and Law Discovery.

### Client Registry Modernization
#### [MODIFY] [organizations/page.tsx](file:///d:/Website/DIGIFORTLABS/frontend/src/app/dashboard/organizations/page.tsx)
- **Wizard Clean-up**:
  - Remove 'Law Firm', 'Corporate Office', and 'Pharma Manufacturing' from Step 1 (Organization Type).
  - Remove 'Warehouse', 'Pharma Ops', 'Law Discovery', and 'Corporate Portal' from Step 4 (Module Configuration).
- **Density Overrides**:
  - Update table row padding from `py-2` to `py-1.5`.
  - Update font sizes for metadata to `text-[10px]`.
  - Refine `StatsCard` to be more compact.

### Audit Center Modernization
#### [MODIFY] [audit/page.tsx](file:///d:/Website/DIGIFORTLABS/frontend/src/app/dashboard/audit/page.tsx)
- **Density Overrides**:
  - Reduce table row padding to `py-1`.
  - Use `text-[10px]` for all cell content.
- **Visual Refinement**:
  - Use `slate-900` for the page header icon and text.
  - Implement a cleaner pagination bar.

### Billing Intelligence Refinement
#### [MODIFY] [accounting/page.tsx](file:///d:/Website/DIGIFORTLABS/frontend/src/app/dashboard/accounting/page.tsx)
- **Density Overrides**:
  - Update main Invoices table to use high-density `py-1.5` rows.
  - Standardize `text-[10px]` for metadata (GST rate, file count).

#### [MODIFY] [FinancialDashboard.tsx](file:///d:/Website/DIGIFORTLABS/frontend/src/app/dashboard/accounting/components/FinancialDashboard.tsx)
- Refine metric cards to be more compact.
- Update labels to use `font-black uppercase tracking-widest text-[9px]`.

## Execution Waves

### Wave 1: Global Scoping & Navigation
- Task 1: Deactivate modules in `Sidebar.tsx`.
- Task 2: Deactivate modules in `organizations/page.tsx` wizard.

### Wave 2: Organization Registry Refinement
- Task 3: Apply high-density table styles to Client Registry.
- Task 4: Refactor `StatsCard` and `ModuleCard` for density.

### Wave 3: Audit & Billing Telemetry
- Task 5: Apply ultra-high density to Audit Logs.
- Task 6: Modernize Billing Intelligence table and dashboard metrics.

## Verification Plan

### Automated Verification
- Run `npm run build` to ensure no TypeScript breakages from removed module references.
- Use `grep` to verify removal of module strings from target files.

### Manual Verification
- Open Client Registry wizard and verify that only 3 modules remain (HMS, Dental, Accounting).
- Verify Sidebar shows only active modules.
- Verify table row heights are noticeably tighter (~32-36px).
