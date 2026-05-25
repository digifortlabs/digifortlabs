# System Architecture

**Analysis Date:** 2026-05-11

## Architecture Overview

Digifort Labs is a modern medical records and healthcare management system built with a decoupled architecture consisting of a high-performance Python backend and a dynamic Next.js frontend.

## High-Level Patterns

- **Monolith-ish Backend**: While the frontend is modern and modular, the backend follows a structured monolithic pattern with clear separation of concerns (Routers -> Services -> Models).
- **App Router Frontend**: Leveraging Next.js 16 (React 19) for server-side rendering, client-side interactivity, and optimized routing.
- **Asynchronous Processing**: Uses Celery and Redis to handle long-running tasks like OCR, AI extraction, and email dispatch without blocking the main request-response cycle.

## Backend Architecture (`backend/`)

### 1. API Layer (FastAPI)
- **FastAPI** handles HTTP requests, validation (via Pydantic), and documentation.
- **Routers**: Modular route definitions organized by feature (Auth, Patient, Hospital, etc.).

### 2. Service Layer
- **Business Logic**: Encapsulated in `app/services/`.
- **Specialized Services**:
    - `AIService`: Interfaces with Google Gemini for structured data extraction.
    - `EmailService`: Handles all system communications via SMTP.
    - `Scanner/OCR Service`: Processes images and PDFs for text extraction.
    - `Storage Service`: Manages file uploads/downloads using AWS S3.

### 3. Data Layer (SQLAlchemy)
- **ORM**: SQLAlchemy for database interaction.
- **Models**: Centrally defined in `backend/app/models.py`.
- **Migrations**: Alembic manages schema changes.

## Frontend Architecture (`frontend/`)

### 1. UI Architecture
- **Next.js App Router**: Component-based architecture with nested layouts.
- **Client/Server Components**: Strategic use of Server Components for SEO and Client Components for high interactivity.

### 2. State Management
- **Local State**: `useState` and `useReducer` for component-level state.
- **Global State**: Likely React Context or specialized hooks for auth and theme.
- **Data Fetching**: Axios for API calls, likely combined with React hooks or custom wrappers.

### 3. Component System
- **Primitive UI**: Shadcn/UI (Radix UI + Tailwind) for consistent design tokens.
- **Feature Modules**: Organized folders in `src/components` for complex features (Scanner, Dental, HMS).

## Data Flow

1. **User Action**: User interacts with the Next.js dashboard (e.g., uploads a record).
2. **API Request**: Frontend sends an Axios request to the FastAPI backend.
3. **Auth Check**: Backend middleware verifies JWT token and permissions.
4. **Processing**: Router calls the appropriate Service (e.g., `StorageService.upload`).
5. **Async Task**: If processing is heavy (e.g., OCR), a Celery task is dispatched to Redis.
6. **Persistence**: Service updates the database via SQLAlchemy.
7. **Response**: Backend returns structured JSON to the frontend.
8. **UI Update**: Frontend updates state and reflects changes to the user.

## External Systems & Abstractions

- **Storage Abstraction**: S3 Handler provides a clean interface for cloud storage, allowing for local file system fallbacks if needed.
- **AI Abstraction**: `AIService` wraps Gemini API, making it easy to swap models or providers.
- **Database Abstraction**: SQLAlchemy allows switching between SQLite (dev) and PostgreSQL (prod) with minimal code changes.

---

*Architecture analysis: 2026-05-11*
*Update after significant architectural changes or adopting new core patterns*
