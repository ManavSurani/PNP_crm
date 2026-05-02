@echo off
echo [INFO] Setting up PNP CRM Desktop Shortcut...
powershell -NoProfile -ExecutionPolicy Bypass -Command "& { . .\create-shortcut.ps1 }"
echo [SUCCESS] Setup complete. 
pause
