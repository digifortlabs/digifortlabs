# Deployment Guide - Digifort Labs

This guide provides instructions on how to deploy the Digifort Labs project on a live server using Docker and Nginx.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed
- A domain name pointing to your server's IP address
- SSL certificates (e.g., from Let's Encrypt)

## Step 1: Transfer Files to Server

You can use `scp` or `rsync` to upload the project files from your local machine to the server.

### Option A: Using SCP (Windows/Linux/Mac)
Run this command from your local project root:
```bash
# Replace 'user' and 'your_server_ip' with your actual server details
scp -r ./* user@your_server_ip:/var/www/digifortlabs
```

### Option B: Using Rsync (Recommended)
Rsync is faster as it only uploads changed files:
```bash
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '__pycache__' --exclude '.venv' . user@your_server_ip:/var/www/digifortlabs
```

## Step 2: Server-Side Preparation

1. SSH into your server: `ssh user@your_server_ip`
2. Navigate to the project directory: `cd /var/www/digifortlabs`
3. Create a production `.env` file:
   ```bash
   cp .env.example .env
   ```
4. Edit the `.env` file: `nano .env` (Provide secure values for all variables).

## Step 3: Build and Start

Run the following command to build the production images and start the services in detached mode:

```bash
docker compose up -d --build
```

## Step 4: Configure Reverse Proxy (Nginx)

Use Nginx as a reverse proxy to handle SSL and route traffic to the Docker containers.

Example Nginx configuration (modify `nginx.conf.template` or use as a guide):

```nginx
server {
    listen 80;
    server_name digifortlabs.com www.digifortlabs.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name digifortlabs.com www.digifortlabs.com;

    ssl_certificate /etc/letsencrypt/live/digifortlabs.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/digifortlabs.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000; # Frontend
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:8000; # Backend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Step 5: Updating the Application

To update the application with the latest changes from the repository:

1. SSH into your server: `ssh -i "your-key.pem" user@your_server_ip`
2. Navigate to the project directory: `cd /var/www/digifortlabs` (or `/home/ec2-user/digifortlabs`)
3. Pull the latest code and rebuild:

```bash
git pull origin master
docker compose up -d --build
```

## Step 6: Maintenance

- **View Logs**: `docker compose logs -f`
- **Restart Services**: `docker compose restart`
- **Backup Database**: Use `docker exec` to run `pg_dump` on the `db` container.

## Security Recommendations

- Never commit your `.env` file to version control.
- Regularly update Docker images.
- Use a firewall (e.g., UFW) to only allow ports 80 and 443.

## Deployment Testing Checklist

After deployment, perform these tests to ensure everything is working correctly:

1. [ ] **Frontend Accessibility**: Open `https://digifortlabs.com` in your browser.
2. [ ] **API Connectivity**: Visit `https://digifortlabs.com/api/health`. It should return `{"status": "ok"}`.
3. [ ] **SSL Verification**: Check the padlock icon in the browser to ensure the SSL certificate is valid.
4. [ ] **Database Connection**: Try to log in with admin credentials to verify the backend can talk to the database.
5. [ ] **File Storage**: Upload a test document and verify it is stored correctly (either in S3 or local storage).
6. [ ] **Worker Status**: Check if background tasks (like cleanups) are running via `docker compose logs worker`.
