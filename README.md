# THE DIGIFORT LABS - Hospital PDF Archival Platform

## Key Features (Pilot Phase)
- **Hybrid Storage**: Unified view of Physical Boxes (Warehouse) and Digital Files (Cloud).
- **Physical Warehouse**: Track box locations, check-in/out status, and request physical retrievals.
- **Smart Analytics**: "Space Saved" calculator showing ROI from digitization.
- **OCR Search**: Search functionality for document content (e.g., "Pneumonia").
- **Security**: JWT Authentication for Hospital Admins.

## Prerequisites
- Python 3.9+
- Node.js 18+
- SQLite (Included via Python)

## Quick Start (Production)
Run the automated start script for Windows:
```bash
start_production.bat
```
*(See `handoff.md` for detailed manual setup)*


## Architecture
- **Backend:** FastAPI (Python) - Port 8001
- **Frontend:** Next.js 15 + Tailwind CSS - Port 3000
- **Database:** SQLite (Dev) -> PostgreSQL (Prod)

> **Full Documentation**: See [handoff.md](./handoff.md) for architecture, security details, and roadmap.
