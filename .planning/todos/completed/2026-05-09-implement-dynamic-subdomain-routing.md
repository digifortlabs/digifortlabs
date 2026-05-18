---
created: 2026-05-09T11:26:37.435Z
title: Implement Dynamic Subdomain Routing
area: general
files:
  - frontend/src/middleware.ts
  - backend/app/main.py
---

## Problem

The user wants to replace the hardcoded `dashboard.` subdomain with dynamic hospital names (e.g., `dixithospital.`, `demo.`) and keep `admin.` for the super admin. The current system only supports hardcoded origins.

## Solution

Update `middleware.ts` to handle dynamic subdomains and `main.py` to support wildcard CORS origins as planned in `04-PLAN-SUBDOMAINS.md`.
