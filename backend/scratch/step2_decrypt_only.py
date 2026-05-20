import os
import sys
import concurrent.futures
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
os.environ["ENCRYPTION_KEY"] = "a1z-3mNXYRp0yKAcP6xVpX6pjK6O38h039zisZMjE1U="

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.encryption import decrypt_data

def get_extension(data):
    if data.startswith(b"%PDF-"):
        return ".pdf"
    if data.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        return ".webp"
    return ""

def decrypt_single_file(source_path, target_dir):
    try:
        with open(source_path, 'rb') as f:
            raw_data = f.read()
            
        dec_data = decrypt_data(raw_data)
        
        ext = get_extension(dec_data)
        
        # Original name without .enc
        base_name = os.path.basename(source_path).replace(".enc", "")
        if not base_name.endswith(ext):
            base_name += ext
            
        # Preserve relative path structure
        rel_dir = os.path.dirname(os.path.relpath(source_path, "E:\\Digifort_S3_Latest_2026"))
        final_path = os.path.join(target_dir, rel_dir, base_name)
        
        os.makedirs(os.path.dirname(final_path), exist_ok=True)
        with open(final_path, 'wb') as f:
            f.write(dec_data)
            
        return True
    except Exception as e:
        # print(f"  ERROR {source_path}: {e}")
        return False

def run_decrypt_only(source_dir="E:\\Digifort_S3_Latest_2026", target_dir="E:\\Digifort_Decrypted_Raw", max_workers=20):
    print(f"--- STEP 2: DECRYPTING ALL FILES TO RAW FORMAT ({max_workers} workers) ---")
    sys.stdout.flush()
    
    all_files = []
    for root, dirs, files in os.walk(source_dir):
        for file in files:
            all_files.append(os.path.join(root, file))
            
    print(f"Total files: {len(all_files)}")
    sys.stdout.flush()
    
    success_count = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(decrypt_single_file, f, target_dir) for f in all_files]
        for i, future in enumerate(concurrent.futures.as_completed(futures)):
            if future.result():
                success_count += 1
            if (i + 1) % 100 == 0:
                print(f"  Progress: {i+1}/{len(all_files)} files decrypted...")
                sys.stdout.flush()
                
    print(f"\n--- DECRYPTION COMPLETE ---")
    print(f"Total Files Decrypted: {success_count}")
    print(f"Location: {target_dir}")
    sys.stdout.flush()

if __name__ == "__main__":
    run_decrypt_only()
