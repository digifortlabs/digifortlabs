<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>DigifortLabs HMS Functional Specification</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 40px; background-color: #f9f9f9; }
        .container { background-color: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-top: 40px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        pre { background-color: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
        code { font-family: Consolas, monospace; background-color: #f1f1f1; padding: 2px 5px; border-radius: 3px; }
        .mermaid { text-align: center; margin: 30px 0; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: visible !important; }
        
        @media print {
            @page { size: A4; margin: 20mm; }
            body { background-color: #fff; padding: 0; font-size: 12pt; }
            .container { box-shadow: none; padding: 0; max-width: 100%; border: none; }
            .page-break { page-break-before: always; }
            .mermaid { box-shadow: none; margin: 10px 0; padding: 10px; }
            hr { display: none; }
        }
    </style>
    <!-- Include Mermaid JS -->
    <script type="module">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
        mermaid.initialize({ startOnLoad: true, theme: 'default' });
    </script>
</head>
<body>
    <div class="container">
        <p><a id="chapter-0"></a></p>
<div style="text-align: center; margin-top: 100px; margin-bottom: 200px;">
    <h1 style="font-size: 3em; color: #2c3e50; border-bottom: none;">DIGIFORTLABS</h1>
    <h2 style="font-size: 2em; color: #3498db; margin-top: -20px;">Comprehensive Hospital Management System (HMS)</h2>

    <br><br><br>

    <h2 style="font-size: 2.5em; color: #333;">HMS Functional Requirement Specification</h2>

    <br><br><br><br>

    <p style="font-size: 1.2em;"><strong>Developed By:</strong> DigifortLabs</p>
    <p style="font-size: 1.2em;"><strong>Prepared For:</strong> Hospital Administrators & Stakeholders</p>
</div>

<div class="page-break"></div>

<h1>Table of Contents</h1>
<ol>
<li><strong><a href="#chapter-1">Chapter 1: Executive Summary & Patient Management</a></strong></li>
<li><strong><a href="#chapter-2">Chapter 2: Outpatient (OPD) & Inpatient (IPD) Operations</a></strong></li>
<li><strong><a href="#chapter-3">Chapter 3: Pharmacy, Inventory & Supply Chain</a></strong></li>
<li><strong><a href="#chapter-4">Chapter 4: Financial Accounting, Billing & TPA</a></strong></li>
<li><strong><a href="#chapter-5">Chapter 5: Laboratory & Diagnostics (LIS/RIS)</a></strong></li>
<li><strong><a href="#chapter-6">Chapter 6: Operation Theatre (OT) & specialized Clinics</a></strong></li>
<li><strong><a href="#chapter-7">Chapter 7: Human Resources & Staff Management</a></strong></li>
</ol>
<div class="page-break"></div>

<hr>

<p><a id="chapter-1"></a></p>
<h1>Chapter 1: Executive Summary & Patient Management</h1>
<h2>1.1 Executive Summary</h2>
<p>The <strong>DigifortLabs Hospital Management System (HMS)</strong> represents a paradigm shift in how modern healthcare institutions manage their clinical, administrative, and financial workflows. Built on a robust, highly scalable, and secure architecture (Next.js, React, and TypeScript), this platform eliminates data silos by unifying Patient Care, Medical Records, Pharmacy Logistics, Human Resources, and Financial Accounting into a single, cohesive ecosystem.</p>
<p>This functional specification document serves as the architectural and operational blueprint for the system. It provides stakeholders, medical directors, and technical implementers with a granular understanding of every module, patient journey, and data structure within the platform.</p>
<h3>Core Objectives</h3>
<ul>
<li><strong>Clinical Unification:</strong> Centralize Electronic Medical Records (EMR) to ensure continuity of care across all hospital departments.</li>
<li><strong>Operational Efficiency:</strong> Automate complex workflows such as bed allocation, discharge summaries, and TPA billing calculations.</li>
<li><strong>Financial Transparency:</strong> Enforce real-time accounting directly tied to pharmacy dispensing, laboratory orders, and clinical services.</li>
<li><strong>Security & Compliance:</strong> Implement strict Role-Based Access Control (RBAC) and HIPAA/GDPR-aligned data protection protocols.</li>
</ul>
<hr />
<h2>1.2 Patient Relationship & Registration Architecture</h2>
<p>The Patient Management module is the primary entry point for all clinical activities. It handles the complete patient lifecycle, from initial appointment booking to registration and medical history formulation.</p>
<h3>1.2.1 High-Level Patient Workflow</h3>
<p>The following flowchart illustrates the standard data flow through the Patient Management module.</p>
<pre class="mermaid">
graph TD
    A[Patient Appointment Request] --> B{Walk-in or Pre-booked?}
    B -- Walk-in --> C[Front Desk Registration]
    B -- Pre-booked --> D[Online Verification & Intake]
    C --> E[Generate Unique Health ID (UHID)]
    D --> E
    E --> F[Triage & Vitals Recording]
    F --> G{Consultation Type}
    G -- OPD --> H[Doctor Consultation]
    G -- IPD --> I[Admission & Bed Allocation]
    H --> J[E-Prescription & Lab Orders]
    I --> K[Inpatient Care Plan & Nursing]
    J --> L[Pharmacy / Billing]
    K --> M[Discharge & Settlement]
</pre>
<hr />
<h2>1.3 Appointment & Triage Management</h2>
<p>Ensuring zero-wait-time experiences through algorithmic scheduling and smart triage management.</p>
<h3>1.3.1 Appointment Dashboard</h3>
<p>The centralized hub for all scheduling activities.</p>
<table>
<thead>
<tr>
<th style="text-align: left;">Feature</th>
<th style="text-align: left;">Functional Description</th>
<th style="text-align: left;">User Role Required</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align: left;"><strong>Slot Management</strong></td>
<td style="text-align: left;">Dynamic scheduling based on doctor availability and specialization.</td>
<td style="text-align: left;">Receptionist / Patient</td>
</tr>
<tr>
<td style="text-align: left;"><strong>Token Generation</strong></td>
<td style="text-align: left;">Automated queue tokens to manage the physical flow of patients.</td>
<td style="text-align: left;">Front Desk</td>
</tr>
<tr>
<td style="text-align: left;"><strong>Vitals Tracking</strong></td>
<td style="text-align: left;">Pre-consultation recording of BP, BMI, SpO2, and temperature.</td>
<td style="text-align: left;">Nursing Staff</td>
</tr>
</tbody>
</table>

<div class="page-break"></div>

<hr>

<p><a id="chapter-2"></a></p>
<h1>Chapter 2: Outpatient (OPD) & Inpatient (IPD) Operations</h1>
<h2>2.1 Overview</h2>
<p>The core clinical delivery engine of DigifortLabs HMS. It empowers doctors with rapid data access and structured documentation to enhance patient outcomes.</p>
<h2>2.2 Outpatient Department (OPD)</h2>
<p>OPD is designed for speed and clinical accuracy, featuring intelligent E-Prescriptions and fast historical medical record (EMR) retrieval.</p>
<h3>2.2.1 E-Prescription & Clinical Notes</h3>
<pre class="mermaid">
sequenceDiagram
    participant Doc as Doctor
    participant System as DigifortLabs EMR
    participant Pharm as Pharmacy
    participant Lab as Laboratory

    Doc->>System: Access Patient UHID
    System-->>Doc: Display Patient History & Vitals
    Doc->>System: Enter Chief Complaints & Diagnoses (ICD-10)
    Doc->>System: Generate E-Prescription
    System->>Pharm: Push Rx to Pharmacy Queue
    Doc->>System: Order Diagnostics
    System->>Lab: Push Test Requisition to LIS
    System-->>Doc: Finalize Encounter Note
</pre>
<h2>2.3 Inpatient Department (IPD)</h2>
<p>Managing the complexity of admitted patients requires strict coordination between doctors, nurses, billing, and pharmacy.</p>
<h3>2.3.1 IPD Modules</h3>
<ol>
<li><strong>Bed & Ward Management:</strong> Real-time visual layout of wards (ICU, General, Private) displaying bed occupancy, sanitation status, and patient mapping.</li>
<li><strong>Nursing Station:</strong> Medication administration records (MAR), hourly vitals charts, and doctor order executions.</li>
<li><strong>Discharge Summary Generator:</strong> Automatically aggregates admission notes, lab results, surgical notes, and daily progress notes into a formatted Discharge Summary.</li>
</ol>

<div class="page-break"></div>

<hr>

<p><a id="chapter-3"></a></p>
<h1>Chapter 3: Pharmacy, Inventory & Supply Chain</h1>
<h2>3.1 Overview</h2>
<p>The Inventory and Pharmacy Management module ensures critical medications and consumables are always in stock while preventing leakage and managing expiry dates.</p>
<h2>3.2 Pharmacy Architecture</h2>
<p>The system utilizes a multi-store, batch-tracked architecture.</p>
<h3>3.2.1 Core Inventory Components</h3>
<table>
<thead>
<tr>
<th style="text-align: left;">Component</th>
<th style="text-align: left;">Description</th>
<th style="text-align: left;">Functionality</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align: left;"><strong>Master Formulary</strong></td>
<td style="text-align: left;">Central drug database.</td>
<td style="text-align: left;">Categorizes by generic name, brand, schedule (e.g., Narcotics), and formulation.</td>
</tr>
<tr>
<td style="text-align: left;"><strong>Batch & Expiry</strong></td>
<td style="text-align: left;">Granular tracking.</td>
<td style="text-align: left;">Enforces FEFO (First Expiry First Out) to minimize wastage and compliance risks.</td>
</tr>
<tr>
<td style="text-align: left;"><strong>Indent Management</strong></td>
<td style="text-align: left;">Internal requisition system.</td>
<td style="text-align: left;">Wards and departments request stock from the central medical store.</td>
</tr>
</tbody>
</table>
<h2>3.3 Supply Chain Flow</h2>
<pre class="mermaid">
graph TD
    A[Low Stock Alert] --> B[Generate Purchase Requisition]
    B --> C[Approval Matrix]
    C --> D[Purchase Order to Vendor]
    D --> E[Goods Receipt Note (GRN)]
    E --> F[QA & Barcoding]
    F --> G[Main Medical Store]
    G --> H[Ward Indent / Pharmacy Transfer]
    H --> I[Dispense to Patient]
</pre>

<div class="page-break"></div>

<hr>

<p><a id="chapter-4"></a></p>
<h1>Chapter 4: Financial Accounting, Billing & TPA</h1>
<h2>4.1 Overview</h2>
<p>The financial backbone of the hospital, automating complex billing rules, corporate packages, and Third-Party Administrator (TPA) insurance claims.</p>
<h2>4.2 Billing Architecture</h2>
<p>DigifortLabs HMS ensures zero revenue leakage by directly linking clinical orders to the patient folio.</p>
<h3>4.2.1 Automated Revenue Workflows</h3>
<table>
<thead>
<tr>
<th style="text-align: left;">Clinical Action</th>
<th style="text-align: left;">Billing Impact</th>
</tr>
</thead>
<tbody>
<tr>
<td style="text-align: left;"><strong>Doctor orders Lab Test</strong></td>
<td style="text-align: left;">Test charge added to Patient Unbilled Folio.</td>
</tr>
<tr>
<td style="text-align: left;"><strong>Nurse administers Medication</strong></td>
<td style="text-align: left;">Pharmacy stock deducted; cost added to IPD bill.</td>
</tr>
<tr>
<td style="text-align: left;"><strong>Bed Transfer (Gen to ICU)</strong></td>
<td style="text-align: left;">System auto-updates daily bed charges and doctor visit tariffs dynamically.</td>
</tr>
</tbody>
</table>
<h2>4.3 TPA & Insurance Management</h2>
<p>Managing cashless claims and corporate panels efficiently.</p>
<ul>
<li><strong>Pre-Authorization:</strong> Generates formatted pre-auth forms based on estimated treatment costs.</li>
<li><strong>Co-Pay & Deductibles:</strong> Mathematically splits the final bill between the patient's out-of-pocket responsibility and the Insurance provider's receivable account.</li>
<li><strong>Claim Tracking:</strong> Dashboard to monitor Sent, Approved, Rejected, and Settled claims.</li>
</ul>

<div class="page-break"></div>

<hr>

<p><a id="chapter-5"></a></p>
<h1>Chapter 5: Laboratory & Diagnostics (LIS/RIS)</h1>
<h2>5.1 Overview</h2>
<p>A fully integrated Laboratory Information System (LIS) that connects billing to sample collection and reporting.</p>
<h2>5.2 LIS Workflow</h2>
<pre class="mermaid">
graph LR
    A[Test Ordered & Billed] --> B[Sample Collection (Phlebotomy)]
    B --> C[Barcode Generation & Labeling]
    C --> D[Sample Processing / Machine Interfacing]
    D --> E[Result Entry & Validation]
    E --> F[Pathologist Approval]
    F --> G[Report Dispatched to EMR / Patient Portal]
</pre>

<div class="page-break"></div>

<hr>
<p style="text-align: center; margin-top: 50px; font-size: 1.2em; color: #7f8c8d;">--- End of Functional Specification ---</p>
    </div>
</body>
</html>
