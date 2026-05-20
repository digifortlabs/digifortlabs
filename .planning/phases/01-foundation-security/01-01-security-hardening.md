---
phase: 1
plan: 1
name: Security Hardening
slug: security-hardening
wave: 1
autonomous: true
requirements: [1.3, 2.2]
files_modified: [backend/app/core/config.py, backend/app/main.py, .env.example]
---

# Plan: Security Hardening

Enforce environment-based secrets and production guardrails to prevent insecure configurations on the live system.

## User Review Required

> [!IMPORTANT]
> This plan changes how `SECRET_KEY` is validated. In production, the app will fail to start if the key is missing or is the default insecure value.

## Proposed Changes

### Backend Core

#### [MODIFY] [config.py](file:///d:/Website/DIGIFORTLABS/backend/app/core/config.py)
- Import `SecretStr` from pydantic.
- Update `SECRET_KEY` and `CSRF_SECRET_KEY` to use `SecretStr`.
- Remove default values for these keys in production (raise error).
- Add `TESSERACT_CMD` and `POPPLER_PATH` to settings (pre-work for Plan 2).

#### [MODIFY] [main.py](file:///d:/Website/DIGIFORTLABS/backend/app/main.py)
- Update the critical security warning logic to be more robust.
- Ensure startup events validate the presence of a strong key.

#### [NEW] [.env.example](file:///d:/Website/DIGIFORTLABS/.env.example)
- Create a template with all required environment variables for a secure deployment.

## Tasks

```xml
<task id="1.1.1">
    <action>Update Settings class in config.py to use SecretStr and enforce env variables for SECRET_KEY/CSRF_SECRET_KEY.</action>
    <read_first>backend/app/core/config.py</read_first>
    <acceptance_criteria>
        - config.py contains `from pydantic import SecretStr`
        - SECRET_KEY uses SecretStr
        - Production environment raises error if keys are insecure
    </acceptance_criteria>
</task>

<task id="1.1.2">
    <action>Create .env.example with placeholders for all essential secrets.</action>
    <read_first>.env</read_first>
    <acceptance_criteria>
        - .env.example exists in root
        - Contains SECRET_KEY=, CSRF_SECRET_KEY=, etc.
    </acceptance_criteria>
</task>
```

## Verification Plan

### Automated Tests
- Run `pytest` (if existing tests pass)
- Manual check: Run `ENVIRONMENT=production python -m app.main` and verify it fails if `SECRET_KEY` is the default.

---
*Phase: 01-foundation-security*
*Plan: 01-security-hardening*
