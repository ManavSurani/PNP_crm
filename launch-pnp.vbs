Dim oShell, sDir
Set oShell = CreateObject("WScript.Shell")

' Get the folder where this VBS file lives
sDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))

' Run start-crm.bat completely hidden (0 = no window, False = don't wait)
oShell.Run "cmd /c """ & sDir & "start-crm.bat""", 0, False

Set oShell = Nothing
