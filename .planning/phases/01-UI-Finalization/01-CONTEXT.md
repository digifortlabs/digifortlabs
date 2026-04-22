# Phase Context: Command Center UI Finalization

## Goal
Finalize the high-density "Command Center" modernization across the Client Registry, Audit Logs, and Billing Intelligence modules.

## Decisions

### 1. Module Scoping (Deactivation)
- **Hide/Disable Modules**: The **Pharma**, **Law (Legal)**, and **Corporate** modules are to be hidden from the UI.
  - **Registration Wizard**: Remove from "Organization Type" and "Module Selection" steps in `organizations/page.tsx`.
  - **Sidebar**: Remove conditional links for `pharma`, `legal`, and `corporate` in `Sidebar.tsx`.
  - **Accounting**: Ensure billing reports and settings ignore these dormant modules.

### 2. Aesthetic & Density
- **Density**: Implement **High-Density** layouts for all administrative tables. 
  - Reduce row padding (`py-1` or `py-1.5`).
  - Use smaller, high-legibility fonts for secondary data.
  - Maximize horizontal space usage for Audit Logs.
- **Color Palette**: **"Stealth" High-Contrast Light**.
  - Use `slate-900` (Obsidian) for primary headers and the sidebar.
  - Use white/slate-50 for content cards to maintain readability and professional clarity.
  - Use sharp, minimalist borders instead of heavy shadows.

### 3. Key Dashboards
- **Billing Intelligence**: Prioritize **Revenue Telemetry** (historical charts) and **License Utilization** (active vs inactive slots) as the hero metrics.
- **Audit Center**: Implement instant debounce filtering and "hover-to-expand" or "click-for-details" for log entries to keep the main view clean.

## Specifics
- **Base Components**: Leverage existing `table.tsx`, `card.tsx`, and `badge.tsx` from `@/components/ui` but apply custom density overrides.
- **Icons**: Stick to `lucide-react` for consistency.

## Deferred Ideas
- **Dark Mode**: A full system-wide dark mode is deferred; focusing on the "Stealth Light" aesthetic for now.
- **Bulk Export Options**: Advanced CSV/PDF export customization is deferred until Phase 2 or 3.

---
*Generated: 2026-04-22 during /gsd-discuss-phase*
