# DIGIFORT LABS - DEV LAUNCHER
# Use this instead of the .bat file if your antivirus blocks it.

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   DIGIFORT LABS - SECURE STARTUP" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

if (Test-Path "start_dev.ps1") {
    & ".\start_dev.ps1"
} else {
    Write-Error "Could not find start_dev.ps1 in the current directory."
}
