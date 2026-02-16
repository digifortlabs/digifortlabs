# DIGIFORT LABS - Architecture & Flow Diagrams

This document provides visual representations of the website's frontend and backend systems, their interactions, and data flows.

## 1. High-Level System Architecture

This diagram shows the main components of the system and how they connect.

```mermaid
graph TD
    User((User/Browser)) -->|HTTPS| Frontend[Next.js Frontend]
    Frontend -->|API Requests| Backend[FastAPI Backend]
    Backend -->|SQL Queries| DB[(PostgreSQL Database)]
    Backend -->|File Storage| Storage{AWS S3 / Local Storage}
    Backend -.->|Background Tasks| Celery[Celery / Async Tasks]
```

## 2. Frontend Flow & Navigation

This chart maps the complete user journey from public pages to the protected dashboard.

```mermaid
flowchart TD
    Start((User Visit)) --> Landing[Landing Page /]
    Landing --> AuthCheck{Is Logged In?}
    
    AuthCheck -- No --> Login[Login Page /login]
    Login --> AuthAPI[Backend /auth/login]
    AuthAPI -- Success --> SetToken[Save Token to localStorage]
    SetToken --> DashGuard
    
    AuthCheck -- Yes --> DashGuard[Dashboard Layout Guard]
    
    subgraph Dashboard[Protected Dashboard Area]
        DashGuard --> Layout[Dashboard Layout]
        Layout --> Navbar[Navbar / Sidebar]
        Layout --> Content[Page Content]
        
        Content --> Records[Patient Records]
        Content --> Accounting[Accounting / Billing]
        Content --> Hospital[Hospital Settings]
        Content --> Inventory[Inventory Mgmt]
    end
    
    subgraph SessionMgmt[Session & Security]
        Monitor[Session Monitor] --- Layout
        Inactivity[Inactivity Hook] --- Layout
        Inactivity -- Timeout --> Logout[Auto Logout]
    end
```

## 3. Dashboard Component Architecture

How the dashboard UI is structured and shared components are utilized.

```mermaid
graph TD
    DL[Dashboard Layout]
    DL --> DN[Dashboard Navbar]
    DL --> MB[Maintenance Banner]
    DL --> IW[Inactivity Warning]
    DL --> PC[Page Content]
    
    subgraph Shared Components
        DN --> Profile[User Profile Dropdown]
        DN --> HospitalInfo[Active Hospital Selector]
        PC --> ErrorBoundary[Global Error Boundary]
        PC --> Loading[Loading States]
    end
    
    subgraph Page Modules
        PC --- R[Records View]
        PC --- A[Accounting Grid]
        PC --- S[Settings Form]
    end
```

## 4. Backend Request Lifecycle

This diagram illustrates how a request is processed by the FastAPI backend.

```mermaid
sequenceDiagram
    participant Browser
    participant Middleware
    participant Router
    participant Service
    participant Database/S3

    Browser->>Middleware: API Request
    Note over Middleware: Security, Rate Limit, Bandwidth
    Middleware->>Router: Standardized Request
    Router->>Service: Business Logic Call
    Service->>Database/S3: Data Access
    Database/S3-->>Service: Result Data
    Service-->>Router: Formatted Response
    Router-->>Middleware: JSON/File Response
    Middleware-->>Browser: HTTP Response (CORS applied)
```

## 5. Patient Record & Document Flow

The path of patient data and PDF uploads from the UI to storage.

```mermaid
flowchart TD
    UI[Frontend: Upload Action] --> |PDF File| Router[Backend: Patient Router]
    Router --> Service[Backend: Storage Service]
    Service --> |Save Metadata| DB[(PostgreSQL)]
    Service --> |Upload File| S3{AWS S3 Bucket}
    S3 --> |Path Reference| DB
```
