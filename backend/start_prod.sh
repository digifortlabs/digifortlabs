#!/bin/bash

# Exit on error
set -e

# Only wait for DB if DB_HOST is set to 'db' (for docker-compose)
if [ "$DB_WAIT_ENABLED" = "true" ]; then
  echo "Waiting for database..."
  while ! pg_isready -h db -p 5432 -U postgres; do
    sleep 2
  done
  echo "Database is ready!"
fi

# Run migrations if necessary (assuming Alembic or similar is set up, 
# otherwise we rely on Base.metadata.create_all in main.py for now)
# python -m app.migrations.run

echo "Starting Gunicorn..."
# Use Gunicorn with Uvicorn workers for production
exec gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --access-logfile - \
    --error-logfile -
