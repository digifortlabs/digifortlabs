#!/bin/bash

# ==============================================================================
# DIGIFORT LABS - SMART CLOUD DEPLOYMENT (Update & Fix)
# ==============================================================================

# ----------------- CONFIGURATION -----------------
# URLs
API_URL="https://digifortlabs.com/api"
WEB_URL="https://digifortlabs.com"
# -------------------------------------------------

echo "=========================================="
echo "   DIGIFORT LABS - PRODUCTION UPDATE"
echo "=========================================="

# 1. SYSTEM DEPENDENCIES (OS Detection)
echo ""
echo "[1/7] Checking System Dependencies..."

if command -v apt-get &> /dev/null; then
    # Ubuntu / Debian
    echo "Detected: apt-get (Ubuntu/Debian)"
    sudo apt-get update -y
    sudo apt-get install -y tesseract-ocr poppler-utils ffmpeg libsm6 libxext6 python3-pip
    
elif command -v yum &> /dev/null; then
    # Amazon Linux / CentOS
    echo "Detected: yum (Amazon Linux)"
    # Quietly try update/install to save time on repeate runs
    sudo yum update -y -q
    sudo amazon-linux-extras install epel -y 2>/dev/null
    sudo yum install -y tesseract poppler-utils python3-pip || echo "Warning: Some packages failed to install. Continuing..."

elif command -v dnf &> /dev/null; then
     # Amazon Linux 2023 / Fedora
    echo "Detected: dnf (Amazon Linux 2023)"
    sudo dnf update -y -q
    sudo dnf install -y tesseract poppler-utils python3-pip || echo "Warning: Some packages failed to install. Continuing..."
else
    echo "⚠️  Unknown Package Manager. Skipping system dependency install."
fi

# 2. CREDENTIALS CHECK (The Smart Part)
echo ""
echo "[2/7] Checking Configuration..."

SKIP_ENV_GEN=false
if [ -f "backend/.env" ]; then
    echo "✅ Existing configuration found on server."
    echo "   Using credentials from backend/.env"
    SKIP_ENV_GEN=true
else
    echo "⚠️  No configuration found. Starting Interactive Setup..."
    
    # Defaults
    DB_USER="postgres"
    DB_PASS=""
    AWS_KEY=""
    AWS_SECRET=""
    AWS_BUCKET="digifort-labs-files"
    
    # DATABASE (RDS)
    DB_HOST="digifort-db.crs4e62wi3w2.ap-south-1.rds.amazonaws.com"
    DB_PORT="5432"

    # Ask for DB Password
    read -s -p "Enter Database Password (for $DB_USER): " DB_PASS
    echo ""

    # Ask for AWS Keys
    read -p "Enter AWS Access Key ID (Leave empty to skip): " AWS_KEY
    if [ ! -z "$AWS_KEY" ]; then
        read -s -p "Enter AWS Secret Key: " AWS_SECRET
        echo ""
    fi
    
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/postgres"
fi

echo ""
echo "[3/7] Stopping Existing Services..."
pkill -f uvicorn || echo " - No Backend running."
pkill -f "next-server" || echo " - No Frontend running."
pkill -f "npm start" || echo " - No NPM process running."

echo ""
echo "[4/7] Updating Codebase..."
git fetch --all
git reset --hard origin/master

# ================= BACKEND SETUP =================
echo ""
echo "[5/7] Configuring Backend..."
cd backend

# Only create .env if we are NOT skipping generation
if [ "$SKIP_ENV_GEN" = false ]; then
    echo "Generating new .env file..."
    cat <<EOF > .env
PROJECT_NAME="Digifort Labs"
ENVIRONMENT="production"
BACKEND_URL="${API_URL}"
FRONTEND_URL="${WEB_URL}"
DATABASE_URL="${DATABASE_URL}"
AWS_ACCESS_KEY_ID="${AWS_KEY}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET}"
AWS_REGION="ap-south-1"
AWS_BUCKET_NAME="${AWS_BUCKET}"
SECRET_KEY="$(openssl rand -hex 32)"
EOF
else
    echo "Skipping .env generation (Existing preserved)."
fi

# Install Python Deps
pip3 install -r requirements.txt > /dev/null 2>&1
echo " - Python Dependencies Installed."

# Migrate Data (Only if local DB exists and we are not just updating)
if [ -f "digifortlabs.db" ]; then
    echo " - Found local DB. Migrating to RDS..."
    pip3 install sqlalchemy psycopg2-binary > /dev/null 2>&1
    # We might need to pull the DB URL from the source if we didn't generate it
    # But migrate_db will default to .env if env var not passed, so this command might fail if var empty
    # For safety, we rely on the .env being loaded by python-dotenv inside the app/script
    python3 migrate_db.py
fi

# Start Backend
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
echo " - Backend Started (Port 8000)."

# ================= FRONTEND SETUP =================
echo ""
echo "[6/7] Configuring Frontend..."
cd ../frontend

# Create Frontend .env (Safe to always recreate as it's static)
cat <<EOF > .env.production
NEXT_PUBLIC_API_URL=${API_URL}
EOF

echo "[7/7] Building Frontend (This may take time)..."
# Clean previous build to prevent caching issues (Fixes 404s)
rm -rf .next
npm install --legacy-peer-deps > /dev/null 2>&1
npm run build

echo "Starting Frontend..."
# Start Next.js on Port 3000
nohup npm start -- -p 3000 > frontend.log 2>&1 &
echo " - Frontend Started (Port 3000)."

echo ""
echo "=========================================="
echo "   ✅ UPDATE COMPLETE"
echo "   - Web: ${WEB_URL}"
echo "   - API: ${API_URL}"
echo "=========================================="
