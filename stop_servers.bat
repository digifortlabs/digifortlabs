@echo off
echo Stopping DIGIFORTLABS Servers...

echo Stopping Frontend (Port 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /f /pid %%a

echo Stopping Backend (Port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do taskkill /f /pid %%a

echo Stopping DB Tunnel (Port 5433)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5433" ^| find "LISTENING"') do taskkill /f /pid %%a

echo Servers stopped. You can now run them manually.
pause
