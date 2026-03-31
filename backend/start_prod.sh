#!/bin/sh
set -e

# Run migrations (if any)
# python app/main.py migrate  <-- if you had a migration command

# Start Gunicorn with Uvicorn workers
exec gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
