Dim oShell, sDir, sCmd
Set oShell = CreateObject("WScript.Shell")

' Get the folder where this VBS file lives
sDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))

' Run start-crm.ps1 via PowerShell completely hidden
' -WindowStyle Hidden ensures the PowerShell engine stays invisible
' The 0 flag in oShell.Run ensures the CMD/Process launch is invisible
sCmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & sDir & "start-crm.ps1"""
oShell.Run sCmd, 0, False

Set oShell = Nothing
