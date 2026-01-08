#!/bin/bash

# Digifort Labs - SSL Setup Script (Amazon Linux 2023 Edition)
# Usage: sudo ./setup_ssl.sh

DOMAIN="digifortlabs.com"
EMAIL="admin@digifortlabs.com"

echo "--- Starting SSL Setup for $DOMAIN (Amazon Linux) ---"

# 1. Update Packages and Install Dependencies
echo "[1/6] Updating packages..."
sudo dnf update -y
sudo dnf install -y nginx python3-pip augeas-libs

# 2. Install Certbot (via pip in venv as per AWS recommendations)
echo "[2/6] Installing Certbot..."
sudo python3 -m venv /opt/certbot
sudo /opt/certbot/bin/pip install --upgrade pip
sudo /opt/certbot/bin/pip install certbot certbot-nginx
sudo ln -sf /opt/certbot/bin/certbot /usr/bin/certbot

# 3. Basic Nginx Config for Validation
echo "[3/6] Configuring Nginx for $DOMAIN..."
# Ensure conf.d exists
sudo mkdir -p /etc/nginx/conf.d

# Write configuration file
cat > /etc/nginx/conf.d/$DOMAIN.conf <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

# Remove default server if it exists (usually inside nginx.conf or conf.d/default.conf)
# We backup standard nginx.conf if needed, but usually conf.d is included.
sudo mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak 2>/dev/null

echo "[4/6] Starting Nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl reload nginx

# 4. Obtain SSL Certificate
echo "[5/6] Obtaining SSL Certificate..."
sudo certbot --nginx --non-interactive --agree-tos -m $EMAIL -d $DOMAIN -d www.$DOMAIN

# 5. Finalize Nginx Config (Ensure Reverse Proxy Settings are correct)
# Certbot usually modifies the file automatically. We will append proxy settings if missing,
# but to be safe, we overwrite with the full secure config now that we have certs.

echo "[6/6] Finalizing Nginx Configuration..."

# Check if certbot created the SSL paths successfully before writing config
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    cat > /etc/nginx/conf.d/$DOMAIN.conf <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api/ {
        rewrite ^/api/(.*) /\$1 break;
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Swagger UI / Docs
    location /docs {
        proxy_pass http://localhost:8000/docs;
        proxy_set_header Host \$host;
    }
    
    location /openapi.json {
        proxy_pass http://localhost:8000/openapi.json;
        proxy_set_header Host \$host;
    }
}
EOF
    echo "SSL Configuration Applied!"
else
    echo "Warning: SSL Certificate not found using expected path. Certbot might have failed."
fi

sudo systemctl restart nginx
echo "--- SSL Setup Complete! Access https://$DOMAIN ---"
