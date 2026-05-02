Set oWS = WScript.CreateObject("WScript.Shell")
sDesktop = oWS.SpecialFolders("Desktop")

' Get the folder where this VBS file lives
sAppFolder = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\") - 1)

' Shortcut configuration
sShortcutPath = sDesktop & "\PNP CRM.lnk"

' Delete old shortcut if exists to force icon refresh
Set fso = CreateObject("Scripting.FileSystemObject")
If fso.FileExists(sShortcutPath) Then
    fso.DeleteFile(sShortcutPath)
End If

Set oShortcut = oWS.CreateShortcut(sShortcutPath)

oShortcut.TargetPath = sAppFolder & "\start-crm.bat"
oShortcut.WorkingDirectory = sAppFolder
oShortcut.Description = "Launch PNP CRM Standalone"
oShortcut.IconLocation = sAppFolder & "\public\crm_logo.ico"

oShortcut.Save

WScript.Echo "Success! PNP CRM shortcut has been updated with the brand logo."
