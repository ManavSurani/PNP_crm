$ErrorActionPreference = "Stop"
$root = Join-Path $env:ProgramData "PNP CRM"
$configDirectory = Join-Path $root "config"
$configPath = Join-Path $configDirectory "app-config.json"
$dataDirectory = Join-Path $root "data"
$uploadsDirectory = Join-Path $root "uploads"
$logsDirectory = Join-Path $root "logs"
$backupsDirectory = Join-Path $root "backups"

if (Test-Path $configPath) { exit 0 }
New-Item -ItemType Directory -Force -Path $configDirectory, $dataDirectory, $uploadsDirectory, $logsDirectory, $backupsDirectory | Out-Null

function New-Secret {
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return ([BitConverter]::ToString($bytes)).Replace("-", "").ToLowerInvariant()
}

$config = @{
    port = 43100
    databaseUrl = "file:$dataDirectory\crm.db"
    dataDir = $root
    uploadsDir = $uploadsDirectory
    logsDir = $logsDirectory
    backupsDir = $backupsDirectory
    authSecret = New-Secret
    nextAuthSecret = New-Secret
    internalBackupSecret = New-Secret
    backupSecret = New-Secret
    r2 = @{}
}
$config | ConvertTo-Json -Depth 5 | Set-Content -Path $configPath -Encoding UTF8
Write-Host "PNP CRM ProgramData configuration created."
