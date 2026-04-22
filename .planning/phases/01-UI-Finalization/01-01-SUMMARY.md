# Wave 1 Summary: Global Scoping & Navigation

## Objective
Deactivate dormant modules (Pharma, Law, Corporate) across the Sidebar and Organization Registration wizard.

## Changes
- **Sidebar.tsx**: Removed commented-out and active links for Pharma Manufacturing, Corporate Portal, and Law Discovery.
- **organizations/page.tsx**: Removed industry types and module configuration cards for deactivated modules in the registration wizard.

## Verification Results
- [x] Sidebar links hidden.
- [x] Wizard Step 1: Only Hospital, Clinic, Dental Clinic remain.
- [x] Wizard Step 4: Pharma, Law, and Corporate modules removed.

## Next Steps
Proceed to Wave 2: Organization Registry Refinement (High-density table styles).
