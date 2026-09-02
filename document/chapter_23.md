# Chapter 23: Institutional Ethics Committee (IEC/IRB) & GCP Clinical Trials

## 23.1 Institutional Ethics Committee (IEC / IRB) Governance Framework

The Institutional Ethics Committee (IEC / IRB) Governance module manages clinical trial ethics reviews, research protocol approvals, informed consent vaults, and investigator compliance in strict adherence to regulatory standards:
- **CDSCO (Central Drugs Standard Control Organisation, India)**
- **New Drugs and Clinical Trials Rules 2019 (NDCTR)**
- **ICMR National Ethical Guidelines for Biomedical & Health Research**
- **Good Clinical Practice (ICH-GCP Guidelines)**
- **US-FDA Institutional Review Board (IRB) 21 CFR Part 56**

```mermaid
graph TD
    A[Principal Investigator (PI) Protocol Submission] --> B[IEC Member Secretary Initial Screening]
    B --> C{Review Classification}
    C -->|High Risk / Intervention| D[Full Board Review Meeting]
    C -->|Minimal Risk / Non-Invasive| E[Expedited Review Pathway]
    C -->|Anonymized Data / Archival| F[Exemption from Review]
    D --> G{Board Decision & Quorum Check}
    E --> G
    F --> G
    G -->|Approved| H[Formal Approval Letter & e-ICF Vault Activation]
    G -->|Revisions Needed| I[PI Amendment Re-submission]
    G -->|Rejected| J[Formal Rejection Notice]
    H --> K[Ongoing SAE Monitoring & Annual Audit]
```

### 23.1.1 Ethics Committee Constitution & Quorum Compliance
- **Multidisciplinary Board Roster:** Manages mandatory IEC membership roles as per ICMR guidelines:
  1. Chairperson (Outside/Independent Medical Expert).
  2. Member Secretary (Internal Senior Clinician).
  3. Basic Medical Scientists (Pharmacologist, Toxicologist).
  4. Clinical Experts (Specialist Physicians / Surgeons).
  5. Legal Expert / Advocate.
  6. Social Scientist / Representative of Non-Governmental Voluntary Agency.
  7. Lay Person (Literate non-medical community member).
- **Automated Quorum Verification Engine:** Validates that every decision-making meeting meets statutory minimum quorum (at least 5 members present, including at least one layperson, one legal expert, one outside member, and one basic scientist).

### 23.1.2 Protocol Proposal Submission & Review Workflows
- **PI Electronic Submission Portal:** Allows Principal Investigators to submit complete study dossiers including Clinical Trial Protocols, Patient Information Sheets (PIS), Informed Consent Forms (ICF in regional languages), Investigator Brochures, Case Report Forms (CRF), and insurance policy certificates.
- **Three-Tier Review Pathways:**
  - **Full Board Review:** Scheduled monthly meeting review for new intervention trials, drug trials, and stem cell research.
  - **Expedited Review:** 7-day fast-track review for minor protocol modifications, non-invasive specimen studies, or minimal risk observational research.
  - **Exemption from Review:** Automated exemption certifier for educational audits, public health surveillance, or fully de-identified archival data analyses.

---

## 23.2 Clinical Trial Monitoring, Digital e-ICF & SAE Escalation

### 23.2.1 Audio-Visual Digital Informed Consent Vault (e-ICF)
- **Mandatory AV Recording Engine:** Adheres to CDSCO mandatory audio-visual consent recording rules for vulnerable populations and new drug trials.
- **Timestamped Biometric Signatures:** Captures digital timestamped signatures of the Subject / Legally Acceptable Representative (LAR), Investigator, and Impartial Witness, locked in an immutable encrypted storage vault.

### 23.2.2 Serious Adverse Event (SAE) 24-Hour Expedited Escalation
- **24-Hour SAE Alert Engine:** When a trial subject experiences a Serious Adverse Event (*Death, Life-threatening event, Inpatient Hospitalization, Congenital Anomaly*), the system triggers an immediate 24-hour expedited notification payload sent to:
  - IEC Chairman & Member Secretary.
  - Trial Sponsor & Clinical Research Organization (CRO).
  - CDSCO Licensing Authority.
- **Compensation & Medical Management Tracking:** Tracks medical management logs, expert committee injury evaluations, and statutory financial compensation payments to subjects for trial-related injuries.

### 23.2.3 Trial Continuation, Amendments & Closure Reports
- **Annual Progress Reports:** Tracks periodic study progress reports, subject enrollment targets vs. actuals, and site monitoring audit logs.
- **Protocol Amendment Management:** Enforces re-review workflows for protocol amendments prior to field implementation.
- **Study Closure & Archival Certification:** Manages final trial termination reports, clinical study report (CSR) archiving, and 15-year trial documentation preservation locks.
