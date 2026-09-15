param(
    [string]$Time = "02:00"
)

$ErrorActionPreference = "Stop"
$TaskName = "PNP CRM Daily Backup"
$AppRoot = Split-Path -Parent $PSScriptRoot
$Node = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if (-not $Node) {
    Write-Warning "Node.js was not found; backup task was not registered."
    exit 0
}

$action = New-ScheduledTaskAction `
    -Execute $Node `
    -Argument ('"' + (Join-Path $AppRoot "pnp-crm-backup.mjs") + '"') `
    -WorkingDirectory $AppRoot
$trigger = New-ScheduledTaskTrigger -Daily -At $Time
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
Write-Host "Registered $TaskName at $Time with missed-run recovery."
