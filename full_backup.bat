@echo off
setlocal
echo ========================================================
echo       DIGIFORT LABS - FULL LOCAL BACKUP UTILITY
echo ========================================================
echo.

REM --- CONFIGURATION ---
set BACKUP_ROOT=E:\Digifort_Backup
set ENV_FILE=.env
set PATH=%PATH%;C:\pgsql\bin

if not exist E:\ (
    echo [ERROR] Drive E: not found! Please connect your drive.
    pause
    exit /b
)

if not exist "%BACKUP_ROOT%" mkdir "%BACKUP_ROOT%"

REM Read .env if exists
if exist %ENV_FILE% (
    echo [INFO] Loading credentials from %ENV_FILE%...
) else (
    if exist backend\.env (
        echo [INFO] Loading credentials from backend\.env...
        set ENV_FILE=backend\.env
    ) else (
        echo [ERROR] .env file not found in root or backend folder!
        echo         Please ensure a .env file with AWS/DB credentials exists.
        pause
        exit /b
    )
)

for /f "usebackq tokens=1* delims==" %%A in (%ENV_FILE%) do (
        if "%%A"=="AWS_ACCESS_KEY_ID" set AWS_ACCESS_KEY_ID=%%B
        if "%%A"=="AWS_SECRET_ACCESS_KEY" set AWS_SECRET_ACCESS_KEY=%%B
        if "%%A"=="AWS_REGION" set AWS_REGION=%%B
        if "%%A"=="AWS_BUCKET_NAME" set AWS_BUCKET_NAME=%%B
        if "%%A"=="POSTGRES_SERVER" set DB_HOST=%%B
        if "%%A"=="POSTGRES_USER" set DB_USER=%%B
        if "%%A"=="POSTGRES_PASSWORD" set PGPASSWORD=%%B
        if "%%A"=="POSTGRES_DB" set DB_NAME=%%B
    )


REM Cleanup quotes
set AWS_ACCESS_KEY_ID=%AWS_ACCESS_KEY_ID:"=%
set AWS_SECRET_ACCESS_KEY=%AWS_SECRET_ACCESS_KEY:"=%
set AWS_BUCKET_NAME=%AWS_BUCKET_NAME:"=%
set DB_HOST=%DB_HOST:"=%
set DB_USER=%DB_USER:"=%
set PGPASSWORD=%PGPASSWORD:"=%
set DB_NAME=%DB_NAME:"=%

echo.
echo [1/3] Backing up Code (Local Git Copy)...
echo     Target: %BACKUP_ROOT%\Code
REM Using Robocopy to exclude heavy folders, or just git export if possible.
REM Simple copy for now:
mkdir "%BACKUP_ROOT%\Code" 2>nul
robocopy . "%BACKUP_ROOT%\Code" /E /XD node_modules .venv venv .git .next __pycache__ /XF *.pem /XO /NFL /NDL /R:0 /W:0
echo     Code backup complete (excluding node_modules/venv).

echo.
echo [2/3] Backing up S3 Files (Sync)...
if "%AWS_BUCKET_NAME%"=="" set AWS_BUCKET_NAME=digifort-labs-files
echo     Target: %BACKUP_ROOT%\S3_Files
aws s3 sync s3://%AWS_BUCKET_NAME% "%BACKUP_ROOT%\S3_Files"
if %errorlevel% neq 0 echo [WARN] S3 Sync failed.

echo.
echo [3/3] Backing up RDS Database...
if "%DB_HOST%"=="" (
    echo [WARN] DB_HOST not found in .env. Skipping DB Backup.
) else (
    echo     Connecting to %DB_HOST%...
    mkdir "%BACKUP_ROOT%\DB_Dumps" 2>nul
    
    where pg_dump >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] 'pg_dump' cmd not found. Install PostgreSQL tools to back up DB.
    ) else (
        echo     Running pg_dump...
        pg_dump -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f "%BACKUP_ROOT%\DB_Dumps\backup_db.sql"
        if errorlevel 1 (
            echo [ERROR] Database backup failed. Check firewall/VPN.
        ) else (
            echo [SUCCESS] Saved to %BACKUP_ROOT%\DB_Dumps
        )
    )
)

echo.
echo ========================================================
echo               BACKUP COMPLETE
echo     Location: %BACKUP_ROOT%
echo ========================================================
pause
