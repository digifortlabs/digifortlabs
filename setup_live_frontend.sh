#!/bin/bash

# DigiFort Labs - Live Frontend "Repair & Setup" Script
# Usage: ./setup_live_frontend.sh

echo "🚀 Starting Repair & Setup..."

# 0. AGGRESSIVE CLEANUP (To fix Disk Full 100%)
echo "🧹 Cleaning up disk space..."
sudo dnf clean all
rm -rf ~/.cache
rm -rf ~/.npm
rm -rf ~/digifortlabs/frontend/node_modules

# Prune Docker if it exists (Major space saver)
if command -v docker &> /dev/null; then
    echo "🐳 Pruning unused Docker images to save space..."
    sudo docker system prune -a -f
fi

# 1. Update Node.js to Version 20 (Required for Next.js 16)
echo "📦 Updating Node.js to v20..."
# Remove old version first
sudo dnf remove -y nodejs
# Add NodeSource repo for v20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Verify Version
NODE_VER=$(node -v)
echo "✅ Installed Node.js: $NODE_VER"

# 2. Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# 3. Navigate to Frontend
cd ~/digifortlabs/frontend || exit

# 4. Pull Latest Code
echo "⬇️  Pulling latest code..."
git pull

# 5. Install Dependencies (Clean Install)
echo "📦 Installing Project Dependencies..."
# Use 'ci' for cleaner/faster install if package-lock exists, else regular install
npm install

# 6. Build the Project
echo "🏗️  Building Frontend... (This may take 1-2 minutes)"
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build Failed!"
    exit 1
fi

# 7. Start/Restart with PM2
echo "🚀 Starting Service with PM2..."
pm2 delete frontend 2>/dev/null || true
pm2 start npm --name "frontend" -- start

echo "🎉 Frontend is Live! Access at https://digifortlabs.com"

