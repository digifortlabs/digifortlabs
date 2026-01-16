@echo off
title Digifort Scanner Builder
echo ===========================================
echo    DIGIFORT LABS - SCANNER BUILDER
echo ===========================================
echo.

echo [1/3] Installing Dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error installing dependencies.
    pause
    exit /b
)

echo.
echo [2/3] Building Protocol Registry Tool...
pyinstaller --noconfirm --onefile --console --name "RegisterProtocol" register_protocol.py

echo.
echo [3/3] Building Main Scanner App...
pyinstaller --noconfirm --onefile --windowed --name "DigifortScanner" scanner_app.py

echo.
echo ===========================================
echo    BUILD COMPLETE!
echo ===========================================
echo.
echo The files are located in the "dist" folder:
echo 1. dist\RegisterProtocol.exe  (Run this ONCE as Admin)
echo 2. dist\DigifortScanner.exe   (This is the app)
echo.
pause
