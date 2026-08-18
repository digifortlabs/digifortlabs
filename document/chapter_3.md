# Chapter 3: Inpatient (IPD) Operations

## 3.1 Overview of IPD in a SaaS Environment

The Inpatient Department (IPD) handles the complex workflows of admitted patients. In our **Multi-Tenant SaaS architecture**, IPD operations are the most critical area for strict data isolation. 

While a patient's **demographic profile and clinical history (Group-Level UHID)** can be shared across branches of the same hospital group, their **IPD Admission** is strictly locked to the local hospital branch (`hospital_id`). 

This ensures that:
- Bed availability and physical ward management never conflict between branches.
- Inpatient billing and daily ward charges are strictly routed to the local branch's accounting ledger.
- Nursing stations only see patients physically admitted to their specific building.

---

## 3.2 Admission & Ward Management

When a doctor recommends admission (from OPD or Emergency), the patient is transitioned to IPD.

### 3.2.1 Bed Allocation (Tenant-Scoped)
- **Real-Time Visual Layout:** Receptionists view a live dashboard of wards (ICU, General, Private, Semi-Private). This layout is highly customizable by the local hospital administrator.
- **Availability Tracking:** Beds are color-coded (Available, Occupied, Cleaning, Maintenance).
- **Admission Record:** An IPD Admission record is generated, tying the patient to a specific Bed ID. **Crucially, this bed assignment is entirely invisible to other branches.**
- **Advance Deposit:** Most hospitals require an advance deposit before assigning a bed, which is credited to the local branch's `PatientLedger`.

### 3.2.2 Inter-Ward Transfers
If a patient's condition changes (e.g., moving from ICU to a General Ward), the local system handles the bed transfer. The billing engine automatically calculates pro-rated bed charges based on the exact hours spent in each ward category.

---

## 3.3 Nursing Station & Clinical Care

The Nursing Station module is the operational hub for admitted patients. It is restricted to the nursing staff of that specific hospital branch.

### 3.3.1 Medication Administration Record (MAR)
- Nurses receive digital indent orders from the doctor.
- Medications are requested from the **Local Branch Pharmacy**. 
- Once administered, the nurse logs the exact time and dosage. The cost of the medication is instantly added to the patient's local running IPD bill.

### 3.3.2 Vitals & Progress Notes
- Nurses log hourly or daily vitals (BP, Heart Rate, SpO2, Temperature).
- Doctors add Daily Progress Notes during their rounds. 
- *Note for Hospital Groups:* If the patient visits another branch in the future, these clinical progress notes will be visible in the "Group Medical History", but the financial charges associated with the doctor's round remain at this local branch.

### 3.3.3 Order Execution (Labs & Radiology)
- Doctors can order lab tests directly from the IPD dashboard.
- The local laboratory receives the order, processes the sample, and uploads the results directly to the patient's local IPD file.
- The cost of the test is added to the running IPD bill.

---

## 3.4 Surgery & Operation Theatre (OT)

For surgical patients, the system manages the complexities of the Operation Theatre.

- **OT Scheduling:** Booking the physical theatre room and surgical team.
- **Surgical Notes:** The primary surgeon inputs operative notes, anesthesia details, and implant records.
- **OT Billing:** The system automatically calculates charges for OT rent, surgeon fees, anesthetist fees, and consumed surgical inventory.

---

## 3.5 Discharge & IPD Billing

The discharge process requires coordination between clinical and financial teams.

### 3.5.1 Clinical Discharge (Discharge Summary)
- The system automatically aggregates admission notes, lab results, surgical notes, and daily progress notes.
- The doctor finalizes the **Discharge Summary**, which serves as the official medical record of the stay.

### 3.5.2 Financial Discharge (Final Billing)
- The local billing department generates the final IPD invoice.
- The system automatically compiles all daily bed charges, nursing charges, pharmacy indents, lab tests, and doctor visits.
- Any advance deposits are automatically deducted from the final total.
- Once the final payment is cleared (or insurance/TPA approval is logged), the system physically releases the bed, turning its status to "Cleaning" or "Available".


## 3.6 Advanced IPD Features (Roadmap)

To manage the complexity of admitted patients efficiently, the following advanced features are planned:

- **Digital Shift Handover (Nursing):** A mandatory digital log where departing nurses leave structured handover notes (e.g., vital alerts) for the incoming shift, ensuring continuity of critical care without relying on paper diaries.
- **Kitchen & Diet Module:** Dietary orders placed by doctors are instantly transmitted to a centralized hospital kitchen dashboard, mapped to the patient's specific Bed ID for accurate tray delivery.
- **Automated TPA/Insurance Locks:** If a patient is admitted under insurance, the system automatically locks the final clinical discharge button until the TPA desk officially uploads the insurer's approval letter, preventing premature discharge before financial clearance.
