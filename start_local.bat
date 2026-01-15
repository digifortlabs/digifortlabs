@echo off
echo ========================================
echo  DigifortLabs - Local Development
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

start "DigifortLabs Backend" cmd /k "call .venv\Scripts\activate && cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

start "DigifortLabs Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting in separate windows...
echo.
pause
