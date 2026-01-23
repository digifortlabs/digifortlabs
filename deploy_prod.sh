#!/bin/bash

# DigiFort Labs - "One-Click" Production Deployment (ROBUST v3)
# -----------------------------------------------------------
# This script ensures the server exactly matches the repository.
# Usage: ./deploy_prod.sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Define root directory (ensure we are in the project root)
PROJECT_ROOT="/home/ec2-user/digifortlabs"
echo "🚀 Starting Deployment in $PROJECT_ROOT"

# --- 0. FORCE GIT SYNC ---
echo "🔄 [0/6] Syncing with Repository (origin/master)..."
cd $PROJECT_ROOT
git fetch origin
git reset --hard origin/master
echo "✅ Git Sync Complete. Current commit: $(git rev-parse --short HEAD)"

# --- 1. SYSTEM CLEANUP ---
echo "🧹 [1/6] Cleaning legacy files & artifacts..."
# Specific cleanup for items being removed in this version
rm -rf Logo .vscode .agent .gemini digifortlabs.db
rm -rf check_users.py manual_setup.sh run_local.bat setup_ssl.sh fix_deployment.sh
rm -rf backend/tests frontend/__tests__

# System-wide cleanup
sudo dnf clean all
rm -rf ~/.cache ~/.npm
if command -v docker &> /dev/null; then sudo docker system prune -f; fi

# Dependency Check (Node 20 & Python)
CURRENT_NODE=$(node -v 2>/dev/null || echo "not found")
if [[ "$CURRENT_NODE" != v20* ]]; then
    echo "📦 Installing/Upgrading Node.js to v20..."
    sudo dnf remove -y nodejs || true
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo dnf install -y nodejs
fi
sudo dnf install -y git python3 python3-pip nginx augeas-libs unzip mesa-libGL poppler-utils
if ! command -v pm2 &> /dev/null; then sudo npm install -g pm2; fi

# --- 2. FRONTEND DEPLOYMENT ---
echo "🎨 [2/6] Building Frontend..."
cd $PROJECT_ROOT/frontend

# Kill existing process and free port 3000
pm2 delete frontend 2>/dev/null || true
sudo fuser -k 3000/tcp 2>/dev/null || true

# Build
rm -rf node_modules .next
# Auto-detect Public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
echo "🌍 Server Public IP: $PUBLIC_IP"

# CRITICAL: Always use HTTPS Domain for API to prevent "Mixed Content" errors
API_URL="https://digifortlabs.com/api"

# Configure CORS to allow access from Domain AND Public IP (for testing)
if [ -z "$PUBLIC_IP" ]; then
    ORIGINS="[\"http://localhost:3000\",\"https://digifortlabs.com\"]"
else
    # Allow port 3000 (dev access) and port 80 (nginx access)
    ORIGINS="[\"http://localhost:3000\",\"https://digifortlabs.com\",\"http://$PUBLIC_IP:3000\",\"http://$PUBLIC_IP\"]"
fi

echo "NEXT_PUBLIC_API_URL=$API_URL" > .env.production
export NEXT_PUBLIC_API_URL=$API_URL

npm install
npm run build

# Start with PM2
pm2 start npm --name "frontend" -- start
echo "✅ Frontend is Live on port 3000."

# --- 3. BACKEND DEPLOYMENT ---
echo "⚙️  [3/6] Setting up Backend..."
cd $PROJECT_ROOT/backend

# Preserve existing AWS Keys if configured manually
EXISTING_ID=""
EXISTING_SECRET=""
if [ -f .env ]; then
    echo "🔍 Checking for existing AWS credentials in .env..."
    EXISTING_ID=$(grep "^AWS_ACCESS_KEY_ID=" .env | cut -d'=' -f2)
    EXISTING_SECRET=$(grep "^AWS_SECRET_ACCESS_KEY=" .env | cut -d'=' -f2)
fi

# Kill existing process and free port 8000
pm2 delete backend 2>/dev/null || true
sudo fuser -k 8000/tcp 2>/dev/null || true

# Virtual Env & Dependencies
if [ ! -d ".venv" ]; then python3 -m venv .venv; fi
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# --- 4. BACKEND CONFIGURATION (.env) ---
echo "📝 [4/6] Verifying Backend Configuration..."

# Check if .env exists
if [ -f .env ]; then
    echo "✅ Using existing .env file."
    
    # Ensure BACKEND_CORS_ORIGINS is up to date (append if missing or just warn?)
    # ideally we trust the server env. checking/updating CORS might be useful though.
    # For now, we trust the user's statement that "env is set".
else
    echo "⚠️  No .env file found in backend/ directory!"
    echo "   Expecting environment variables to be set on the server."
    
    # Optional: Generate a minimal .env from current shell ENV if needed by the app
    # but normally python-dotenv or os.environ handles this.
    # We will assume the server is correctly configured as per user instruction.
fi


# --- 5. DATABASE SCHEMA SYNC ---
# echo "🛠️  [5/6] Syncing Database Schema..."
# python fix_db_schema.py || echo "⚠️ Warning: Schema check skipped or failed."


# --- 6. LAUNCH BACKEND & NGINX ---
echo "🚀 [6/6] Finalizing Launch..."
UVICORN_CMD="$PROJECT_ROOT/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips '*'"
pm2 start "$UVICORN_CMD" --name "backend"

# Save PM2 state
pm2 save

# Restart Nginx
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "---------------------------------------------------"
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "---------------------------------------------------"
echo "URL: https://digifortlabs.com"
echo "---------------------------------------------------"
pm2 status
