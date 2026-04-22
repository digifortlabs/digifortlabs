# Codebase Structure

## Directory Overview
- **`.git/`**: Version control history.
- **`.planning/`**: GSD planning assets (PROJECT.md, ROADMAP.md, codebase metadata).
- **`backend/`**: Python Flask API service.
  - Contains database migration scripts (`alter_db.py`), health checks (`check_db_*.py`), and core API logic.
- **`frontend/`**: Next.js 16 web application.
  - `src/` (implied): Component and page logic.
  - `public/`: Static assets.
- **`scripts/`**: DevOps and utility scripts.
  - `fetch_live_code.ps1`: Syncing live code from AWS.
  - `deploy.sh`: Production deployment script.
- **`local_scanner/`**: Auxiliary Python module for scanning tasks.
- **`nginx.conf.template`**: Configuration for the Nginx proxy.
- **`docker-compose.yml`**: Service orchestration for local and production environments.

## Entry Points
- **Frontend**: `npm run dev` (running on Next.js dev server).
- **Backend**: `flask run` or `gunicorn`.
- **Full Stack**: `docker-compose up`.
