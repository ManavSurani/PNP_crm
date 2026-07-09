# desktop-notifier.ps1
# Background script to update the desktop shortcut with live badges AND send native Windows Toast Notifications

$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
$ApiUrl = "http://localhost:3000/api/notifications?token=pnp_desktop_local_secret"
$WshShell = New-Object -ComObject WScript.Shell
$AppDir = $PSScriptRoot
$BadgesDir = Join-Path $AppDir "public\badges_v2"

# Initialize UWP classes for Toast Notifications
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

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

$previousIds = @()
$isFirstRun = $true

while ($true) {
    try {
        # Fetch notifications
        $UrlWithTimestamp = "$ApiUrl&_t=$([DateTimeOffset]::Now.ToUnixTimeMilliseconds())"
        $response = Invoke-RestMethod -Uri $UrlWithTimestamp -TimeoutSec 10 -ErrorAction Stop
        
        $currentIds = @()
        $total = 0
        $followUps = 0
        $siteVisits = 0
        $overdue = 0
        
        if ($null -ne $response) {
            foreach ($n in $response) {
                $currentIds += $n.id
                $total++
                if ($n.category -eq "Follow-Ups") { $followUps++ }
                elseif ($n.category -eq "Site Visits") { $siteVisits++ }
                elseif ($n.category -eq "Overdue") { $overdue++ }
            }
            
            # --- TOAST NOTIFICATIONS (Only for BRAND NEW items after startup) ---
            $newNotifications = $response | Where-Object { $_.id -notin $previousIds }
            
            if (-not $isFirstRun -and $newNotifications.Count -gt 0) {
                foreach ($newNotif in $newNotifications) {
                    $title = $newNotif.title
                    $description = $newNotif.description
                    
                    $xmlString = @"
<toast>
  <visual>
    <binding template="ToastGeneric">
      <text>$title</text>
      <text>$description</text>
    </binding>
  </visual>
</toast>
"@
                    $xml = [Windows.Data.Xml.Dom.XmlDocument]::new()
                    $xml.LoadXml($xmlString)
                    $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
                    $toast.ExpirationTime = [DateTimeOffset]::Now.AddHours(1)
                    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("PNP CRM").Show($toast)
                }
            }
        }
        
        # --- DESKTOP ICON UPDATES ---
        $desc = "PNP CRM Notifications"
        $desc += "`nTotal: $total"
        if ($followUps -gt 0) { $desc += "`nFollow-Ups: $followUps" }
        if ($siteVisits -gt 0) { $desc += "`nSite Visits: $siteVisits" }
        if ($overdue -gt 0) { $desc += "`nOverdue: $overdue" }

        if ($total -eq 0) {
            $desc = "PNP CRM Application`n(No pending notifications)"
        }

        $iconNum = $total
        if ($iconNum -gt 99) { $iconNum = 99 }
        if ($iconNum -lt 0) { $iconNum = 0 }
        
        $IconPath = Join-Path $BadgesDir "badge_$iconNum.ico"
        if (-not (Test-Path $IconPath)) {
            $IconPath = Join-Path $AppDir "public\crm_icon.ico"
        }

        $ShortcutPath = Get-CrmShortcut
        
        if ($null -ne $ShortcutPath) {
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
            
            if ($changed) {
                $Shortcut.Save()
                try { (Get-Item $ShortcutPath).LastWriteTime = (Get-Date) } catch {}
                Refresh-Desktop -FilePath $ShortcutPath
            }
        }
        
        # Update state
        $previousIds = $currentIds
        $isFirstRun = $false
        
    } catch {
        # Silently fail if server is unreachable
    }

    Start-Sleep -Seconds 30
}
