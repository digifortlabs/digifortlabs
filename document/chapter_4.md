# Chapter 4: Financial Accounting, Billing & TPA

## 4.1 Overview

The financial backbone of the hospital, automating complex billing rules, corporate packages, and Third-Party Administrator (TPA) insurance claims.

## 4.2 Billing Architecture

DigifortLabs HMS ensures zero revenue leakage by directly linking clinical orders to the patient folio.

### 4.2.1 Automated Revenue Workflows

| Clinical Action | Billing Impact |
| :--- | :--- |
| **Doctor orders Lab Test** | Test charge added to Patient Unbilled Folio. |
| **Nurse administers Medication** | Pharmacy stock deducted; cost added to IPD bill. |
| **Bed Transfer (Gen to ICU)** | System auto-updates daily bed charges and doctor visit tariffs dynamically. |

## 4.3 TPA & Insurance Management

Managing cashless claims and corporate panels efficiently.

- **Pre-Authorization:** Generates formatted pre-auth forms based on estimated treatment costs.
- **Co-Pay & Deductibles:** Mathematically splits the final bill between the patient's out-of-pocket responsibility and the Insurance provider's receivable account.
- **Claim Tracking:** Dashboard to monitor Sent, Approved, Rejected, and Settled claims.

### 4.3.1 GIPSA (General Insurance Public Sector Association) Compliance

The system supports strict adherence to the GIPSA PPN (Preferred Provider Network) tariff structures. For GIPSA-aligned hospitals, the HMS automatically maps standard procedures to the pre-agreed package rates (e.g., standardizing the cost of a Total Knee Replacement regardless of minor ward variations), ensuring zero claim rejections due to over-billing.

- **GIPSA Package Mapping:** Direct linking of clinical ICD codes to GIPSA package codes.
- **Exclusion Management:** Automatically separating non-payable items (e.g., diet charges, specific consumables) into a co-pay bill for the patient as per GIPSA guidelines.

### 4.3.2 Integrated TPA Network

The billing module includes pre-configured tariff masters and API readiness for major Indian TPAs, including but not limited to:

| Category | Associated Companies / TPAs |
| :--- | :--- |
| **GIC / GIPSA Member Insurers** | General Insurance Corporation of India (GIC), New India Assurance, National Insurance, Oriental Insurance, United India Insurance. |
| **Major Private TPAs** | Star Health, Medi Assist, Vidal Health, MDIndia, FHPL (Family Health Plan Ltd), Raksha TPA, Heritage Health. |
| **Corporate Panels** | Direct empanelment with PSUs (e.g., ONGC, BHEL) and private enterprises. |
| **Government Schemes** | Ayushman Bharat (PM-JAY), CGHS, ECHS. |
