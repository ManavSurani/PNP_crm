Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" | Where-Object { $_.CommandLine -like "*desktop-notifier.ps1*" } | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}
Write-Host "Testing desktop-notifier.ps1 synchronously..."
& "C:\Vs\pnp_crm\desktop-notifier.ps1"
