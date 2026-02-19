@echo off
echo Launching DIGIFORTLABS Development Environment...
echo This will start:
echo  1. SSH Tunnel to Live Database (15.206.86.130)
echo  2. Backend API (Port 8000)
echo  3. Frontend App (Port 3000)
echo.

:: Launch the existing PowerShell automation script
powershell -NoProfile -ExecutionPolicy Bypass -File "start_dev.ps1"

if %errorlevel% neq 0 (
    echo.
    echo Error encountered launching start_dev.ps1
    pause
)
