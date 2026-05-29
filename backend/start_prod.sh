#!/bin/sh
set -e

# Run migrations (if any)
# python app/main.py migrate  <-- if you had a migration command

# Activate virtual environment to use Python 3.11+ and its dependencies
if [ -d "venv" ]; then
    . venv/bin/activate
fi

# Start Gunicorn with Uvicorn workers
exec gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
