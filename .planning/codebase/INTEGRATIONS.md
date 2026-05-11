# External Integrations

**Analysis Date:** 2026-05-11

## Databases

**Primary Database:**
- **PostgreSQL** - Used in production (detected via `psycopg2-binary` and `.env.example`).
- **SQLite** - Used for local development and testing (`digifortlabs.db` found in root, `sqlalchemy.url` in `alembic.ini`).

**Cache / Message Broker:**
- **Redis** - Used as a broker for Celery tasks and likely for caching.

## Cloud Services

**AWS (Amazon Web Services):**
- **S3 (Simple Storage Service)** - Used for medical record storage and file management (detected in `s3_handler.py`).
- **SES (Simple Email Service) / SMTP** - Used for sending system emails (alerts, OTPs, invoices).

**Google Cloud Platform:**
- **Gemini API (Google Generative AI)** - Used for medical record data extraction and computer vision (detected in `ai_service.py` using `gemini-1.5-flash`).

## External APIs

**Medical / Healthcare:**
- **ICD-11 Service** - Likely integrates with WHO ICD-11 API for medical coding (detected `icd11_service.py`).

**Communication:**
- **SMTP** - General email integration for security alerts, welcome emails, and invoices.

## Security & Auth

**Authentication:**
- **JWT (JSON Web Tokens)** - Using `python-jose` for secure token-based authentication.
- **Passlib / Bcrypt** - Password hashing and verification.

**MFA (Multi-Factor Authentication):**
- **Email-based OTP** - One-Time Passwords sent via email for secondary verification.

## File Processing

**OCR / Computer Vision:**
- **Tesseract OCR** - Used for text extraction from scanned medical documents.
- **OpenCV** - Image processing for document alignment and cleaning.
- **Gemini Vision** - Multimodal AI extraction directly from document images.

---

*Integrations analysis: 2026-05-11*
*Update when adding new external services or changing providers*
