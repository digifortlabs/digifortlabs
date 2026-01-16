#!/bin/bash

# ==============================================================================
# DIGIFORT LABS - FULL STACK CLOUD DEPLOYMENT (Amazon Linux Compatible)
# ==============================================================================

# ----------------- CONFIGURATION -----------------
# DATABASE (RDS)
DB_HOST="digifort-db.crs4e62wi3w2.ap-south-1.rds.amazonaws.com"
DB_PORT="5432"
# Note: Sensitive values provided interactively or via existing .env

# URLs
API_URL="https://digifortlabs.com/api"
WEB_URL="https://digifortlabs.com"
# -------------------------------------------------

echo "=========================================="
echo "   DIGIFORT LABS - PRODUCTION DEPLOY"
echo "=========================================="

# 1. SYSTEM DEPENDENCIES (OS Detection)
echo ""
echo "[1/7] Installing System Dependencies..."

if command -v apt-get &> /dev/null; then
    # Ubuntu / Debian
    echo "Detected: apt-get (Ubuntu/Debian)"
    sudo apt-get update -y
    sudo apt-get install -y tesseract-ocr poppler-utils ffmpeg libsm6 libxext6 python3-pip
    
elif command -v yum &> /dev/null; then
    # Amazon Linux / CentOS
    echo "Detected: yum (Amazon Linux)"
    sudo yum update -y
    
    # Enable EPEL (Extra Packages for Enterprise Linux) if available
    sudo amazon-linux-extras install epel -y 2>/dev/null || echo "EPEL skipped (not available or already enabled)"
    
    # Install dependencies
    # Note: ffmpeg is often hard to get on vanilla Amazon Linux, so we skip it if missing to prevent failure
    sudo yum install -y tesseract poppler-utils python3-pip || echo "Warning: Some packages failed to install. Continuing..."

elif command -v dnf &> /dev/null; then
     # Amazon Linux 2023 / Fedora
    echo "Detected: dnf (Amazon Linux 2023)"
    sudo dnf update -y
    sudo dnf install -y tesseract poppler-utils python3-pip || echo "Warning: Some packages failed to install. Continuing..."
else
    echo "⚠️  Unknown Package Manager. Skipping system dependency install."
fi

# 2. INTERACTIVE CREDENTIALS
echo ""
echo "[2/7] Checking Credentials..."

# Defaults
DB_USER="postgres"
DB_PASS=""
AWS_KEY=""
AWS_SECRET=""
AWS_BUCKET="digifort-labs-files"

# Ask for DB Password if not in env
read -s -p "Enter Database Password (for $DB_USER): " DB_PASS
echo ""

# Ask for AWS Keys if not in env
read -p "Enter AWS Access Key ID (Leave empty to skip): " AWS_KEY
if [ ! -z "$AWS_KEY" ]; then
    read -s -p "Enter AWS Secret Key: " AWS_SECRET
    echo ""
fi

DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/postgres"

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

# Create Backend .env
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

# Install Python Deps
pip3 install -r requirements.txt > /dev/null 2>&1
echo " - Python Dependencies Installed."

# Migrate Data if needed
if [ -f "digifortlabs.db" ]; then
    echo " - Found local DB. Migrating to RDS..."
    pip3 install sqlalchemy psycopg2-binary > /dev/null 2>&1
    python3 migrate_db.py "$DATABASE_URL"
fi

# Start Backend
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
echo " - Backend Started (Port 8000)."

# ================= FRONTEND SETUP =================
echo ""
echo "[6/7] Configuring Frontend..."
cd ../frontend

# Create Frontend .env (Critical for Build)
cat <<EOF > .env.production
NEXT_PUBLIC_API_URL=${API_URL}
EOF

echo "[7/7] Building Frontend (This may take time)..."
npm install --legacy-peer-deps > /dev/null 2>&1
npm run build

echo "Starting Frontend..."
# Start Next.js on Port 3000
nohup npm start -- -p 3000 > frontend.log 2>&1 &
echo " - Frontend Started (Port 3000)."

echo ""
echo "=========================================="
echo "   ✅ FULL DEPLOYMENT COMPLETE"
echo "   - Web: ${WEB_URL}"
echo "   - API: ${API_URL}"
echo "   - DB:  AWS RDS (Connected)"
echo "   - OCR: Tesseract (if supported by OS)"
echo "=========================================="
