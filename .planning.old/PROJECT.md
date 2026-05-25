# Project: Digifort Labs - Advanced PDF Optimization

## What This Is
A project to enhance the core medical record processing engine, focusing on achieving high-density PDF compression that maintains "clean and sharp" text quality for digitized medical records, while ensuring system scalability and security.

## Core Value
To provide hospitals with a storage-efficient archival system where records are minimized to ~500KB without sacrificing the legibility and "sharpness" required for medical compliance and future clinical review.

## Context
- **Existing Stack**: FastAPI (Python), Next.js 16, SQLAlchemy, Redis/Celery.
- **Current State**: Basic image-based JPEG compression (quality 60) which can be blurry and is skipped for files >20MB due to server load concerns.
- **Target**: Achieve the quality and compression ratio seen in provided samples (e.g., ~500KB for full reports) while keeping text sharp.

## Requirements

### Validated
- ✓ Basic PDF archival and retrieval system - existing
- ✓ Basic OCR and AI data extraction - existing
- ✓ Basic AWS S3 integration - existing

### Active
- [x] **Advanced Compression Engine**: Implement high-quality grayscale/JBIG2-style compression to achieve "clean and sharp" results.
- [x] **Background Processing**: Move heavy compression tasks to Celery/Redis to support large files without blocking the API.
- [x] **Security Hardening**: Rotate `SECRET_KEY` and audit CSRF/MFA flows identified during codebase mapping.
- [x] **Service Refactoring**: De-monolithize `email_service.py` and move templates to external files.

### Out of Scope
- Mobile App development - prioritized web dashboard first.
- Real-time video consultation - focus is on archival and data extraction.

## Key Decisions
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Background Tasks | Heavy compression hangs the main thread; Celery provides scalability. | — Pending |
| Sharp Compression | JPEG 60 is too blurry for medical text; need better format (Grayscale/PNG/JBIG2). | — Pending |
| YOLO Mode | User approved autonomous execution with automated verification. | — Pending |
| PEM Key Safety | Root .pem files are intentional for production; do not remove. | — Verified |

## Evolution
This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-05-11 after initialization*
