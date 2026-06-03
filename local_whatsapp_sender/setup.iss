[Setup]
AppName=WhatsApp Sender
AppVersion=1.0
DefaultDirName={pf}\WhatsApp Sender
DefaultGroupName=WhatsApp Sender
OutputDir=.
OutputBaseFilename=WhatsAppSender_Setup
SetupIconFile=logo.ico
Compression=lzma2
SolidCompression=yes
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Files]
Source: "dist\WhatsAppSender\*"; DestDir: "{app}"; Flags: ignoreversion recurseSubdirs createallsubdirs

[Icons]
Name: "{group}\WhatsApp Sender"; Filename: "{app}\WhatsAppSender.exe"
Name: "{commondesktop}\WhatsApp Sender"; Filename: "{app}\WhatsAppSender.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop icon"; GroupDescription: "Additional icons:"
