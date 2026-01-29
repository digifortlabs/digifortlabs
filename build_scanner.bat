
@echo off
echo Building Digifort Scanner...
pyinstaller --noconfirm --onefile --windowed --icon "local_scanner/icon.ico" --name "DigifortScanner" --add-data "local_scanner/icon.ico;." "local_scanner/scanner_app.py"
echo Build Complete. EXE is in dist/DigifortScanner.exe
pause
