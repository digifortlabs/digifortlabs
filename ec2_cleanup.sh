#!/bin/bash
# EC2 Cleanup & Optimization Script

echo "🧹 Starting EC2 Cleanup..."

# 1. Docker cleanup
echo "Cleaning Docker..."
docker system prune -af --volumes

# 2. Clean apt cache
echo "Cleaning apt cache..."
sudo apt-get clean
sudo apt-get autoremove -y

# 3. Clean logs older than 7 days
echo "Cleaning old logs..."
sudo journalctl --vacuum-time=7d
find /var/log -type f -name "*.log" -mtime +7 -delete 2>/dev/null

# 4. Clean tmp files
echo "Cleaning tmp files..."
sudo rm -rf /tmp/*
sudo rm -rf /var/tmp/*

# 5. Show final disk usage
echo -e "\n✅ Cleanup Complete! Current disk usage:"
df -h | grep -E '^/dev/|Filesystem'

echo -e "\n💾 Memory usage:"
free -h
