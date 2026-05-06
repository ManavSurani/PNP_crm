# PNP CRM Native PowerShell Launcher
# This script handles database setup, port management, and server startup.

$AppRoot = $PSScriptRoot
$DataDir = Join-Path $AppRoot "_data"
$DbFile = Join-Path $DataDir "crm.db"
$Port = 3000
$NpmCmd = "npm.cmd"
$LogFile = Join-Path $AppRoot "server_log.txt"
$ErrFile = Join-Path $AppRoot "server_error.txt"

# 1. Ensure Data Directory exists
if (-not (Test-Path $DataDir)) { New-Item -ItemType Directory -Path $DataDir -Force | Out-Null }

# 2. Port Management (Silent Cleanup)
$process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
if ($process) {
    Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
}

# 3. Clear Logs
if (Test-Path $LogFile) { Remove-Item $LogFile -Force }
if (Test-Path $ErrFile) { Remove-Item $ErrFile -Force }

# 4. Database Initialization if missing
if (-not (Test-Path $DbFile)) {
    Start-Process -FilePath $NpmCmd -ArgumentList 'exec', 'prisma', 'db', 'push', '--', '--accept-data-loss' -WorkingDirectory $AppRoot -Wait -WindowStyle Hidden
    Start-Process -FilePath "node" -ArgumentList "seed.mjs" -WorkingDirectory $AppRoot -Wait -WindowStyle Hidden
}

# 5. Set Environment Variables
$env:DATABASE_URL = "file:$DbFile"
$env:NEXTAUTH_URL = "http://localhost:$Port"
$env:AUTH_SECRET = 'pnp_crm_local_secure_secret_9988'

# 6. Start the Server (Hidden)
$dateString = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"--- Launching PNP CRM at $dateString ---" | Out-File $LogFile
Start-Process -FilePath $NpmCmd -ArgumentList 'run', 'dev', '--', '-p', $Port -WorkingDirectory $AppRoot -WindowStyle Hidden -RedirectStandardOutput $LogFile -RedirectStandardError $ErrFile

# 7. Wait for Server to be Ready
function Find-Chrome {
    $paths = @(
        "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "${env:LocalAppData}\Google\Chrome\Application\chrome.exe"
    )
    foreach ($p in $paths) { if (Test-Path $p) { return $p } }
    return "chrome"
}

$url = "http://localhost:$Port"
$healthUrl = "http://127.0.0.1:$Port"
$ready = $false
$tries = 0

while (-not $ready -and $tries -lt 120) {
    try {
        $r = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        $ready = $true
    }
    catch {
        $tries++
        Start-Sleep -Milliseconds 500
    }
}

# 8. Open Browser if ready
if ($ready) {
    $chrome = Find-Chrome
    Start-Process $chrome -ArgumentList "--app=$url", "--window-size=1280,800"
}
