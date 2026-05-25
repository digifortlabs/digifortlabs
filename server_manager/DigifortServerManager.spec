# -*- mode: python ; coding: utf-8 -*-
block_cipher = None

a = Analysis(
    ['desktop_app.py'],
    pathex=[],
    binaries=[],
    datas=[('static', 'static')],  # Embeds static index/css/js assets inside the exe!
    hiddenimports=['uvicorn', 'fastapi', 'jinja2', 'websockets', 'pystray', 'PIL'],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='DigifortServerManager',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False, # Hides the background console window, running purely as a GUI desktop app!
    icon=None      # Safe default, set to a valid .ico path if available
)
