# Phase 1: Foundation & Security - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary
This phase hardens the system's security, refactors technical debt in the email service, and makes the OCR engine environment-agnostic. It serves as the stable foundation for the upcoming advanced PDF optimization features.

</domain>

<decisions>
## Implementation Decisions

### Security Hardening
- **Secret Key Enforcement**: The `SECRET_KEY` and `CSRF_SECRET_KEY` must be loaded from environment variables. 
- **Production Guardrails**: In `ENVIRONMENT=production`, the application must fail to start if these keys are missing or use the insecure defaults.
- **Live User Protection**: Since the system is live, any rotation of keys that would logout users must be carefully audited. The code will be updated first to support environment overrides without forcing a change if a custom key is already present.

### Email Architecture (Jinja2)
- **Template Separation**: All inlined HTML templates in `email_service.py` will be moved to a new directory: `backend/app/templates/email/`.
- **Engine**: Use **Jinja2** for template rendering.
- **Service Refactor**: `EmailService` will be refactored to use these templates, removing ~1000+ lines of redundant HTML strings from the Python logic.

### Binary Path Configuration
- **Centralized Config**: Hardcoded paths for `tesseract.exe` and `poppler` will be moved from `ocr.py` to `backend/app/core/config.py`.
- **Flexibility**: The system will retain "auto-discovery" for common Windows paths but **must** allow overrides via environment variables (`TESSERACT_CMD`, `POPPLER_PATH`) to support Docker/Linux environments.

### the agent's Discretion
- Selection of the specific Jinja2 integration pattern (e.g., a helper function to load and render).
- The exact structure of the email template base layout.

</decisions>

<canonical_refs>
## Canonical References

### Backend Core
- `backend/app/core/config.py` — Central settings and security configuration.
- `backend/app/main.py` — Security middleware and startup logic.

### Services
- `backend/app/services/email_service.py` — Target for template refactoring.
- `backend/app/services/ocr.py` — Target for path configuration refactoring.

</canonical_refs>

---

*Phase: 01-foundation-security*
*Context gathered: 2026-05-11*
