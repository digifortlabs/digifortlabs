# Chapter 19: Biomedical Engineering CMMS & Equipment Maintenance

## 19.1 Equipment Classification & Asset Tracking

The Computerized Maintenance Management System (CMMS) tracks medical equipment, facilities, and diagnostic assets across 7 core categories:
1. **Radiology & Imaging:** MRI, CT Scanner, Digital X-Ray, Mammography, Ultrasound.
2. **ICU & Critical Care:** Ventilators, Multipara Monitors, Infusion Pumps, Defibrillators.
3. **Operating Theatre:** Anesthesia Workstations, OT Lights, Electrocautery Units, Heart-Bypass Pumps.
4. **Pathology & Laboratory:** Auto-Analyzers, Centrifuges, Biosafety Cabinets, Deep Freezers.
5. **CSSD & Sterilization:** Steam Autoclaves, ETO Sterilizers, Washer-Disinfectors.
6. **Facilities & HVAC:** Chillers, Air Handling Units (AHUs), Diesel Generators, Oxygen Plants.
7. **Clinical Support:** ECG Machines, Nebulizers, Suction Units, Hospital Beds.

### 19.1.1 QR Asset Tagging & Diagnostic Imaging Telemetry
- **QR Asset Tagging:** Every physical asset receives a weatherproof QR asset tag linking serial numbers, purchase dates, warranty expiry, user manuals, and maintenance history.
- **Diagnostic Telemetry Integration:** Real-time telemetry tracking MRI Liquid Helium Boil-off %, CT Scanner X-Ray Tube Heat Units (HU %), and Radiographer Thermo-Luminescent Dosimeter (TLD) badge radiation exposure logs.

---

## 19.2 Breakdown Ticket SLA Engine & License Expiry Tracker

### 19.2.1 Priority-Based Breakdown SLA Dispatch Engine

| Priority Level | Target Response Time | Target Resolution SLA | Equipment Category Covered |
| :--- | :--- | :--- | :--- |
| **P1 Critical** | **15 Minutes** | **2 Hours** | ICU Ventilators, OT Anesthesia Workstations, CathLab, CT/MRI. |
| **P2 High** | **30 Minutes** | **4 Hours** | PathLab Analyzers, Emergency X-Ray, Blood Bank Refrigerators. |
| **P3 Medium** | **2 Hours** | **12 Hours** | Ward Multipara Monitors, ECG Machines, Infusion Pumps. |
| **P4 Low** | **4 Hours** | **24 Hours** | OT Lights, Hospital Beds, Wheelchairs, Non-clinical Furniture. |

### 19.2.2 Contract Management & Statutory License Reminders
- **AMC / CMC Management:** Tracks Annual Maintenance Contracts (AMC) and Comprehensive Maintenance Contracts (CMC), vendor response SLAs, spare parts coverage, Mean Time To Repair (MTTR), and Mean Time Between Failures (MTBF).
- **Statutory License Expiration Reminders:** 90/60/30-day automated notifications for AERB eLORA licenses, Fire NOC, Clinical Establishment Act (CEA) registration, and Bio-Medical Waste (BMW) authorization renewals.

---

## 19.3 Hospital Linen, Laundry & Housekeeping Management

### 19.3.1 Laundry Circulation & RFID Linen Tagging
- **Linen Inventory Lifecycle:** Tracks dirty linen collection from IPD wards, OT suites, and ER bays; sorting by contamination tier (*Infectious, Soiled, General*); and dispatch to central hospital laundry or third-party dry-cleaning vendors.
- **RFID Linen Tagging & Wash Count Monitoring:** UHF RFID tags embedded in hospital bedsheets, OT scrubs, blankets, and doctor coats track daily wash cycles, monitoring maximum wash thresholds before fabric degradation retirement.
- **Loss & Depreciation Logs:** Automatic ledger tracking for lost, torn, or discarded linen items with monthly inventory audit reconciliations.
