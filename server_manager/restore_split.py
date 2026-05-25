import json
import os
import sys

extracted_path = r"d:\Website\DIGIFORTLABS\server_manager\extracted_code.py"
desktop_app_path = r"d:\Website\DIGIFORTLABS\server_manager\desktop_app.py"

with open(extracted_path, "r", encoding="utf-8") as f:
    content = f.read()

# The content is a JSON-encoded string (with double quotes at ends and escaped newlines)
# We can decode it using json.loads to get the actual multi-line string.
try:
    if content.startswith('"') and content.endswith('"'):
        # Parse it as a JSON string
        decoded_code = json.loads(content)
    else:
        # Fallback to string replacement of literal \n
        # If it was saved with literal quotes in file
        decoded_code = json.loads('"' + content.replace('"', '\\"') + '"')
except Exception as e:
    print("Direct JSON decode failed, attempting eval/replace:", e)
    # Manual replacement of escaped characters
    decoded_code = content.strip('"').replace('\\n', '\n').replace('\\t', '\t').replace('\\"', '"').replace('\\\\', '\\')

# Let's inspect the decoded code structure
print("Decoded code length:", len(decoded_code))
print("First 200 characters of decoded code:")
print(decoded_code[:200])

# Let's read the current desktop_app.py to replace the DesktopApp class section
with open(desktop_app_path, "r", encoding="utf-8") as f:
    orig_content = f.read()

# We need to replace the entire 'class DesktopApp:' block
# The original code has:
# class DesktopApp:
#     def __init__(self, root):
#         ...
# and ends right before:
# def main():

start_idx = orig_content.find("class DesktopApp:")
end_idx = orig_content.find("def main():")

if start_idx == -1 or end_idx == -1:
    print("ERROR: Could not locate class DesktopApp or def main() in target file!")
    sys.exit(1)

new_content = orig_content[:start_idx] + decoded_code + "\n\n" + orig_content[end_idx:]

with open(desktop_app_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("SUCCESS: Successfully restored the split-pane DesktopApp layout into desktop_app.py!")
