$w=New-Object -ComObject WScript.Shell
$s=$w.CreateShortcut([Environment]::GetFolderPath('Desktop')+'\PNP CRM.lnk')
$s.IconLocation="C:\Vs\pnp_crm\public\badges_v2\badge_8.ico"
$s.Save()

$Source = @"
using System;
using System.Runtime.InteropServices;
public class NativeMethods {
    [DllImport("shell32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern void SHChangeNotify(int wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);
}
"@
Add-Type -TypeDefinition $Source
[NativeMethods]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)

Write-Host "Set and Refreshed!"
