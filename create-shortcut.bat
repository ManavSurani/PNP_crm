@echo off
pushd "%~dp0"
echo Setting up PNP CRM Desktop Shortcut...
powershell.exe -ExecutionPolicy Bypass -File .\create-shortcut.ps1
echo Setup complete.
pause
popd
