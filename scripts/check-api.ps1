$ApiUrl = "http://localhost:3000/api/notifications?token=pnp_desktop_local_secret"
try {
    $res = Invoke-RestMethod -Uri $ApiUrl -TimeoutSec 5
    Write-Host "API Result count: $($res.Count)"
} catch {
    Write-Host "API Error: $_" -ForegroundColor Red
}
