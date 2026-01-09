#!/bin/bash

# DigiFort Labs - "One-Click" Production Deployment
# -----------------------------------------------
# This script sets up BOTH Frontend and Backend from scratch.
# Usage: ./deploy_prod.sh

# 0. ENSURE LATEST CODE
echo "⬇️ [0/6] Pulling latest changes..."
git pull
if [ $? -ne 0 ]; then
    echo "⚠️ Git pull failed. Continuing with current code..."
fi

# --- 1. SYSTEM PREP & CLEANUP ---
echo "🧹 [1/6] Cleaning System & Checking Dependencies..."
sudo dnf clean all
rm -rf ~/.cache ~/.npm
# Prune docker to ensure space (if exists)
if command -v docker &> /dev/null; then sudo docker system prune -a -f; fi

# Install Node.js 20 (if not correct version)
CURRENT_NODE=$(node -v 2>/dev/null)
if [[ "$CURRENT_NODE" != v20* ]]; then
    echo "📦 Upgrading Node.js to v20..."
    sudo dnf remove -y nodejs
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo dnf install -y nodejs
fi

# Install Python & Git & Nginx
sudo dnf install -y git python3 python3-pip nginx augeas-libs

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then sudo npm install -g pm2; fi

echo "✅ System Ready. Node: $(node -v), Python: $(python3 --version)"


# --- 2. FRONTEND SETUP ---
echo "🎨 [2/6] Building Frontend..."
cd ~/digifortlabs/frontend || exit

# Clean install
rm -rf node_modules .next

# Force Production Environment Variables
echo "NEXT_PUBLIC_API_URL=https://digifortlabs.com/api" > .env.production
echo "✅ Created frontend/.env.production"

npm install
npm run build

# Start Frontend Config check
if [ ! -f "src/config/api.ts" ]; then
    echo "⚠️ Warning: config/api.ts not found, check git pull."
fi

# Start with PM2
pm2 delete frontend 2>/dev/null || true
pm2 start npm --name "frontend" -- start
echo "✅ Frontend Running."


# --- 3. BACKEND SETUP ---
echo "⚙️  [3/6] Setting up Backend..."
cd ~/digifortlabs/backend || exit

# Setup Virtual Env
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

# Install Requirements
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# --- 4. CREATE .ENV FILE (AUTOMATICALLY) ---
echo "📝 [4/6] configuring Database Credentials..."
cat > .env <<EOF
# LIVE PRODUCTION CONFIG - Created by deploy_prod.sh
POSTGRES_USER=postgres
POSTGRES_PASSWORD=Keva!2902
POSTGRES_SERVER=digifort-demo-db.crs4e62wi3w2.ap-south-1.rds.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_DB=postgres
DATABASE_URL=postgresql://postgres:Keva%212902@digifort-demo-db.crs4e62wi3w2.ap-south-1.rds.amazonaws.com:5432/postgres?sslmode=require

SECRET_KEY=production_key_digifort_redeploy_2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
EOF
echo "✅ .env file created."

# --- 5. START BACKEND WITH PM2 ---
echo "🚀 [5/6] Launching Backend..."
# We use the full path to uvicorn inside venv
UVICORN_CMD="/home/ec2-user/digifortlabs/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000"

pm2 delete backend 2>/dev/null || true
pm2 start "$UVICORN_CMD" --name "backend"

# Save PM2 list so they resurrect on reboot
pm2 save
# Ensure PM2 starts on boot (user usually needs to run the output command manually once, but we try)
# pm2 startup | tail -n 1 | bash 2>/dev/null || true 

echo "✅ Backend Running on Port 8000."


# --- 6. CHECK NGINX ---
echo "🌐 [6/6] Checking Nginx..."
sudo systemctl enable nginx
sudo systemctl restart nginx


echo "---------------------------------------------------"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "---------------------------------------------------"
echo "Frontend: https://digifortlabs.com"
echo "Backend:  https://digifortlabs.com/api/docs"
echo "PM2 Status: (Run 'pm2 status' to view)"
echo "---------------------------------------------------"
