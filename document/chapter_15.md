# Chapter 15: Diagnostic Imaging RIS/PACS, DICOM 3.0 & Voice Dictation

## 15.1 DICOM 3.0 Modality Worklists (MWL) & Web PACS Viewer

The Radiology Information System (RIS) and Picture Archiving and Communication System (PACS) manage diagnostic imaging scheduling, DICOM image storage, zero-footprint web viewing, and structured radiology reporting.

### 15.1.1 DICOM 3.0 Modality Worklist (MWL) Integration
- **Direct Console Worklists:** Pushes patient booking data, accession numbers, patient demographics, and scan protocols straight to CT, MRI, X-Ray, Mammography, and Ultrasound console screens via DICOM MWL, eliminating manual typing on imaging equipment consoles.

### 15.1.2 Zero-Footprint Web PACS Viewer
- **HTML5 Web PACS Viewer:** High-performance, zero-footprint browser DICOM viewer rendering full-resolution diagnostic imaging studies on PC, Mac, and iPad without installing local software plugins.
- **Diagnostic Measurement Tools:** Multi-Planar Reconstruction (MPR), Maximum Intensity Projection (MIP), 3D Volume Rendering, Hounsfield Unit (HU) tissue density calculation, Cobb angle measurement, and side-by-side prior scan comparisons.

---

## 15.2 Radiologist AI Voice Dictation & Radiation Dose Telemetry

### 15.2.1 Structured AI Voice Dictation Engine
- **Radiology Speech Recognition:** Voice dictation engine tuned for medical radiology terminology, supporting structured report generation adhering to international guidelines (*BI-RADS for Mammography, RECIST 1.1 for Oncology, LI-RADS for Liver, PI-RADS for Prostate*).

### 15.2.2 Patient Radiation Dose Index (DAP / CTDIvol)
- **Radiation Safety Tracking:** Automatically extracts Dose Area Product (DAP) and Volume CT Dose Index ($CTDI_{vol}$ in mGy) from DICOM headers, logging cumulative radiation exposure per patient and auto-generating AERB eLORA safety compliance reports.

---

## 15.3 Automated Radiology Report Generation from Image Markings & Measurements

### 15.3.1 Dynamic Caliper & Annotation Auto-Parsing Engine
- **Image Marking Auto-Extraction:** Automatically parses measurements, calipers, ruler lines, and region-of-interest (ROI) markings placed on Ultrasound, CT, MRI, and X-ray frames.
- **Instant Structured Report Compilation:** When a Radiologist or Sonographer places markings on an image (e.g., measuring lesion diameter, organ volume, or fetal parameters), the system automatically extracts the numerical values and maps them directly into structured report templates:
  - **Obstetric Ultrasound (OB-GYN):** BPD, HC, AC, FL markings automatically calculate Gestational Age (GA), Estimated Fetal Weight (EFW via Hadlock), and generate growth curve graphs in the final PDF report.
  - **Doppler Velocimetry:** Pulsatility Index (PI), Resistive Index (RI), and peak systolic velocity markings automatically populate vascular assessment sections.
  - **Organ / Lesion Measurements:** 3D organ measurements ($L \times W \times H$) automatically compute total organ volume (e.g., Prostate Volume, Thyroid Volume, Kidney Volume) and insert impressions.
- **OCR Caliper Recognition:** Built-in Optical Character Recognition (OCR) engine reads caliper measurements burned into ultrasound screen captures for older legacy non-DICOM machines.
- **One-Click Draft Report Generation:** Generates complete, fully-formatted diagnostic reports instantly upon marking completion, requiring only a single click for radiologist review and digital signature.
