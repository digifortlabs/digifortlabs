<#
.SYNOPSIS
    Automates the deployment of the local codebase to the AWS production server.
.DESCRIPTION
    This script performs the following actions:
    1. Checks for uncommitted changes and commits them if found.
    2. Pushes the latest 'main' branch to the GitHub repository.
    3. Connects to the AWS EC2 instance via SSH.
    4. Triggers the remote deployment script (/home/ec2-user/digifortlabs/deploy.sh)
       to synchronize and restart the live services.
#>

$ErrorActionPreference = 'Stop'

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 AWS Deployment Autopilot Initializing..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Handle Git Commits
Write-Host "[1/4] Checking local Git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "Uncommitted changes detected. Auto-committing..." -ForegroundColor DarkGray
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git add .
    git commit -m "Auto-deploy commit: $timestamp"
    Write-Host "✅ Changes committed successfully." -ForegroundColor Green
} else {
    Write-Host "✅ Working directory is clean." -ForegroundColor Green
}

# Step 2: Push to GitHub
Write-Host ""
Write-Host "[2/4] Pushing code to GitHub (origin/main)..." -ForegroundColor Yellow
try {
    git push origin main
    Write-Host "✅ Push successful." -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to push to GitHub. Aborting deployment." -ForegroundColor Red
    exit 1
}

# Step 3: Trigger Remote Deployment via SSH
Write-Host ""
Write-Host "[3/4] Connecting to AWS and triggering deployment script..." -ForegroundColor Yellow
$PEM_FILE = "digifort-prod-key.pem"
$EC2_USER = "ec2-user"
$EC2_HOST = "digifortlabs.com"
$REMOTE_SCRIPT = "sh /home/ec2-user/digifortlabs/deploy.sh"

if (-Not (Test-Path -Path $PEM_FILE)) {
    Write-Host "❌ SSH Key ($PEM_FILE) not found in the current directory!" -ForegroundColor Red
    exit 1
}

try {
    # We use -o StrictHostKeyChecking=no to avoid prompts if the known_hosts isn't set up
    ssh -i $PEM_FILE -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" $REMOTE_SCRIPT
    Write-Host ""
    Write-Host "✅ Remote deployment executed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to execute remote deployment script." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🎉 Deployment Complete!" -ForegroundColor Cyan
Write-Host "Check https://digifortlabs.com to verify." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
