@echo off
setlocal

echo ========================================
echo  DigifortLabs - Backend Server Setup
echo ========================================

:: Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH.
    pause
    exit /b 1
)

:: Check if .venv exists
if not exist ".venv" (
    echo.
    echo Virtual environment not found. Creating one...
    python -m venv .venv
    echo.
    echo Installing dependencies...
    call .venv\Scripts\activate.bat
    pip install --upgrade pip
    pip install -r backend\requirements.txt
    echo.
    echo Setup complete.
) else (
    echo.
    echo Virtual environment found using .venv
    call .venv\Scripts\activate.bat
)

echo.
echo Starting Backend Server...
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
