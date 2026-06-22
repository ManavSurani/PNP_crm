$AppRoot = "C:\Vs\pnp_crm"
$BadgesDir = Join-Path $AppRoot "public\badges_v2"
$ApiUrl = "http://localhost:3000/api/notifications?token=pnp_desktop_local_secret"
$Port = 3000

$PrevCount = -1
$PrevDesc = ""

$WshShell = New-Object -ComObject WScript.Shell

function Find-PnpShortcut {
    $DesktopPath = [System.Environment]::GetFolderPath('Desktop')
    $AllShortcuts = Get-ChildItem -Path $DesktopPath -Filter "*.lnk" -ErrorAction SilentlyContinue
    foreach ($file in $AllShortcuts) {
        try {
            $tempShortcut = $WshShell.CreateShortcut($file.FullName)
            if ($tempShortcut.TargetPath -like "*pnp*" -or 
                $tempShortcut.Arguments -like "*start-crm*" -or 
                $tempShortcut.Arguments -like "*launch-pnp*" -or
                $file.Name -like "*PNP*" -or
                $file.Name -like "*CRM*") {
                return $file.FullName
            }
        } catch {}
    }
    return $null
}

function Get-Notifications {
    try {
        $cacheBuster = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
        $bustedUrl = "$ApiUrl&t=$cacheBuster"
        $response = Invoke-RestMethod -Uri $bustedUrl -TimeoutSec 8 -ErrorAction Stop
        return $response
    } catch {
        return $null
    }
}

function Process-Notifications {
    param($Notifications)
    $arr = @($Notifications)
    $overdue   = @($arr | Where-Object { $_.type -eq "OVERDUE" }).Count
    $followUps = @($arr | Where-Object { $_.type -eq "FOLLOW_UP" }).Count
    $visits    = @($arr | Where-Object { $_.type -eq "SITE_VISIT" }).Count
    $total = $overdue + $followUps + $visits
    if ($total -eq 0) { return @{ Count = 0; Desc = "PNP CRM`nAll caught up! No pending tasks." } }
    return @{ Count = $total; Desc = "PENDING: $total" }
}

for ($i=0; $i -lt 3; $i++) {
    Write-Host "--- Iteration $i ---"
    $notifications = Get-Notifications
    if ($null -ne $notifications) {
        $result = Process-Notifications -Notifications $notifications
        $count = $result.Count
        $desc = $result.Desc
        Write-Host "API Result -> Count: $count, Desc: $desc"
        
        if ($count -ne $PrevCount -or $desc -ne $PrevDesc) {
            Write-Host "Detected change! Updating shortcut..."
            $shortcutPath = Find-PnpShortcut
            if ($shortcutPath) {
                Write-Host "Shortcut found at: $shortcutPath"
                
                # Update Icon Logic
                $badgeIndex = [Math]::Min($count, 99)
                $icoFile = Join-Path $BadgesDir "badge_$badgeIndex.ico"
                
                $shortcut = $WshShell.CreateShortcut($shortcutPath)
                $shortcut.IconLocation = "$icoFile, 0"
                $shortcut.Description = $desc
                $shortcut.Save()
                
                try { (Get-Item $shortcutPath).LastWriteTime = Get-Date } catch {}
                try {
                    $tmpPath = "$shortcutPath.tmp"
                    Rename-Item -Path $shortcutPath -NewName (Split-Path $tmpPath -Leaf) -Force -ErrorAction Stop
                    Rename-Item -Path $tmpPath -NewName (Split-Path $shortcutPath -Leaf) -Force -ErrorAction Stop
                } catch { Write-Host "Rename failed: $_" }
                
                Write-Host "Shortcut updated successfully!"
                $PrevCount = $count
                $PrevDesc = $desc
            } else {
                Write-Host "Shortcut NOT FOUND!"
            }
        } else {
            Write-Host "No change detected."
        }
    } else {
        Write-Host "Failed to get notifications from API."
    }
    Start-Sleep -Seconds 2
}
