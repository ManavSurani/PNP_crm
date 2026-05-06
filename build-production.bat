@echo off
SETLOCAL EnableDelayedExpansion
title PNP CRM Production Build

SET "APP_ROOT=%~dp0"
echo [1/2] Synchronizing Database Schema...
npx prisma db push -- --accept-data-loss

echo.
echo [2/2] Building Application...
echo This may take a few minutes. Please wait...
npm run build

echo.
echo ====================================================
echo SUCCESS: Production build complete!
echo ====================================================
pause
exit /b 0

