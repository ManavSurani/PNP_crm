@echo off
setlocal
echo ====================================================
echo        PNP CRM FILE ICON INSTALLER (SAFE FIX)
echo ====================================================
echo.

:: Auto-Elevate to Administrator safely
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Administrator privileges confirmed.
) else (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:: Get absolute path to the ico file
set "ICON_PATH=%~dp0doc_logo.ico"

:: Check if the icon file actually exists
if not exist "%ICON_PATH%" (
    echo [ERROR] Could not find doc_logo.ico!
    pause
    exit /b 1
)

echo Cleaning up old registry conflicts...
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.pnpcrm" /f >nul 2>&1
reg delete "HKCU\Software\Classes\.pnpcrm" /f >nul 2>&1
reg delete "HKCU\Software\Classes\PNPCRMFile" /f >nul 2>&1

echo Registering system-wide extension...
reg add "HKCR\.pnpcrm" /ve /d "PNPCRMFile" /f >nul
reg add "HKCR\PNPCRMFile" /ve /d "PNP CRM Backup File" /f >nul
reg add "HKCR\PNPCRMFile\DefaultIcon" /ve /d "\"%ICON_PATH%\"" /f >nul

echo.
echo [SUCCESS] Registry updated perfectly!
echo Broadcasting icon refresh to Windows safely (no black screen)...

:: Notify the system of shell changes smoothly
ie4uinit.exe -show >nul 2>&1
ie4uinit.exe -ClearIconCache >nul 2>&1

:: Broadcast SHCNE_ASSOCCHANGED to Windows Explorer natively via PowerShell
powershell -Command "Add-Type -TypeDefinition 'using System.Runtime.InteropServices; public class Win32 { [DllImport(\"shell32.dll\")] public static extern void SHChangeNotify(int eventId, int flags, int item1, int item2); }'; [Win32]::SHChangeNotify(0x08000000, 0, 0, 0)" >nul 2>&1

echo Done! The custom document logo is now applied.
echo You can safely close this window.
pause
