# Frontend + Backend Live Server Report

Generated: 2026-05-13T14:47:00.862Z
Workspace: `D:\Website\DIGIFORTLABS`

## Purpose

This report only covers `frontend/` and `backend/`. It separates files required for a live deployment from local, test, scratch, temporary, or operator-only files.

## Summary

- Required/live files: 229
- Optional/operator files: 25
- Exclude or review before deploy: 51

## Live Deployment Bundle

Use these files for the normal live server build/runtime. `backend/.env` is listed because the live server needs equivalent environment variables, but the local file itself should not be committed or blindly copied.

| File | Size | Lines | Why Required | Note |
|---|---:|---:|---|---|
| `backend/.dockerignore` | 86 B | - | Backend build/runtime/deployment configuration required for the live API service. |  |
| `backend/.env` | 1.1 KB | 29 | Required on the live server as environment configuration, but must not be committed or copied from a developer machine. |  |
| `backend/Dockerfile` | 470 B | 21 | Backend build/runtime/deployment configuration required for the live API service. |  |
| `backend/alembic.ini` | 1.7 KB | 78 | Database migration configuration/revisions required for controlled live schema deployment. |  |
| `backend/alembic/env.py` | 1.9 KB | 71 | Database migration configuration/revisions required for controlled live schema deployment. |  |
| `backend/alembic/script.py.mako` | 635 B | 27 | Database migration configuration/revisions required for controlled live schema deployment. |  |
| `backend/alembic/versions/3925b046fb45_add_is_deleted_to_user_and_hospital.py` | 952 B | 33 | Database migration configuration/revisions required for controlled live schema deployment. |  |
| `backend/alembic/versions/a5a41c3994c0_initial_baseline.py` | 675 B | 31 | Database migration configuration/revisions required for controlled live schema deployment. |  |
| `backend/alembic/versions/b78be8167775_add_dental_fields_to_patient_model.py` | 1.4 KB | 41 | Database migration configuration/revisions required for controlled live schema deployment. |  |
| `backend/alembic/versions/cc7fe2021d9e_redirect_dental_relationships_to_.py` | 3.3 KB | 61 | Database migration configuration/revisions required for controlled live schema deployment. |  |
| `backend/app/audit.py` | 1.4 KB | 42 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/celery_app.py` | 475 B | 23 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/core/celery_app.py` | 473 B | 21 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/core/config.py` | 4.1 KB | 88 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. | Loads production settings, secrets, URLs, CORS, storage, and feature configuration. |
| `backend/app/core/logging_config.py` | 1.3 KB | 42 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/database.py` | 1.2 KB | 44 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/main.py` | 10.7 KB | 314 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. | FastAPI entrypoint: security middleware, CORS, routers, static storage, health checks, startup cleanup loop. |
| `backend/app/middleware/bandwidth.py` | 3.0 KB | 82 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/middleware/security.py` | 3.3 KB | 89 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/models.py` | 54.2 KB | 1247 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. | Main SQLAlchemy model definitions for users, hospitals, records, files, accounting, dental, ENT, HMS, storage, audit, and platform data. |
| `backend/app/models/base.py` | 1.8 KB | 55 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/accounting.py` | 38.1 KB | 983 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/accounting_advanced.py` | 13.2 KB | 383 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/appointments.py` | 5.6 KB | 183 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/audit_logs.py` | 3.4 KB | 105 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/auth.py` | 31.1 KB | 810 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/clinic.py` | 5.2 KB | 180 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/compliance.py` | 2.4 KB | 69 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/contact.py` | 586 B | 18 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/dental.py` | 48.3 KB | 1343 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/diagnoses.py` | 6.5 KB | 188 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/ent.py` | 7.9 KB | 245 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/hms.py` | 9.9 KB | 338 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/hospitals.py` | 19.8 KB | 502 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/inventory.py` | 5.4 KB | 167 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/optimization.py` | 1.9 KB | 69 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/patients.py` | 77.6 KB | 1939 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/platform.py` | 8.4 KB | 246 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/platform_ops.py` | 2.5 KB | 72 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/procedures.py` | 5.9 KB | 175 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/qa.py` | 3.5 KB | 110 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/reports.py` | 12.1 KB | 340 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/scanner.py` | 692 B | 18 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/server_files.py` | 4.5 KB | 126 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/stats.py` | 16.9 KB | 457 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/storage.py` | 42.6 KB | 1141 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/routers/users.py` | 11.6 KB | 302 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/scripts/check_db.sh` | 180 B | 3 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/scripts/cleanup_orphaned_files.py` | 3.8 KB | 126 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/scripts/cleanup_s3_drafts.py` | 9.5 KB | 247 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/scripts/fix_file_sizes.py` | 1.7 KB | 59 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/scripts/fix_invoice_schema.py` | 2.1 KB | 56 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/scripts/fix_system_settings.py` | 1.3 KB | 39 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/scripts/make_racks_global.py` | 1.3 KB | 32 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/scripts/migrate_pg_config.py` | 1.5 KB | 48 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/scripts/recover_file.py` | 901 B | 31 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/scripts/update_config_schema.py` | 1.1 KB | 34 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/seeds/icd11_procedures_sample.json` | 1.5 KB | 78 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/seeds/icd11_sample.json` | 3.4 KB | 162 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/seeds/seed_icd11.py` | 1.0 KB | 46 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/seeds/seed_icd11_procedures.py` | 1.4 KB | 51 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/services/ai_service.py` | 3.9 KB | 100 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/services/cleanup_service.py` | 4.3 KB | 102 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/services/compression.py` | 6.1 KB | 152 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/services/demo_service.py` | 2.9 KB | 91 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/services/email_service.py` | 59.9 KB | 1243 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/services/encryption.py` | 2.5 KB | 82 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/services/icd11_service.py` | 3.0 KB | 85 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/services/ocr.py` | 6.1 KB | 174 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/services/s3_handler.py` | 9.1 KB | 246 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/services/scanner/__init__.py` | 0 B | 0 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/services/scanner/doc_scanner.py` | 9.6 KB | 237 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/services/scanner/pyimagesearch/__init__.py` | 0 B | 0 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/services/scanner/pyimagesearch/imutils.py` | 1.5 KB | 59 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/services/scanner/pyimagesearch/transform.py` | 2.7 KB | 70 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/services/storage.py` | 1.1 KB | 38 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/services/storage_service.py` | 7.4 KB | 201 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/services/tasks.py` | 1.9 KB | 59 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/static/DigifortScanner.exe` | 76.3 MB | - | Runtime static backend asset; scanner executable is served/downloaded by backend routes. |  |
| `backend/app/tasks/__init__.py` | 23 B | 2 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/tasks/optimization.py` | 1.4 KB | 40 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/app/templates/email/account_locked.html` | 829 B | 19 | Runtime email template required by backend notification flows. |  |
| `backend/app/templates/email/base.html` | 1.0 KB | 23 | Runtime email template required by backend notification flows. |  |
| `backend/app/templates/email/download_request.html` | 1.2 KB | 24 | Runtime email template required by backend notification flows. |  |
| `backend/app/templates/email/email_change_alert.html` | 1.1 KB | 25 | Runtime email template required by backend notification flows. |  |
| `backend/app/templates/email/login_alert.html` | 1.1 KB | 23 | Runtime email template required by backend notification flows. |  |
| `backend/app/templates/email/otp.html` | 900 B | 21 | Runtime email template required by backend notification flows. |  |
| `backend/app/utils.py` | 2.8 KB | 83 | Backend application source required for live FastAPI API, models, routers, services, middleware, Celery tasks, and utilities. |  |
| `backend/gunicorn_conf.py` | 380 B | 23 | Backend build/runtime/deployment configuration required for the live API service. |  |
| `backend/pyproject.toml` | 303 B | 18 | Backend build/runtime/deployment configuration required for the live API service. |  |
| `backend/requirements.txt` | 411 B | 36 | Backend build/runtime/deployment configuration required for the live API service. |  |
| `backend/start_prod.sh` | 229 B | 9 | Backend build/runtime/deployment configuration required for the live API service. |  |
| `frontend/.dockerignore` | 133 B | - | Frontend build/deployment configuration or dependency manifest required to build the Next.js app. |  |
| `frontend/Dockerfile` | 510 B | 27 | Frontend build/deployment configuration or dependency manifest required to build the Next.js app. |  |
| `frontend/components.json` | 467 B | 24 | Frontend build/deployment configuration or dependency manifest required to build the Next.js app. |  |
| `frontend/next.config.mjs` | 328 B | 17 | Frontend build/deployment configuration or dependency manifest required to build the Next.js app. |  |
| `frontend/package-lock.json` | 623.3 KB | 17831 | Frontend build/deployment configuration or dependency manifest required to build the Next.js app. |  |
| `frontend/package.json` | 1.7 KB | 66 | Frontend build/deployment configuration or dependency manifest required to build the Next.js app. |  |
| `frontend/postcss.config.mjs` | 94 B | 8 | Frontend build/deployment configuration or dependency manifest required to build the Next.js app. |  |
| `frontend/public/404.html` | 3.6 KB | 135 | Static public asset served by the live frontend; scanner installers are required only if downloads remain enabled. |  |
| `frontend/public/50x.html` | 3.6 KB | 135 | Static public asset served by the live frontend; scanner installers are required only if downloads remain enabled. |  |
| `frontend/public/DigifortScanner_Setup.exe` | 45.4 MB | - | Static public asset served by the live frontend; scanner installers are required only if downloads remain enabled. | Public scanner download artifact; deploy only if end users download scanner from site. |
| `frontend/public/DigifortScanner_Setup_v2.1.exe` | 74.1 MB | - | Static public asset served by the live frontend; scanner installers are required only if downloads remain enabled. | Public scanner download artifact; deploy only if end users download scanner from site. |
| `frontend/public/favicon.ico` | 12.3 KB | - | Static public asset served by the live frontend; scanner installers are required only if downloads remain enabled. |  |
| `frontend/public/file.svg` | 391 B | - | Static public asset served by the live frontend; scanner installers are required only if downloads remain enabled. |  |
| `frontend/public/globe.svg` | 1.0 KB | - | Static public asset served by the live frontend; scanner installers are required only if downloads remain enabled. |  |
| `frontend/public/logo/logo.png` | 502.3 KB | - | Static public asset served by the live frontend; scanner installers are required only if downloads remain enabled. |  |
| `frontend/public/logo/longlogo.png` | 1019.1 KB | - | Static public asset served by the live frontend; scanner installers are required only if downloads remain enabled. |  |
| `frontend/public/next.svg` | 1.3 KB | - | Static public asset served by the live frontend; scanner installers are required only if downloads remain enabled. |  |
| `frontend/public/scanner_app.zip` | 71.5 MB | - | Static public asset served by the live frontend; scanner installers are required only if downloads remain enabled. | Public scanner download artifact; deploy only if end users download scanner from site. |
| `frontend/public/vercel.svg` | 128 B | - | Static public asset served by the live frontend; scanner installers are required only if downloads remain enabled. |  |
| `frontend/public/window.svg` | 385 B | - | Static public asset served by the live frontend; scanner installers are required only if downloads remain enabled. |  |
| `frontend/src/app/about/page.tsx` | 9.9 KB | 151 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/contact/page.tsx` | 11.4 KB | 205 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/accounting/components/AccountingSettings.tsx` | 19.4 KB | 337 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/accounting/components/AgingReport.tsx` | 9.3 KB | 200 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/accounting/components/EditInvoiceModal.tsx` | 18.7 KB | 344 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/accounting/components/ExpenseManager.tsx` | 19.4 KB | 357 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/accounting/components/FinancialDashboard.tsx` | 11.5 KB | 221 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/accounting/components/HospitalLedgerList.tsx` | 6.4 KB | 132 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/accounting/components/InventoryManager.tsx` | 14.6 KB | 284 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/accounting/components/InvoiceGenerationModal.tsx` | 33.3 KB | 551 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/accounting/components/InvoicePreviewModal.tsx` | 6.3 KB | 142 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/accounting/components/ProfitAndLoss.tsx` | 7.3 KB | 146 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/accounting/components/ReceivePaymentModal.tsx` | 7.8 KB | 162 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/accounting/components/VendorManager.tsx` | 14.8 KB | 266 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/accounting/ledger/[id]/page.tsx` | 10.6 KB | 199 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/accounting/page.tsx` | 28.2 KB | 522 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/appointments/components/CreateAppointmentModal.tsx` | 10.0 KB | 208 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/appointments/page.tsx` | 17.7 KB | 334 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/archive/page.tsx` | 6.4 KB | 120 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/audit/page.tsx` | 10.2 KB | 204 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/clinic/[id]/page.tsx` | 25.4 KB | 429 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/clinic/page.tsx` | 20.3 KB | 377 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/dental/analytics/page.tsx` | 11.9 KB | 228 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/dental/components/AppointmentModal.tsx` | 6.0 KB | 133 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/dental/components/PatientDetail.tsx` | 99.1 KB | 1599 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/dental/inventory/page.tsx` | 8.8 KB | 171 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/dental/page.tsx` | 35.5 KB | 671 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/downloads/page.tsx` | 5.7 KB | 92 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/drafts/page.tsx` | 7.4 KB | 165 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/ent/components/ENTPatientDetail.tsx` | 15.1 KB | 266 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/ent/page.tsx` | 17.2 KB | 316 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/group-overview/page.tsx` | 13.1 KB | 235 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/hms/admissions/page.tsx` | 15.0 KB | 235 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/hms/beds/page.tsx` | 12.0 KB | 189 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/hms/page.tsx` | 16.3 KB | 253 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/hospital-overview/page.tsx` | 20.2 KB | 379 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/inventory/page.tsx` | 1.6 KB | 39 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/layout.tsx` | 4.6 KB | 122 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/page.tsx` | 53.5 KB | 955 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/records/components/CameraModal.tsx` | 4.2 KB | 103 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/records/components/PatientCreateModal.tsx` | 24.2 KB | 391 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/records/components/PatientDetailView.tsx` | 114.4 KB | 1960 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/records/page.tsx` | 168 B | 8 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/records/view/page.tsx` | 68.3 KB | 1334 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/reports/page.tsx` | 24.6 KB | 427 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/requests/page.tsx` | 23.7 KB | 394 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/settings/components/AccountSettings.tsx` | 11.0 KB | 171 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/settings/components/CompanyProfileSettings.tsx` | 8.1 KB | 189 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/settings/components/LoginActivityPanel.tsx` | 6.5 KB | 148 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/settings/components/PlatformConfig.tsx` | 11.7 KB | 205 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/settings/page.tsx` | 10.0 KB | 250 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/dashboard/staff/page.tsx` | 12.6 KB | 252 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/demo/page.tsx` | 10.4 KB | 177 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/error.tsx` | 2.1 KB | 47 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/forgot-password/page.tsx` | 12.5 KB | 238 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/globals.css` | 5.5 KB | 210 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/icon.png` | 333.7 KB | - | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/invoice-preview/[id]/page.tsx` | 7.1 KB | 154 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/layout.tsx` | 1.1 KB | 43 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/legal/page.tsx` | 7.0 KB | 113 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/login/page.tsx` | 16.7 KB | 340 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/not-found.tsx` | 2.0 KB | 34 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/page.tsx` | 18.3 KB | 286 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/pricing/page.tsx` | 13.9 KB | 214 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/register/page.tsx` | 41.8 KB | 584 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/services/page.tsx` | 8.4 KB | 122 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/site-map/page.tsx` | 7.7 KB | 164 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/app/sitemap.ts` | 1.4 KB | 57 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/Auth/SessionMonitor.tsx` | 4.8 KB | 113 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/ConfirmationModal.tsx` | 6.5 KB | 146 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/DashboardNavbar.tsx` | 23.1 KB | 399 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/DashboardPageShell.tsx` | 3.9 KB | 103 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/Footer.tsx` | 3.2 KB | 56 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/GlobalHospitalSelector.tsx` | 4.3 KB | 103 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/GlobalPatientRegister.tsx` | 25.3 KB | 442 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/ICD11/ICD11Search.tsx` | 6.8 KB | 154 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/InactivityWarning.tsx` | 2.3 KB | 53 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/InvoiceRenderer.tsx` | 23.9 KB | 392 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/MaintenanceBanner.tsx` | 6.7 KB | 142 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/Navbar.tsx` | 4.2 KB | 94 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/Scanner/DigitizationScanner.tsx` | 61.6 KB | 1108 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/Scanner/ScannerTypes.ts` | 380 B | 15 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/Scanner/ScannerUtils.ts` | 6.6 KB | 190 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/SecurePDFViewer.tsx` | 13.8 KB | 303 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/Sidebar.tsx` | 18.2 KB | 331 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/dashboard/ActionButton.tsx` | 630 B | 21 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/dashboard/AlertItem.tsx` | 1.9 KB | 44 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/dashboard/MetricCard.tsx` | 1.7 KB | 44 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/dashboard/ModuleLauncher.tsx` | 4.9 KB | 82 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/dental/LiveScanner.tsx` | 9.3 KB | 209 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/dental/Odontogram.tsx` | 18.7 KB | 380 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/dental/PeriodontalChart.tsx` | 10.3 KB | 204 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/dental/ThreeDViewer.tsx` | 5.4 KB | 128 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/records/RecordManager.tsx` | 25.7 KB | 509 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/ui/badge.tsx` | 1.2 KB | 36 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/ui/button.tsx` | 2.0 KB | 58 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/ui/card.tsx` | 2.0 KB | 81 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/ui/dialog.tsx` | 4.0 KB | 123 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/ui/dropdown-menu.tsx` | 8.2 KB | 258 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/ui/input.tsx` | 912 B | 27 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/ui/label.tsx` | 747 B | 28 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/ui/select.tsx` | 5.9 KB | 161 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/ui/sonner.tsx` | 1.0 KB | 41 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/ui/table.tsx` | 2.9 KB | 119 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/ui/tabs.tsx` | 2.0 KB | 57 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/components/ui/textarea.tsx` | 852 B | 26 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/config/api.ts` | 3.4 KB | 116 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. | Frontend API URL and CSRF helper; must match live backend origin/cookie setup. |
| `frontend/src/hooks/useDashboard.ts` | 2.6 KB | 90 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/hooks/useInactivityLogout.ts` | 3.9 KB | 108 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/hooks/useTerminology.ts` | 2.6 KB | 75 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/lib/api.ts` | 1.7 KB | 59 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/lib/dateFormatter.ts` | 1.1 KB | 44 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/lib/formatters.ts` | 395 B | 16 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/lib/reportUtils.ts` | 10.4 KB | 280 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/lib/utils.ts` | 1.1 KB | 41 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. |  |
| `frontend/src/proxy.ts` | 1.7 KB | 53 | Frontend application source required to build live Next.js routes, components, hooks, API helpers, and styling. | Next.js proxy/middleware-style routing logic currently present instead of older middleware.ts. |
| `frontend/tsconfig.json` | 719 B | 43 | Frontend build/deployment configuration or dependency manifest required to build the Next.js app. |  |

## Optional Operations Files

These are useful for maintenance, seeding, debugging, migration support, or operator documentation, but they should not be part of a minimal runtime image unless your deployment runbook explicitly uses them.

| File | Size | Lines | Reason |
|---|---:|---:|---|
| `backend/.env.example` | 548 B | 20 | Example environment template for operators; not read by the live app. |
| `backend/create_initial_data.py` | 1.7 KB | 57 | Bootstrap/reference database utility; not required for normal live runtime after migrations/seeding. |
| `backend/database_schema.sql` | 1.6 KB | 50 | Bootstrap/reference database utility; not required for normal live runtime after migrations/seeding. |
| `backend/maintenance_scripts/add_columns.py` | 1001 B | 26 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `backend/maintenance_scripts/add_mother_column.py` | 1.3 KB | 32 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `backend/maintenance_scripts/backup_database.py` | 2.5 KB | 73 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `backend/maintenance_scripts/check_db_schema.py` | 825 B | 28 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `backend/maintenance_scripts/check_ocr_status.py` | 609 B | 24 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `backend/maintenance_scripts/check_status.py` | 831 B | 23 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `backend/maintenance_scripts/create_local_admin.py` | 1.1 KB | 45 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `backend/maintenance_scripts/debug_accounting.py` | 5.2 KB | 127 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `backend/maintenance_scripts/fix_local_db.py` | 2.7 KB | 92 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `backend/maintenance_scripts/migrate_accounting.py` | 1.2 KB | 33 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `backend/maintenance_scripts/migrate_db.py` | 2.8 KB | 81 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `backend/maintenance_scripts/migrate_inventory.py` | 1.7 KB | 49 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `backend/maintenance_scripts/migrate_mother.py` | 1.8 KB | 48 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `backend/maintenance_scripts/migrate_patients_fields.py` | 1.6 KB | 43 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `backend/maintenance_scripts/reset_ocr.py` | 614 B | 25 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `backend/maintenance_scripts/update_roles.py` | 2.1 KB | 65 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `backend/maintenance_scripts/verify_db.py` | 638 B | 23 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `backend/scripts/migrate_db.py` | 4.4 KB | 109 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `backend/scripts/test_celery.py` | 913 B | 31 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `backend/scripts/unlock_user.py` | 972 B | 36 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `backend/tools/migrate_ocr.py` | 3.1 KB | 85 | Operational/maintenance script; keep out of normal runtime image unless your runbook needs it. |
| `frontend/next-env.d.ts` | 324 B | 8 | Generated Next.js TypeScript declaration; can be regenerated during install/build. |

## Do Not Deploy / Review First

These files are local artifacts, tests, logs, temporary documents, local databases, scratch/deprecated scripts, or otherwise not required on the live server.

| File | Size | Lines | Reason |
|---|---:|---:|---|
| `backend/app/tests/test_ocr_classification.py` | 1.4 KB | 40 | Backend test file; useful before deployment but not required on live server. |
| `backend/backend/data/temp/6b42e33e-84dd-48ce-9aeb-8e05e27195c6/optimized_test_input.pdf` | 1.7 KB | - | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/backend/data/temp/6b42e33e-84dd-48ce-9aeb-8e05e27195c6/test_input.pdf` | 1.1 KB | - | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/backend/data/temp/dd16c095-8d5e-419b-8e62-6ea7720277b7/optimized_test_input.pdf` | 1.1 KB | - | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/backend/data/temp/dd16c095-8d5e-419b-8e62-6ea7720277b7/test_input.pdf` | 1.1 KB | - | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/celery_broker.db` | 32.0 KB | - | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/celery_results.db` | 24.0 KB | - | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/compressed_decrypted.pdf.enc` | 17.8 KB | - | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/deprecated/add_columns_pg.py` | 1.3 KB | 33 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/add_dental_identifiers.py` | 1.6 KB | 55 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/alter_db.py` | 510 B | 16 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/check_db_d45536.py` | 673 B | 17 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/check_db_latest.py` | 364 B | 9 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/check_db_local.py` | 410 B | 11 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/check_db_patient.py` | 659 B | 17 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/check_db_remote.py` | 404 B | 9 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/check_recovered.py` | 896 B | 33 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/check_s3.py` | 803 B | 26 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/check_sqlite_tables.py` | 1017 B | 31 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/create_appointment_tables.py` | 6.2 KB | 142 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/create_tables.py` | 180 B | 7 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/debug_patients.py` | 434 B | 13 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/debug_session.py` | 2.0 KB | 57 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/migrate_v1_3.py` | 3.3 KB | 84 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/digifortlabs.db` | 644.0 KB | - | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/encrypted_demo.pdf.enc` | 16.6 KB | - | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/scratch/check_async_csrf.py` | 152 B | 5 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/compress_encrypted_demo.py` | 2.8 KB | 85 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/compress_s3_file.py` | 2.4 KB | 75 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/count_s3.py` | 579 B | 23 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/debug_s3_compress.py` | 2.0 KB | 64 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/generate_test_pdf.py` | 339 B | 10 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/inspect_csrf.py` | 209 B | 8 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/inspect_pdf.py` | 753 B | 27 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/migrate_to_e_drive.py` | 4.6 KB | 122 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/step1_download_all.py` | 2.7 KB | 83 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/step2_decrypt_only.py` | 2.7 KB | 82 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/step2_process_files.py` | 4.0 KB | 111 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/test_s3_decrypt.py` | 734 B | 30 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/test_single_compress.py` | 1.2 KB | 35 | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/temp_s3_decrypted.pdf` | 2.2 MB | - | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/temp_s3_input.enc` | 2.9 MB | - | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/temp_s3_input.enc.Ac85Ef13` | 2.9 MB | - | Unclassified backend/frontend file; review manually before deployment. |
| `backend/temp_s3_optimized.pdf` | 2.2 MB | - | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/temp_s3_optimized.pdf.enc` | 2.9 MB | - | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/test_input.pdf` | 1.1 KB | - | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `frontend/.gitignore` | 493 B | - | Local/dev documentation, lint, placeholder, or log file; not required on live server. |
| `frontend/README.md` | 1.4 KB | 37 | Local/dev documentation, lint, placeholder, or log file; not required on live server. |
| `frontend/eslint.config.mjs` | 638 B | 26 | Local/dev documentation, lint, placeholder, or log file; not required on live server. |
| `frontend/frontend.log` | 0 B | - | Local/dev documentation, lint, placeholder, or log file; not required on live server. |
| `frontend/test_file` | 0 B | - | Local/dev documentation, lint, placeholder, or log file; not required on live server. |

## Deployment Notes

- Frontend: deploy `package.json`, `package-lock.json`, build configs, `src/`, and `public/`; run `npm ci` then `npm run build` and serve with `npm run start` or the Dockerfile.
- Backend: deploy `requirements.txt`/runtime config, `app/`, Alembic files, templates/static assets, and production process config; install dependencies and run the FastAPI app through Gunicorn/Uvicorn as configured.
- Secrets: create production environment variables on the server. Do not deploy developer `.env`, SQLite DBs, temp PDFs, encrypted test payloads, or key material.
- Migrations: use Alembic for live schema changes; avoid relying on startup `create_all` for production schema management.