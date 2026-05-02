$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $DesktopPath "PNP CRM.lnk"
$AppFolder = $PSScriptRoot.TrimEnd('\')

# Delete old shortcut
if (Test-Path $ShortcutPath) {
    Remove-Item $ShortcutPath -Force
}

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"" + (Join-Path $AppFolder "launch-pnp.vbs") + "`""
$Shortcut.WorkingDirectory = $AppFolder
$Shortcut.Description = "Launch PNP CRM Standalone"
$Shortcut.IconLocation = Join-Path $AppFolder "public\crm_logo.ico"
$Shortcut.Save()

Write-Host "Success! Desktop shortcut created at $ShortcutPath"

