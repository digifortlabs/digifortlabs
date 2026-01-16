#!/bin/bash

# DIGIFORT LABS - SAFE DEPLOYMENT SCRIPT
# This script updates the code WITHOUT deleting your database or local storage.

echo "=========================================="
echo "   DIGIFORT LABS - SAFE DEPLOYMENT"
echo "=========================================="

# 1. Check if we are in the right directory
if [ ! -d "backend" ]; then
    echo "ERROR: You must run this script from inside the 'digifortlabs' folder."
    exit 1
fi

echo "[1/4] Fetching latest code..."
git fetch --all

echo "[2/4] Resetting code to match Master..."
# This updates tracked files but leaves untracked files (like your DB) alone initially.
git reset --hard origin/master

echo "[3/4] Cleaning up old files (PRESERVING DATA)..."
# -f: force clean
# -d: remove directories
# -e: EXCLUDE the following patterns from deletion:
git clean -fd -e digifortlabs.db -e backend/digifortlabs.db -e backend/local_storage -e .env -e backend/.env

echo "[4/4] Restarting Application..."
# Adjust this command based on how you normally start your app (e.g., docker, pm2, systemd)
# Example for Docker Compose:
if [ -f "docker-compose.yml" ]; then
    docker-compose down
    docker-compose up -d --build
    echo "Docker containers restarted."
else
    echo "⚠️  No docker-compose.yml found. Please restart your server manually."
fi

echo "=========================================="
echo "   DEPLOYMENT COMPLETE - DATA SAVED"
echo "=========================================="
