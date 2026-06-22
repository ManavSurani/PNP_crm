# PNP CRM Desktop Notifier - Background Service
# Tooltip shows: Total count + breakdown by category (Overdue / Follow-Ups / Site Visits)
# Instant Reactivity: Watches _data\crm.db for changes
# Adapted for C:\Vs\pnp_crm (this PC)

$AppRoot = "C:\Vs\pnp_crm"
$BadgesDir = Join-Path $AppRoot "public\badges_v2"
$ApiUrl = "http://localhost:3000/api/notifications?token=pnp_desktop_local_secret"
$Port = 3000

$PrevCount = -1
$PrevDesc = ""
$LastDbTime = $null
$FailCount = 0
$OfflineTolerance = 3
$LoopCounter = 0

# Load Shell COM for shortcut manipulation
$WshShell = New-Object -ComObject WScript.Shell

$Source = @"
using System;
using System.Runtime.InteropServices;
public class NativeMethods {
    [DllImport("shell32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern void SHChangeNotify(int wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);

    [DllImport("shell32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern void SHChangeNotify(int wEventId, uint uFlags, string dwItem1, string dwItem2);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr FindWindowEx(IntPtr hwndParent, IntPtr hwndChildAfter, string lpszClass, string lpszWindow);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public static void RefreshDesktop() {
        // Send F5 refresh command (41504) to the Desktop (Progman)
        IntPtr progman = FindWindow("Progman", null);
        PostMessage(progman, 0x0111, new IntPtr(41504), IntPtr.Zero);
        
        // In Windows 10/11, the desktop might be hosted by WorkerW
        IntPtr desktopWorkerW = IntPtr.Zero;
        do {
            desktopWorkerW = FindWindowEx(IntPtr.Zero, desktopWorkerW, "WorkerW", null);
            if (desktopWorkerW != IntPtr.Zero) {
                IntPtr shellDll = FindWindowEx(desktopWorkerW, IntPtr.Zero, "SHELLDLL_DefView", null);
                if (shellDll != IntPtr.Zero) {
                    PostMessage(shellDll, 0x0111, new IntPtr(41504), IntPtr.Zero);
                }
            }
        } while (desktopWorkerW != IntPtr.Zero);
    }
}
"@
try { Add-Type -TypeDefinition $Source -ErrorAction SilentlyContinue } catch {}

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

function Update-ShortcutIcon {
    param([string]$ShortcutPath, [int]$Count, [string]$Description)
    try {
        $badgeIndex = [Math]::Min($Count, 99)
        $icoFile = Join-Path $BadgesDir "badge_$badgeIndex.ico"
        if (-not (Test-Path $icoFile)) { $icoFile = Join-Path $AppRoot "public\crm_icon.ico" }
        
        # 1. Write the new icon + description to the shortcut file
        $shortcut = $WshShell.CreateShortcut($ShortcutPath)
        $shortcut.IconLocation = "$icoFile, 0"
        $shortcut.Description = $Description
        $shortcut.Save()
        
        # 2. Touch LastWriteTime
        try { (Get-Item $ShortcutPath).LastWriteTime = Get-Date } catch {}
        
        # 3. Rename trick: forces Explorer to see a brand-new file, bypassing all caches
        try {
            $tmpPath = "$ShortcutPath.tmp"
            Rename-Item -Path $ShortcutPath -NewName (Split-Path $tmpPath -Leaf) -Force -ErrorAction Stop
            Rename-Item -Path $tmpPath -NewName (Split-Path $ShortcutPath -Leaf) -Force -ErrorAction Stop
        } catch {}
        
        # 6. Shell notifications
        try { 
            [NativeMethods]::SHChangeNotify(0x00002000, 0x0005, $ShortcutPath, $null)
            [NativeMethods]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero) 
        } catch {}

        # 7. Silent Desktop Refresh (F5 equivalent)
        try { [NativeMethods]::RefreshDesktop() } catch {}
    } catch {}
}

function Get-Notifications {
    try {
        $cacheBuster = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
        $bustedUrl = "$ApiUrl&t=$cacheBuster"
        $response = Invoke-RestMethod -Uri $bustedUrl -TimeoutSec 8 -ErrorAction Stop
        return ,$response
    } catch {
        return $null
    }
}

function Process-Notifications {
    param($Notifications)
    
    # Only count the 3 specific categories, forcing Array @() to prevent single-item unrolling bug
    $arr = @($Notifications)
    $overdue   = @($arr | Where-Object { $_.type -eq "OVERDUE" }).Count
    $followUps = @($arr | Where-Object { $_.type -eq "FOLLOW_UP" }).Count
    $visits    = @($arr | Where-Object { $_.type -eq "SITE_VISIT" }).Count
    
    $total = $overdue + $followUps + $visits
    
    if ($total -eq 0) {
        return @{ Count = 0; Desc = "PNP CRM`nAll caught up! No pending tasks." }
    }
    
    $lines = @()
    $lines += "PNP CRM  |  $total Notification$(if ($total -ne 1) {'s'}) pending"
    $lines += "----------------------------"

    if ($overdue -gt 0)   { $lines += "!! Overdue      : $overdue" }
    if ($followUps -gt 0) { $lines += ">> Follow-Ups   : $followUps" }
    if ($visits -gt 0)    { $lines += ">> Site Visits  : $visits" }

    $desc = $lines -join "`n"
    if ($desc.Length -gt 255) { $desc = $desc.Substring(0, 252) + "..." }
    
    return @{ Count = $total; Desc = $desc }
}

# Initial fetch trigger
$shouldFetch = $true

# Main Loop (Runs every 2 seconds)
while ($true) {
    try {
        # Always fetch to prevent DB LastWriteTime caching delays
        $shouldFetch = $true
        
        if ($shouldFetch) {
            $shouldFetch = $false
            
            # Check server
            $serverRunning = $false
            try {
                $testResponse = Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
                $serverRunning = $true
                $FailCount = 0 # Reset fail counter on success
            } catch {
                $FailCount++
            }

            if ($serverRunning) {
                $notifications = Get-Notifications
                if ($null -ne $notifications) {
                    $result = Process-Notifications -Notifications $notifications
                    $count = $result.Count
                    $desc = $result.Desc
                    
                    if ($count -ne $PrevCount -or $desc -ne $PrevDesc) {
                        $shortcutPath = Find-PnpShortcut
                        if ($shortcutPath) {
                            Update-ShortcutIcon -ShortcutPath $shortcutPath -Count $count -Description $desc
                            $PrevCount = $count
                            $PrevDesc = $desc
                        }
                    }
                }
            } else {
                # Server Offline Logic (Requires consecutive failures)
                if ($FailCount -ge $OfflineTolerance -and $PrevCount -ne 0) {
                    $shortcutPath = Find-PnpShortcut
                    if ($shortcutPath) {
                        Update-ShortcutIcon -ShortcutPath $shortcutPath -Count 0 -Description "PNP CRM`n[ Server is offline ]"
                        $PrevCount = 0
                        $PrevDesc = ""
                    }
                }
            }
        }
    } catch {}
    
    $LoopCounter++
    Start-Sleep -Seconds 2
}
