; Script generated for Digifort WhatsApp Sender
; SEE THE DOCUMENTATION FOR DETAILS ON CREATING INNO SETUP SCRIPT FILES!

#define MyAppName "Digifort WA Sender"
#define MyAppVersion "1.0"
#define MyAppPublisher "Digifort Labs"
#define MyAppURL "https://www.digifortlabs.com/"
#define MyAppExeName "DigifortWASender.exe"

[Setup]
AppId={{C88008-401-551-1833}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=dist_installer
OutputBaseFilename=DigifortWASender_Setup_v{#MyAppVersion}
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Main Executable
Source: "dist\DigifortWASender\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; Protocol Handler Helper
Source: "dist\RegisterProtocol\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
; Run the Protocol Registrar nicely with a status message
Filename: "{app}\RegisterProtocol.exe"; Description: "Register digifort-wa:// Protocol"; Flags: runascurrentuser nowait postinstall; StatusMsg: "Registering URL Protocol..."
