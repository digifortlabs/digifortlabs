# Chapter 2: Super Admin & SaaS Tenant Management

## 2.1 Overview

The **Super Admin Module** is the highest level of administrative control in the DigifortLabs Hospital Management System. Designed exclusively for the SaaS service provider, this module governs the overarching Multi-Tenant architecture, allowing the platform operators to onboard new hospitals, manage client subscriptions, control module access, and monitor billing usage across all isolated tenants.

## 2.2 Client Onboarding & Tenant Provisioning

When a new healthcare facility subscribes to the DigifortLabs platform, the Super Admin uses the **Onboard Client Wizard** to instantly provision a logically isolated tenant environment.

### 2.2.1 Facility Classification
To ensure the HMS adapts its UI and workflows to the specific needs of the client, the Super Admin classifies the facility during registration:
- **Organization Type:** Categorizes the facility (e.g., Multi-Specialty Hospital, Single-Specialty Hospital, Polyclinic / Day Care Center, Diagnostic Center, Independent Doctor Clinic, Pharmacy / Medical Store).
- **Primary Specialty:** A dynamic sub-classification based on the Organization Type (e.g., a Single-Specialty Hospital can be defined as Cardiology, Orthopedics, or Maternity). 
- **Hospital Group / Chain:** If the facility is a branch of a larger chain, it can be linked to a Parent Group. This allows for Group-Level UHID (Unique Health Identifier) sharing while maintaining local IPD and billing isolation.

### 2.2.2 Tenant Identity & Subdomains
Each onboarded hospital is assigned a unique, dedicated workspace:
- **Custom Subdomain:** The system automatically generates or assigns a dedicated subdomain (e.g., `cityhospital.digifortlabs.com`) for the client's staff and administrators to log in securely.
- **Tenant Isolation:** All database transactions, patient records, and financial data are strictly isolated using the client's unique `hospital_id`.

## 2.3 SaaS Modules Control

The DigifortLabs HMS operates on a modular, pay-as-you-go architecture. The Super Admin has the granular ability to toggle specific functional modules on or off for any given hospital tenant. Toggling these parameters instantly updates client access authorizations across their custom subdomains without requiring system redeployments.

**Available Modules include:**
- **Core Patient Records (MRD):** Document management, patient file storage, and core configurations.
- **Inpatient & Wards (IPD):** Bed management, ADT (Admission, Discharge, Transfer), and nursing stations.
- **Hospital Asset Management:** Supply chain inventory, machine logs, and fixed assets tracking.
- **SaaS Accounting & Ledger:** Comprehensive billing, invoices, payments, and financial control.
- **Outpatient Clinic (OPD):** Appointment scheduling, queue management, and lightweight clinic EMR.
- **Dental Specialty Module:** Specialized tooth mapping and dental treatment charting.
- **ENT Specialty Module:** Custom diagnostics panels for Ear, Nose & Throat specialists.
- **Pharmacy & Prescriptions:** Standalone medicine dispensing, inventory, and pharmacy point-of-sale.

## 2.4 Subscription & MRD File Billing

To support diverse business models (from small independent clinics to massive corporate chains), the system includes a flexible, usage-based billing engine monitored by the Super Admin.

### 2.4.1 MRD (Medical Records Department) Service Type
The platform can charge clients based on their digital footprint and patient volume. The Super Admin configures the MRD service tier for each hospital:
- **Portal Only (Zero Cost):** Basic access without specialized cloud storage constraints.
- **Managed Storage:** The platform manages and bills for all historical clinical data storage.
- **Hybrid / External Drive:** The hospital manages their own physical storage devices, with the platform maintaining the application layer.

### 2.4.2 Granular Usage Pricing
For hospitals on managed storage plans, the Super Admin configures specific financial parameters:
- **Subscription Plan Tier:** e.g., Starter, Professional, Enterprise.
- **Price per Patient MRD File:** A fixed cost charged to the hospital for every new unique patient record generated.
- **Included Pages:** A threshold of digital pages/documents included per patient file before overage charges apply.
- **Price per Extra Page (₹):** The micro-transaction cost billed to the hospital for exceeding the included page limit.

By centralizing these controls, the Super Admin dashboard provides total command over platform scalability, revenue generation, and tenant configuration.
