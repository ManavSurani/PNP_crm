$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
$WshShell = New-Object -ComObject WScript.Shell
$AppDir = 'c:\Vs\pnp_crm'
$BaseIconPath = Join-Path $AppDir "public\crm_icon.ico"

$AllShortcuts = Get-ChildItem -Path $DesktopPath -Filter "*.lnk"
foreach ($file in $AllShortcuts) {
    try {
        $Shortcut = $WshShell.CreateShortcut($file.FullName)
        if ($Shortcut.Arguments -like "*launch-pnp.vbs*") {
            $Shortcut.IconLocation = $BaseIconPath
            $Shortcut.Description = "PNP CRM Application"
            $Shortcut.Save()
            Write-Host "Reset shortcut: $($file.FullName)"
        }
    } catch {}
}
