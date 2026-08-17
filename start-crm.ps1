param(
    [switch]$BackgroundOnly
)

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

# 2. Check if server is already running
Write-Host "Checking server status..." -ForegroundColor Gray
$IsRunning = $false
try {
    $r = Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    $IsRunning = $true
} catch { }

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

if ($IsRunning) {
    if ($BackgroundOnly) {
        Write-Host "Server is already running in background. Exiting quietly." -ForegroundColor Green
        exit 0
    } else {
        Write-Host "Server is already running! Opening browser instantly..." -ForegroundColor Green
        "Server is already running! Opening browser..." | Out-File $LogFile -Append
        $browser = Find-Browser
        if ($browser) {
            $ProfileDir = Join-Path $env:TEMP "pnp_crm_session"
            if (Test-Path $ProfileDir) { Remove-Item -Path $ProfileDir -Recurse -Force -ErrorAction SilentlyContinue }
            Start-Process $browser -ArgumentList "--app=http://localhost:$Port", "--window-size=1280,800", "--user-data-dir=`"$ProfileDir`""
        } else {
            Start-Process "http://localhost:$Port"
        }
        # Wait 2 seconds to ensure browser launches before closing cmd window
        Start-Sleep -Seconds 2
        exit 0
    }
}

# 3. Aggressive Cleanup (only if server not running)
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
    # Kill existing desktop notifiers
    Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" | Where-Object { $_.CommandLine -like "*desktop-notifier.ps1*" } | ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
    # Kill existing ngrok tunnels if any
    Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
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
    $StartArgs = "/c node node_modules\next\dist\bin\next start -p $Port"
} else {
    Write-Host "Starting in DEVELOPMENT mode (Slow)..." -ForegroundColor Yellow
    "Development mode active (No valid production build found)." | Out-File $LogFile -Append
    $StartArgs = "/c npx.cmd next dev --turbopack -p $Port"
}

Write-Host "Waiting for server to become ready..." -ForegroundColor Cyan

Start-Process -FilePath "cmd.exe" -ArgumentList $StartArgs -WorkingDirectory $AppRoot -WindowStyle Hidden -RedirectStandardOutput $NpmLogFile -RedirectStandardError $ErrFile

# Launch Desktop Notifier Background Service
Start-Process -FilePath "powershell.exe" -ArgumentList "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$AppRoot\desktop-notifier.ps1`"" -WindowStyle Hidden

# Launch Mobile Sync Tunnel (Checks Internet First)
$NgrokExe = "C:\ngrok\ngrok.exe"
$NgrokDomain = "research-reshuffle-bagful.ngrok-free.dev"
if (Test-Path $NgrokExe) {
    $hasInternet = $false
    try {
        $testPing = Invoke-WebRequest -Uri "https://1.1.1.1" -Method Head -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        $hasInternet = $true
    } catch {
        try {
            $testPing2 = Invoke-WebRequest -Uri "https://dns.google" -Method Head -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            $hasInternet = $true
        } catch { }
    }

    if ($hasInternet) {
        Write-Host "Internet detected. Starting mobile sync tunnel in background..." -ForegroundColor Green
        "Internet OK: Starting Ngrok tunnel in background." | Out-File $LogFile -Append
        Start-Process -FilePath $NgrokExe -ArgumentList "http --url=$NgrokDomain $Port" -WindowStyle Hidden
    } else {
        Write-Host "No internet detected. Running in local offline mode." -ForegroundColor Yellow
        "No Internet: Skipping tunnel. Local offline mode active." | Out-File $LogFile -Append
        # Show native Windows Toast Notification
        try {
            [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
            [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
            $template = @"
<toast>
    <visual>
        <binding template="ToastGeneric">
            <text>PNP CRM — Offline Mode</text>
            <text>No internet connection detected. The CRM is running in offline mode. Click 'Connect' in the sidebar when internet returns.</text>
        </binding>
    </visual>
</toast>
"@
            $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
            $xml.LoadXml($template)
            $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
            [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("PNP CRM").Show($toast)
        } catch { }
    }
}

# 7. Wait for Server to be Ready

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
    "Server is ready!" | Out-File $LogFile -Append
    if (-not $BackgroundOnly) {
        "Opening browser..." | Out-File $LogFile -Append
        $browser = Find-Browser
        if ($browser) {
            $ProfileDir = Join-Path $env:TEMP "pnp_crm_session"
            if (Test-Path $ProfileDir) {
                Remove-Item -Path $ProfileDir -Recurse -Force -ErrorAction SilentlyContinue
            }
            Start-Process $browser -ArgumentList "--app=$url", "--window-size=1280,800", "--user-data-dir=`"$ProfileDir`""
        } else {
            Start-Process $url
        }
    } else {
        "Background mode: Server running silently." | Out-File $LogFile -Append
    }
} else {
    "Server failed to start within timeout." | Out-File $ErrFile -Append
}

if (-not $BackgroundOnly) {
    Write-Host "`nPress Enter to close this window..." -ForegroundColor Yellow
    Read-Host
}
