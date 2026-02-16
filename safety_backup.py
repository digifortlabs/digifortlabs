import os
import sys
import shutil
import datetime
import subprocess
import json

# Setup Boto3
try:
    import boto3
    from cryptography.fernet import Fernet
except ImportError:
    print("Please install boto3 and cryptography: pip install boto3 cryptography")
    sys.exit(1)

# Configuration
BACKUP_DIR = r"E:\Digifort_Backup"
LOCAL_STORAGE_DIRS = ["local_storage", "drafts", "backend/local_storage"]
EC2_HOST = "ec2-user@15.206.86.130"
EC2_KEY = "digifort-prod-key.pem"
BUCKET_NAME = "digifort-labs-files"

# Hardcoded Key from .env (User request: simple standalone script)
# Ideally read from .env but script runs from root
ENCRYPTION_KEY = "a1z-3mNXYRp0yKAcP6xVpX6pjK6O38h039zisZMjE1U="

def decrypt_data(encrypted_bytes):
    try:
        fernet = Fernet(ENCRYPTION_KEY.encode())
        return fernet.decrypt(encrypted_bytes)
    except Exception as e:
        print(f"  ❌ Decryption Failed: {e}")
        return None

def get_s3_inventory(bucket):
    print(f"📡 Fetching S3 Inventory from {bucket}...")
    s3 = boto3.client('s3')
    inventory = {}
    
    paginator = s3.get_paginator('list_objects_v2')
    try:
        for page in paginator.paginate(Bucket=bucket):
            if 'Contents' in page:
                for obj in page['Contents']:
                    inventory[obj['Key']] = {
                        'size': obj['Size'],
                        'mtime': obj['LastModified'].timestamp()
                    }
    except Exception as e:
        print(f"❌ S3 Error: {e}")
        print("⚠️  Proceeding assuming S3 is empty/inaccessible (Full Backup)")
        return {}
        
    print(f"✅ Indexed {len(inventory)} files in S3.")
    return inventory

def process_file(file_path, backup_subfolder, original_filename=None):
    """
    Copies file to backup, decrypting if necessary.
    """
    filename = original_filename or os.path.basename(file_path)
    
    # Check if encrypted
    is_encrypted = filename.endswith('.enc')
    
    # Determine Dest Name
    dest_name = filename
    if is_encrypted:
        dest_name = filename.replace('.enc', '') # e.g. scan.pdf.enc -> scan.pdf
    
    dest_path = os.path.join(BACKUP_DIR, backup_subfolder, dest_name)
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    
    try:
        if is_encrypted:
            with open(file_path, 'rb') as f:
                data = f.read()
            decrypted = decrypt_data(data)
            if decrypted:
                with open(dest_path, 'wb') as f:
                    f.write(decrypted)
                print(f"  🔓 Decrypted & Backed up: {dest_name}")
                return True
        else:
            shutil.copy2(file_path, dest_path)
            print(f"  💾 Backed up: {dest_name}")
            return True
    except Exception as e:
        print(f"  ❌ Backup Error ({filename}): {e}")
        return False

def scan_local(s3_inv):
    print("\n💻 Scanning Local Files...")
    count = 0
    for d in LOCAL_STORAGE_DIRS:
        if os.path.exists(d):
            for root, dirs, files in os.walk(d):
                for f in files:
                    if f.endswith('.enc') or f.endswith('.pdf') or f.endswith('.mp4'):
                        full_path = os.path.join(root, f)
                        
                        # S3 Check (by filename)
                        is_safe = False
                        for key in s3_inv:
                            if os.path.basename(key) == f:
                                # We skip if it exists in S3, regardless of encryption state 
                                # (unless user wants offline copy of everything?)
                                # User said: "skipping already place in s3"
                                is_safe = True
                                break
                        
                        if not is_safe:
                            if process_file(full_path, "Local_Found"):
                                count += 1
    print(f"✅ Local Backup: {count} files.")

def scan_ec2(s3_inv):
    print(f"\n☁️  Scanning EC2 ({EC2_HOST})...")
    # Extended search paths - safer to search from root 'digifortlabs' to avoid errors on missing subdirs
    # Using 'find digifortlabs' covering backend, frontend, local_storage etc.
    cmd = fr'ssh -i "{EC2_KEY}" -o StrictHostKeyChecking=no {EC2_HOST} "find digifortlabs -type f \( -name *.enc -o -name *.pdf \) 2>/dev/null"'
    
    try:
        result = subprocess.check_output(cmd, shell=True).decode().splitlines()
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Could not list EC2 files. Error: {e}")
        return

    ec2_count = 0
    temp_dir = "temp_ec2_downloads"
    os.makedirs(temp_dir, exist_ok=True)

    for remote_path in result:
        remote_path = remote_path.strip()
        filename = os.path.basename(remote_path)
        
        # Skip standard node_modules or venv garbage if any match
        if "node_modules" in remote_path or ".venv" in remote_path:
            continue
        
        # S3 Check
        is_safe = False
        for key in s3_inv:
             if os.path.basename(key) == filename:
                 is_safe = True
                 break
        
        if not is_safe:
            print(f"  ⬇️  Downloading from EC2: {filename}")
            local_temp = os.path.join(temp_dir, filename)
            
            scp_cmd = f'scp -i "{EC2_KEY}" -o StrictHostKeyChecking=no {EC2_HOST}:{remote_path} "{local_temp}"'
            subprocess.call(scp_cmd, shell=True)
            
            if os.path.exists(local_temp):
                if process_file(local_temp, "EC2_Found", original_filename=filename):
                    ec2_count += 1
                os.remove(local_temp) # Cleanup temp
            
    try:
        os.rmdir(temp_dir)
    except: pass
    print(f"✅ EC2 Backup: {ec2_count} files.")

def download_s3_bucket(s3_inv):
    print(f"\n☁️  Downloading ALL files from S3 to {BACKUP_DIR}...")
    s3 = boto3.client('s3')
    count = 0
    
    for key in s3_inv:
        # Determine local path
        filename = os.path.basename(key)
        
        # Handle decryption naming
        is_encrypted = filename.endswith('.enc')
        dest_filename = filename.replace('.enc', '') if is_encrypted else filename
        dest_path = os.path.join(BACKUP_DIR, "S3_Mirror", dest_filename)
        
        # Skip if already exists (Simple incremental backup)
        if os.path.exists(dest_path):
            continue
            
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        
        try:
            # Download to memory or temp file
            if is_encrypted:
                obj = s3.get_object(Bucket=BUCKET_NAME, Key=key)
                encrypted_data = obj['Body'].read()
                decrypted = decrypt_data(encrypted_data)
                
                if decrypted:
                    with open(dest_path, 'wb') as f:
                        f.write(decrypted)
                    print(f"  ⬇️  Downloaded & Decrypted: {dest_filename}")
                    count += 1
            else:
                s3.download_file(BUCKET_NAME, key, dest_path)
                print(f"  ⬇️  Downloaded: {dest_filename}")
                count += 1
                
        except Exception as e:
            print(f"  ❌ Failed to download {key}: {e}")
            
    print(f"✅ S3 Mirror: Downloaded {count} new files.")

def main():
    print("=== 🛡️ DIGIFORT SAFETY BACKUP (FULL MIRROR) ===\n")
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
        
    s3_inv = get_s3_inventory(BUCKET_NAME)
    
    # 1. Download S3 Content (The "Back All" request)
    download_s3_bucket(s3_inv)
    
    # 2. Check for extra local files
    scan_local(s3_inv)
    
    # 3. Check for extra EC2 files
    scan_ec2(s3_inv)
    
    print(f"\n🎉 Backup Complete! Check '{BACKUP_DIR}/' folder.")

if __name__ == "__main__":
    main()
