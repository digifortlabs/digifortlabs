#!/bin/bash

# DigiFort Labs - Live Frontend Setup Script (Amazon Linux 2023)
# Usage: ./setup_live_frontend.sh

echo "🚀 Starting Frontend Setup..."

# 1. Install Node.js if missing
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    sudo dnf install -y nodejs
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Node.js"
        exit 1
    fi
else
    echo "✅ Node.js is already installed ($(node -v))"
fi

# 2. Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
else
    echo "✅ PM2 is already installed"
fi

# 3. Navigate to Frontend
cd ~/digifortlabs/frontend || exit

# 4. Pull Latest Code
echo "⬇️  Pulling latest code..."
git pull

# 5. Install Dependencies
echo "📦 Installing Project Dependencies... (This may take a minute)"
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
