@echo off
title PNP CRM - First Time Setup
echo --------------------------------------------------
echo PNP CRM - Professional Desktop Setup
echo --------------------------------------------------
echo.
echo Please wait while we create your Desktop Shortcut...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0create-shortcut.ps1"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo --------------------------------------------------
    echo SUCCESS: Desktop Shortcut Created!
    echo --------------------------------------------------
    echo You can now close this window and use the 
    echo 'PNP CRM' icon on your Desktop.
) else (
    echo.
    echo --------------------------------------------------
    echo ERROR: Setup failed. Please contact support.
    echo --------------------------------------------------
)

echo.
pause
