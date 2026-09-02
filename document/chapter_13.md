# Chapter 13: Mortality Management, Mortuary & Medico-Legal Cases (MLC)

## 13.1 Medical Certification of Cause of Death (MCCD Form 4 / Form 4A)

The Mortality Management module governs inpatient and brought-in-dead death clinical procedures, medical certification, mortuary cold storage, and statutory civil death registration.

### 13.1.1 Structured ICD-10 / ICD-11 Mortality Coding
- **Sequential Cause of Death Logging:** Captures cause of death in strict alignment with WHO MCCD standards:
  - **Part I Line (a):** Immediate Cause of Death (e.g., *Acute Myocardial Infarction*).
  - **Part I Line (b):** Antecedent Cause (e.g., *Coronary Artery Thrombosis*).
  - **Part I Line (c):** Underlying Cause (e.g., *Severe Atherosclerotic Heart Disease*).
  - **Part II:** Other significant conditions contributing to death (e.g., *Type-2 Diabetes Mellitus*).

### 13.1.2 Auto-Generation of Statutory Death Certificates
- **MCCD Form 4:** Official Medical Certificate of Cause of Death generated for institutional inpatient deaths.
- **MCCD Form 4A:** Medical Certificate of Cause of Death generated for non-institutional deaths or Brought-in-Dead (BID) cases evaluated in the Emergency Department.

---

## 13.2 Medico-Legal Cases (MLC) & Forensic Chain-of-Custody

### 13.2.1 Automated MLC Registration
- **Unnatural Death Triggers:** Auto-assigns an immutable Medico-Legal Case (MLC) registration number for deaths resulting from road traffic accidents, burns, poisonings, suicides, homicides, firearm injuries, occupational accidents, or unknown Brought-in-Dead cases.
- **Police Intimation Memos:** Dispatches automated Police Intimation Memos to local police station portals and prints official Post-Mortem requisition letters.
- **Forensic Evidence Tracking:** Logs chain-of-custody for forensic specimens (viscera samples, blood spots, clothing items, bullets), recording exact handover timestamps, police officer rank/badge number, and receiving forensic lab signatures.

---

## 13.3 Mortuary Cold-Storage Management & Statutory CRS Registration

### 13.3.1 Body Tagging & Cold Chamber Allocation
- **Barcode Toe-Tagging:** Auto-prints barcode toe-tags capturing Deceased Name, UHID, Death Timestamp, Ward/Emergency Bay, and MLC Reference ID.
- **Cold Storage Chamber Allocation:** Assigns body cold storage chambers (+2°C to +4°C standard cold storage / Deep Freeze -15°C for forensic preservation).

### 13.3.2 Dual-Verification Body Release Protocol
- **Release Verification:** Requires dual digital sign-off (Hospital Medical Superintendent + Police Clearance Certificate for MLC cases) before unlocking body release to relatives or mortuary hearses.

### 13.3.3 Clinical Mortality Review & Statutory CRS Registration (Form 2)
- **Hospital Mortality Audit:** Compiles automated clinical case summaries for hospital Clinical Mortality Review Committees (evaluating 24-hr post-admission deaths, maternal mortality MMR, neonatal mortality, and ICU deaths).
- **Statutory CRS Form 2 Generation:** Auto-populates official Government Death Registration Form 2 linking Deceased Aadhaar ID, informant details, hospital death record number, exact death timestamp, and MCCD cause of death for Municipal / Gram Panchayat Death Certificate issuance.
