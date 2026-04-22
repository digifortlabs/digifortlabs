# Architecture Overview

## Layout
The project follows a standard decoupled Mono-Repo structure with a clear separation between the presentation layer (Frontend) and the logic/data layer (Backend).

## Communication Flow
1.  **Client Request**: Enters through the Nginx proxy (port 80/443).
2.  **Routing**: Nginx routes traffic to the Next.js frontend or the Flask API based on the URI path.
3.  **Frontend (Next.js)**: Serves the React application. Interacts with the Backend API via asynchronous HTTP requests.
4.  **Backend (Flask)**: Processes business logic, authenticates users (JWT), and interacts with the persistent storage.
5.  **Storage**:
    *   **PostgreSQL**: Structured data (User records, metadata).
    *   **AWS S3**: Unstructured binary data (Reports, uploads).

## Component Responsibilities
- **Frontend**: Navigation, data visualization (Recharts), report generation (jspdf), and user interaction.
- **Backend**: API endpoints, database migrations, and cloud storage integration.
- **Scripts**: Automation of maintenance and synchronization tasks.
