#define MyAppName "PNP CRM"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "PNP CRM"

[Setup]
AppId={{D91D8B4D-3C3E-4B8D-A21C-2BB7B0F3C2C1}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\PNP CRM
DefaultGroupName={#MyAppName}
OutputDir=.
OutputBaseFilename=PNP-CRM-Setup
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
SetupIconFile=..\public\crm_icon.ico

[Files]
Source: "..\packaging\release\*"; DestDir: "{app}"; Flags: recursesubdirs ignoreversion; Permissions: users-readexec
Source: "..\tools\pnp-crm-launch.ps1"; DestDir: "{app}\tools"; Flags: ignoreversion; Permissions: users-readexec
Source: "..\tools\pnp-crm-install-config.ps1"; DestDir: "{app}\tools"; Flags: ignoreversion; Permissions: users-readexec
Source: "..\tools\pnp-crm-register-backup.ps1"; DestDir: "{app}\tools"; Flags: ignoreversion; Permissions: users-readexec
Source: "..\tools\pnp-crm-reset-admin.mjs"; DestDir: "{app}\tools"; Flags: ignoreversion; Permissions: users-readexec
Source: "..\tools\pnp-crm-backup.mjs"; DestDir: "{app}\tools"; Flags: ignoreversion; Permissions: users-readexec

[Dirs]
Name: "{commonappdata}\PNP CRM\config"
Name: "{commonappdata}\PNP CRM\data"
Name: "{commonappdata}\PNP CRM\uploads"
Name: "{commonappdata}\PNP CRM\logs"
Name: "{commonappdata}\PNP CRM\backups"

[Icons]
Name: "{autodesktop}\PNP CRM"; Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\tools\pnp-crm-launch.ps1"""
Name: "{group}\PNP CRM"; Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\tools\pnp-crm-launch.ps1"""

[Run]
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\tools\pnp-crm-install-config.ps1"""; Flags: waituntilterminated
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\tools\pnp-crm-register-backup.ps1"""; Flags: waituntilterminated
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\tools\pnp-crm-launch.ps1"""; Flags: nowait postinstall skipifsilent
