@echo off
setlocal
set INSTANCE_ID=i-0c5834fb0e0fe22e6
set REGION=ap-south-1
set KEY_FILE=digifort-prod-key.pem

:MENU
cls
echo ========================================================
echo       DIGIFORT LABS - EC2 SERVER MANAGEMENT
echo ========================================================
echo  Instance ID: %INSTANCE_ID%
echo  Region:      %REGION%
echo ========================================================
echo.
echo  1. [STATUS]  Check Server Status
echo  2. [START]   Start Server
echo  3. [STOP]    Stop Server (Save Cost)
echo  4. [SSH]     Connect to Server
echo  5. [EXIT]    Exit
echo.
echo ========================================================
set /p choice="Select an option (1-5): "

if "%choice%"=="1" goto STATUS
if "%choice%"=="2" goto START
if "%choice%"=="3" goto STOP
if "%choice%"=="4" goto SSH
if "%choice%"=="5" exit /b

echo Invalid choice. Press any key to try again.
pause >nul
goto MENU

:STATUS
echo.
echo Checking status...
aws ec2 describe-instances --instance-ids %INSTANCE_ID% --region %REGION% --query "Reservations[0].Instances[0].{State:State.Name,IP:PublicIpAddress}" --output table
echo.
pause
goto MENU

:START
echo.
echo Starting server...
aws ec2 start-instances --instance-ids %INSTANCE_ID% --region %REGION%
echo.
echo Wait a minute for the server to initialize.
pause
goto MENU

:STOP
echo.
echo Stopping server...
aws ec2 stop-instances --instance-ids %INSTANCE_ID% --region %REGION%
echo.
pause
goto MENU

:SSH
echo.
echo Fetching Public IP...
for /f "tokens=*" %%i in ('aws ec2 describe-instances --instance-ids %INSTANCE_ID% --region %REGION% --query "Reservations[0].Instances[0].PublicIpAddress" --output text') do set IP=%%i
if "%IP%"=="None" (
    echo [ERROR] Server is not running. Start it first.
    pause
    goto MENU
)
echo Connecting to ec2-user@%IP%...
ssh -i "%KEY_FILE%" ec2-user@%IP%
echo.
echo Connection closed.
pause
goto MENU
