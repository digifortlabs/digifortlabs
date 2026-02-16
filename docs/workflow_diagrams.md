# DigiFort Labs - Architecture & Flow Diagrams

This document providing a comprehensive visual representation of the DigiFort Labs system, its components, security layers, and data life cycles.

## 1. High-Level Infrastructure & System Architecture

This diagram illustrates the production deployment on AWS, featuring containerized services behind a reverse proxy.

```mermaid
graph TD
    subgraph ClientLayer [Client Layer]
        User((User Browser))
        ScannerApp[[local_scanner Tool]]
    end

    subgraph Infrastructure [AWS EC2 Instance]
        NGINX[NGINX Reverse Proxy]
        
        subgraph DockerEnvironment [Dockerized Environment]
            Frontend[Next.js Frontend]
            Backend[FastAPI Backend]
            Workers[Async Workers<br/>'OCR Processing & Archival']
            Redis[(Redis)]
        end
    end

    subgraph StorageLayer [Hybrid Storage Approach]
        S3{{AWS S3<br/>'Cloud Archiving'}}
        LocalStorage[(Local Volume<br/>'Temporary/Local')]
    end

    subgraph DataLayer [Data Persistence]
        DB[(PostgreSQL Database)]
        SQLite[(SQLite<br/>'Local Dev Only')]
    end

    User -->|HTTPS| NGINX
    ScannerApp -->|API / HTTPS| NGINX
    
    NGINX -->|Route: /| Frontend
    NGINX -->|Route: /api| Backend
    
    Backend <-->|Cache / Queue| Redis
    Redis <--> Workers
    
    Backend <--> DB
    Backend <--> S3
    Backend <--> LocalStorage
    
    style NGINX fill:#f9f,stroke:#333,stroke-width:2px
    style DockerEnvironment fill:#e1f5fe,stroke:#01579b,stroke-dasharray: 5 5
```

## 2. Authentication & Security Flow

Secure session management using HttpOnly Cookies and centralized JWT validation.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant NGINX
    participant Backend
    participant DB

    User->>Frontend: Enter Credentials
    Frontend->>NGINX: POST /api/auth/token
    NGINX->>Backend: Forward to Auth Router
    Backend->>DB: Verify User & Organization
    DB-->>Backend: User Records
    
    Note over Backend: Generate JWT with Session ID
    
    Backend-->>NGINX: HTTP 200 + Set-Cookie (HttpOnly)
    NGINX-->>Frontend: Success Response
    
    Note over Frontend: Session Monitor Starts
    
    User->>Frontend: Perform Action
    Frontend->>NGINX: API Request (Cookie attached)
    NGINX->>Backend: Forward Request
    Note over Backend: Validate Token from Cookie
    Backend-->>User: Authorized Content
```

## 3. Patient Record & Document Flow

The dual-path upload strategy for manual and automated digitization.

```mermaid
flowchart TD
    subgraph PathA [Path A: Manual Upload]
        Browser[User Browser] -->|Upload UI| BackendAPI[FastAPI Backend]
    end

    subgraph PathB [Path B: Automated Digitization]
        Scanner[Physical Box] -->|Scan| LocalTool[local_scanner app]
        LocalTool -->|Auth & Batch Push| BackendAPI
    end

    subgraph Processing [Backend Processing]
        BackendAPI --> Metadata[Save Records to PostgreSQL]
        BackendAPI --> Archive[Push to AWS S3 Archival]
        BackendAPI --> OCR[Trigger OCR Worker]
    end

    OCR -->|Refined Metadata| Metadata
    
    style PathA fill:#fff9c4,stroke:#fbc02d
    style PathB fill:#c8e6c9,stroke:#388e3c
```

## 4. Backend Request Lifecycle

Internal processing of API requests from middleware to database.

```mermaid
graph LR
    Req((Request)) --> Sec[Security Middleware<br/>'Rate Limit / CSRF']
    Sec --> Bandwidth[Bandwidth Monitor]
    Bandwidth --> Router{Router Selection}
    
    Router -->|/patients| PR[Patient Router]
    Router -->|/storage| SR[Storage Router]
    Router -->|/billing| AR[Accounting Router]
    
    PR & SR & AR --> Logic[Business Logic / Service]
    Logic --> Persistence[(DB / S3 / Local)]
    Logic -.->|Task Delay| Redis[(Redis Queue)]
```
