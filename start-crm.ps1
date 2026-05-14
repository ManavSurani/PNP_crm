# PNP CRM Native PowerShell Launcher
# This script handles database setup, port management, and server startup.

$AppRoot = $PSScriptRoot
$DataDir = Join-Path $AppRoot "_data"
$DbFile = Join-Path $DataDir "crm.db"
$Port = 3000
$NpmCmd = "npm.cmd"
$LogFile = Join-Path $AppRoot "server_status.txt"
$NpmLogFile = Join-Path $AppRoot "server_log.txt"
$ErrFile = Join-Path $AppRoot "server_error.txt"

# 1. Verification
Write-Host "--- PNP CRM Portable Launcher ---" -ForegroundColor Yellow
Write-Host "Checking environment..." -ForegroundColor Cyan

if (-not (Test-Path $DataDir)) { New-Item -ItemType Directory -Path $DataDir -Force | Out-Null }

if (-not (Test-Path (Join-Path $AppRoot "node_modules"))) {
    Write-Host "ERROR: node_modules folder is missing!" -ForegroundColor Red
    Write-Host "Please copy the COMPLETE project folder from your developer PC." -ForegroundColor Yellow
    Write-Host "`nPress Enter to exit..."
    Read-Host
    exit 1
}

Write-Host "Environment OK. Starting server..." -ForegroundColor Green

# 2. Aggressive Cleanup
Write-Host "Cleaning up old processes..." -ForegroundColor Gray
function Stop-CrmProcesses {
    $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    foreach ($p in $processes) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
    # Also kill any orphaned node/cmd processes in this folder
    Get-CimInstance Win32_Process -Filter "Name = 'node.exe' OR Name = 'cmd.exe'" | Where-Object { $_.CommandLine -like "*$AppRoot*" } | ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

Stop-CrmProcesses
Write-Host "Cleanup complete." -ForegroundColor Gray

# 3. Clear Logs (with retry for locks)
Write-Host "Resetting logs..." -ForegroundColor Gray
$retry = 0
while ($retry -lt 5) {
    try {
        if (Test-Path $LogFile) { Remove-Item $LogFile -Force }
        if (Test-Path $NpmLogFile) { Remove-Item $NpmLogFile -Force }
        if (Test-Path $ErrFile) { Remove-Item $ErrFile -Force }
        break
    } catch {
        $retry++
        Start-Sleep -Seconds 1
    }
}

# 4. Database Initialization if missing
if (-not (Test-Path $DbFile)) {
    Write-Host "First-time run: Initializing database... Please wait." -ForegroundColor Cyan
    & $NpmCmd exec prisma db push -- --accept-data-loss
    Write-Host "Seeding initial data..." -ForegroundColor Cyan
    & node seed.mjs
}

# 5. Set Environment Variables
$env:DATABASE_URL = "file:$DbFile"
$env:NEXTAUTH_URL = "http://localhost:$Port"
$env:NEXTAUTH_SECRET = 'pnp_crm_local_secure_secret_9988'
$env:AUTH_SECRET = 'pnp_crm_local_secure_secret_9988'
$env:AUTH_TRUST_HOST = "true"
$env:NODE_OPTIONS = "--max-old-space-size=4096"

# 6. Start the Server (Hidden)
$dateString = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"--- Launching PNP CRM at $dateString ---" | Out-File $LogFile
"Memory Limit: 4GB" | Out-File $LogFile -Append

if (Test-Path (Join-Path $AppRoot ".next\BUILD_ID")) {
    Write-Host "Starting in PRODUCTION mode (Fast)..." -ForegroundColor Green
    "Production mode detected (Valid build found)." | Out-File $LogFile -Append
    $StartArgs = "/c npx next start -p $Port"
} else {
    Write-Host "Starting in DEVELOPMENT mode (Slow)..." -ForegroundColor Yellow
    "Development mode active (No valid production build found)." | Out-File $LogFile -Append
    $StartArgs = "/c npx next dev --turbopack -p $Port"
}

Write-Host "Waiting for server to become ready..." -ForegroundColor Cyan

Start-Process -FilePath "cmd.exe" -ArgumentList $StartArgs -WorkingDirectory $AppRoot -WindowStyle Hidden -RedirectStandardOutput $NpmLogFile -RedirectStandardError $ErrFile

# 7. Wait for Server to be Ready
function Find-Browser {
    $paths = @(
        "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "${env:LocalAppData}\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe"
    )
    foreach ($p in $paths) { if (Test-Path $p) { return $p } }
    return $null
}

$url = "http://localhost:$Port"
$ready = $false
$tries = 0

while (-not $ready -and $tries -lt 60) { # 60 * 2s = 120s max
    Write-Host "." -NoNewline -ForegroundColor Cyan
    foreach ($target in @("localhost", "127.0.0.1")) {
        try {
            $healthUrl = "http://$($target):$Port"
            $r = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
            $ready = $true
            break
        } catch { }
    }
    if (-not $ready) {
        $tries++
        Start-Sleep -Seconds 2
    }
}

# 8. Open Browser if ready
if ($ready) {
    "Server is ready! Opening browser..." | Out-File $LogFile -Append
    $browser = Find-Browser
    if ($browser) {
        Start-Process $browser -ArgumentList "--app=$url", "--window-size=1280,800"
    } else {
        Start-Process $url
    }
} else {
    "Server failed to start within timeout." | Out-File $ErrFile -Append
}

Write-Host "`nPress Enter to close this window..." -ForegroundColor Yellow
Read-Host
