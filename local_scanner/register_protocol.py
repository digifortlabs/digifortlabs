import sys
import os
import winreg
import ctypes

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def register_protocol():
    # Determine if running as script or frozen exe
    if getattr(sys, 'frozen', False):
        # We are running as RegisterProtocol.exe
        # The target scanner exe should be in the SAME directory
        base_dir = os.path.dirname(sys.executable)
        target_exe = os.path.join(base_dir, "DigifortScanner.exe")
        
        # Command: "Path\To\DigifortScanner.exe" "%1"
        cmd_str = f"\"{target_exe}\" \"%1\""
    else:
        # We are running as python script
        python_exe = sys.executable
        script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "scanner_app.py"))
        target_exe = script_path # For check below
        
        # Command: "python.exe" "scanner_app.py" "%1"
        cmd_str = f"\"{python_exe}\" \"{script_path}\" \"%1\""

    # Check if target exists
    if not os.path.exists(target_exe):
        print(f"Error: Could not find target app at: {target_exe}")
        print("Make sure DigifortScanner.exe is in the same folder as this tool.")
        return

    protocol = "digifort"
    key_path = f"Software\\Classes\\{protocol}"
    
    try:
        # Create the Protocol Key
        key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, key_path)
        winreg.SetValue(key, "", winreg.REG_SZ, "Digifort Scanner Protocol")
        winreg.SetValueEx(key, "URL Protocol", 0, winreg.REG_SZ, "")
        winreg.CloseKey(key)

        # Create the Default Icon Key
        icon_key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, f"{key_path}\\DefaultIcon")
        winreg.SetValue(icon_key, "", winreg.REG_SZ, f"\"{target_exe}\",0") 
        winreg.CloseKey(icon_key)

        # Create the Shell Open Command Key
        command_key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, f"{key_path}\\shell\\open\\command")
        winreg.SetValue(command_key, "", winreg.REG_SZ, cmd_str)
        winreg.CloseKey(command_key)

        print(f"Successfully registered '{protocol}://' protocol.")
        print(f"Target: {cmd_str}")

    except Exception as e:
        print(f"Failed to register protocol: {e}")

if __name__ == "__main__":
    print("Digifort Protocol Registrar")
    register_protocol()
    input("Press Enter to exit...")
