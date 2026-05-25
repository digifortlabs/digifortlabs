# Phase 4: Async Compression Pipeline

## Objective
Enable a robust, production-ready background processing pipeline for PDF optimization that works in environments without Redis (using SQLite as a broker for development).

## Requirements
- **Fallback Broker**: Configure Celery to use SQLAlchemy/SQLite when Redis is unavailable.
- **Background Tasks**: Fully implement the `process_pdf_optimization` task.
- **API Integration**:
    - `POST /api/v1/optimize/trigger`: Start an optimization job.
    - `GET /api/v1/optimize/status/{job_id}`: Poll for job progress.
- **Storage Management**: 
    - Ensure unique job directories are used.
    - Implement a `CleanupService` to purge old temporary files.

## Success Criteria
- [ ] Celery worker can process tasks using the SQLite broker.
- [ ] API can trigger a task and receive a `job_id`.
- [ ] API can return "COMPLETED" status with the final optimized file path.
- [ ] Total size reduction is >50% for standard clinical scans.
