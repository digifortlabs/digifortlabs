# Phase 1: Foundation & Security - Research

**Analysis Date:** 2026-05-11

## 1. Email Refactoring (Jinja2)

### The Challenge
The current `EmailService` has inlined HTML strings, making it hard to maintain. We need to render templates without a `Request` object (common in background tasks).

### Technical Solution
- **Library**: `jinja2`
- **Pattern**: Use a standalone `jinja2.Environment` with a `FileSystemLoader`.
- **Implementation**:
    ```python
    from jinja2 import Environment, FileSystemLoader, select_autoescape

    env = Environment(
        loader=FileSystemLoader("app/templates/email"),
        autoescape=select_autoescape(["html", "xml"])
    )

    def render_template(template_name: str, **context):
        template = env.get_template(template_name)
        return template.render(**context)
    ```

## 2. Security Hardening (Pydantic Settings)

### The Challenge
`SECRET_KEY` currently has an insecure default. We need to enforce environment variables in production and fail fast on startup.

### Technical Solution
- **Library**: `pydantic-settings` (v2.x)
- **Validation**: Use `Field(..., min_length=32)` to enforce strong keys.
- **Environment Separation**:
    - Use `ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")`.
    - If `ENVIRONMENT == "production"` and `SECRET_KEY` is the default, raise a `ValidationError`.
- **Secret Handling**: Use `SecretStr` for `SECRET_KEY` and `CSRF_SECRET_KEY` to prevent accidental logging.

## 3. Binary Path Handling (Cross-Platform)

### The Challenge
Hardcoded Windows paths in `ocr.py` break on Docker/Linux.

### Technical Solution
- **Pattern**: Priority-based resolution in `config.py`.
    1. Environment variable (`TESSERACT_CMD` / `POPPLER_PATH`).
    2. `shutil.which()` for system PATH.
    3. Standard installation paths (Windows fallbacks).
- **Config**:
    ```python
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", shutil.which("tesseract") or r"C:\Program Files\Tesseract-OCR\tesseract.exe")
    ```

## 4. Migration Strategy (Live System)

- **Audit**: Before enforcing `SECRET_KEY` in production, the code will check if an existing environment variable is present.
- **Safe Transition**: We will provide a `.env.example` with clear instructions on which variables are mandatory for the live environment.

---
*Research: 2026-05-11*
