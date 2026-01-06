#!/bin/bash

# 1. Update and Install Dependencies
echo "Installing Docker and Git..."
sudo yum update -y
sudo yum install -y docker git

# 2. Start and Enable Docker
echo "Starting Docker..."
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# 3. Install Docker Compose
echo "Installing Docker Compose..."
mkdir -p ~/.docker/cli-plugins/
curl -SL https://github.com/docker/compose/releases/download/v2.24.1/docker-compose-linux-x86_64 -o ~/.docker/cli-plugins/docker-compose
chmod +x ~/.docker/cli-plugins/docker-compose

# 4. Clone the Repository
echo "Cloning Repository..."
cd /home/ec2-user
if [ -d "digifortlabs" ]; then
    echo "Repo already exists, pulling updates..."
    cd digifortlabs && git pull
else
    git clone https://github.com/digifortlabs/digifortlabs.git
    cd digifortlabs
fi

# 5. Setup Configuration
echo "Configuring Environment..."
# Create a robust docker-compose override if needed, or just use the base one.
# For this demo, we assume the base docker-compose.yml is sufficient for a start.

# 6. Launch Application
echo "Launching App..."
docker compose up -d --build

echo "✅ Setup Complete! Application should be running."
echo "Public IP: $(curl -s http://checkip.amazonaws.com)"
