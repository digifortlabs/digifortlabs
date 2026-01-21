@echo off
echo ========================================
echo  DigifortLabs - Frontend Server Setup
echo ========================================

cd frontend
if not exist "node_modules" (
    echo.
    echo node_modules not found. Installing dependencies...
    cmd /c "npm install"
    echo.
    echo Setup complete.
)

echo Starting Frontend Server...
npm run dev
