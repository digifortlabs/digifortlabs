# Extra And Temporary Files List

Generated: 2026-05-13T14:48:40.306Z

These files are not required for the normal live server deployment. Review before deleting because some may be useful for local debugging, tests, or one-time operations.

## Files

| File | Size | Reason |
|---|---:|---|
| `backend/app/tests/test_ocr_classification.py` | 1.4 KB | Backend test file; useful before deployment but not required on live server. |
| `backend/backend/data/temp/6b42e33e-84dd-48ce-9aeb-8e05e27195c6/optimized_test_input.pdf` | 1.7 KB | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/backend/data/temp/6b42e33e-84dd-48ce-9aeb-8e05e27195c6/test_input.pdf` | 1.1 KB | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/backend/data/temp/dd16c095-8d5e-419b-8e62-6ea7720277b7/optimized_test_input.pdf` | 1.1 KB | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/backend/data/temp/dd16c095-8d5e-419b-8e62-6ea7720277b7/test_input.pdf` | 1.1 KB | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/celery_broker.db` | 32.0 KB | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/celery_results.db` | 24.0 KB | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/compressed_decrypted.pdf.enc` | 17.8 KB | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/deprecated/add_columns_pg.py` | 1.3 KB | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/add_dental_identifiers.py` | 1.6 KB | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/alter_db.py` | 510 B | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/check_db_d45536.py` | 673 B | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/check_db_latest.py` | 364 B | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/check_db_local.py` | 410 B | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/check_db_patient.py` | 659 B | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/check_db_remote.py` | 404 B | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/check_recovered.py` | 896 B | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/check_s3.py` | 803 B | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/check_sqlite_tables.py` | 1017 B | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/create_appointment_tables.py` | 6.2 KB | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/create_tables.py` | 180 B | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/debug_patients.py` | 434 B | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/debug_session.py` | 2.0 KB | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/deprecated/migrate_v1_3.py` | 3.3 KB | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/digifortlabs.db` | 644.0 KB | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/encrypted_demo.pdf.enc` | 16.6 KB | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/scratch/check_async_csrf.py` | 152 B | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/compress_encrypted_demo.py` | 2.8 KB | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/compress_s3_file.py` | 2.4 KB | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/count_s3.py` | 579 B | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/debug_s3_compress.py` | 2.0 KB | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/generate_test_pdf.py` | 339 B | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/inspect_csrf.py` | 209 B | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/inspect_pdf.py` | 753 B | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/migrate_to_e_drive.py` | 4.6 KB | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/step1_download_all.py` | 2.7 KB | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/step2_decrypt_only.py` | 2.7 KB | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/step2_process_files.py` | 4.0 KB | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/test_s3_decrypt.py` | 734 B | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/scratch/test_single_compress.py` | 1.2 KB | Scratch/deprecated migration/debug script; not required on live server. |
| `backend/temp_s3_decrypted.pdf` | 2.2 MB | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/temp_s3_input.enc` | 2.9 MB | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/temp_s3_input.enc.Ac85Ef13` | 2.9 MB | Unclassified backend/frontend file; review manually before deployment. |
| `backend/temp_s3_optimized.pdf` | 2.2 MB | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/temp_s3_optimized.pdf.enc` | 2.9 MB | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `backend/test_input.pdf` | 1.1 KB | Local database, encrypted payload, PDF, or temporary processing artifact; do not deploy to live server. |
| `frontend/.gitignore` | 493 B | Local/dev documentation, lint, placeholder, or log file; not required on live server. |
| `frontend/README.md` | 1.4 KB | Local/dev documentation, lint, placeholder, or log file; not required on live server. |
| `frontend/eslint.config.mjs` | 638 B | Local/dev documentation, lint, placeholder, or log file; not required on live server. |
| `frontend/frontend.log` | 0 B | Local/dev documentation, lint, placeholder, or log file; not required on live server. |
| `frontend/test_file` | 0 B | Local/dev documentation, lint, placeholder, or log file; not required on live server. |

## Quick Cleanup Guidance

- Do not deploy local databases, temp PDFs, encrypted test payloads, logs, scratch folders, deprecated scripts, or frontend placeholder files.
- Keep production secrets as server environment variables, not copied from local developer files.
- Tests can stay in the repository but do not need to be copied into a minimal runtime artifact.