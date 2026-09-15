param(
    [switch]$BackgroundOnly,
    [switch]$Stop
)

$ErrorActionPreference = "Stop"
$AppRoot = Split-Path -Parent $PSScriptRoot
$ProgramDataRoot = Join-Path $env:ProgramData "PNP CRM"
$ConfigPath = Join-Path $ProgramDataRoot "config\app-config.json"
$Port = 3000

function Read-AppConfig {
    if (Test-Path $ConfigPath) {
        return Get-Content $ConfigPath -Raw | ConvertFrom-Json
    }
    return $null
}

function Read-EnvValue([string]$Name) {
    $envPath = Join-Path $AppRoot ".env"
    if (-not (Test-Path $envPath)) { return $null }
    $line = Get-Content $envPath | Where-Object { $_ -match "^\s*$Name\s*=" } | Select-Object -First 1
    if ($line) { return ($line -split "=", 2)[1].Trim().Trim('"').Trim("'") }
    return $null
}

function Stop-Crm {
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    foreach ($connection in $connections) {
        Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

$config = Read-AppConfig
if ($config -and $config.port) {
    $Port = [int]$config.port
} elseif ($env:PORT) {
    $Port = [int]$env:PORT
} elseif (Read-EnvValue "PORT") {
    $Port = [int](Read-EnvValue "PORT")
}

if ($Stop) {
    Stop-Crm
    exit 0
}

if ($config) {
    $env:PORT = [string]$Port
    $env:NEXTAUTH_URL = "http://localhost:$Port"
    $env:DATABASE_URL = $config.databaseUrl
    $env:AUTH_SECRET = $config.authSecret
    $env:NEXTAUTH_SECRET = $config.nextAuthSecret
    $env:INTERNAL_BACKUP_SECRET = $config.internalBackupSecret
    $env:BACKUP_SECRET = $config.backupSecret
}

if ($config -and -not (Test-Path ($config.databaseUrl -replace "^file:", ""))) {
    & npm.cmd exec prisma db push -- --accept-data-loss
    if ($LASTEXITCODE -ne 0) { throw "Database initialization failed." }
    if (Test-Path (Join-Path $AppRoot "seed.mjs")) {
        & node.exe (Join-Path $AppRoot "seed.mjs")
        if ($LASTEXITCODE -ne 0) { throw "Database seed failed." }
    }
}

if (-not (Test-Path (Join-Path $AppRoot ".next\BUILD_ID"))) {
    throw "Production build not found. Run the existing npm run build command first."
}

$existing = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if (-not $existing) {
    $startArguments = @("node_modules\next\dist\bin\next", "start")
    if ($config -or $env:PORT -or (Read-EnvValue "PORT")) {
        $startArguments += @("-p", [string]$Port)
    }
    Start-Process -FilePath "node.exe" `
        -ArgumentList $startArguments `
        -WorkingDirectory $AppRoot -WindowStyle Hidden
}

if (-not $BackgroundOnly) {
    Start-Process "http://localhost:$Port"
}
