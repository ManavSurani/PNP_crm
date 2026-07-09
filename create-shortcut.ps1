$StartupPath = [Environment]::GetFolderPath('Startup')
$ShortcutPath = Join-Path $StartupPath 'PNP_CRM_Background_Server.lnk'
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = 'c:\Vs\pnp_crm\startup-pnp.vbs'
$Shortcut.WorkingDirectory = 'c:\Vs\pnp_crm'
$Shortcut.Save()
