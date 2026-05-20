# Phase 4 Research: Async Compression Pipeline

## Current Infrastructure
- **Task Trigger**: `POST /optimization/trigger` saves file to `backend/data/temp/<job_id>` and triggers `process_pdf_optimization`.
- **Status Tracking**: `GET /optimization/status/{task_id}` uses `AsyncResult` to check Celery status.
- **Storage**: Jobs are stored in `backend/data/temp`.
- **Cleanup**: `CleanupService` has `cleanup_temp_jobs` but it's only called on a 24-hour loop in `main.py`.

## Gaps
- **Progress Reporting**: `status` endpoint only returns `SUCCESS`, `FAILURE`, or `PENDING`. No intermediate progress (e.g. "Step 2/3: Applying JBIG2").
- **Result Download**: No endpoint to download the optimized PDF directly after completion.
- **Storage Pressure**: If many large files are processed, `backend/data/temp` could grow quickly between 24-hour cleanup cycles.
- **Error Transparency**: Celery errors are caught but not always surfaced clearly to the frontend.

## Proposed Enhancements
- Add `GET /optimization/download/{job_id}/{filename}` endpoint.
- Implement more granular status updates using `task.update_state`.
- Trigger immediate cleanup for SUCCESSFUL jobs after download (optional/optionality).
- Refine `CleanupService` to be more aggressive or configurable.
