@echo off
SETLOCAL EnableDelayedExpansion
title PNP CRM Production Build

SET "APP_ROOT=%~dp0"
SET "NODE_EXE=%APP_ROOT%node_runtime\node.exe"
SET "NPM_CLI=%APP_ROOT%node_runtime\node_modules\npm\bin\npm-cli.js"

echo [1/2] Synchronizing Database Schema...
"%NODE_EXE%" "%NPM_CLI%" exec prisma db push -- --accept-data-loss

echo.
echo [2/2] Building Application...
echo This may take a few minutes. Please wait...
"%NODE_EXE%" "%NPM_CLI%" run build

echo.
echo ====================================================
echo SUCCESS: Production build complete!
echo ====================================================
pause
exit /b 0

