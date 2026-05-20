---
phase: 1
plan: 2
name: Environment-Agnostic Paths
slug: binary-paths
wave: 1
autonomous: true
requirements: [2.2]
files_modified: [backend/app/core/config.py, backend/app/services/ocr.py, backend/app/services/compression.py]
---

# Plan: Environment-Agnostic Paths

Centralize Tesseract and Poppler path discovery in the configuration layer to support cross-platform deployments.

## Proposed Changes

### Backend Configuration

#### [MODIFY] [config.py](file:///d:/Website/DIGIFORTLABS/backend/app/core/config.py)
- Implement dynamic path discovery for `TESSERACT_CMD` and `POPPLER_PATH`.
- Use `shutil.which` as the primary lookup.
- Allow environment variable overrides.

### Services

#### [MODIFY] [ocr.py](file:///d:/Website/DIGIFORTLABS/backend/app/services/ocr.py)
- Replace hardcoded path lists with `settings.TESSERACT_CMD` and `settings.POPPLER_PATH`.
- Remove manual `os.environ["PATH"]` modifications where possible, or centralize them.

#### [MODIFY] [compression.py](file:///d:/Website/DIGIFORTLABS/backend/app/services/compression.py)
- Update any path references to use `settings`.

## Tasks

```xml
<task id="1.2.1">
    <action>Centralize Tesseract/Poppler path logic in Settings class (config.py).</action>
    <read_first>backend/app/core/config.py</read_first>
    <acceptance_criteria>
        - config.py defines TESSERACT_CMD and POPPLER_PATH
        - Both support os.getenv overrides
    </acceptance_criteria>
</task>

<task id="1.2.2">
    <action>Update ocr.py to use settings for binary paths.</action>
    <read_first>backend/app/services/ocr.py</read_first>
    <acceptance_criteria>
        - ocr.py no longer contains hardcoded "C:\Program Files" paths
        - ocr.py uses settings.TESSERACT_CMD
    </acceptance_criteria>
</task>
```

## Verification Plan

### Automated Tests
- `pytest backend/app/tests/test_ocr_classification.py` should still pass.
- Manual check: Verify `ocr.py` still finds Tesseract on the current Windows machine.

---
*Phase: 01-foundation-security*
*Plan: 02-binary-paths*
