# Phase 2: Async Infrastructure - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning
**Source:** Approved Implementation Plan (Phase 2)

<domain>
## Phase Boundary
This phase establishes the background processing pipeline using Celery and Redis. It provides the infrastructure needed for long-running PDF optimization tasks.

### Deliverables
- Celery application initialized in `backend/app/core/celery_app.py`.
- Redis-based broker and backend configuration in `config.py`.
- A shared storage service for managing job-specific temporary files.
- A base background task for PDF optimization (stub).
</domain>

<decisions>
## Implementation Decisions

### 1. Broker & Result Backend
- Use Redis as the primary broker and result backend.
- Default URL: `redis://localhost:6379/0`.
- Connection settings must be configurable via environment variables.

### 2. Storage Strategy
- Use a dedicated `data/temp/` directory for job files.
- Each job gets a unique sub-directory (e.g., `data/temp/{job_id}/`).
- Files are cleaned up after successful delivery or 24-hour expiration.

### 3. Task Structure
- Use a class-based or functional approach consistent with the existing `app/services` pattern.
- Tasks should include standard error handling and logging.
</decisions>

<canonical_refs>
## Canonical References
- `backend/app/core/config.py` — For adding settings.
- `backend/app/main.py` — For potential startup events.
</canonical_refs>

<specifics>
## Specific Ideas
- Implement a `StorageService` in `app.services.storage` to abstract filesystem operations.
- Ensure the Celery worker has access to the same Tesseract/Poppler environment as the main app.
</specifics>
