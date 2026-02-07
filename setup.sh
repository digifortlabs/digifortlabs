#!/bin/bash

# DigiFort Labs - EC2 Initial Setup Script (Amazon Linux 2023 ARM)
# ---------------------------------------------------------------
# This script automates the installation of system dependencies,
# runtimes, and database setup for the DigiFort Labs application.
# ---------------------------------------------------------------

# Exit on any error
set -e

echo "🚀 [START] Beginning system setup sequence..."

# 1. System Update & Timezone
echo "--- [1/7] Updating System & Setting Timezone ---"
sudo dnf update -y
sudo timedatectl set-timezone Asia/Kolkata || true
echo "✅ System updated. Current time: $(date)"

# 2. Configure Swap Memory (Crucial for t4g.small with 2GB RAM)
echo "--- [2/7] Configuring 2GB Swap Memory ---"
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap memory created and enabled."
else
    echo "ℹ️ Swap file already exists. Skipping."
fi

# 3. Install Runtime Environments (Node.js 20, Python 3, PM2)
echo "--- [3/7] Installing Runtimes & Build Tools ---"
sudo dnf install -y python3 python3-pip git wget curl unzip

# Install Node.js 20 (Amazon Linux 2023 provides nodejs)
sudo dnf install -y nodejs
echo "✅ Node version: $(node -v)"

# Install PM2 globally
sudo npm install -g pm2
echo "✅ PM2 installed: $(pm2 -v)"

# 4. Install System-Level Dependencies & Plugins
echo "--- [4/7] Installing System Dependencies (OCR, PDF, Images) ---"
sudo dnf install -y nginx augeas-libs mesa-libGL poppler-utils tesseract
echo "✅ System dependencies installed."

# 5. Install Redis & FFmpeg
echo "--- [5/7] Installing Redis & FFmpeg ---"
# Install Redis 6 (AL2023 default)
sudo dnf install -y redis6
sudo systemctl enable --now redis6
echo "✅ Redis installed and started."

# Install FFmpeg (Detect Architecture: x86_64 or ARM64)
if ! command -v ffmpeg &> /dev/null; then
    ARCH=$(uname -m)
    echo "Downloading FFmpeg static build for $ARCH..."
    if [ "$ARCH" = "x86_64" ]; then
        URL="https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"
        DIR_SUFFIX="amd64"
    else
        URL="https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz"
        DIR_SUFFIX="arm64"
    fi
    
    wget $URL
    tar -xf ffmpeg-release-$DIR_SUFFIX-static.tar.xz
    sudo cp ffmpeg-*-static/ffmpeg /usr/local/bin/
    sudo cp ffmpeg-*-static/ffprobe /usr/local/bin/
    rm -rf ffmpeg-*-static*
    echo "✅ FFmpeg ($ARCH) installed."
else
    echo "ℹ️ FFmpeg already exists. Skipping."
fi

# 6. Database Setup (PostgreSQL 15)
echo "--- [6/7] Installing & Configuring PostgreSQL 15 ---"
sudo dnf install -y postgresql15-server postgresql15
sudo postgresql-setup --initdb
sudo systemctl enable --now postgresql

# Create Database and User
echo "🐘 Configuring Database..."
sudo su - postgres -c "psql -c \"CREATE DATABASE digifort_db;\"" || true
sudo su - postgres -c "psql -c \"CREATE USER keval WITH ENCRYPTED PASSWORD 'YourSecurePassword';\"" || true
sudo su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE digifort_db TO keval;\"" || true

# Optimize PostgreSQL for low RAM (128MB shared buffers, max 20 connections)
PG_CONF="/var/lib/pgsql/data/postgresql.conf"
if [ -f "$PG_CONF" ]; then
    sudo sed -i "s/^max_connections = .*/max_connections = 20/" "$PG_CONF"
    sudo sed -i "s/^#shared_buffers = .*/shared_buffers = 128MB/" "$PG_CONF"
    sudo sed -i "s/^shared_buffers = .*/shared_buffers = 128MB/" "$PG_CONF"
    sudo systemctl restart postgresql
    echo "✅ PostgreSQL optimized for t4g.small."
fi

# 7. Create Application Directory Structure
echo "--- [7/7] Creating Application Directories ---"
sudo mkdir -p /home/ec2-user/digifortlabs
sudo mkdir -p /home/ec2-user/digifortlabsdb

# Adjust ownership to ec2-user
sudo chown -R ec2-user:ec2-user /home/ec2-user/digifortlabs
sudo chown -R ec2-user:ec2-user /home/ec2-user/digifortlabsdb

echo "---------------------------------------------------"
echo "✨ SETUP COMPLETE! YOUR SERVER IS READY."
echo "---------------------------------------------------"
echo "Next Steps:"
echo "1. Upload your code to /home/ec2-user/digifortlabs"
echo "2. Run 'deploy_prod.sh' to build and launch services."
echo "---------------------------------------------------"
