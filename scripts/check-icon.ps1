$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
$AllShortcuts = Get-ChildItem -Path $DesktopPath -Filter "*.lnk"
foreach ($file in $AllShortcuts) {
    try {
        $tempShortcut = $WshShell.CreateShortcut($file.FullName)
        if ($tempShortcut.Arguments -like "*launch-pnp.vbs*") {
            Write-Host "Name: $($file.Name)"
            Write-Host "Target: $($tempShortcut.TargetPath)"
            Write-Host "Arguments: $($tempShortcut.Arguments)"
            Write-Host "Description: $($tempShortcut.Description)"
            Write-Host "IconLocation: $($tempShortcut.IconLocation)"
            break
        }
    } catch {}
}

# Also run the API check manually to see if it works
$ApiUrl = "http://localhost:3000/api/notifications"
try {
    $res = Invoke-RestMethod -Uri $ApiUrl -TimeoutSec 5
    Write-Host "API Result count: $($res.Count)"
} catch {
    Write-Host "API Error: $_" -ForegroundColor Red
}
