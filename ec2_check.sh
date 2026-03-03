#!/bin/bash
# EC2 Optimization & Storage Check Script

echo "=========================================="
echo "EC2 STORAGE & OPTIMIZATION REPORT"
echo "=========================================="

# 1. Disk Usage
echo -e "\n📊 DISK USAGE:"
df -h | grep -E '^/dev/|Filesystem'

# 2. Top 10 Largest Directories
echo -e "\n📁 TOP 10 LARGEST DIRECTORIES:"
du -h --max-depth=1 / 2>/dev/null | sort -rh | head -10

# 3. Docker Space Usage
echo -e "\n🐳 DOCKER SPACE USAGE:"
docker system df

# 4. Clean Docker (if needed)
echo -e "\n🧹 DOCKER CLEANUP OPTIONS:"
echo "Run these commands to free space:"
echo "  docker system prune -a --volumes  # Remove all unused data"
echo "  docker image prune -a             # Remove unused images"
echo "  docker volume prune               # Remove unused volumes"

# 5. Log Files Size
echo -e "\n📝 LOG FILES SIZE:"
du -sh /var/log 2>/dev/null
du -sh ~/logs 2>/dev/null

# 6. Memory Usage
echo -e "\n💾 MEMORY USAGE:"
free -h

# 7. Running Processes
echo -e "\n⚙️ TOP MEMORY PROCESSES:"
ps aux --sort=-%mem | head -6

# 8. Optimization Recommendations
echo -e "\n✅ OPTIMIZATION RECOMMENDATIONS:"
echo "1. Clean Docker: docker system prune -a --volumes"
echo "2. Clean logs: sudo journalctl --vacuum-time=7d"
echo "3. Clean apt cache: sudo apt-get clean"
echo "4. Remove old kernels: sudo apt autoremove"
echo "5. Compress logs: find /var/log -type f -name '*.log' -exec gzip {} \;"

echo -e "\n=========================================="
