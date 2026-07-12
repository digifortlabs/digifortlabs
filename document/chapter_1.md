# Chapter 1: Executive Summary & Patient Management

## 1.1 Executive Summary

The **DigifortLabs Hospital Management System (HMS)** represents a paradigm shift in how modern healthcare institutions manage their clinical, administrative, and financial workflows. Built on a robust, highly scalable, and secure architecture (Next.js, React, and TypeScript), this platform eliminates data silos by unifying Patient Care, Medical Records, Pharmacy Logistics, Human Resources, and Financial Accounting into a single, cohesive ecosystem.

This functional specification document serves as the architectural and operational blueprint for the system. It provides stakeholders, medical directors, and technical implementers with a granular understanding of every module, patient journey, and data structure within the platform.

### Core Objectives

- **Clinical Unification:** Centralize Electronic Medical Records (EMR) to ensure continuity of care across all hospital departments.
- **Operational Efficiency:** Automate complex workflows such as bed allocation, discharge summaries, and TPA billing calculations.
- **Financial Transparency:** Enforce real-time accounting directly tied to pharmacy dispensing, laboratory orders, and clinical services.
- **Security & Compliance:** Implement strict Role-Based Access Control (RBAC) and HIPAA/GDPR-aligned data protection protocols.

---


## 1.2 Patient Registration & OPD

When a patient first arrives at the hospital, the initial step is capturing their demographic data at the registration desk or reception.


- **Doctor Selection & OPD Routing:** Based on their disease or symptoms, the patient selects their respective specialized doctor. Once registered under the selected doctor, the patient proceeds directly to that specific OPD.
- **Emergency & Trauma Routing:** If a patient arrives under trauma or in a critical condition, the standard OPD registration is bypassed, and they are immediately directed to the **Emergency Department**. The patient or their accompanying relatives must pay the necessary emergency charges at the respective billing counter.
- **Consultation Queue & Waiting Area:** For standard cases, the patient is immediately added to the selected doctor's digital OPD queue. The patient will then wait in the designated OPD waiting area until his/her turn arrives as per the digital waiting list.
- **OPD Consultation (Doctor's Cabin):** When their turn arrives, the patient enters the OPD. The particular doctor will examine the patient based on their complaints and seamlessly use the system to prescribe medications, laboratory tests, or radiology investigations.
- **Minor Procedures & Additional Billing:** If the doctor performs any minor procedures during the consultation (such as wound dressing), these are recorded in the system as extra OPD fees. The patient must pay these additional charges at the respective billing counter.
- **Diagnostic Billing & Payment:** If tests are prescribed on an OPD basis, the patient must first proceed to the Registration Desk, Reception, or Billing Counter. They are required to pay the specified amount for the doctor-suggested tests before they are cleared for the procedures.
- **Diagnostics & Sample Collection:** Once payment is verified, the patient is allowed to proceed to the respective department to provide laboratory samples (blood, urine, etc.) or undergo radiology imaging (X-Ray, CT, MRI, USG).
- **Results & Report Waiting:** After providing laboratory samples or completing radiology imaging, the patient will wait in the designated area until the diagnostic reports and test results are finalized and made available in the system.
- **Post-Diagnostic OPD Consultation:** Once the reports are generated, the patient returns to the respective doctor's OPD cabin. After reviewing the diagnostic results, the doctor will prescribe necessary medications, recommend rest, advise inpatient admission, or schedule the next OPD follow-up based on the patient's specific requirements.
- **Physiotherapy Billing & Treatment:** If the doctor prescribes physiotherapy treatment, the patient must first pay the applicable charges at the billing counter. Once payment is confirmed, the patient will be directed to the Physiotherapy Department to receive the required therapeutic sessions and treatment plans.
- **Inpatient Admission (IPD):** If the patient presents with major complaints requiring hospitalization, the doctor can directly admit the patient. The system allows the doctor to recommend admission to a specific ward or intensive care unit (ICU) based on the patient's choice and medical necessity.
- **Pharmacy Purchase & Verification:** If medications are prescribed, the patient proceeds to the Pharmacy Store to purchase them. Afterward, the patient returns to the OPD staff (nurse or doctor) to verify that the correct medicines have been dispensed.
- **Discharge & Follow-up:** If the patient does not require admission, they will go home after their consultation and medication verification. The patient will return for a follow-up appointment in the OPD as prescribed by the doctor or based on medical necessity.


