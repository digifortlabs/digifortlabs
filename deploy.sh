#!/bin/bash

# Configuration
PROJECT_DIR="/home/ec2-user/digifortlabs"
FRONTEND_SERVICE="frontend"
BACKEND_NAME="backend"

echo "🚀 Starting Production Deployment (Hard Pull)..."

# Navigate to project
cd $PROJECT_DIR || { echo "❌ Failed to change directory"; exit 1; }

# Update Code
echo "Updating code from GitHub..."
git fetch --all
git reset --hard origin/main
git clean -fd

# Backend Refresh
echo "Updating Backend and Database..."
cd backend
python3 migrate_v1_3.py
pm2 restart $BACKEND_NAME || pm2 start main.py --name $BACKEND_NAME
cd ..

# Frontend Build (Docker)
echo "Building and restarting Frontend container..."
docker-compose -f docker-compose.prod.yml up -d --build $FRONTEND_SERVICE

echo "✅ Deployment Successful! Check logs with: pm2 logs backend"
