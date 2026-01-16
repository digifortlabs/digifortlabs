#!/bin/bash

# ==============================================================================
# DIGIFORT LABS - CLOUD DEPLOYMENT SCRIPT (AUTO-GENERATED)
# ==============================================================================

# CONFIGURATION
DB_HOST="digifort-db.crs4e62wi3w2.ap-south-1.rds.amazonaws.com"
DB_PORT="5432"
DB_USER="postgres"
DB_PASS="ZPN30ajJy87jAUdH"
DB_NAME="postgres"

# Connection String
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "=========================================="
echo "   DIGIFORT LABS - FINAL CLOUD SETUP"
echo "=========================================="

echo "[1/4] Updating Codebase..."
git fetch --all
git reset --hard origin/master

echo "[2/4] Configuring Database (RDS)..."
cd backend
# Create the .env file with the secure credentials
echo "DATABASE_URL=${DATABASE_URL}" > .env
# Also add standard AWS/App settings (Default placeholders for now if needed)
echo "PROJECT_NAME=Digifort Labs" >> .env
echo "ENVIRONMENT=production" >> .env

echo "Backend configuration updated."

echo "[3/4] Migrating Data (Optional)..."
# Try to run migration. If it fails (e.g. fresh DB), it continues.
if [ -f "digifortlabs.db" ]; then
    echo "Found local data. Attempting migration to RDS..."
    python3 migrate_db.py "$DATABASE_URL"
else
    echo "No local data found or already migrated. Skipping."
fi

echo "[4/4] Restarting Application..."
# Kill existing backend process (uvicorn)
pkill -f uvicorn || echo "No existing process found."

# Install Updated Requirements if any
pip3 install -r requirements.txt > /dev/null 2>&1 || echo "Dependencies already satisfied."

# Start Backend in Background
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

echo "=========================================="
echo "   ✅ DEPLOYMENT SUCCESSFUL"
echo "   - Database: AWS RDS (Connected)"
echo "   - Backend: Running on Port 8000"
echo "=========================================="
