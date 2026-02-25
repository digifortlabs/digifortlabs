# Design Document - DIGIFORT LABS

## 1. System Architecture Overview
DIGIFORT LABS follows a modern split-stack architecture designed for scalability and high availability.

- **Frontend**: Next.js 16.1 (React 19.2) provides a server-side rendered, responsive UI. It utilizes a dynamic terminology system to support multi-industry use cases.
- **Backend**: FastAPI (Python) serves as the high-performance API layer, handling business logic, authentication, and file processing. Asynchronous tasks and workers are powered by Celery and Redis.
- **Database**:
  - **Production**: PostgreSQL (AWS RDS) for enterprise-grade data management.
  - **Development**: SQLite for lightweight, isolated local development.
- **Storage**: Hybrid model combining AWS S3 for digital binary storage and a relational database for metadata and physical warehouse tracking.

## 2. Modular Backbone Paradigm
The architectural core is built on the **Backbone & Module** strategy:

- **The Backbone**: Core tables (`organizations`, `entity_records`, `pdf_files`) remain immutable across industries. This ensures system stability and simplifies migrations.
- **The Module**: Specialized functionality is added via domain-specific tables (e.g., `dental_patients`, `accounting_transactions`, `qa_entries`, `inventory_items`, `icd11_codes`) that reference the core backbone using Foreign Keys.
- **Activation**: Modules are activated per organization through a JSON-based `enabled_modules` field.

## 3. Data Extensibility Strategy
To avoid "Schema Bloat," new industry requirements follow these rules:
1. **Reuse First**: Use core backbone fields if they map conceptually (e.g., a "Client" is maps to the `entity_records` backbone).
2. **Linked Tables**: Create new tables for complex, domain-specific data structures instead of adding dozens of nullable columns to core tables.
3. **Safe Migrations**: Use automated migration scripts (`app/main.py`) to append columns safely without breaking existing records.

## 4. Frontend Design Principles
- **Dynamic Terminology**: The `useTerminology` hook intercepts and replaces core terms (like "Patient") based on the organization's `specialty`.
- **Conditional Routing**: Sidebar and dashboard views are dynamically rendered based on the `enabled_modules` array.
- **Security**: Authentication state is managed via JWT Bearer Tokens, ideally stored in HttpOnly cookies to prevent XSS.

## 5. Deployment & Infrastructure
- **NGINX**: Acts as a reverse proxy, handling SSL termination and routing traffic to the Frontend (Port 3000) and Backend (Port 8000).
- **Docker**: Containerization is fully supported for standardized dev and prod environments using `docker-compose`.
- **AWS EC2**: Primary hosting platform for the application and database.
