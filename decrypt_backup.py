
import os
import sys
from cryptography.fernet import Fernet

def decrypt_backup(root_folder: str, key_str: str):
    try:
        fernet = Fernet(key_str.encode())
    except Exception as e:
        print(f"❌ Invalid Key format: {e}")
        return

    print(f"📂 Scanning for encrypted files in: {root_folder}")
    success_count = 0
    fail_count = 0

    for dirpath, dirnames, filenames in os.walk(root_folder):
        for filename in filenames:
            if filename.endswith(".enc"):
                enc_path = os.path.join(dirpath, filename)
                # target path removes .enc suffix
                target_path = enc_path[:-4] 
                
                try:
                    with open(enc_path, 'rb') as f:
                        encrypted_data = f.read()
                    
                    decrypted_data = fernet.decrypt(encrypted_data)
                    
                    with open(target_path, 'wb') as f:
                        f.write(decrypted_data)
                        
                    print(f"✅ Decrypted: {target_path}")
                    success_count += 1
                except Exception as e:
                    print(f"❌ Failed to decrypt {filename}: {e}")
                    fail_count += 1

    print("-" * 40)
    print(f"🎉 Completed. Success: {success_count}, Failed: {fail_count}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python decrypt_backup.py <backup_folder_path> <encryption_key>")
        print("Example: python decrypt_backup.py \"E:\\Digifort_S3_Backup\" \"YOUR_KEY_FROM_ENV\"")
        sys.exit(1)
        
    folder = sys.argv[1]
    key = sys.argv[2]
    
    if not os.path.exists(folder):
        print(f"❌ Folder not found: {folder}")
        sys.exit(1)
        
    decrypt_backup(folder, key)
