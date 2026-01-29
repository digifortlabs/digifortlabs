#!/bin/bash

# DigiFort Labs - "One-Click" Production Deployment (STRATEGIC v4)
# -----------------------------------------------------------
# Verified for AWS EC2 Deployment | RDS PostgreSQL | S3 Storage
# -----------------------------------------------------------

# Exit immediately if a command exits with a non-zero status.
set -e

# Define root directory
PROJECT_ROOT="/home/ec2-user/digifortlabs"
echo "🚀 [START] Beginning Deployment Sequence for DIGIFORT LABS"
echo "📅 Time: $(date)"

# --- 0. PRE-FLIGHT CHECK & BACKUP ---
echo "🔒 [0/7] Securing Environment & Local Backups..."
cd $PROJECT_ROOT

# Create persistent backup directory
mkdir -p .deploy_backups/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=".deploy_backups/$(date +%Y%m%d_%H%M%S)"

if [ -f .env ]; then cp .env "$BACKUP_DIR/root.env"; echo "✅ Root .env backed up to $BACKUP_DIR"; fi
if [ -f backend/.env ]; then cp backend/.env "$BACKUP_DIR/backend.env"; echo "✅ Backend .env backed up to $BACKUP_DIR"; fi

# --- 1. SOURCE SYNC ---
echo "🔄 [1/7] Syncing with Repository (origin/master)..."
git fetch origin
git reset --hard origin/master
git clean -fd

# Restore active environment files
if [ -f "$BACKUP_DIR/root.env" ]; then cp "$BACKUP_DIR/root.env" .env; fi
if [ -f "$BACKUP_DIR/backend.env" ]; then cp "$BACKUP_DIR/backend.env" backend/.env; fi

echo "✅ Source sync complete. Commit: $(git rev-parse --short HEAD)"

# --- 2. SYSTEM CLEANUP ---
echo "🧹 [2/7] Purging cache and legacy artifacts..."
rm -rf Logo .vscode .agent .gemini digifortlabs.db
rm -rf check_users.py manual_setup.sh run_local.bat setup_ssl.sh fix_deployment.sh
rm -rf backend/tests frontend/__tests__

# System-wide purge
sudo dnf clean all
rm -rf ~/.cache ~/.npm
npm cache clean --force || true
find . -type d -name "__pycache__" -exec rm -rf {} +
sudo rm -rf /tmp/* || true

# --- 3. DEPENDENCY VALIDATION ---
echo "📦 [3/7] Validating System Dependencies..."
# Ensure Python 3.11+ and Node 20
sudo dnf install -y git python3-pip nginx augeas-libs unzip mesa-libGL poppler-utils tesseract

# Node.js 20 check
CURRENT_NODE=$(node -v 2>/dev/null || echo "not found")
if [[ "$CURRENT_NODE" != v20* ]]; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo dnf install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then sudo npm install -g pm2; fi

# --- 4. FRONTEND BUILD ---
echo "🎨 [4/7] Building Optimized Frontend..."
cd $PROJECT_ROOT/frontend

# Kill existing process to free memory for build
pm2 stop frontend 2>/dev/null || true

# Build configuration
API_URL="https://digifortlabs.com/api"
echo "NEXT_PUBLIC_API_URL=$API_URL" > .env.production
export NEXT_PUBLIC_API_URL=$API_URL

npm install --frozen-lockfile || npm install
npm run build

# Start with PM2
pm2 start npm --name "frontend" -- start || pm2 restart frontend
echo "✅ Frontend build successfully deployed."

# --- 5. BACKEND SETUP ---
echo "⚙️  [5/7] Configuring Backend Environment..."
cd $PROJECT_ROOT/backend

# Virtual Environment Management
if [ ! -d ".venv" ]; then 
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Database Connectivity Test (Ensuring RDS is reachable)
echo "🐘 Testing RDS Database Connectivity..."
# We use a simple python command to check if we can connect
python3 -c "import os; from app.database import engine; conn = engine.connect(); print('Database connection SUCCESS'); conn.close()" || { echo "❌ ERROR: Database (RDS) unreachable. Check .env and AWS SG."; exit 1; }

# --- 6. LAUNCH SERVICES ---
echo "🚀 [6/7] Finalizing System Launch..."

# Backend Command with Proxy Headers for Production
UVICORN_CMD="$PROJECT_ROOT/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips '*'"
pm2 delete backend 2>/dev/null || true
pm2 start "$UVICORN_CMD" --name "backend"

# Nginx Validation & Reload
echo "🛡️ Validating Nginx Configuration..."
sudo nginx -t && sudo systemctl restart nginx || { echo "❌ Nginx validation failed!"; exit 1; }

pm2 save

# --- 7. POST-DEPLOYMENT HEALTH CHECK ---
echo "🏥 [7/7] Performing Health Check..."
sleep 12 # Increased warm-up time

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://digifortlabs.com/api/platform/health || echo "fail")

if [ "$HEALTH_CHECK" == "200" ]; then
    echo "---------------------------------------------------"
    echo "✨ DEPLOYMENT SUCCESSFUL! SYSTEM LIVE"
    echo "---------------------------------------------------"
    echo "URL: https://digifortlabs.com"
    echo "Commit: $(git rev-parse --short HEAD)"
else
    echo "⚠️  WARNING: Health check returned $HEALTH_CHECK. System may still be starting or failed."
    echo "🔍 Fetching last 50 lines of Backend Logs..."
    pm2 logs backend --lines 50 --no-daemon
fi

pm2 status

df -h