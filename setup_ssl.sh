#!/bin/bash

# Digifort Labs - SSL Setup Script using Certbot (Let's Encrypt)
# Usage: sudo ./setup_ssl.sh

DOMAIN="digifortlabs.com"
EMAIL="admin@digifortlabs.com"

echo "--- Starting SSL Setup for $DOMAIN ---"

# 1. Update Packages
echo "[1/5] Updating package lists..."
sudo apt update

# 2. Install Nginx and Certbot
echo "[2/5] Installing Nginx and Certbot..."
sudo apt install -y nginx certbot python3-certbot-nginx

# 3. Basic Nginx Config for Validation
echo "[3/5] Configuring Nginx for $DOMAIN..."
cat > /etc/nginx/sites-available/$DOMAIN <<EOF
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

# Enable the site
ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

# 4. Obtain SSL Certificate
echo "[4/5] Obtaining SSL Certificate..."
sudo certbot --nginx --non-interactive --agree-tos -m $EMAIL -d $DOMAIN -d www.$DOMAIN

# 5. Finalize Nginx Config (Reverse Proxy)
echo "[5/5] Finalizing Nginx Reverse Proxy Configuration..."
cat > /etc/nginx/sites-available/$DOMAIN <<EOF
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

sudo systemctl restart nginx
echo "--- SSL Setup Complete! Access https://$DOMAIN ---"
