@echo off
TITLE Digifort Labs - Local Development
echo Starting Digifort Labs...

:: Start Backend in a new window
echo Launching Backend (FastAPI)...
start "Digifort Backend" cmd /k "cd backend && ..\.venv\Scripts\activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Give backend a few seconds to initialize
timeout /t 3 /nobreak > nul

:: Start Frontend in a new window
echo Launching Frontend (Next.js)...
start "Digifort Frontend" cmd /k "cd frontend && npm run dev -- --port 3000"

echo.
echo Digifort Labs is starting up!
echo ----------------------------------------
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo ----------------------------------------
echo.
pause
