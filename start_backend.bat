@echo off
echo Starting Backend Server...
call .venv\Scripts\activate.bat
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
