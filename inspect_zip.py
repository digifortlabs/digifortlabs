import zipfile
import os

zip_path = r"d:\Website\DIGIFORTLABS\frontend\public\scanner_app.zip"

try:
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        print(f"Listing contents of {zip_path}:")
        # List first 20 files to gauge structure
        for i, name in enumerate(zip_ref.namelist()):
            print(name)
            if i > 20:
                print("... (truncated)")
                break
except Exception as e:
    print(f"Error reading zip: {e}")
