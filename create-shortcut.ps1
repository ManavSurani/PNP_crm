# PNP CRM Multi-Location Shortcut Creator
$AppRoot = $PSScriptRoot
if (-not $AppRoot) { $AppRoot = "C:\Vs\pnp_crm" }

$LaunchVbs = Join-Path $AppRoot "launch-pnp.vbs"
$StartupVbs = Join-Path $AppRoot "startup-pnp.vbs"
$IconFile = Join-Path $AppRoot "public\crm_icon.ico"

$WshShell = New-Object -ComObject WScript.Shell

# 1. Gather all target desktop directories
$DesktopTargets = @(
    [Environment]::GetFolderPath('Desktop'),
    "C:\Users\Jay\Desktop",
    "C:\Users\Jay\OneDrive\Desktop",
    "C:\Users\Public\Desktop"
) | Select-Object -Unique | Where-Object { Test-Path $_ }

# 2. Deploy Desktop Shortcuts
foreach ($dir in $DesktopTargets) {
    try {
        $lnkPath = Join-Path $dir "PNP CRM.lnk"
        $shortcut = $WshShell.CreateShortcut($lnkPath)
        $shortcut.TargetPath = "C:\Windows\System32\wscript.exe"
        $shortcut.Arguments = "`"$LaunchVbs`""
        $shortcut.WorkingDirectory = $AppRoot
        $shortcut.Description = "PNP CRM - Enterprise Management System"
        if (Test-Path $IconFile) {
            $shortcut.IconLocation = "$IconFile,0"
        }
        $shortcut.Save()
        Write-Host "Created Desktop Shortcut: $lnkPath" -ForegroundColor Green
    } catch {
        Write-Warning "Could not write shortcut to $($dir): $_"
    }
}

# 3. Deploy Windows Start Menu Shortcut (Enables Win + S Search)
$StartMenuPrograms = [Environment]::GetFolderPath('Programs')
if (Test-Path $StartMenuPrograms) {
    try {
        $startMenuLnk = Join-Path $StartMenuPrograms "PNP CRM.lnk"
        $startShortcut = $WshShell.CreateShortcut($startMenuLnk)
        $startShortcut.TargetPath = "C:\Windows\System32\wscript.exe"
        $startShortcut.Arguments = "`"$LaunchVbs`""
        $startShortcut.WorkingDirectory = $AppRoot
        $startShortcut.Description = "PNP CRM - Enterprise Management System"
        if (Test-Path $IconFile) {
            $startShortcut.IconLocation = "$IconFile,0"
        }
        $startShortcut.Save()
        Write-Host "Created Start Menu Shortcut: $startMenuLnk" -ForegroundColor Green
    } catch {
        Write-Warning "Could not write Start Menu shortcut: $_"
    }
}

# 4. Deploy Windows Startup Shortcut (Background Server Autostart)
$StartupPath = [Environment]::GetFolderPath('Startup')
if (Test-Path $StartupPath) {
    try {
        $startupLnk = Join-Path $StartupPath "PNP_CRM_Background_Server.lnk"
        $startupShortcut = $WshShell.CreateShortcut($startupLnk)
        $startupShortcut.TargetPath = "C:\Windows\System32\wscript.exe"
        $startupShortcut.Arguments = "`"$StartupVbs`""
        $startupShortcut.WorkingDirectory = $AppRoot
        $startupShortcut.Description = "PNP CRM Background Server"
        if (Test-Path $IconFile) {
            $startupShortcut.IconLocation = "$IconFile,0"
        }
        $startupShortcut.Save()
        Write-Host "Created Startup Shortcut: $startupLnk" -ForegroundColor Green
    } catch {
        Write-Warning "Could not write Startup shortcut: $_"
    }
}

# 5. Flush Windows Shell Icon Cache
try {
    $Source = @"
using System;
using System.Runtime.InteropServices;
public class ShellHelper {
    [DllImport("shell32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern void SHChangeNotify(int wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);
}
"@
    Add-Type -TypeDefinition $Source -ErrorAction SilentlyContinue
    [ShellHelper]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)
    Write-Host "Refreshed Windows Shell Icon Cache." -ForegroundColor Cyan
} catch { }

Write-Host "`nAll PNP CRM shortcuts successfully configured!" -ForegroundColor Green
