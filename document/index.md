<div style="text-align: center; margin-top: 50px; margin-bottom: 120px;">
    <img src="logo.png" alt="Digifort Labs Logo" style="max-width: 380px; height: auto; margin-bottom: 20px;">
    <h2 style="font-size: 1.8em; color: #2563eb; margin-top: 5px;">Enterprise Hospital Management System (HMS)</h2>
    <br>
    <h2 style="font-size: 2.2em; color: #0f172a;">26-Chapter Functional Requirement Specification</h2>
    <p style="font-size: 1.1em; color: #64748b;">Enterprise Healthcare SaaS & On-Premise Architecture Manual</p>
    <br><br>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; max-width: 650px; margin: 0 auto; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.03);">
        <p style="font-size: 1.1em; margin: 5px 0;"><strong>Company:</strong> Digifort Labs Private Limited</p>
        <p style="font-size: 1.05em; margin: 5px 0;"><strong>Official Website:</strong> <a href="https://digifortlabs.com" target="_blank" style="color: #2563eb;">https://digifortlabs.com</a></p>
        <p style="font-size: 1.05em; margin: 5px 0;"><strong>Email Contact:</strong> <a href="mailto:info@digifortlabs.com" style="color: #2563eb;">info@digifortlabs.com</a></p>
        <p style="font-size: 1.05em; margin: 5px 0;"><strong>Direct WhatsApp / Phone:</strong> +91 81416 69879 (Rahul) | +91 97257 90563 (Keval)</p>
        <p style="font-size: 1.05em; margin: 5px 0;"><strong>Headquarters:</strong> Vapi, District Valsad, Gujarat, India</p>
    </div>
</div>

<div class="page-break"></div>

# Table of Contents

### PART I: Enterprise Platform Architecture & Core Governance
1. **<a href="#chapter-1">Chapter 1: Platform Architecture, Multi-Tenancy SaaS & Super Admin Governance</a>** *(Multi-Tenancy, Subdomains, Security, Desktop Protocol Handler `digifort-wa://`, TWAIN Daemons & AWS S3 Backups)*

---

### PART II: Patient Access & Acute Clinical Operations
2. **<a href="#chapter-2">Chapter 2: Outpatient (OPD) Registration, Consultation & Smart QMS</a>** *(Smart QMS Kiosks, Kiosk Self-Registration API, 30-Sec E-Rx, CDSS)*
3. **<a href="#chapter-3">Chapter 3: Patient Digital Engagement, Telemedicine & WhatsApp AI Portal</a>** *(WhatsApp AI Bot, WebRTC Telemed, Mobile PHR & ABHA)*
4. **<a href="#chapter-4">Chapter 4: Emergency Room (ER), ESI Triage & Ambulance Fleet Operations</a>** *(ESI 5-Level Triage Board, Trauma Flowsheet)*
5. **<a href="#chapter-5">Chapter 5: Inpatient (IPD), Ward Management, eMAR & ICU Telemetry</a>** *(Visual Bed Matrix, eMAR, ICU Vitals & MRD Handover)*
6. **<a href="#chapter-6">Chapter 6: Surgery, Operation Theatre (OT) & High-Value RFID Asset Tracking</a>** *(OT Scheduling, PAC, RFID Implant Tracking)*
7. **<a href="#chapter-7">Chapter 7: OT Sanitation, AHU/HEPA Telemetry & CSSD Sterilization</a>** *(AHU HEPA Telemetry, UV-C Sterilization, CSSD Autoclave)*

---

### PART III: Specialized Clinical Registries & Regulatory Compliance
8. **<a href="#chapter-8">Chapter 8: Maternity, Obstetrics & NICU Operations</a>** *(ANC Tracker, WHO Partograph, APGAR)*
9. **<a href="#chapter-9">Chapter 9: Gestational Surrogacy, IVF & ART Bio-Vault Operations</a>** *(Surrogacy Act 2021, Cryo LN2 Bio-Vault)*
10. **<a href="#chapter-10">Chapter 10: PCPNDT Act Compliance & Fetal Diagnostic Register</a>** *(PCPNDT Form F Auto-Filing & Sex Selection Lock)*
11. **<a href="#chapter-11">Chapter 11: MTP Act Compliance & CARA Child Adoption Registry</a>** *(MTP Act 2021 Form C, CARA Adoption Register)*
12. **<a href="#chapter-12">Chapter 12: Organ Donation, Transplant Registry & Cold Ischemia Telemetry</a>** *(THOA Brain Death Protocols, NOTTO/SOTTO Telemetry)*
13. **<a href="#chapter-13">Chapter 13: Mortality Management, Mortuary & Medico-Legal Cases (MLC)</a>** *(MCCD Form 4/4A, Forensic MLC Chain-of-Custody)*

---

### PART IV: Clinical Diagnostics & Bio-Vaults
14. **<a href="#chapter-14">Chapter 14: Laboratory Information System (LIS) & PathLab IQC Rules</a>** *(ASTM/HL7 Interfacing, Westgard QC Rules)*
15. **<a href="#chapter-15">Chapter 15: Diagnostic Imaging RIS/PACS, DICOM 3.0 & Voice Dictation</a>** *(DICOM 3.0 MWL, Web PACS, Marking Reports)*
16. **<a href="#chapter-16">Chapter 16: Comprehensive Blood Bank & Stem Cell Bio-Repository</a>** *(ISBT 128 DIN, 5-TTI Lock, Cord Blood Vault)*

---

### PART V: Pharmacy, Supply Chain & CMMS Facilities
17. **<a href="#chapter-17">Chapter 17: Pharmacy POS, FEFO Multi-Store & Supply Chain Management</a>** *(Multi-Store FEFO Inventory, POS Billing & GRN)*
18. **<a href="#chapter-18">Chapter 18: B2B Vendor Portal & Universal Master Inventory Catalog</a>** *(8-Tier UNSPSC Catalog, B2B Quotations)*
19. **<a href="#chapter-19">Chapter 19: Biomedical Engineering CMMS & Equipment Maintenance</a>** *(7 Asset Categories, Preventive Maintenance SLA)*

---

### PART VI: Enterprise Finance, MRD Warehouse, Research, HR & Specialty EHR Governance
20. **<a href="#chapter-20">Chapter 20: Financial Accounting, Patient Billing & AI Claim Denial Engine</a>** *(GIPSA Tariff Posting, AI Denial Predictor, Doctor Referral Commission Matrix & E-Wallet Ledger)*
21. **<a href="#chapter-21">Chapter 21: Universal Clinical Terminology & Coding Systems (ICD-10/11, CPT)</a>** *(Universal Diagnostic & Procedural Terminology Server)*
22. **<a href="#chapter-22">Chapter 22: Medical Records Department (MRD) & Physical Warehouse Store</a>** *(5-Tier Warehouse Indexing & Physical Rack Store Layout)*
23. **<a href="#chapter-23">Chapter 23: Institutional Ethics Committee (IEC/IRB) & GCP Clinical Trials</a>** *(CDSCO Compliance, e-ICF Vault, 24-Hr SAE Escalation)*
24. **<a href="#chapter-24">Chapter 24: Business Intelligence Analytics & Master Configurations</a>** *(Executive Dashboards, 32-Role Matrix, Statutory Public Health Reports)*
25. **<a href="#chapter-25">Chapter 25: Human Resources, Staff Management, 24/7 Rostering & Doctor FFS Payroll</a>** *(Digital HR Onboarding, Licensing Alerts, Biometric Rostering, Doctor FFS Payout & Referral Reconciliation)*
26. **<a href="#chapter-26">Chapter 26: Dental EHR, 3D STL Imaging, Periodontics & ENT Audiometry Operations</a>** *(Tooth Charting, Periodontogram, 3D STL Scans, Dental Lab Orders & ENT Audiometry)*

---

### APPENDIX A: Regulatory Compliance & ROI Benchmark Matrix

| Regulatory Standard | Chapter Reference | Key Compliance Capability Enforced |
| :--- | :--- | :--- |
| **NABH 5th Edition (AAC/MOM/COP)** | Ch 2, Ch 4, Ch 7 | Smart QMS E-Rx, Medication Error Locks, AHU/HEPA positive pressure (≥ 15 Pa). |
| **ABDM / ABHA (M1 / M2 / M3)** | Ch 3, Ch 1 | National Health ID QR Sync, Consent-driven cross-hospital EMR exchange via ABDM Gateway. |
| **DPDP Act 2023** | Ch 1, Ch 3 | Explicit digital consent vault, patient data right-to-erasure logs, AES-256 bit encryption. |
| **CPCB Bio-Medical Waste 2016** | Ch 7 | 4-Color segregation (Yellow, Red, White, Blue), Bluetooth scale weight logging & CBWTF manifests. |
| **PCPNDT Act 1994** | Ch 10 | Mandatory Form F auto-filing engine, monthly CMO portal exports, sex selection prohibition locks. |
| **MTP Act 2021 & CARA** | Ch 11 | RMP 2-Doctor opinion approvals, Form C register, CARA adoption & abandoned newborn register. |
| **THOA Organ Transplant 1994** | Ch 12 | 4-Doctor Brain Death certification board, NOTTO/SOTTO telemetry, cold ischemia timers. |
| **GIPSA / TPA Claim Denial AI** | Ch 20 | Pre-submission GIPSA tariff package validator, 35% reduction in TPA insurance claim rejections. |
| **Paperless ROI Metric** | Ch 2, Ch 24 | Saves ₹15-₹25 per patient visit in printing, physical chart storage, and paper prescription costs. |

---

### APPENDIX B: Hardware Integration, Local Protocol Handlers & Backup Matrix

| Integration Domain | Technology Layer | Router / Module Reference | Implementation Functionality Enforced |
| :--- | :--- | :--- | :--- |
| **Desktop WA Sender** | Custom Protocol `digifort-wa://` | `whatsapp.py` / `local_wa_sender/` | Local desktop Selenium automation daemon for zero-cost WhatsApp Web OPD receipts. |
| **Hardware TWAIN Scanning** | Background Windows Service | `scanner.py` / `local_scanner/` | Direct USB TWAIN scanner and WebCam capture feed into EMR patient charts. |
| **On-Premise Server Manager** | Tkinter Desktop GUI Application | `server_manager/` | GUI tool for hospital IT admins to monitor DB status, restart FastAPI, and trigger backups. |
| **Cloud Disaster Recovery** | Dual-Tier AWS S3 Sync | `s3_backup.py` / `backup_all.bat` | Scheduled encrypted PostgreSQL `.dump` and `local_storage/` attachment upload to AWS S3. |
| **Self-Registration Kiosks** | Scoped Rate-Limited API | `self_registration.py` | Touchscreen lobby registration parsing Aadhaar/ABHA QR codes with instant token issuance. |
| **Doctor Referral Network** | Ledger Commission Engine | `referrals.py` | Configurable percentage/fixed referral splits per service type with monthly payout statements. |
| **Patient E-Wallet Ledger** | Prepaid Balance Manager | `patient_ledger.py` | Advance deposit collection, family wallet top-ups, and audited refund workflows. |
