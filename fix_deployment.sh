#!/bin/bash

# FIX DEPLOYMENT SCRIPT
# This script forces a "Hard Reset" of the code to ensure you have the latest version.

echo "🛑 STOPPING SERVICES..."
pm2 delete all 2>/dev/null

echo "🧹 CLEANING GIT CONFLICTS..."
cd ~/digifortlabs
git fetch --all
git reset --hard origin/master
git clean -fd

echo "🗑️ REMOVING OLD CACHES (The Nuclear Option)..."
rm -rf node_modules .next frontend/node_modules frontend/.next

echo "📦 RETRYING DEPLOYMENT..."
chmod +x deploy_prod.sh
./deploy_prod.sh
