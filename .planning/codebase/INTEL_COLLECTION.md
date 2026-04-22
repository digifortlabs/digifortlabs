# Integrations

## External Services
- **AWS S3**: Used for object storage. Keypair and PEM files in the root suggest direct interaction or sync via scripts.
- **PostgreSQL**: Primary database. Connected via `psycopg2`.

## Internal Bridges
- **JWT**: Cross-layer authentication between Flask and Next.js.
- **REST API**: Standard interface between frontend and backend.
- **S3 Sync**: Scripts exist to fetch/sync live code and assets from cloud environments.
<!-- slide -->
# Coding Conventions

## Style Guides
- **Frontend**: Follows TypeScript and React best practices. Components are likely functional with hooks. Tailwind CSS used for styling.
- **Backend**: Standard Python/PEP8 conventions. Flask blueprints likely used for modularity.

## Patterns
- **API**: RESTful endpoints.
- **State Management**: React `useState`/`useEffect` (Standard) or Context API.
- **Styling**: Utility-first CSS via Tailwind.
<!-- slide -->
# Testing Strategy

## Frameworks
- **Frontend**: Jest and React Testing Library (from `package.json`).
- **Backend**: Python `coverage` package indicates testing culture. Likely uses `unittest` or `pytest`.

## Coverage
- Test files detected in `frontend` (e.g., `src/__tests__` or similar).
- Backend scripts like `check_db_*.py` serve as functional health checks.
<!-- slide -->
# Identified Concerns

## 1. Environment Parity
The existence of `fetch_live_code.ps1` and multiple PEM files suggests a critical dependency on synchronization between local and live environments.

## 2. Dependency Management
- Frontend uses `package.json` (npm/yarn).
- Backend uses `requirements.txt` (pip).

## 3. Deployment Complexity
The deployment process involves multiple shell and batch scripts, Docker, and Nginx. This increases the surface area for configuration drift.

## 4. Security
PEM keys and sensitive scripts are present in the root. These must be handled with caution and excluded from public version control.
