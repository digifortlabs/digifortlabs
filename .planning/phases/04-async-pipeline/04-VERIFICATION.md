# Phase 4 Verification: Async Compression Pipeline

## UAT Criteria
- [x] **Granular Status**: Polling the status endpoint returns intermediate states (e.g., `PROGRESS`) before `SUCCESS`.
- [x] **Downloadability**: The optimized file can be downloaded using the provided endpoint.
- [x] **Security**: Download endpoint prevents path traversal (cannot download files outside of the job directory).
- [x] **Cleanup**: Temporary job folders are removed automatically after the retention period.

## Test Cases

### 1. End-to-End Status Polling
1. POST `/optimization/trigger` with a 5MB PDF.
2. Poll `/optimization/status/{task_id}` every 1s.
3. Verify that `status` transitions from `PENDING` -> `PROGRESS` (or similar) -> `SUCCESS`.
4. Verify `result` contains compression metrics.

### 2. Result Retrieval
1. After Step 1 is SUCCESS, construct the download URL.
2. Verify the file is accessible and has the expected size.
3. Try to access `/optimization/download/..%2f..%2f.env` and verify it fails with 403/404.

### 3. Cleanup Logic
1. Create a dummy folder in `backend/data/temp/old_job`.
2. Set its `mtime` to 48 hours ago.
3. Trigger `CleanupService.cleanup_temp_jobs(max_age_hours=24)`.
4. Verify the folder is gone.
