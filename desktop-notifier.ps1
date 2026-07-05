# desktop-notifier.ps1
# Background script to update the desktop shortcut with live notification counts and badges

$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
$ApiUrl = "http://localhost:3000/api/notifications?token=pnp_desktop_local_secret"
$WshShell = New-Object -ComObject WScript.Shell
$AppDir = $PSScriptRoot
$BadgesDir = Join-Path $AppDir "public\badges_v2"

# C# Helper for SHChangeNotify to refresh desktop icons
$Source = @"
using System;
using System.Runtime.InteropServices;
public class NativeMethods {
    [DllImport("shell32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern void SHChangeNotify(int wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);

    [DllImport("shell32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern void SHChangeNotifyPath(int wEventId, uint uFlags, string dwItem1, string dwItem2);
}
"@
Add-Type -TypeDefinition $Source

function Refresh-Desktop {
    param([string]$FilePath)
    if ([string]::IsNullOrEmpty($FilePath)) {
        [NativeMethods]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)
    } else {
        [NativeMethods]::SHChangeNotifyPath(0x00002000, 0x0005, $FilePath, $null)
    }
}

function Get-CrmShortcut {
    $AllShortcuts = Get-ChildItem -Path $DesktopPath -Filter "*.lnk"
    foreach ($file in $AllShortcuts) {
        try {
            $tempShortcut = $WshShell.CreateShortcut($file.FullName)
            if ($tempShortcut.Arguments -like "*launch-pnp.vbs*") {
                return $file.FullName
            }
        } catch {}
    }
    return $null
}

# Initial check
if ($null -eq (Get-CrmShortcut)) {
    exit
}

while ($true) {
    try {
        # Fetch notifications with Cache-Buster Timestamp to bypass PowerShell caching
        $UrlWithTimestamp = "$ApiUrl&_t=$([DateTimeOffset]::Now.ToUnixTimeMilliseconds())"
        $response = Invoke-RestMethod -Uri $UrlWithTimestamp -TimeoutSec 10 -ErrorAction Stop
        
        $total = 0
        $followUps = 0
        $siteVisits = 0
        $overdue = 0

        # Note: API returns a JSON array of notification objects
        if ($null -ne $response) {
            foreach ($n in $response) {
                $total++
                if ($n.category -eq "Follow-Ups") { $followUps++ }
                elseif ($n.category -eq "Site Visits") { $siteVisits++ }
                elseif ($n.category -eq "Overdue") { $overdue++ }
            }
        }

        # Build tooltip description
        $desc = "PNP CRM Notifications"
        $desc += "`nTotal: $total"
        if ($followUps -gt 0) { $desc += "`nFollow-Ups: $followUps" }
        if ($siteVisits -gt 0) { $desc += "`nSite Visits: $siteVisits" }
        if ($overdue -gt 0) { $desc += "`nOverdue: $overdue" }

        if ($total -eq 0) {
            $desc = "PNP CRM Application`n(No pending notifications)"
        }

        # Determine Icon Path
        $iconNum = $total
        if ($iconNum -gt 99) { $iconNum = 99 }
        if ($iconNum -lt 0) { $iconNum = 0 }
        
        $IconPath = Join-Path $BadgesDir "badge_$iconNum.ico"
        
        # Fallback to base icon if badge missing
        if (-not (Test-Path $IconPath)) {
            $IconPath = Join-Path $AppDir "public\crm_icon.ico"
        }

        # Dynamically find the shortcut in case it was renamed
        $ShortcutPath = Get-CrmShortcut
        
        if ($null -ne $ShortcutPath) {
            # Load shortcut and update description
            $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
            
            $changed = $false
            if ($Shortcut.Description -ne $desc) {
                $Shortcut.Description = $desc
                $changed = $true
            }
            $currentIcon = $Shortcut.IconLocation -replace ",0$", ""
            if ($currentIcon -ne $IconPath) {
                $Shortcut.IconLocation = $IconPath
                $changed = $true
            }
            
            # Only save and refresh if changed (minimizes disk writes and screen flashing)
            if ($changed) {
                $Shortcut.Save()
                try { (Get-Item $ShortcutPath).LastWriteTime = (Get-Date) } catch {}
                Refresh-Desktop -FilePath $ShortcutPath
            }
        }
    } catch {
        # Silently fail if server is unreachable or file is locked
    }

    Start-Sleep -Seconds 30
}
