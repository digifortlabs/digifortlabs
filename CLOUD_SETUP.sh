#!/bin/bash

# ==============================================================================
# DIGIFORT LABS - CLOUD DEPLOYMENT SCRIPT (Interactive)
# ==============================================================================

# HARDCODED DATABASE CREDENTIALS (As provided by User)
DB_HOST="digifort-db.crs4e62wi3w2.ap-south-1.rds.amazonaws.com"
DB_PORT="5432"
DB_USER="postgres"
DB_PASS="ZPN30ajJy87jAUdH"
DB_NAME="postgres"

# DATABASE CONNECTION STRING
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "=========================================="
echo "   DIGIFORT LABS - FINAL CLOUD SETUP"
echo "=========================================="

# 1. FETCH LATEST CODE
echo ""
echo "[1/5] Updating Codebase..."
git fetch --all
git reset --hard origin/master

# 2. GATHER S3 CREDENTIALS (INTERACTIVE)
echo ""
echo "[2/5] Configuring S3 Storage..."
echo "To enable file uploads, please enter your AWS Credentials."
echo "Press [ENTER] if you want to skip (Uploads will fail)."

read -p "AWS Access Key ID: " AWS_KEY
read -p "AWS Secret Access Key: " AWS_SECRET
read -p "S3 Bucket Name (default: digifort-labs-files): " AWS_BUCKET
AWS_BUCKET=${AWS_BUCKET:-digifort-labs-files}

# 3. CREATE .ENV FILE
echo ""
echo "[3/5] Generating Configuration..."
cd backend

cat <<EOF > .env
PROJECT_NAME="Digifort Labs"
ENVIRONMENT="production"
BACKEND_URL="https://digifortlabs.com/api"
FRONTEND_URL="https://digifortlabs.com"

# DATABASE (RDS)
DATABASE_URL="${DATABASE_URL}"

# AWS S3 (Storage)
AWS_ACCESS_KEY_ID="${AWS_KEY}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET}"
AWS_REGION="ap-south-1"
AWS_BUCKET_NAME="${AWS_BUCKET}"

# SECURITY (Generated Randomly)
SECRET_KEY="$(openssl rand -hex 32)"
EOF

echo ".env file created successfully."

# 4. DATA MIGRATION
echo ""
echo "[4/5] Migrating Data (Local -> RDS)..."
if [ -f "digifortlabs.db" ]; then
    echo "Found local SQLite database. Attempting migration..."
    # Install sqlalchemy for migration script
    pip3 install sqlalchemy psycopg2-binary
    python3 migrate_db.py "$DATABASE_URL"
else
    echo "No local database found. Skipping migration."
fi

# 5. RESTART SERVER
echo ""
echo "[5/5] Restarting Application..."
pkill -f uvicorn || echo "No existing process killed."

# Install all dependencies
pip3 install -r requirements.txt > /dev/null 2>&1

# Run in background
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

echo ""
echo "=========================================="
echo "   ✅ DEPLOYMENT COMPLETE"
echo "   - Status: LIVE"
echo "   - Database: AWS RDS"
echo "   - Storage: S3 ($AWS_BUCKET)"
echo "=========================================="
