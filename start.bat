@echo off
echo ========================================
echo  DigifortLabs - Master Startup Script
echo ========================================
echo.
echo Starting Backend and Frontend servers...
echo.
echo Backend will run on: http://localhost:8000
echo Frontend will run on: http://localhost:3000
echo.
echo Press Ctrl+C in each window to stop the servers
echo ========================================
echo.

start "DigifortLabs Backend" cmd /k "call start_backend.bat"

timeout /t 3 /nobreak >nul

start "DigifortLabs Frontend" cmd /k "call start_frontend.bat"

echo.
echo Both servers are starting in separate windows...
echo.
pause
