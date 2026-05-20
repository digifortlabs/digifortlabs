# DIGIFORTLABS Codebase Report

Generated: 2026-05-13T14:40:18.975Z
Workspace: `D:\Website\DIGIFORTLABS`

## Scope

- Included all project files found under the workspace, excluding dependency/build/cache directories: `.git`, `node_modules`, `.venv`, `.next`, and `__pycache__`.
- Binary, PDF, database, encrypted, and executable artifacts are listed with risk notes instead of content inspection.
- Existing worktree was dirty before this report; application files were not modified by this report generation.

## Executive Summary

- Stack: FastAPI + SQLAlchemy + Celery backend, Next.js 16/React 19 frontend, Tkinter/OpenCV local scanner utility, Alembic migrations, AWS/S3-oriented deployment scripts.
- Domain: hospital archive and operations platform covering patients, records, storage/warehouse, accounting, QA, reports, dental, ENT, HMS, inventory, platform administration, scanner ingestion, OCR, compression, and compliance.
- Biggest immediate risks: private `.pem` keys in repo root, `backend/.env` present locally, committed/local SQLite databases and temp PDFs/encrypted files, large public scanner binaries, and duplicated model definitions between `backend/app/models.py` and `backend/app/models/base.py`.
- Testing appears light relative to scope: one backend OCR classification test is visible; frontend has test tooling but no discovered test files in the scanned source set.

## File Inventory

| File | Size | Lines | Report |
|---|---:|---:|---|
| `.code-review-graph/.gitignore` | 143 B | - | Local code review graph metadata/database artifact. |
| `.code-review-graph/graph.db` | 148.0 KB | - | Local code review graph metadata/database artifact. |
| `.env.example` | 917 B | 42 | Project file; see path/name for domain context. |
| `.gitignore` | 662 B | - | Project file; see path/name for domain context. |
| `.planning/PROJECT.md` | 2.2 KB | 43 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/REQUIREMENTS.md` | 1.7 KB | 41 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/ROADMAP.md` | 2.1 KB | 43 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/STATE.md` | 892 B | 26 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/codebase/ARCHITECTURE.md` | 3.5 KB | 70 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/codebase/CONCERNS.md` | 2.3 KB | 37 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/codebase/CONVENTIONS.md` | 2.3 KB | 55 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/codebase/INTEGRATIONS.md` | 1.8 KB | 51 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/codebase/STACK.md` | 2.0 KB | 84 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/codebase/STRUCTURE.md` | 3.4 KB | 81 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/codebase/TESTING.md` | 1.7 KB | 48 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/config.json` | 277 B | 15 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/phases/01-foundation-security/01-01-SUMMARY.md` | 2.0 KB | 31 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/phases/01-foundation-security/01-01-security-hardening.md` | 2.2 KB | 70 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/phases/01-foundation-security/01-02-binary-paths.md` | 2.0 KB | 65 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/phases/01-foundation-security/01-03-email-refactor.md` | 2.4 KB | 76 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/phases/01-foundation-security/01-CONTEXT.md` | 2.3 KB | 52 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/phases/01-foundation-security/01-RESEARCH.md` | 2.3 KB | 62 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/phases/01-foundation-security/01-VALIDATION.md` | 1.5 KB | 35 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/phases/02-async-infrastructure/02-01-PLAN.md` | 4.7 KB | 163 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/phases/02-async-infrastructure/02-01-SUMMARY.md` | 1.1 KB | 22 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/phases/02-async-infrastructure/02-CONTEXT.md` | 1.6 KB | 47 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/phases/03-high-density-compression/03-01-PLAN.md` | 1.0 KB | 31 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/phases/04-async-pipeline/04-CONTEXT.md` | 982 B | 21 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/research/ARCHITECTURE.md` | 1.5 KB | 36 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `.planning/research/STACK.md` | 2.2 KB | 39 | Planning/documentation artifact describing architecture, roadmap, research, phases, or project state. |
| `backend/.dockerignore` | 86 B | - | Backend source/config/data artifact file. |
| `backend/.env` | 1.1 KB | 29 | Local backend environment file. Contains runtime secrets/config; should stay untracked. |
| `backend/.env.example` | 548 B | 20 | Backend source/config/data artifact file. |
| `backend/Dockerfile` | 470 B | 21 | Backend source/config/data artifact file. |
| `backend/alembic.ini` | 1.7 KB | 78 | Backend source/config/data artifact file. |
| `backend/alembic/env.py` | 1.9 KB | 71 | Alembic migration configuration/runtime template. |
| `backend/alembic/script.py.mako` | 635 B | 27 | Alembic migration configuration/runtime template. |
| `backend/alembic/versions/3925b046fb45_add_is_deleted_to_user_and_hospital.py` | 952 B | 33 | Alembic migration revision 3925b046fb45_add_is_deleted_to_user_and_hospital. |
| `backend/alembic/versions/a5a41c3994c0_initial_baseline.py` | 675 B | 31 | Alembic migration revision a5a41c3994c0_initial_baseline. |
| `backend/alembic/versions/b78be8167775_add_dental_fields_to_patient_model.py` | 1.4 KB | 41 | Alembic migration revision b78be8167775_add_dental_fields_to_patient_model. |
| `backend/alembic/versions/cc7fe2021d9e_redirect_dental_relationships_to_.py` | 3.3 KB | 61 | Alembic migration revision cc7fe2021d9e_redirect_dental_relationships_to_. |
| `backend/app/audit.py` | 1.4 KB | 42 | Backend source/config/data artifact file. |
| `backend/app/celery_app.py` | 475 B | 23 | Backend source/config/data artifact file. |
| `backend/app/core/celery_app.py` | 473 B | 21 | Backend source/config/data artifact file. |
| `backend/app/core/config.py` | 4.1 KB | 88 | Central settings loader for environment, database, secrets, storage, mail, CORS, and feature configuration. |
| `backend/app/core/logging_config.py` | 1.3 KB | 42 | Backend source/config/data artifact file. |
| `backend/app/database.py` | 1.2 KB | 44 | SQLAlchemy engine/session setup and database dependency. |
| `backend/app/main.py` | 10.7 KB | 314 | FastAPI application bootstrap: CSRF, middleware, CORS, routers, static mount, health endpoints, background cleanup. |
| `backend/app/middleware/bandwidth.py` | 3.0 KB | 82 | Backend source/config/data artifact file. |
| `backend/app/middleware/security.py` | 3.3 KB | 89 | Backend source/config/data artifact file. |
| `backend/app/models.py` | 54.2 KB | 1247 | Large SQLAlchemy domain model module for hospitals, users, patients, files, accounting, storage, dental, ENT, HMS, audit, and platform settings. |
| `backend/app/models/base.py` | 1.8 KB | 55 | Model enum/permission base definitions; overlaps with monolithic models.py and should be checked for duplication drift. |
| `backend/app/routers/accounting.py` | 38.1 KB | 983 | FastAPI router for accounting domain endpoints and schemas. |
| `backend/app/routers/accounting_advanced.py` | 13.2 KB | 383 | FastAPI router for accounting_advanced domain endpoints and schemas. |
| `backend/app/routers/appointments.py` | 5.6 KB | 183 | FastAPI router for appointments domain endpoints and schemas. |
| `backend/app/routers/audit_logs.py` | 3.4 KB | 105 | FastAPI router for audit_logs domain endpoints and schemas. |
| `backend/app/routers/auth.py` | 31.1 KB | 810 | FastAPI router for auth domain endpoints and schemas. |
| `backend/app/routers/clinic.py` | 5.2 KB | 180 | FastAPI router for clinic domain endpoints and schemas. |
| `backend/app/routers/compliance.py` | 2.4 KB | 69 | FastAPI router for compliance domain endpoints and schemas. |
| `backend/app/routers/contact.py` | 586 B | 18 | FastAPI router for contact domain endpoints and schemas. |
| `backend/app/routers/dental.py` | 48.3 KB | 1343 | FastAPI router for dental domain endpoints and schemas. |
| `backend/app/routers/diagnoses.py` | 6.5 KB | 188 | FastAPI router for diagnoses domain endpoints and schemas. |
| `backend/app/routers/ent.py` | 7.9 KB | 245 | FastAPI router for ent domain endpoints and schemas. |
| `backend/app/routers/hms.py` | 9.9 KB | 338 | FastAPI router for hms domain endpoints and schemas. |
| `backend/app/routers/hospitals.py` | 19.8 KB | 502 | FastAPI router for hospitals domain endpoints and schemas. |
| `backend/app/routers/inventory.py` | 5.4 KB | 167 | FastAPI router for inventory domain endpoints and schemas. |
| `backend/app/routers/optimization.py` | 1.9 KB | 69 | FastAPI router for optimization domain endpoints and schemas. |
| `backend/app/routers/patients.py` | 77.6 KB | 1939 | FastAPI router for patients domain endpoints and schemas. |
| `backend/app/routers/platform.py` | 8.4 KB | 246 | FastAPI router for platform domain endpoints and schemas. |
| `backend/app/routers/platform_ops.py` | 2.5 KB | 72 | FastAPI router for platform_ops domain endpoints and schemas. |
| `backend/app/routers/procedures.py` | 5.9 KB | 175 | FastAPI router for procedures domain endpoints and schemas. |
| `backend/app/routers/qa.py` | 3.5 KB | 110 | FastAPI router for qa domain endpoints and schemas. |
| `backend/app/routers/reports.py` | 12.1 KB | 340 | FastAPI router for reports domain endpoints and schemas. |
| `backend/app/routers/scanner.py` | 692 B | 18 | FastAPI router for scanner domain endpoints and schemas. |
| `backend/app/routers/server_files.py` | 4.5 KB | 126 | FastAPI router for server_files domain endpoints and schemas. |
| `backend/app/routers/stats.py` | 16.9 KB | 457 | FastAPI router for stats domain endpoints and schemas. |
| `backend/app/routers/storage.py` | 42.6 KB | 1141 | FastAPI router for storage domain endpoints and schemas. |
| `backend/app/routers/users.py` | 11.6 KB | 302 | FastAPI router for users domain endpoints and schemas. |
| `backend/app/scripts/check_db.sh` | 180 B | 3 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/app/scripts/cleanup_orphaned_files.py` | 3.8 KB | 126 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/app/scripts/cleanup_s3_drafts.py` | 9.5 KB | 247 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/app/scripts/fix_file_sizes.py` | 1.7 KB | 59 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/app/scripts/fix_invoice_schema.py` | 2.1 KB | 56 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/app/scripts/fix_system_settings.py` | 1.3 KB | 39 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/app/scripts/make_racks_global.py` | 1.3 KB | 32 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/app/scripts/migrate_pg_config.py` | 1.5 KB | 48 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/app/scripts/recover_file.py` | 901 B | 31 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/app/scripts/update_config_schema.py` | 1.1 KB | 34 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/app/seeds/icd11_procedures_sample.json` | 1.5 KB | 78 | Backend source/config/data artifact file. |
| `backend/app/seeds/icd11_sample.json` | 3.4 KB | 162 | Backend source/config/data artifact file. |
| `backend/app/seeds/seed_icd11.py` | 1.0 KB | 46 | Backend source/config/data artifact file. |
| `backend/app/seeds/seed_icd11_procedures.py` | 1.4 KB | 51 | Backend source/config/data artifact file. |
| `backend/app/services/ai_service.py` | 3.9 KB | 100 | Backend service layer for ai_service behavior. |
| `backend/app/services/cleanup_service.py` | 4.3 KB | 102 | Backend service layer for cleanup_service behavior. |
| `backend/app/services/compression.py` | 6.1 KB | 152 | Backend service layer for compression behavior. |
| `backend/app/services/demo_service.py` | 2.9 KB | 91 | Backend service layer for demo_service behavior. |
| `backend/app/services/email_service.py` | 59.9 KB | 1243 | Backend service layer for email_service behavior. |
| `backend/app/services/encryption.py` | 2.5 KB | 82 | Backend service layer for encryption behavior. |
| `backend/app/services/icd11_service.py` | 3.0 KB | 85 | Backend service layer for icd11_service behavior. |
| `backend/app/services/ocr.py` | 6.1 KB | 174 | Backend service layer for ocr behavior. |
| `backend/app/services/s3_handler.py` | 9.1 KB | 246 | Backend service layer for s3_handler behavior. |
| `backend/app/services/scanner/__init__.py` | 0 B | 0 | Backend service layer for scanner/__init__ behavior. |
| `backend/app/services/scanner/doc_scanner.py` | 9.6 KB | 237 | Backend service layer for scanner/doc_scanner behavior. |
| `backend/app/services/scanner/pyimagesearch/__init__.py` | 0 B | 0 | Backend service layer for scanner/pyimagesearch/__init__ behavior. |
| `backend/app/services/scanner/pyimagesearch/imutils.py` | 1.5 KB | 59 | Backend service layer for scanner/pyimagesearch/imutils behavior. |
| `backend/app/services/scanner/pyimagesearch/transform.py` | 2.7 KB | 70 | Backend service layer for scanner/pyimagesearch/transform behavior. |
| `backend/app/services/storage.py` | 1.1 KB | 38 | Backend service layer for storage behavior. |
| `backend/app/services/storage_service.py` | 7.4 KB | 201 | Backend service layer for storage_service behavior. |
| `backend/app/services/tasks.py` | 1.9 KB | 59 | Backend service layer for tasks behavior. |
| `backend/app/static/DigifortScanner.exe` | 76.3 MB | - | Backend source/config/data artifact file. |
| `backend/app/tasks/__init__.py` | 23 B | 2 | Backend source/config/data artifact file. |
| `backend/app/tasks/optimization.py` | 1.4 KB | 40 | Backend source/config/data artifact file. |
| `backend/app/templates/email/account_locked.html` | 829 B | 19 | HTML email template for account locked notifications. |
| `backend/app/templates/email/base.html` | 1.0 KB | 23 | HTML email template for base notifications. |
| `backend/app/templates/email/download_request.html` | 1.2 KB | 24 | HTML email template for download request notifications. |
| `backend/app/templates/email/email_change_alert.html` | 1.1 KB | 25 | HTML email template for email change alert notifications. |
| `backend/app/templates/email/login_alert.html` | 1.1 KB | 23 | HTML email template for login alert notifications. |
| `backend/app/templates/email/otp.html` | 900 B | 21 | HTML email template for otp notifications. |
| `backend/app/tests/test_ocr_classification.py` | 1.4 KB | 40 | Backend source/config/data artifact file. |
| `backend/app/utils.py` | 2.8 KB | 83 | Backend source/config/data artifact file. |
| `backend/backend/data/temp/6b42e33e-84dd-48ce-9aeb-8e05e27195c6/optimized_test_input.pdf` | 1.7 KB | - | Backend sample/temp encrypted or PDF data artifact; may contain sensitive document test data. |
| `backend/backend/data/temp/6b42e33e-84dd-48ce-9aeb-8e05e27195c6/test_input.pdf` | 1.1 KB | - | Backend sample/temp encrypted or PDF data artifact; may contain sensitive document test data. |
| `backend/backend/data/temp/dd16c095-8d5e-419b-8e62-6ea7720277b7/optimized_test_input.pdf` | 1.1 KB | - | Backend sample/temp encrypted or PDF data artifact; may contain sensitive document test data. |
| `backend/backend/data/temp/dd16c095-8d5e-419b-8e62-6ea7720277b7/test_input.pdf` | 1.1 KB | - | Backend sample/temp encrypted or PDF data artifact; may contain sensitive document test data. |
| `backend/celery_broker.db` | 32.0 KB | - | SQLite runtime/cache database artifact; usually exclude from source control and review for sensitive data. |
| `backend/celery_results.db` | 24.0 KB | - | SQLite runtime/cache database artifact; usually exclude from source control and review for sensitive data. |
| `backend/compressed_decrypted.pdf.enc` | 17.8 KB | - | Backend sample/temp encrypted or PDF data artifact; may contain sensitive document test data. |
| `backend/create_initial_data.py` | 1.7 KB | 57 | Backend source/config/data artifact file. |
| `backend/database_schema.sql` | 1.6 KB | 50 | Backend source/config/data artifact file. |
| `backend/deprecated/add_columns_pg.py` | 1.3 KB | 33 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/deprecated/add_dental_identifiers.py` | 1.6 KB | 55 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/deprecated/alter_db.py` | 510 B | 16 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/deprecated/check_db_d45536.py` | 673 B | 17 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/deprecated/check_db_latest.py` | 364 B | 9 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/deprecated/check_db_local.py` | 410 B | 11 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/deprecated/check_db_patient.py` | 659 B | 17 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/deprecated/check_db_remote.py` | 404 B | 9 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/deprecated/check_recovered.py` | 896 B | 33 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/deprecated/check_s3.py` | 803 B | 26 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/deprecated/check_sqlite_tables.py` | 1017 B | 31 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/deprecated/create_appointment_tables.py` | 6.2 KB | 142 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/deprecated/create_tables.py` | 180 B | 7 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/deprecated/debug_patients.py` | 434 B | 13 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/deprecated/debug_session.py` | 2.0 KB | 57 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/deprecated/migrate_v1_3.py` | 3.3 KB | 84 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/digifortlabs.db` | 644.0 KB | - | SQLite runtime/cache database artifact; usually exclude from source control and review for sensitive data. |
| `backend/encrypted_demo.pdf.enc` | 16.6 KB | - | Backend sample/temp encrypted or PDF data artifact; may contain sensitive document test data. |
| `backend/gunicorn_conf.py` | 380 B | 23 | Backend source/config/data artifact file. |
| `backend/logs/activity.log` | 2.0 KB | - | Backend source/config/data artifact file. |
| `backend/logs/auth.log` | 8.1 KB | - | Backend source/config/data artifact file. |
| `backend/logs/system.log` | 923 B | - | Backend source/config/data artifact file. |
| `backend/maintenance_scripts/add_columns.py` | 1001 B | 26 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/maintenance_scripts/add_mother_column.py` | 1.3 KB | 32 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/maintenance_scripts/backup_database.py` | 2.5 KB | 73 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/maintenance_scripts/check_db_schema.py` | 825 B | 28 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/maintenance_scripts/check_ocr_status.py` | 609 B | 24 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/maintenance_scripts/check_status.py` | 831 B | 23 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/maintenance_scripts/create_local_admin.py` | 1.1 KB | 45 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/maintenance_scripts/debug_accounting.py` | 5.2 KB | 127 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/maintenance_scripts/fix_local_db.py` | 2.7 KB | 92 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/maintenance_scripts/migrate_accounting.py` | 1.2 KB | 33 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/maintenance_scripts/migrate_db.py` | 2.8 KB | 81 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/maintenance_scripts/migrate_inventory.py` | 1.7 KB | 49 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/maintenance_scripts/migrate_mother.py` | 1.8 KB | 48 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/maintenance_scripts/migrate_patients_fields.py` | 1.6 KB | 43 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/maintenance_scripts/reset_ocr.py` | 614 B | 25 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/maintenance_scripts/update_roles.py` | 2.1 KB | 65 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/maintenance_scripts/verify_db.py` | 638 B | 23 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/pyproject.toml` | 303 B | 18 | Backend source/config/data artifact file. |
| `backend/requirements.txt` | 411 B | 36 | Backend source/config/data artifact file. |
| `backend/scratch/check_async_csrf.py` | 152 B | 5 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/scratch/compress_encrypted_demo.py` | 2.8 KB | 85 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/scratch/compress_s3_file.py` | 2.4 KB | 75 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/scratch/count_s3.py` | 579 B | 23 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/scratch/debug_s3_compress.py` | 2.0 KB | 64 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/scratch/generate_test_pdf.py` | 339 B | 10 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/scratch/inspect_csrf.py` | 209 B | 8 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/scratch/inspect_pdf.py` | 753 B | 27 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/scratch/migrate_to_e_drive.py` | 4.6 KB | 122 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/scratch/step1_download_all.py` | 2.7 KB | 83 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/scratch/step2_decrypt_only.py` | 2.7 KB | 82 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/scratch/step2_process_files.py` | 4.0 KB | 111 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/scratch/test_s3_decrypt.py` | 734 B | 30 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/scratch/test_single_compress.py` | 1.2 KB | 35 | Operational, migration, debug, or scratch utility script; review before production use. |
| `backend/scripts/migrate_db.py` | 4.4 KB | 109 | Backend source/config/data artifact file. |
| `backend/scripts/test_celery.py` | 913 B | 31 | Backend source/config/data artifact file. |
| `backend/scripts/unlock_user.py` | 972 B | 36 | Backend source/config/data artifact file. |
| `backend/start_prod.sh` | 229 B | 9 | Repository automation script for local start/stop/deploy/backup workflow. |
| `backend/temp_s3_decrypted.pdf` | 2.2 MB | - | Backend sample/temp encrypted or PDF data artifact; may contain sensitive document test data. |
| `backend/temp_s3_input.enc` | 2.9 MB | - | Backend sample/temp encrypted or PDF data artifact; may contain sensitive document test data. |
| `backend/temp_s3_input.enc.Ac85Ef13` | 2.9 MB | - | Backend source/config/data artifact file. |
| `backend/temp_s3_optimized.pdf` | 2.2 MB | - | Backend sample/temp encrypted or PDF data artifact; may contain sensitive document test data. |
| `backend/temp_s3_optimized.pdf.enc` | 2.9 MB | - | Backend sample/temp encrypted or PDF data artifact; may contain sensitive document test data. |
| `backend/test_input.pdf` | 1.1 KB | - | Backend sample/temp encrypted or PDF data artifact; may contain sensitive document test data. |
| `backend/tools/migrate_ocr.py` | 3.1 KB | 85 | Backend source/config/data artifact file. |
| `backup_all.bat` | 2.2 KB | 57 | Repository automation script for local start/stop/deploy/backup workflow. |
| `cli.bat` | 63 B | 3 | Repository automation script for local start/stop/deploy/backup workflow. |
| `deploy.bat` | 278 B | 11 | Repository automation script for local start/stop/deploy/backup workflow. |
| `deploy.sh` | 982 B | 33 | Repository automation script for local start/stop/deploy/backup workflow. |
| `deploy_to_aws.ps1` | 2.7 KB | 71 | Repository automation script for local start/stop/deploy/backup workflow. |
| `digifort-demo-key.pem` | 1.7 KB | - | PRIVATE KEY MATERIAL. Should not be committed or distributed; rotate if exposed. |
| `digifort-prod-key.pem` | 1.7 KB | - | PRIVATE KEY MATERIAL. Should not be committed or distributed; rotate if exposed. |
| `digifortlabs-keypair.pem` | 1.6 KB | - | PRIVATE KEY MATERIAL. Should not be committed or distributed; rotate if exposed. |
| `digifortlabs.pem` | 1.6 KB | - | PRIVATE KEY MATERIAL. Should not be committed or distributed; rotate if exposed. |
| `frontend/.dockerignore` | 133 B | - | Frontend source/config/public asset file. |
| `frontend/.gitignore` | 493 B | - | Frontend source/config/public asset file. |
| `frontend/Dockerfile` | 510 B | 27 | Frontend source/config/public asset file. |
| `frontend/README.md` | 1.4 KB | 37 | Frontend source/config/public asset file. |
| `frontend/components.json` | 467 B | 24 | Frontend source/config/public asset file. |
| `frontend/eslint.config.mjs` | 638 B | 26 | Frontend source/config/public asset file. |
| `frontend/frontend.log` | 0 B | - | Frontend source/config/public asset file. |
| `frontend/next-env.d.ts` | 324 B | 8 | Frontend source/config/public asset file. |
| `frontend/next.config.mjs` | 328 B | 17 | Frontend source/config/public asset file. |
| `frontend/package-lock.json` | 619.2 KB | 17721 | Frontend source/config/public asset file. |
| `frontend/package.json` | 1.7 KB | 64 | Frontend source/config/public asset file. |
| `frontend/postcss.config.mjs` | 94 B | 8 | Frontend source/config/public asset file. |
| `frontend/public/404.html` | 3.6 KB | 135 | Frontend source/config/public asset file. |
| `frontend/public/50x.html` | 3.6 KB | 135 | Frontend source/config/public asset file. |
| `frontend/public/DigifortScanner_Setup.exe` | 45.4 MB | - | Public downloadable scanner installer/archive binary. |
| `frontend/public/DigifortScanner_Setup_v2.1.exe` | 74.1 MB | - | Public downloadable scanner installer/archive binary. |
| `frontend/public/favicon.ico` | 12.3 KB | - | Frontend source/config/public asset file. |
| `frontend/public/file.svg` | 391 B | - | Frontend source/config/public asset file. |
| `frontend/public/globe.svg` | 1.0 KB | - | Frontend source/config/public asset file. |
| `frontend/public/logo/logo.png` | 502.3 KB | - | Frontend source/config/public asset file. |
| `frontend/public/logo/longlogo.png` | 1019.1 KB | - | Frontend source/config/public asset file. |
| `frontend/public/next.svg` | 1.3 KB | - | Frontend source/config/public asset file. |
| `frontend/public/scanner_app.zip` | 71.5 MB | - | Public downloadable scanner installer/archive binary. |
| `frontend/public/vercel.svg` | 128 B | - | Frontend source/config/public asset file. |
| `frontend/public/window.svg` | 385 B | - | Frontend source/config/public asset file. |
| `frontend/src/app/about/page.tsx` | 9.9 KB | 151 | Next.js App Router page for /about route. |
| `frontend/src/app/contact/page.tsx` | 11.4 KB | 205 | Next.js App Router page for /contact route. |
| `frontend/src/app/dashboard/accounting/components/AccountingSettings.tsx` | 19.4 KB | 337 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/accounting/components/AgingReport.tsx` | 9.3 KB | 200 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/accounting/components/EditInvoiceModal.tsx` | 18.7 KB | 344 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/accounting/components/ExpenseManager.tsx` | 19.4 KB | 357 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/accounting/components/FinancialDashboard.tsx` | 11.5 KB | 221 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/accounting/components/HospitalLedgerList.tsx` | 6.4 KB | 132 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/accounting/components/InventoryManager.tsx` | 14.6 KB | 284 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/accounting/components/InvoiceGenerationModal.tsx` | 33.3 KB | 551 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/accounting/components/InvoicePreviewModal.tsx` | 6.3 KB | 142 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/accounting/components/ProfitAndLoss.tsx` | 7.3 KB | 146 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/accounting/components/ReceivePaymentModal.tsx` | 7.8 KB | 162 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/accounting/components/VendorManager.tsx` | 14.8 KB | 266 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/accounting/ledger/[id]/page.tsx` | 10.6 KB | 199 | Next.js App Router page for /dashboard/accounting/ledger/[id] route. |
| `frontend/src/app/dashboard/accounting/page.tsx` | 28.2 KB | 522 | Next.js App Router page for /dashboard/accounting route. |
| `frontend/src/app/dashboard/appointments/components/CreateAppointmentModal.tsx` | 10.0 KB | 208 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/appointments/page.tsx` | 17.7 KB | 334 | Next.js App Router page for /dashboard/appointments route. |
| `frontend/src/app/dashboard/archive/page.tsx` | 6.4 KB | 120 | Next.js App Router page for /dashboard/archive route. |
| `frontend/src/app/dashboard/audit/page.tsx` | 10.2 KB | 204 | Next.js App Router page for /dashboard/audit route. |
| `frontend/src/app/dashboard/clinic/[id]/page.tsx` | 25.4 KB | 429 | Next.js App Router page for /dashboard/clinic/[id] route. |
| `frontend/src/app/dashboard/clinic/page.tsx` | 20.3 KB | 377 | Next.js App Router page for /dashboard/clinic route. |
| `frontend/src/app/dashboard/dental/analytics/page.tsx` | 11.9 KB | 228 | Next.js App Router page for /dashboard/dental/analytics route. |
| `frontend/src/app/dashboard/dental/components/AppointmentModal.tsx` | 6.0 KB | 133 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/dental/components/PatientDetail.tsx` | 99.1 KB | 1599 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/dental/inventory/page.tsx` | 8.8 KB | 171 | Next.js App Router page for /dashboard/dental/inventory route. |
| `frontend/src/app/dashboard/dental/page.tsx` | 35.5 KB | 671 | Next.js App Router page for /dashboard/dental route. |
| `frontend/src/app/dashboard/downloads/page.tsx` | 5.7 KB | 92 | Next.js App Router page for /dashboard/downloads route. |
| `frontend/src/app/dashboard/drafts/page.tsx` | 7.4 KB | 165 | Next.js App Router page for /dashboard/drafts route. |
| `frontend/src/app/dashboard/ent/components/ENTPatientDetail.tsx` | 15.1 KB | 266 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/ent/page.tsx` | 17.2 KB | 316 | Next.js App Router page for /dashboard/ent route. |
| `frontend/src/app/dashboard/group-overview/page.tsx` | 13.1 KB | 235 | Next.js App Router page for /dashboard/group-overview route. |
| `frontend/src/app/dashboard/hms/admissions/page.tsx` | 15.0 KB | 235 | Next.js App Router page for /dashboard/hms/admissions route. |
| `frontend/src/app/dashboard/hms/beds/page.tsx` | 12.0 KB | 189 | Next.js App Router page for /dashboard/hms/beds route. |
| `frontend/src/app/dashboard/hms/page.tsx` | 16.3 KB | 253 | Next.js App Router page for /dashboard/hms route. |
| `frontend/src/app/dashboard/hospital-overview/page.tsx` | 20.2 KB | 379 | Next.js App Router page for /dashboard/hospital-overview route. |
| `frontend/src/app/dashboard/inventory/page.tsx` | 1.6 KB | 39 | Next.js App Router page for /dashboard/inventory route. |
| `frontend/src/app/dashboard/layout.tsx` | 4.6 KB | 122 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/page.tsx` | 53.5 KB | 955 | Next.js App Router page for /dashboard route. |
| `frontend/src/app/dashboard/records/components/CameraModal.tsx` | 4.2 KB | 103 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/records/components/PatientCreateModal.tsx` | 24.2 KB | 391 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/records/components/PatientDetailView.tsx` | 114.4 KB | 1960 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/records/page.tsx` | 168 B | 8 | Next.js App Router page for /dashboard/records route. |
| `frontend/src/app/dashboard/records/view/page.tsx` | 68.3 KB | 1334 | Next.js App Router page for /dashboard/records/view route. |
| `frontend/src/app/dashboard/reports/page.tsx` | 24.6 KB | 427 | Next.js App Router page for /dashboard/reports route. |
| `frontend/src/app/dashboard/requests/page.tsx` | 23.7 KB | 394 | Next.js App Router page for /dashboard/requests route. |
| `frontend/src/app/dashboard/settings/components/AccountSettings.tsx` | 11.0 KB | 171 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/settings/components/CompanyProfileSettings.tsx` | 8.1 KB | 189 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/settings/components/LoginActivityPanel.tsx` | 6.5 KB | 148 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/settings/components/PlatformConfig.tsx` | 11.7 KB | 205 | Frontend source/config/public asset file. |
| `frontend/src/app/dashboard/settings/page.tsx` | 10.0 KB | 250 | Next.js App Router page for /dashboard/settings route. |
| `frontend/src/app/dashboard/staff/page.tsx` | 12.6 KB | 252 | Next.js App Router page for /dashboard/staff route. |
| `frontend/src/app/demo/page.tsx` | 10.4 KB | 177 | Next.js App Router page for /demo route. |
| `frontend/src/app/error.tsx` | 2.1 KB | 47 | Frontend source/config/public asset file. |
| `frontend/src/app/forgot-password/page.tsx` | 12.5 KB | 238 | Next.js App Router page for /forgot-password route. |
| `frontend/src/app/globals.css` | 5.5 KB | 210 | Frontend source/config/public asset file. |
| `frontend/src/app/icon.png` | 333.7 KB | - | Frontend source/config/public asset file. |
| `frontend/src/app/invoice-preview/[id]/page.tsx` | 7.1 KB | 154 | Next.js App Router page for /invoice-preview/[id] route. |
| `frontend/src/app/layout.tsx` | 1.1 KB | 43 | Frontend source/config/public asset file. |
| `frontend/src/app/legal/page.tsx` | 7.0 KB | 113 | Next.js App Router page for /legal route. |
| `frontend/src/app/login/page.tsx` | 16.7 KB | 340 | Next.js App Router page for /login route. |
| `frontend/src/app/not-found.tsx` | 2.0 KB | 34 | Frontend source/config/public asset file. |
| `frontend/src/app/page.tsx` | 18.3 KB | 286 | Public homepage route. |
| `frontend/src/app/pricing/page.tsx` | 13.9 KB | 214 | Next.js App Router page for /pricing route. |
| `frontend/src/app/register/page.tsx` | 41.8 KB | 584 | Next.js App Router page for /register route. |
| `frontend/src/app/services/page.tsx` | 8.4 KB | 122 | Next.js App Router page for /services route. |
| `frontend/src/app/site-map/page.tsx` | 7.7 KB | 164 | Next.js App Router page for /site-map route. |
| `frontend/src/app/sitemap.ts` | 1.4 KB | 57 | Frontend source/config/public asset file. |
| `frontend/src/components/Auth/SessionMonitor.tsx` | 4.8 KB | 113 | Shared React component/helper: Auth/SessionMonitor. |
| `frontend/src/components/ConfirmationModal.tsx` | 6.5 KB | 146 | Shared React component/helper: ConfirmationModal. |
| `frontend/src/components/DashboardNavbar.tsx` | 23.1 KB | 399 | Shared React component/helper: DashboardNavbar. |
| `frontend/src/components/DashboardPageShell.tsx` | 3.9 KB | 103 | Shared React component/helper: DashboardPageShell. |
| `frontend/src/components/Footer.tsx` | 2.8 KB | 48 | Shared React component/helper: Footer. |
| `frontend/src/components/GlobalHospitalSelector.tsx` | 4.3 KB | 103 | Shared React component/helper: GlobalHospitalSelector. |
| `frontend/src/components/GlobalPatientRegister.tsx` | 25.3 KB | 442 | Shared React component/helper: GlobalPatientRegister. |
| `frontend/src/components/ICD11/ICD11Search.tsx` | 6.8 KB | 154 | Shared React component/helper: ICD11/ICD11Search. |
| `frontend/src/components/InactivityWarning.tsx` | 2.3 KB | 53 | Shared React component/helper: InactivityWarning. |
| `frontend/src/components/InvoiceRenderer.tsx` | 23.9 KB | 392 | Shared React component/helper: InvoiceRenderer. |
| `frontend/src/components/MaintenanceBanner.tsx` | 6.7 KB | 142 | Shared React component/helper: MaintenanceBanner. |
| `frontend/src/components/Navbar.tsx` | 4.2 KB | 94 | Shared React component/helper: Navbar. |
| `frontend/src/components/Scanner/DigitizationScanner.tsx` | 61.6 KB | 1108 | Shared React component/helper: Scanner/DigitizationScanner. |
| `frontend/src/components/Scanner/ScannerTypes.ts` | 380 B | 15 | Shared React component/helper: Scanner/ScannerTypes. |
| `frontend/src/components/Scanner/ScannerUtils.ts` | 6.6 KB | 190 | Shared React component/helper: Scanner/ScannerUtils. |
| `frontend/src/components/SecurePDFViewer.tsx` | 13.8 KB | 303 | Shared React component/helper: SecurePDFViewer. |
| `frontend/src/components/Sidebar.tsx` | 18.2 KB | 331 | Shared React component/helper: Sidebar. |
| `frontend/src/components/dashboard/ActionButton.tsx` | 630 B | 21 | Shared React component/helper: dashboard/ActionButton. |
| `frontend/src/components/dashboard/AlertItem.tsx` | 1.9 KB | 44 | Shared React component/helper: dashboard/AlertItem. |
| `frontend/src/components/dashboard/MetricCard.tsx` | 1.7 KB | 44 | Shared React component/helper: dashboard/MetricCard. |
| `frontend/src/components/dashboard/ModuleLauncher.tsx` | 4.9 KB | 82 | Shared React component/helper: dashboard/ModuleLauncher. |
| `frontend/src/components/dental/LiveScanner.tsx` | 9.3 KB | 209 | Shared React component/helper: dental/LiveScanner. |
| `frontend/src/components/dental/Odontogram.tsx` | 18.7 KB | 380 | Shared React component/helper: dental/Odontogram. |
| `frontend/src/components/dental/PeriodontalChart.tsx` | 10.3 KB | 204 | Shared React component/helper: dental/PeriodontalChart. |
| `frontend/src/components/dental/ThreeDViewer.tsx` | 5.4 KB | 128 | Shared React component/helper: dental/ThreeDViewer. |
| `frontend/src/components/records/RecordManager.tsx` | 25.7 KB | 509 | Shared React component/helper: records/RecordManager. |
| `frontend/src/components/ui/badge.tsx` | 1.2 KB | 36 | Reusable shadcn/Radix UI primitive wrapper: badge. |
| `frontend/src/components/ui/button.tsx` | 2.0 KB | 58 | Reusable shadcn/Radix UI primitive wrapper: button. |
| `frontend/src/components/ui/card.tsx` | 2.0 KB | 81 | Reusable shadcn/Radix UI primitive wrapper: card. |
| `frontend/src/components/ui/dialog.tsx` | 4.0 KB | 123 | Reusable shadcn/Radix UI primitive wrapper: dialog. |
| `frontend/src/components/ui/dropdown-menu.tsx` | 8.2 KB | 258 | Reusable shadcn/Radix UI primitive wrapper: dropdown-menu. |
| `frontend/src/components/ui/input.tsx` | 912 B | 27 | Reusable shadcn/Radix UI primitive wrapper: input. |
| `frontend/src/components/ui/label.tsx` | 747 B | 28 | Reusable shadcn/Radix UI primitive wrapper: label. |
| `frontend/src/components/ui/select.tsx` | 5.9 KB | 161 | Reusable shadcn/Radix UI primitive wrapper: select. |
| `frontend/src/components/ui/sonner.tsx` | 1.0 KB | 41 | Reusable shadcn/Radix UI primitive wrapper: sonner. |
| `frontend/src/components/ui/table.tsx` | 2.9 KB | 119 | Reusable shadcn/Radix UI primitive wrapper: table. |
| `frontend/src/components/ui/tabs.tsx` | 2.0 KB | 57 | Reusable shadcn/Radix UI primitive wrapper: tabs. |
| `frontend/src/components/ui/textarea.tsx` | 852 B | 26 | Reusable shadcn/Radix UI primitive wrapper: textarea. |
| `frontend/src/config/api.ts` | 3.4 KB | 116 | Frontend source/config/public asset file. |
| `frontend/src/hooks/useDashboard.ts` | 2.6 KB | 90 | Custom React hook: useDashboard. |
| `frontend/src/hooks/useInactivityLogout.ts` | 3.9 KB | 108 | Custom React hook: useInactivityLogout. |
| `frontend/src/hooks/useTerminology.ts` | 2.6 KB | 75 | Custom React hook: useTerminology. |
| `frontend/src/lib/api.ts` | 1.7 KB | 59 | Frontend utility/API helper module: api. |
| `frontend/src/lib/dateFormatter.ts` | 1.1 KB | 44 | Frontend utility/API helper module: dateFormatter. |
| `frontend/src/lib/formatters.ts` | 395 B | 16 | Frontend utility/API helper module: formatters. |
| `frontend/src/lib/reportUtils.ts` | 10.4 KB | 280 | Frontend utility/API helper module: reportUtils. |
| `frontend/src/lib/utils.ts` | 1.1 KB | 41 | Frontend utility/API helper module: utils. |
| `frontend/src/proxy.ts` | 1.7 KB | 53 | Frontend source/config/public asset file. |
| `frontend/test_file` | 0 B | - | Frontend source/config/public asset file. |
| `frontend/tsconfig.json` | 719 B | 43 | Frontend source/config/public asset file. |
| `graphify.bat` | 84 B | 3 | Repository automation script for local start/stop/deploy/backup workflow. |
| `information/1.1-BIOLOGICAL-DISCIPLINE.pdf` | 659.2 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/1.10.-RADIOLOGICAL-DISCIPLINE-1.pdf` | 537.5 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/1.11.-SOFTWARE-IT-SYSTEM-DISCIPLINE.pdf` | 435.7 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/1.2-CHEMICAL-DISCIPLINE_Amd-26.11.2020.pdf` | 443.8 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/1.3.-DIAGNOSTIC-RADIOLOGY-QA-TESTING-DISCIPLINE.pdf` | 538.6 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/1.4-ELECTRICAL-DISCIPLINE.pdf` | 525.6 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/1.5.-ELECTRONICS-DISCIPLINE.pdf` | 562.7 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/1.6.-FLUID-FLOW-DISCIPLINE.pdf` | 548.3 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/1.8-Mechanical-Discipline.pdf` | 230.2 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/1.8-NON-DESTRUCTIVE-TESTING-DISCIPLINE.pdf` | 593.8 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/1.9.-PHOTOMETRY-DISCIPLINE-1.pdf` | 538.2 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/2.-CALIBRATION-FIELD-2.1-to-2.7-converted.pdf` | 265.1 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202005061238-NABL-137-doc.pdf` | 484.6 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202007070954-NABL-132-doc.pdf` | 182.9 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202008220547-NABL-132A-doc.pdf` | 132.1 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202011180741-NABL-141-doc.pdf` | 738.7 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202101120721-NABL-142-doc.pdf` | 227.3 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202103150455-NABL-015-doc.pdf` | 514.5 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202103280533-NABL-143-doc.pdf` | 255.3 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202106110309-NABL-126-doc.pdf` | 542.4 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202109141045-NABL-139-doc.pdf` | 310.4 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202111240506-NABL-129-doc.pdf` | 2.7 MB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202309180913-NABL-130-doc.pdf` | 261.9 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202401250549-NABL-111-doc.pdf` | 211.3 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202409080300-NABL-133-doc.pdf` | 474.2 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202412180304-NABL-112-A-doc.pdf` | 1.5 MB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202504040242-NABL-136-doc.pdf` | 210.1 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202508210428-NABL-128-doc.pdf` | 538.2 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202508280508-NABL-100B-doc.pdf` | 785.9 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202509300826-NABL-134-doc.pdf` | 200.9 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202511040532-NABL-138-doc.pdf` | 401.4 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202511060637-NABL-112B-doc.pdf` | 1023.2 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202512230649-NABL-120-doc.pdf` | 860.3 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202601060442-NABL-135-doc.pdf` | 854.7 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202601231130-NABL-131-doc.pdf` | 234.2 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202602031214-NABL-100-A-doc.pdf` | 1.4 MB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/202602100511-NABL-127-doc.pdf` | 932.1 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/AnyDesk.exe` | 7.9 MB | - | Binary/config artifact in information archive; review provenance before distribution. |
| `information/Business-oppertunity-in-PT-Provider.pdf` | 475.6 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/CRM-and-RM_14.07.23.pdf` | 369.1 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/Forensic-Discipline-1.pdf` | 162.1 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/MEDICAL-NABL-112-1.pdf` | 218.0 KB | - | Reference/compliance/business PDF document kept in information archive. |
| `information/gcapi.dll` | 385.0 KB | - | Binary/config artifact in information archive; review provenance before distribution. |
| `information/service.conf.lock` | 0 B | 0 | Binary/config artifact in information archive; review provenance before distribution. |
| `information/system.conf.lock` | 0 B | 0 | Binary/config artifact in information archive; review provenance before distribution. |
| `local_scanner/DigifortScanner.spec` | 715 B | 40 | Local desktop scanner dependency, packaging, or protocol-registration file. |
| `local_scanner/RegisterProtocol.spec` | 681 B | 39 | Local desktop scanner dependency, packaging, or protocol-registration file. |
| `local_scanner/icon.ico` | 76.6 KB | - | Local desktop scanner dependency, packaging, or protocol-registration file. |
| `local_scanner/register_protocol.py` | 2.3 KB | 67 | Local desktop scanner dependency, packaging, or protocol-registration file. |
| `local_scanner/requirements.txt` | 59 B | 7 | Local desktop scanner dependency, packaging, or protocol-registration file. |
| `local_scanner/scanner_app.py` | 64.7 KB | 1523 | Tkinter/OpenCV desktop scanner app with capture, processing, editing, and upload/protocol behavior. |
| `local_scanner/setup.iss` | 2.0 KB | 54 | Local desktop scanner dependency, packaging, or protocol-registration file. |
| `start.ps1` | 492 B | 13 | Repository automation script for local start/stop/deploy/backup workflow. |
| `start_dev.ps1` | 3.2 KB | 73 | Repository automation script for local start/stop/deploy/backup workflow. |
| `start_servers.bat` | 196 B | 6 | Repository automation script for local start/stop/deploy/backup workflow. |
| `stop_servers.bat` | 545 B | 15 | Repository automation script for local start/stop/deploy/backup workflow. |

## Security And Hygiene Findings

- Root private key files detected: `digifort-demo-key.pem`, `digifort-prod-key.pem`, `digifortlabs-keypair.pem`, `digifortlabs.pem`. Treat as exposed if this repository has ever left a trusted machine; rotate keys and remove from repo history.
- Local environment file detected: `backend/.env`. It should remain untracked and should not be shared in reports or commits.
- Runtime/data artifacts detected in backend: SQLite databases, temp S3 PDFs, encrypted PDF payloads, and temp processing folders. These may contain PHI or operational data and should be excluded from commits and backups unless intentionally encrypted and governed.
- Public binaries detected: frontend scanner installers and backend static scanner executable. Verify signatures/versioning and distribution policy.
- The backend global exception handler returns `str(exc)` in JSON responses; in production this can leak internal details.
- `Base.metadata.create_all(bind=engine)` runs at startup while Alembic migrations also exist. This can mask migration drift and should be reviewed.

## Suggested Next Steps

1. Remove or quarantine private keys, `.env`, local databases, temp PDFs, and generated artifacts; update `.gitignore` accordingly.
2. Decide whether `backend/app/models.py` or the split `backend/app/models/` package is canonical, then remove duplication carefully.
3. Add backend API tests around auth, RBAC, upload/OCR, storage, accounting, and tenant scoping; add frontend smoke tests for login and dashboard flows.
4. Replace startup `create_all` with migration-only schema management for production.
5. Review frontend API helper usage because some call sites appear to treat raw `Response` objects as parsed JSON.