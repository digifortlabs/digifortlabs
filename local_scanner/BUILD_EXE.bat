@echo off
title Digifort Scanner Builder
echo ===========================================
echo    DIGIFORT LABS - SCANNER BUILDER
echo ===========================================
echo.

echo [1/4] Installing Dependencies...
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error installing dependencies.
    pause
    exit /b
)

echo.
echo [2/4] Building Protocol Registry Tool...
python -m PyInstaller --noconfirm --onefile --console --name "RegisterProtocol" register_protocol.py

echo.
echo [3/4] Building Main Scanner App...
python -m PyInstaller --noconfirm --onefile --windowed --name "DigifortScanner" scanner_app.py --icon="icon.ico" --add-data "icon.ico;."

echo.
echo [4/4] Creating Installer (Inno Setup)...
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" setup.iss

echo.
echo ===========================================
echo    BUILD COMPLETE!
echo ===========================================
echo.
echo The files are located in the "dist" folder:
echo 1. dist\RegisterProtocol.exe
echo 2. dist\DigifortScanner.exe
echo 3. dist\DigifortScanner_Setup_v2.1.exe
echo.
pause
