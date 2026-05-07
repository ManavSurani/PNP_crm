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

# 1. Ensure Data Directory exists
if (-not (Test-Path $DataDir)) { New-Item -ItemType Directory -Path $DataDir -Force | Out-Null }

# 2. Aggressive Cleanup
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

# 3. Clear Logs (with retry for locks)
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
    Start-Process -FilePath $NpmCmd -ArgumentList 'exec', 'prisma', 'db', 'push', '--', '--accept-data-loss' -WorkingDirectory $AppRoot -Wait -WindowStyle Hidden
    Start-Process -FilePath "node" -ArgumentList "seed.mjs" -WorkingDirectory $AppRoot -Wait -WindowStyle Hidden
}

# 5. Set Environment Variables
$env:DATABASE_URL = "file:$DbFile"
$env:NEXTAUTH_URL = "http://localhost:$Port"
$env:AUTH_SECRET = 'pnp_crm_local_secure_secret_9988'
$env:NODE_OPTIONS = "--max-old-space-size=4096"

# 6. Start the Server (Hidden)
$dateString = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"--- Launching PNP CRM at $dateString ---" | Out-File $LogFile
"Memory Limit: 4GB" | Out-File $LogFile -Append
"Waiting for server to be ready..." | Out-File $LogFile -Append

$StartArgs = "/c npm run dev -- -p $Port"
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
