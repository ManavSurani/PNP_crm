Set oWS = WScript.CreateObject("WScript.Shell")
' Get the folder where this VBS file lives
sAppFolder = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\") - 1)
oWS.CurrentDirectory = sAppFolder
' Run the PowerShell shortcut creator
oWS.Run "powershell.exe -ExecutionPolicy Bypass -File .\create-shortcut.ps1", 1, True
