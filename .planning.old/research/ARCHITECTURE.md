# Architecture Research: Async File Processing

**Analysis Date:** 2026-05-11

## Pattern: Producer-Consumer for Heavy CPU Tasks

The current "in-request" compression logic must be moved to an asynchronous architecture to support large files and prevent API timeouts.

### 1. FastAPI (Producer)
- **Responsibility**: Validate the request, save the raw file to a temporary shared storage (or S3), and enqueue a task.
- **Response**: Immediately returns a `task_id` (202 Accepted).

### 2. Redis (Broker & Backend)
- **Broker**: Stores the task messages in a queue.
- **Result Backend**: Stores the status (`PENDING`, `STARTED`, `SUCCESS`, `FAILURE`) and the final compressed file metadata.

### 3. Celery Workers (Consumer)
- **Responsibility**: Pick up tasks, run the `ocrmypdf` / `ghostscript` pipeline.
- **Shared Storage**: Workers must have access to the same filesystem (for local `/tmp`) or S3 bucket as the FastAPI app.

## Data Flow for Compression

1. **Upload**: Client uploads PDF to `POST /v1/records/optimize`.
2. **Persistence**: FastAPI saves to `storage/pending/{uuid}.pdf`.
3. **Dispatch**: `optimize_pdf.delay(file_id=uuid)`.
4. **Processing**: Celery worker runs `ocrmypdf --optimize 3`.
5. **Completion**: Worker saves result to `storage/optimized/{uuid}.pdf` and updates Redis.
6. **Notification**: (Optional) Send a WebSocket or webhook notification to the frontend.

## Optimization: Triage Queues
- **Fast Queue**: For small files (<5MB) that take <10s.
- **Heavy Queue**: For large files or batch processing that can take minutes.

---
*Research: 2026-05-11*
