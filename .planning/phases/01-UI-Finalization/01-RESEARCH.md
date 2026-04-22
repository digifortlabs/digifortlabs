# Phase 1 Research: Command Center UI Finalization

## Technical Landscape

### 1. High-Density UI Patterns
- **Table Density**: Standard shadcn/ui or custom tables in the codebase use `px-3 py-2`. To achieve "Command Center" density, we will override this to `px-3 py-1` or `py-1.5`.
- **Typography**: Secondary information currently uses `text-[10px]` or `text-xs`. We will standardize `text-[10px]` for metadata and `text-xs` for primary content to maximize visibility.
- **Borders**: Standardizing on `border-slate-200` for light theme and `border-white/10` for obsidian elements.

### 2. Stealth Color Palette (Obsidian/Chrome/Bronze)
- **Primary Header/Sidebar**: Already uses `bg-slate-900`. We will ensure all "Command Center" pages have a unified `slate-900` header block.
- **Backgrounds**: `bg-slate-50/50` for page background, `bg-white` for content cards.
- **Accents**: 
  - **Chrome**: `slate-400`
  - **Obsidian**: `slate-900`
  - **Industrial Bronze**: `amber-600/70` (for premium alerts/highlights)

### 3. Module Deactivation Map
The following modules must be removed or commented out to declutter the UI:
- **Pharma Manufacturing**: `industry === 'Pharma'`, `modId === 'pharma'`
- **Law/Legal Discovery**: `industry === 'Legal'`, `modId === 'legal'`
- **Corporate Portal**: `industry === 'Corporate'`, `modId === 'corporate'`

**Impact Points:**
- `frontend/src/app/dashboard/organizations/page.tsx`: Step 1 (OrgType dropdown), Step 4 (Module Selection Grid), Table specialty badges.
- `frontend/src/components/Sidebar.tsx`: Conditional links for Pharma, Corporate, and ENT (if ENT is also to be hidden, though not explicitly asked, we'll focus on the requested 3).
- `frontend/src/app/dashboard/accounting/page.tsx`: Revenue filters and part labels.

### 4. Telemetry Visualization
- **Audit Center**: The current table in `audit/page.tsx` is basic. We will introduce a "Status Pulse" column and debounce filtering.
- **Billing Intelligence**: `FinancialDashboard.tsx` uses custom bars and stats. We will refine these to be more compact and "telemeter-style" (e.g., using small font-black tracking-widest labels).

## Implementation Strategy

### Component Reuse
- **ModuleCard**: Refactor to support a "Hidden" or "Disabled" state, or simply filter them out of the mapping arrays.
- **PlanBadge**: Ensure it follows the new density rules.

### Layout Consistency
- All admin pages should follow a consistent 3-block structure:
  1. Header with breadcrumbs and primary action.
  2. Stats/Telemetry block.
  3. Search/Filter bar + High-density data table.

## Validation Architecture
- **Visual Audit**: Verify spacing with Chrome DevTools (target < 32px row height for tables).
- **Functionality**: Ensure deactivating modules doesn't break the registration wizard (Step 5 pricing calculation).
- **Responsiveness**: Ensure high-density tables don't break on 13" laptops.

---
*Research complete: 2026-04-22*
