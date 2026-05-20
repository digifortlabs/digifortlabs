# Requirements: Advanced PDF Optimization

## 1. Functional Requirements

### 1.1 High-Density Compression
- [ ] Achieve file sizes of ~500KB for typical 10-20 page medical reports.
- [ ] Implement JBIG2 encoding for monochrome text layers.
- [ ] Implement image downsampling (limit to 150-200 DPI).
- [ ] Provide "Clean and Sharp" output specifically optimized for scanned document legibility.

### 1.2 User Control
- [ ] Add "Compression Level" selection in the UI (Low, Medium, High).
- [ ] High level must prioritize size (~500KB target).
- [ ] Medium level must prioritize balance (keep some color if present).
- [ ] Low level must be lossless/high-fidelity.

### 1.3 Asynchronous Execution
- [ ] All compression tasks >2MB must run in the background via Celery.
- [ ] UI must show progress status (e.g., "Optimizing...", "Done").
- [ ] Support for files up to 100MB (limit defined in `main.py`).

## 2. Technical Requirements

### 2.1 Backend (FastAPI/Celery)
- [ ] Integration of `ocrmypdf` and `ghostscript` into the `compression.py` service.
- [ ] Implementation of status polling endpoints for background tasks.
- [x] Move HTML email templates from `email_service.py` to external Jinja2 templates.

### 2.2 Security
- [x] Rotate `SECRET_KEY` and ensure it's loaded from environment variables only.
- [x] Fix hardcoded paths in `ocr.py` to be environment-agnostic (Docker-friendly).

## 3. Success Criteria (UAT)
- [ ] **Sharpness**: Text remains legible at 200% zoom after "High" compression.
- [ ] **Size**: A 10MB scanned PDF is reduced to <1MB.
- [ ] **Reliability**: A 50MB PDF does not hang the FastAPI server.
- [ ] **Searchability**: Compressed PDFs retain their searchable text layer (OCR).

---
*Last updated: 2026-05-11*
