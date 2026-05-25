# Phase 1: Foundation & Security - Validation Strategy

## 1. Automated Tests

### 1.1 Security Configuration
- [ ] **Test Case**: Verify application fails to start in `ENVIRONMENT=production` if `SECRET_KEY` is missing.
- [ ] **Test Case**: Verify `SECRET_KEY` is loaded correctly from `.env`.
- [ ] **Test Case**: Verify `SecretStr` is used (keys are not present in `__repr__` or logs).

### 1.2 Email Templating
- [ ] **Test Case**: Verify `jinja2` can render a sample email template with dynamic data.
- [ ] **Test Case**: Verify `EmailService` correctly loads templates from the `templates/email/` directory.

### 1.3 Binary Path Resolution
- [ ] **Test Case**: Verify `TESSERACT_CMD` can be overridden by an environment variable.
- [ ] **Test Case**: Verify `shutil.which` correctly identifies binaries in the system PATH.

## 2. Manual Verification

### 2.1 Live System Audit
- [ ] **Action**: Check live server environment variables for `SECRET_KEY`.
- [ ] **Action**: Verify that rotating the key logs out a test user as expected.

### 2.2 Functional Check
- [ ] **Action**: Trigger a "Login Alert" email and verify the formatting is consistent with the old hardcoded version.
- [ ] **Action**: Run a test OCR scan and verify that `tesseract.exe` is called correctly from the new config path.

## 3. Success Criteria
- [ ] No hardcoded HTML in `email_service.py`.
- [ ] No hardcoded binary paths in `ocr.py`.
- [ ] Production-safe `SECRET_KEY` enforcement.

---
*Validation Strategy: 2026-05-11*
