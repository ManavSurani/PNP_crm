@echo off
SETLOCAL EnableDelayedExpansion

:: --- CONFIGURATION ---
SET "APP_ROOT=%~dp0"
SET "DATA_DIR=%APP_ROOT%_data"
SET "LEGACY_DATA_DIR=C:\PNP_CRM_Data"
SET "PORT=3000"
SET "NPM_CMD=%APP_ROOT%node_runtime\npm.cmd"

:: 1. Migration & Setup
if exist "%LEGACY_DATA_DIR%" (
    if not exist "%DATA_DIR%" (
        echo [INFO] Migrating legacy data to project folder...
        mkdir "%DATA_DIR%"
        xcopy /E /I /Y "%LEGACY_DATA_DIR%\*" "%DATA_DIR%\" >nul
        echo [SUCCESS] Data migrated to %DATA_DIR%
    )
)

if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
SET "DB_FILE=%DATA_DIR%\crm.db"

:: 2. Create the temporary launcher script
SET "LAUNCHER=%APP_ROOT%launch_temp.ps1"

(
echo # Dynamic Path Resolution
echo $AppRoot = '%APP_ROOT%'.TrimEnd('\'^)
echo $DbFile = Join-Path $AppRoot '_data\crm.db'
echo $NpmCmd = Join-Path $AppRoot 'node_runtime\npm.cmd'
echo $Port = '%PORT%'
echo.
echo # Function to find Chrome
echo function Find-Chrome {
echo     $paths = @(
echo         "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
echo         "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
echo         "${env:LocalAppData}\Google\Chrome\Application\chrome.exe"
echo     ^)
echo     foreach ($p in $paths^) { if (Test-Path $p^) { return $p } }
echo     return "chrome"
echo }
echo.
echo # Initialize Database if missing
echo if ^(-not ^(Test-Path $DbFile^)^) {
echo     Write-Host "Initializing database..."
echo     Start-Process -FilePath $NpmCmd -ArgumentList 'exec', 'prisma', 'db', 'push', '--', '--accept-data-loss' -WorkingDirectory $AppRoot -Wait -WindowStyle Hidden
echo }
echo.
echo $env:DATABASE_URL = "file:$DbFile"
echo $env:NEXTAUTH_URL = "http://localhost:$Port"
echo $env:AUTH_SECRET = 'pnp_crm_local_secure_secret_9988'
echo.
echo # Start the server and log output
echo $logFile = Join-Path $AppRoot 'server_log.txt'
echo $errFile = Join-Path $AppRoot 'server_error.txt'
echo $dateString = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
echo "--- Launching PNP CRM at $dateString ---" ^| Out-File $logFile
echo Start-Process -FilePath $NpmCmd -ArgumentList 'run', 'dev', '--', '-p', $Port -WorkingDirectory $AppRoot -WindowStyle Hidden -RedirectStandardOutput $logFile -RedirectStandardError $errFile
echo.
echo $url = "http://localhost:$Port"
echo $healthUrl = "http://127.0.0.1:$Port"
echo $ready = $false; $tries = 0
echo Write-Host "Waiting for server to start on port $Port..."
echo while ^(-not $ready -and $tries -lt 30^) {
echo     try { $r = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop; $ready = $true }
echo     catch { $tries++; Start-Sleep -Seconds 2 }
echo }
echo.
echo if ^($ready^) { 
echo     $chrome = Find-Chrome
echo     Write-Host "Server ready! Opening $url"
echo     Start-Process $chrome -ArgumentList "--app=$url", "--window-size=1280,800" 
echo } else {
echo     Write-Error "Server failed to start. Check server_error.txt for details."
echo     Read-Host "Press Enter to exit..."
echo }
) > "%LAUNCHER%"

:: 3. Run the launcher
powershell -NoProfile -ExecutionPolicy Bypass -File "%LAUNCHER%"

:: 4. Cleanup
if exist "%LAUNCHER%" del "%LAUNCHER%"
exit /b 0

