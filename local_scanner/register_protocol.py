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
    # Path to the python executable and the scanner script
    python_exe = sys.executable
    script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "scanner_app.py"))
    
    # Check if script exists
    if not os.path.exists(script_path):
        print(f"Error: Could not find {script_path}")
        return

    protocol = "digifort"
    key_path = f"Software\\Classes\\{protocol}"
    
    try:
        # Create the Protocol Key
        key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, key_path)
        winreg.SetValue(key, "", winreg.REG_SZ, "URL:Digifort Scanner Protocol")
        winreg.SetValueEx(key, "URL Protocol", 0, winreg.REG_SZ, "")
        winreg.CloseKey(key)

        # Create the Default Icon Key
        icon_key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, f"{key_path}\\DefaultIcon")
        winreg.SetValue(icon_key, "", winreg.REG_SZ, f"\"{script_path}\",0") # Use script as icon placeholder
        winreg.CloseKey(icon_key)

        # Create the Shell Open Command Key
        command_key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, f"{key_path}\\shell\\open\\command")
        # Command: "python.exe" "scanner_app.py" "%1"
        # We assume the script handles the URI parsing
        cmd_str = f"\"{python_exe}\" \"{script_path}\" \"%1\""
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
