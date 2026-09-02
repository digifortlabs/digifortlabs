# Chapter 8: Maternity, Obstetrics & NICU Operations

## 8.1 Antenatal Care (ANC) & High-Risk Pregnancy Tracker

The Maternity & Obstetrics module manages maternal healthcare from initial antenatal visits through labor ward delivery, newborn care, and post-natal monitoring.

### 8.1.1 Trimester ANC Visit Scheduling & Clinical Metrics
- **Trimester ANC Tracking:** Automatically schedules standard 8 antenatal checkups across 3 trimesters, logging fundal height (cm), maternal weight gain trajectory, Blood Pressure ($BP$), fetal heart rate ($FHR$ in bpm), urine protein, hemoglobin ($Hb$ in g/dL), and fetal growth velocity on ultrasound scans.
- **Estimated Date of Delivery (EDD) Calculator:** Computes EDD using Naegele's rule based on Last Menstrual Period (LMP) date, automatically adjusting expected delivery dates upon initial 1st-trimester crown-rump length (CRL) dating scans.

### 8.1.2 High-Risk Pregnancy Alert Engine
- **Automated Risk Flags:** Triggers high-risk alerts on patient EMR headers for:
  - **Preeclampsia Risk:** BP $≥ 140/90 mmHg$ + Urine Protein $\ge 1+$.
  - **Gestational Diabetes Mellitus (GDM):** 75g Oral Glucose Tolerance Test (OGTT) $≥ 140 mg/dL$.
  - **Rh-Negative Isoimmunization:** Rh-Negative mother with Rh-Positive partner; auto-schedules Anti-D Immunoglobulin administration at 28 weeks.
  - **Placenta Previa & Fetal FGR:** Flags complete/partial placenta previa or Fetal Growth Restriction on ultrasound tracking.

---

## 8.2 Labor Ward Operations & Digital WHO Partograph

The Labor Ward module monitors labor progression adhering to World Health Organization (WHO) partograph standards.

### 8.2.1 Real-Time Digital WHO Partograph Plotting
- **Cervical Dilation & Descent:** Real-time plotting of cervical dilation (cm) against Alert and Action lines, tracking fetal head station descent ($0/5$ to $5/5$ above pelvic brim).
- **Uterine Contraction Telemetry:** Plots contraction frequency per 10 minutes and duration category (< 20 secs, 20–40 secs, > 40 secs).
- **Amniotic Fluid & Fetal Status:** Logs amniotic fluid state (*I - Intact, C - Clear, M - Meconium-Stained, B - Bloody*) and fetal heart rate trends every 30 minutes.

### 8.2.2 Delivery Outcome Recording
- **Mode of Delivery Logging:** Captures delivery type (*Spontaneous Normal Vaginal Delivery, Vacuum-Assisted, Forceps-Assisted, Emergency LSCS, Elective LSCS*), episiotomy repairs, maternal blood loss volume (ml), third-stage active management, and placenta complete delivery verification.

---

## 8.3 Newborn Care, APGAR Scoring & NICU Telemetry

### 8.3.1 APGAR Scoring & Birth Profile
- **APGAR Engine:** Computes 1-minute and 5-minute APGAR scores evaluating Appearance (Color), Pulse (Heart Rate), Grimace (Reflex Irritability), Activity (Muscle Tone), and Respiration ($0-10$ scale).
- **Mother-Baby QR Wristband Pair:** Generates dual-paired QR wristbands (Mother UHID + Baby Unique ID) printed immediately in the labor room. Scanner verification is mandatory before transferring infants or initiating feeding to prevent mix-ups.

### 8.3.2 NICU Incubator & Phototherapy Management
- **Radiant Warmer & Phototherapy Telemetry:** Logs incubator ambient temperature, radiant warmer hours, phototherapy unit irradiance levels for neonatal hyperbilirubinemia, and CPAP/Mechanical ventilation parameters.
- **Statutory CRS Form 1 Birth Registration:** Auto-populates official Government Birth Registration Form 1 capturing parents' Aadhaar IDs, hospital birth registry number, exact birth timestamp, gender, and birth weight for direct submission to Municipal / Gram Panchayat authorities.
