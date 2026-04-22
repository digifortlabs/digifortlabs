---
created: 2026-04-22T13:18:07+05:30
title: Platform Admin Hospital Selection Overview
area: ui
files:
  - frontend/src/components/Sidebar.tsx
  - frontend/src/app/dashboard/page.tsx
  - frontend/src/app/dashboard/records/page.tsx
  - frontend/src/app/dashboard/appointments/page.tsx
---

## Problem

The user requested: "in every module given hospital selection and after open overview for platform admin". 
Currently, Platform Admins can select a hospital within specific modules (like Records and Appointments) to view data. However, there is a need to standardize this hospital selection across *every* module. Furthermore, after a Platform Admin selects a hospital, the system should ideally navigate them to an "overview" or summary dashboard specific to that chosen hospital before digging into specific module data.

## Solution

1. **Global/Standardized Selector**: Consider moving the hospital selection state higher up in the component tree (e.g., in a top navigation bar or `layout.tsx`) so that it applies contextually across all modules, rather than implementing a distinct dropdown on every single page.
2. **Hospital Overview Page**: Create a new route or dynamic dashboard view (e.g., `/dashboard/hospital-overview/[id]`) that renders key metrics for the selected hospital. When a Platform Admin selects a client from the dropdown, navigate them to this overview page first.
