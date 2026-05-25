# Technical Concerns

**Analysis Date:** 2026-05-11

## Security Risks

- **SECRET_KEY Usage**: The application logs a critical warning if running in production with the default secret key. If this is not rotated, JWT tokens can be forged.
- **CSRF Bypass**: While CSRF protection is implemented, it relies on manual exclusion lists in `main.py`. Any new state-changing endpoints must be carefully added or verified.
- **Database Exposure**: SQLite database (`digifortlabs.db`) is stored in the root directory. If not properly protected in production, it could be downloaded if the web server is misconfigured.

## Technical Debt

- **Monolithic Service Files**: `email_service.py` is extremely large (~72KB, 1400+ lines) and contains many inlined HTML templates. This makes it difficult to maintain and test.
- **Inlined Templates**: HTML templates for emails are hardcoded in Python strings. These should be moved to a template engine like Jinja2 or separate HTML files.
- **Hardcoded Paths**: `ocr.py` contains hardcoded Windows file paths for Tesseract and Poppler. This reduces portability across different environments (Linux/Docker).

## Infrastructure Fragility

- **Binary Dependencies**: OCR functionality depends on Tesseract and Poppler being installed at specific paths. If these are missing or moved, document processing will fail.
- **Runtime PATH Modification**: `ocr.py` modifies `os.environ["PATH"]` at runtime to include Poppler. This is a fragile pattern that can lead to unexpected behavior in multi-threaded environments.
- **Single DB Model File**: `backend/app/models.py` is a monolith containing 50KB+ of SQLAlchemy models. As the schema grows, this will become unmanageable.

## Testing Gaps

- **Minimal Coverage**: Only one test file exists (`test_ocr_classification.py`). Core business logic, API endpoints, and frontend components lack automated verification.
- **Manual Verification**: High reliance on manual testing for critical paths like patient registration and record archival.

## Performance Bottlenecks

- **OCR Processing**: Large PDFs are processed page-by-page. While this saves memory, it can be slow for high-volume hospitals.
- **Large Model File**: Loading a 50KB+ models file on every request/startup might have a small but measurable impact on performance.

---

*Concerns analysis: 2026-05-11*
*Update when fixing debt or discovering new critical issues*
