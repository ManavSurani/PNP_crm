$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $DesktopPath "PNP CRM.lnk"
$AppFolder = $PSScriptRoot.TrimEnd('\')
$IconPath = Join-Path $AppFolder "public\crm_icon.ico"
$LauncherPath = Join-Path $AppFolder "launch-pnp.vbs"

# Verify Icon exists
if (-not (Test-Path $IconPath)) {
    Write-Error "Icon not found at $IconPath. Please ensure the file exists."
    exit 1
}

# Delete old shortcut if exists to force refresh
if (Test-Path $ShortcutPath) { Remove-Item $ShortcutPath -Force }

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "C:\Windows\System32\wscript.exe"
$Shortcut.Arguments = "`"$LauncherPath`""
$Shortcut.WorkingDirectory = $AppFolder
$Shortcut.IconLocation = $IconPath
$Shortcut.Description = "PNP CRM Application"
$Shortcut.Save()

Write-Host "Success! Desktop shortcut created at $ShortcutPath" -ForegroundColor Green
