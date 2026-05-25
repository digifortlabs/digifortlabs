---
phase: 1
plan: 3
name: Email Refactor (Jinja2)
slug: email-refactor
wave: 1
autonomous: true
requirements: [2.1]
files_modified: [backend/app/services/email_service.py]
files_created: [backend/app/templates/email/base.html, backend/app/templates/email/login_alert.html, backend/app/templates/email/otp.html]
---

# Plan: Email Refactor (Jinja2)

Move hardcoded HTML templates to external Jinja2 files to reduce technical debt and improve maintainability.

## Proposed Changes

### Templates

#### [NEW] [base.html](file:///d:/Website/DIGIFORTLABS/backend/app/templates/email/base.html)
- Define a standard layout with logo, footer, and a `{% block content %}` area.

#### [NEW] [login_alert.html](file:///d:/Website/DIGIFORTLABS/backend/app/templates/email/login_alert.html)
- Move the login alert HTML from `email_service.py` to this file.

#### [NEW] [otp.html](file:///d:/Website/DIGIFORTLABS/backend/app/templates/email/otp.html)
- Move the OTP HTML from `email_service.py` to this file.

### Services

#### [MODIFY] [email_service.py](file:///d:/Website/DIGIFORTLABS/backend/app/services/email_service.py)
- Integrate `jinja2.Environment`.
- Refactor `send_login_alert` and other methods to use `template.render()`.
- Remove hundreds of lines of inlined HTML.

## Tasks

```xml
<task id="1.3.1">
    <action>Setup Jinja2 environment in email_service.py.</action>
    <read_first>backend/app/services/email_service.py</read_first>
    <acceptance_criteria>
        - email_service.py imports jinja2
        - Environment initialized with FileSystemLoader
    </acceptance_criteria>
</task>

<task id="1.3.2">
    <action>Create base and feature templates in backend/app/templates/email/.</action>
    <read_first>backend/app/services/email_service.py</read_first>
    <acceptance_criteria>
        - templates/email/ directory created
        - base.html and login_alert.html exist
    </acceptance_criteria>
</task>

<task id="1.3.3">
    <action>Refactor EmailService methods to use templates.</action>
    <read_first>backend/app/services/email_service.py</read_first>
    <acceptance_criteria>
        - send_login_alert uses env.get_template
        - Inlined HTML string removed
    </acceptance_criteria>
</task>
```

## Verification Plan

### Automated Tests
- Create a temporary script in `scratch/` to render all templates and verify they produce valid HTML.

---
*Phase: 01-foundation-security*
*Plan: 03-email-refactor*
