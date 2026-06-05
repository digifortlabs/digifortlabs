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
    if getattr(sys, 'frozen', False):
        base_dir = os.path.dirname(sys.executable)
        target_exe = os.path.join(base_dir, "DigifortWASender.exe")
        cmd_str = f"\"{target_exe}\" \"%1\""
    else:
        python_exe = sys.executable
        script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "wa_sender.py"))
        target_exe = script_path
        cmd_str = f"\"{python_exe}\" \"{script_path}\" \"%1\""

    if not os.path.exists(target_exe):
        print(f"Error: Could not find target app at: {target_exe}")
        return

    protocol = "digifort-wa"
    key_path = f"Software\\Classes\\{protocol}"
    
    try:
        key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, key_path)
        winreg.SetValue(key, "", winreg.REG_SZ, "Digifort WhatsApp Sender Protocol")
        winreg.SetValueEx(key, "URL Protocol", 0, winreg.REG_SZ, "")
        winreg.CloseKey(key)

        command_key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, f"{key_path}\\shell\\open\\command")
        winreg.SetValue(command_key, "", winreg.REG_SZ, cmd_str)
        winreg.CloseKey(command_key)

        print(f"Successfully registered '{protocol}://' protocol.")
        print(f"Target: {cmd_str}")

    except Exception as e:
        print(f"Failed to register protocol: {e}")

if __name__ == "__main__":
    print("Digifort WA Protocol Registrar")
    register_protocol()
    input("Press Enter to exit...")
