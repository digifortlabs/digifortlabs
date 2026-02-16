#!/bin/bash
set -e

echo "🚀 Upgrading Server to Python 3.11..."

# 1. Install Python 3.11
echo "📦 Installing Python 3.11 packages..."
if ! command -v python3.11 &> /dev/null; then
    sudo dnf install -y python3.11 python3.11-devel python3.11-pip
else
    echo "   Python 3.11 is already installed."
fi

# Confirm version
python3.11 --version

# 2. Rebuild Virtual Environment
echo "🔄 Rebuilding Backend Virtual Environment..."
cd /home/ec2-user/digifortlabs/backend

# Stop service
pm2 stop backend || true

# Backup/Remove old venv
if [ -d ".venv" ]; then
    echo "   Backing up old .venv to .venv_old..."
    rm -rf .venv_old
    mv .venv .venv_old
fi

# Create new venv
echo "   Creating new .venv with Python 3.11..."
python3.11 -m venv .venv

# Install dependencies
echo "   Installing dependencies..."
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 3. Restart Service
echo "🚀 Restarting Backend Service..."
# PM2 command needs to be updated to ensure it uses the new venv's python
pm2 delete backend || true
pm2 start "/home/ec2-user/digifortlabs/backend/.venv/bin/python" --name "backend" -- -m uvicorn \
    app.main:app --host 0.0.0.0 --port 8000 --workers 4 --proxy-headers --forwarded-allow-ips '*'

pm2 save
echo "✅ Upgrade Complete! Python 3.11 is now active."
