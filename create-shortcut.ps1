$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $DesktopPath "PNP CRM.lnk"
$AppFolder = $PSScriptRoot.TrimEnd('\')
$IconPath = Join-Path $AppFolder "public\crm_logo.ico"
$LauncherPath = Join-Path $AppFolder "launch-pnp.vbs"

# Delete old shortcut if exists
if (Test-Path $ShortcutPath) { Remove-Item $ShortcutPath -Force }

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$LauncherPath`""
$Shortcut.WorkingDirectory = $AppFolder
$Shortcut.IconLocation = $IconPath
$Shortcut.Description = "PNP CRM Application"
$Shortcut.Save()

Write-Host "Success! Desktop shortcut created at $ShortcutPath" -ForegroundColor Green
