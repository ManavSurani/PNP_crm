Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\\Vs\\pnp_crm"
WshShell.Run """C:\Program Files\nodejs\node.exe"" ""C:\Vs\pnp_crm\scripts\auto-backup.mjs""", 0, False