$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
$AllShortcuts = Get-ChildItem -Path $DesktopPath -Filter "*.lnk"
$WshShell = New-Object -ComObject WScript.Shell

$desc = "PNP CRM Notifications`nTotal: 5`nFollow-Ups: 3`nSite Visits: 2"

foreach ($file in $AllShortcuts) {
    try {
        $tempShortcut = $WshShell.CreateShortcut($file.FullName)
        if ($tempShortcut.Arguments -like "*launch-pnp.vbs*") {
            $tempShortcut.Description = $desc
            $tempShortcut.Save()
            Write-Host "Success! Shortcut updated at $($file.FullName)" -ForegroundColor Green
            break
        }
    } catch {}
}
