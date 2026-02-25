# Product Requirements Document (PRD) - DIGIFORT LABS

## 1. Vision & Strategy
DIGIFORT LABS is evolving from a specialized hospital archival platform into an **All-In-One (AIO) Data Processor**. The vision is to provide a highly flexible, B2B Multi-Tenant SaaS platform that empowers organizations across various industries (Healthcare, Legal, Accounting, Corporate) to securely digitize, manage, and extract value from their documents using AI and OCR technology.

## 2. Target Audience
- **Hospitals & Clinics**: Managing medical records and patient data.
- **Dental Practices**: Specialized dental charts and clinical records.
- **Accounting Firms**: Managing ledgers, invoices, and financial documents.
- **Law Firms**: Archiving legal cases and document search.
- **Corporations**: General document management and digitization.

## 3. Core Features (Pilot Phase)
### A. Hybrid Storage Management
- Unified view of physical assets (warehouse boxes) and digital files (cloud storage).
- Tracking box locations and check-in/out status.
- Integration with AWS S3 for secure cloud storage.

### B. Smart OCR & AI Search
- Full-text search capability for digitized documents (e.g., searching for "Pneumonia" within scanned PDFs).
- Automated AI data extraction from specialized document types using Google Gemini.

### C. Advanced Practice Management
- **Invoicing & Accounting**: Full ledger, vendor, and expense management for clinics and businesses.
- **Inventory Tracking**: Manage clinic consumables, reorder levels, and stock flow.
- **Integrated Quality Assurance**: Built-in QA pipelines for digitized files allowing reviewers to approve or reject content.
- **ICD-11 Medical Coding**: Integrated medical logic and disease coding.

### D. Modular Multi-Tenancy
- Industry-specific "Modules" (e.g., Dental, Accounting) that can be enabled per organization.
- Dynamic UI that adapts terminology based on the organization's specialty (using `useTerminology`).

### E. Smart Analytics
- "Space Saved" ROI calculator showing physical storage reduction from digitization.
- Operational dashboards for organization admins (Storage quotas, bandwidth usage).

## 4. User Roles & Permissions
- **SuperAdmin**: Platform owners; manage all organizations and global modular configurations.
- **OrgAdmin (Hospital/Company Admin)**: Manage their own instance, register staff, and configure organization-specific settings.
- **Staff (Medical/Warehouse/Clerical)**: Operational access to upload files, manage records, and track physical assets.

## 5. Roadmap & Future Scope
- **External Tool Integration**: Connecting with local scanners and third-party ERPs.
- **Mobile Access**: Dedicated app for warehouse management and on-the-go document viewing.
