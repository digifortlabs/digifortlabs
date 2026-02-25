@echo off
setlocal

:: Get current date in YYYY-MM-DD format regardless of Windows locale settings
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set "YYYY=%datetime:~0,4%"
set "MM=%datetime:~4,2%"
set "DD=%datetime:~6,2%"
set "DATE_STR=%YYYY%-%MM%-%DD%"

set "BACKUP_DIR=E:\Backup_%DATE_STR%"
set "S3_DIR=%BACKUP_DIR%\S3_Decrypted"
set "PEM_FILE=digifort-prod-key.pem"
set "EC2_USER=ec2-user@15.206.86.130"

echo ========================================================
echo   Digifort Labs - Complete System Automated Backup
echo   Target Directory: %BACKUP_DIR%
echo ========================================================
echo.

echo [1/5] Creating Backup Directories on E: Drive...
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%S3_DIR%" mkdir "%S3_DIR%"
echo Done.

echo.
echo [2/5] Securing live PostgreSQL database dump on EC2...
ssh -i %PEM_FILE% -o StrictHostKeyChecking=no %EC2_USER% "pg_dump postgresql://digifort_admin:'Digif0rtlab$'@127.0.0.1:5432/digifort_db > digifort_db_backup.sql"
echo Done.

echo.
echo [3/5] Compressing live EC2 Codebase (This may take a minute)...
ssh -i %PEM_FILE% -o StrictHostKeyChecking=no %EC2_USER% "tar -czf digifortlabs_code_backup.tar.gz digifortlabs/"
echo Done.

echo.
echo [4/5] Downloading Archives from Server to Local E: Drive...
scp -i %PEM_FILE% -o StrictHostKeyChecking=no %EC2_USER%:/home/ec2-user/digifort_db_backup.sql "%BACKUP_DIR%\digifort_db_backup.sql"
scp -i %PEM_FILE% -o StrictHostKeyChecking=no %EC2_USER%:/home/ec2-user/digifortlabs_code_backup.tar.gz "%BACKUP_DIR%\digifortlabs_code_backup.tar.gz"
echo Downloads Complete.

echo.
echo [5/5] Stream-Downloading and Decrypting all S3 Files locally...
:: Set AWS credentials via environment variables instead of hardcoding
set "AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY"
set "AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY"

.venv\Scripts\python.exe backend\s3_backup.py "%S3_DIR%" "a1z-3mNXYRp0yKAcP6xVpX6pjK6O38h039zisZMjE1U="

echo.
echo ========================================================
echo   BACKUP SUCCESSFULLY COMPLETED!
echo   All files are secure in: %BACKUP_DIR%
echo ========================================================
pause
