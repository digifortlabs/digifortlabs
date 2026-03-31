# Product Overview

## Project Purpose
THE DIGIFORT LABS is a comprehensive Hospital PDF Archival Platform designed to modernize medical record management through hybrid storage solutions. The platform bridges physical warehouse management with cloud-based digital archival, enabling hospitals to transition from paper-based systems to efficient digital workflows while maintaining access to legacy physical records.

## Value Proposition
- **Hybrid Storage Management**: Seamlessly manage both physical boxes in warehouses and digital files in the cloud through a unified interface
- **ROI Tracking**: Built-in "Space Saved" analytics demonstrate tangible cost savings from digitization efforts
- **Intelligent Search**: OCR-powered search enables finding documents by content (e.g., searching for "Pneumonia" across all archived records)
- **Physical Asset Tracking**: Complete warehouse management with box locations, check-in/out status, and retrieval request workflows
- **Enterprise Security**: JWT-based authentication with role-based access control for hospital administrators and staff

## Key Features

### Core Capabilities
- **Patient Record Management**: Comprehensive patient data storage with medical history, diagnoses (ICD-11), procedures, and document attachments
- **Document Archival**: PDF upload, storage, and retrieval with OCR processing for searchable content
- **Physical Warehouse System**: Track physical box locations, manage check-in/out workflows, and handle retrieval requests
- **Smart Analytics Dashboard**: Real-time metrics on space saved, digitization progress, and storage utilization
- **Multi-Hospital Support**: Platform supports multiple hospital tenants with isolated data and custom configurations

### Advanced Features
- **Accounting Module**: Invoice generation (GST/Non-GST), expense tracking, receipt management with automated numbering
- **Inventory Management**: Track medical supplies, consumables, and equipment with reorder alerts
- **QA Issue Tracking**: Document quality assurance workflow for flagging data errors, image blur, and other issues
- **Dental Specialization**: Dedicated dental patient management with 3D scan storage, tooth-specific treatments, and appointment scheduling
- **Bandwidth Monitoring**: Track and enforce monthly bandwidth quotas per hospital
- **Audit Logging**: Comprehensive activity tracking for compliance and security monitoring

### Integration Features
- **Desktop Scanner App**: Windows application for direct document scanning and upload via custom protocol handler
- **OCR Processing**: Automated text extraction from scanned documents using Tesseract and Google Gemini AI
- **Cloud Storage**: AWS S3 integration for scalable document storage with local fallback mode
- **Background Processing**: Celery-based task queue for OCR, video processing, and batch operations

## Target Users

### Primary Users
- **Hospital Administrators**: Manage hospital settings, user accounts, and view analytics
- **Medical Records Staff**: Upload, organize, and retrieve patient documents
- **Healthcare Providers**: Access patient records and medical history
- **Warehouse Personnel**: Manage physical box inventory and process retrieval requests

### User Roles
- **Super Admin**: Platform-wide administration and multi-hospital management
- **Hospital Admin**: Hospital-specific configuration and user management
- **Staff**: Day-to-day operations including patient records and document management
- **Viewer**: Read-only access to records and reports

## Use Cases

### Primary Workflows
1. **Document Digitization**: Scan physical records using desktop app, automatic OCR processing, searchable archive creation
2. **Hybrid Record Access**: Search digital archives first, request physical box retrieval when needed
3. **Patient Onboarding**: Create patient records, upload medical documents, link diagnoses and procedures
4. **Physical Inventory Management**: Track box locations, manage check-in/out, fulfill retrieval requests
5. **Compliance Reporting**: Generate audit trails, track user activities, monitor data access

### Specialized Workflows
- **Dental Practice Management**: Patient appointments, treatment planning, 3D scan visualization
- **Financial Operations**: Invoice generation, expense tracking, GST compliance reporting
- **Quality Assurance**: Flag document issues, track resolution status, maintain data quality standards
- **Inventory Control**: Monitor stock levels, generate reorder alerts, track consumption patterns

## Deployment Model
- **Development**: SQLite database, local file storage, single-server deployment
- **Production**: PostgreSQL database, AWS S3 storage, containerized deployment with Nginx reverse proxy
- **Pilot Phase**: Currently supporting initial hospital partners with core feature set
