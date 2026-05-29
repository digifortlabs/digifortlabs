#!/bin/bash

# Configuration
PROJECT_DIR="/home/ec2-user/digifortlabs"
FRONTEND_SERVICE="frontend"
BACKEND_NAME="backend"

echo "???? Starting Production Deployment (Hard Pull)..."

# Navigate to project
cd $PROJECT_DIR || { echo "??? Failed to change directory"; exit 1; }

# Update Code
echo "Updating code from GitHub..."
git fetch --all
git reset --hard origin/main
# CRITICAL: Exclude .env and node_modules from clean to prevent configuration loss
git clean -f -e .env -e .env.production -e node_modules/ -e venv/

# Backend Refresh
echo "Updating Backend and Database..."
cd backend
# Make sure we use the production environment for migrations
if [ -f "venv/bin/python" ]; then
    venv/bin/python migrate_v1_3.py
else
    python3 migrate_v1_3.py
fi
pm2 restart $BACKEND_NAME || pm2 start main.py --name $BACKEND_NAME
cd ..

# Frontend Build (Docker Compose v2)
echo "Building and restarting Frontend container..."
docker compose -f docker-compose.prod.yml up -d --build $FRONTEND_SERVICE

echo "??? Deployment Successful! Check logs with: pm2 logs backend"
