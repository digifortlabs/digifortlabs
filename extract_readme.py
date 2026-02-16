import zipfile
import os

zip_path = r"d:\Website\DIGIFORTLABS\frontend\public\scanner_app.zip"
extract_path = r"d:\Website\DIGIFORTLABS\extracted_readme.txt"

try:
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        # Check if README exists
        if "README.txt" in zip_ref.namelist():
            with zip_ref.open("README.txt") as source, open(extract_path, "wb") as target:
                target.write(source.read())
            print(f"Extracted README.txt to {extract_path}")
        else:
            print("README.txt not found in zip.")
except Exception as e:
    print(f"Error extracting: {e}")
