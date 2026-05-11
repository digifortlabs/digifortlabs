# Roadmap: Advanced PDF Optimization

## Milestone 1.0.0: Sharp Compression & Scalability

### Phase 1: Foundation & Security [COMPLETE - 2026-05-11]
- [x] **Task 1.1**: Rotate `SECRET_KEY` and move to environment variables.
- [x] **Task 1.2**: Fix hardcoded paths for Tesseract/Poppler in `ocr.py`.
- [x] **Task 1.3**: Refactor `email_service.py` to use external Jinja2 templates.
- **Goal**: Secure and clean the codebase for new feature integration.

### Phase 2: Infrastructure & Async Prep
- [ ] **Task 2.1**: Configure Celery and Redis in `backend/app/core/`.
- [ ] **Task 2.2**: Implement shared storage abstraction for temporary files.
- [ ] **Task 2.3**: Create base background task handlers.
- **Goal**: Enable asynchronous processing for heavy PDF tasks.

### Phase 3: High-Density Compression Engine
- [ ] **Task 3.1**: Integrate `ocrmypdf` for JBIG2 monochrome compression.
- [ ] **Task 3.2**: Integrate `Ghostscript` for general PDF downsampling.
- [ ] **Task 3.3**: Update `compression.py` with multi-level strategies (Low/Med/High).
- **Goal**: Achieve the "clean and sharp" compression quality.

### Phase 4: Async Compression Pipeline
- [ ] **Task 4.1**: Implement the background compression task logic.
- [ ] **Task 4.2**: Create API endpoints for status polling and task retrieval.
- [ ] **Task 4.3**: Implement automatic cleanup of temporary files.
- **Goal**: Full end-to-end background optimization workflow.

### Phase 5: Dashboard Integration
- [ ] **Task 5.1**: Add "Compression Level" selection to the record upload flow.
- [ ] **Task 5.2**: Implement real-time status indicators (Optimizing...) in the UI.
- [ ] **Task 5.3**: Add success/failure notifications for background tasks.
- **Goal**: Expose the new capabilities to the end-user.

### Phase 6: Validation & Performance
- [ ] **Task 6.1**: UAT with user-provided sample PDFs (~500KB target).
- [ ] **Task 6.2**: Benchmarking and performance tuning of the Celery worker.
- [ ] **Task 6.3**: Final documentation of the optimization engine.
- **Goal**: Ensure the solution meets "clean and sharp" requirements at scale.

---
*Roadmap generated: 2026-05-11*
