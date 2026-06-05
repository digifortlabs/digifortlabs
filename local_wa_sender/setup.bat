@echo off
echo ==============================================
echo  Digifort WhatsApp Auto-Sender Setup
echo ==============================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python from https://www.python.org/downloads/
    pause
    exit /b
)

echo Installing required Python packages...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

echo.
echo Registering digifort-wa:// protocol in Windows...
python register_protocol.py

echo.
echo ==============================================
echo Setup Complete!
echo You can now click "Send WhatsApp" in the Digifort Web App.
echo Chrome will open automatically and send the message for you.
echo ==============================================
pause
