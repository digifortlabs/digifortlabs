# Chapter 1: Executive Summary & Patient Management

## 1.1 Executive Summary

The **DigifortLabs Hospital Management System (HMS)** represents a paradigm shift in how modern healthcare institutions manage their clinical, administrative, and financial workflows. Built on a robust, highly scalable, and secure **Multi-Tenant SaaS architecture** (Next.js, React, and TypeScript), this platform acts as a unified backbone for independent hospitals and hospital groups. It is designed with **Shared Database Multi-Tenancy** (logical data isolation via `hospital_id`), ensuring absolute data privacy and robust security for each hospital client, while keeping infrastructure lean and easily manageable for the service provider.

This functional specification document serves as the architectural and operational blueprint for the system. It provides stakeholders, medical directors, and technical implementers with a granular understanding of every module, patient journey, and data structure within the platform.

### Core Objectives

- **Multi-Hospital Scalability (SaaS):** Support multiple independent hospitals on a centralized shared infrastructure, securely isolating their data at the logical level to guarantee HIPAA/GDPR compliance.
- **Group-Level Patient Identity (UHID):** For hospital chains (e.g., ABC Vapi, ABC Valsad), implement a Group-Level Unique Health Identifier (UHID). This allows branches within the same group to share patient medical records securely, while remaining completely isolated from competitors.
- **Service Provider Control (Superadmin):** Provide the service provider (Digifort Labs) with top-down visibility and control to onboard new hospitals, manage billing/subscriptions, and control access.
- **Clinical Unification:** Centralize Electronic Medical Records (EMR) to ensure continuity of care across all hospital departments and interconnected branches.
- **Operational Efficiency:** Automate complex workflows such as bed allocation, discharge summaries, and TPA billing calculations.
- **Financial Transparency:** Enforce real-time accounting directly tied to pharmacy dispensing, laboratory orders, and clinical services.
- **Security & Compliance:** Implement strict Role-Based Access Control (RBAC) and HIPAA/GDPR-aligned data protection protocols with absolute tenant-level data segregation.

---


## 1.2 Patient Registration & OPD

When a patient first arrives at the hospital, the initial step is capturing their demographic data at the registration desk or reception. In our SaaS model, every registration is explicitly tied to the current **Local Hospital Branch (Tenant)** by a `hospital_id`, ensuring data is securely separated and only visible to authorized hospital staff.

- **Group-Level UHID & Local ID:** For hospital chains (e.g., ABC Hospital Group), a patient is assigned a Group-Level Unique Health Identifier (UHID). If the patient visits multiple branches of the same chain, the receptionist can import their Group Profile, ensuring a unified medical history. Independent hospitals simply use standard localized patient IDs.
- **Tenant/Branch Selection:** Registration desks and online portals automatically route data to the local hospital's logical partition within the shared database. Each patient is assigned a localized Patient ID specific to that branch's records.
- **Doctor Selection & OPD Routing:** Based on their disease or symptoms, the patient selects their respective specialized doctor from the branch's local roster.
- **Emergency & Trauma Routing:** Standard OPD registration is bypassed for critical cases. Patients are immediately directed to the Emergency Department, with emergency charges processed locally.
- **Consultation Queue & Waiting Area:** The patient is added to the local doctor's digital OPD queue.
- **Centralized Telemedicine Queues (Optional):** For hospital groups, a central pool of doctors can handle virtual OPDs for multiple branches simultaneously, accessing local records via the Global UHID.
- **Inter-Branch Referrals:** Doctors at Branch A can digitally refer patients to a specialized OPD at Branch B (within the same hospital group). The patient's EMR securely accompanies the referral.
- **OPD Consultation (Doctor's Cabin):** The doctor examines the patient and uses the system to prescribe medications, laboratory tests, or radiology investigations.
- **Minor Procedures & Additional Billing:** Minor procedures (e.g., wound dressing) are recorded as extra OPD fees payable at the local billing counter.
- **Diagnostic Billing & Payment:** Tests prescribed on an OPD basis must be paid for at the branch's Billing Counter before the procedure.
- **Diagnostics & Sample Collection:** After payment verification, laboratory samples or radiology imaging is completed at the local branch.
- **Results & Report Waiting:** The patient waits in the designated area until reports are finalized.
- **Post-Diagnostic OPD Consultation:** The patient returns to the doctor's cabin to review results and receive further prescriptions or admission advice.
- **Physiotherapy Billing & Treatment:** If the doctor prescribes physiotherapy treatment, the patient must first pay the applicable charges at the billing counter.
- **Inpatient Admission (IPD):** If hospitalization is required, the doctor recommends admission to a specific ward or ICU within the local branch.
- **Pharmacy Purchase & Verification:** Prescribed medications are purchased at the branch's Pharmacy Store, followed by verification.
- **Discharge & Follow-up:** If admission is not needed, the patient goes home and returns for follow-up appointments as necessary.




## 1.3 Advanced OPD Features (Roadmap)

To optimize patient flow for medium-to-large hospitals (50-300 beds), the following advanced features are integrated into the OPD roadmap:

- **QR Code Self-Registration (Queue Buster):** Patients scan a QR code in the lobby to self-register their demographics, significantly reducing receptionist data-entry load.
- **WhatsApp Integration (Automated Comms):** Automated dispatch of OPD prescriptions, lab reports, and follow-up reminders directly to the patient's WhatsApp.
- **Smart TV Token Display:** Digital displays in waiting areas synced with the doctor's digital queue, visually and audibly announcing token numbers and cabin assignments.
