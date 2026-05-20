import os
import sys
import concurrent.futures
from pathlib import Path
from dotenv import load_dotenv

# Set ENCRYPTION_KEY and GHOSTSCRIPT_CMD before imports
load_dotenv()
os.environ["ENCRYPTION_KEY"] = "a1z-3mNXYRp0yKAcP6xVpX6pjK6O38h039zisZMjE1U="
if not os.getenv("GHOSTSCRIPT_CMD"):
    os.environ["GHOSTSCRIPT_CMD"] = r"C:\Program Files\gs\gs10.07.0\bin\gswin64c.exe"

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.encryption import encrypt_data, decrypt_data
from app.services.compression import CompressionService

def process_single_file(source_path, target_path):
    try:
        # 1. Decrypt
        with open(source_path, 'rb') as f:
            raw_data = f.read()
        
        try:
            dec_data = decrypt_data(raw_data)
        except Exception:
            # If decryption fails, it might not be encrypted or already optimized
            dec_data = raw_data
            
        # 2. Optimize if PDF
        # We check magic bytes for PDF
        is_pdf = dec_data.startswith(b"%PDF-")
        
        temp_dec = source_path + ".dec.tmp"
        temp_opt = source_path + ".opt.tmp"
        
        if is_pdf:
            with open(temp_dec, 'wb') as f:
                f.write(dec_data)
            
            # Run Ghostscript (BALANCED)
            res = CompressionService.optimize_pdf(temp_dec, temp_opt, level="BALANCED")
            
            with open(temp_opt, 'rb') as f:
                final_data = f.read()
                
            # Cleanup temp
            if os.path.exists(temp_dec): os.remove(temp_dec)
            if os.path.exists(temp_opt): os.remove(temp_opt)
        else:
            final_data = dec_data
            
        # 3. Re-encrypt (New Format)
        new_enc_data = encrypt_data(final_data)
        
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        with open(target_path, 'wb') as f:
            f.write(new_enc_data)
            
        return True, len(raw_data), len(new_enc_data)
    except Exception as e:
        print(f"  ERROR processing {source_path}: {e}")
        return False, 0, 0

def run_step2_processing(source_dir="E:\\Digifort_S3_Latest_2026", target_dir="E:\\Digifort_S3_Optimized_2026", max_workers=6):
    print(f"--- STEP 2: DECRYPT -> OPTIMIZE -> RE-ENCRYPT ({max_workers} workers) ---")
    sys.stdout.flush()
    
    all_files = []
    for root, dirs, files in os.walk(source_dir):
        for file in files:
            all_files.append(os.path.join(root, file))
            
    print(f"Total files to process: {len(all_files)}")
    sys.stdout.flush()
    
    total_original = 0
    total_optimized = 0
    total_success = 0
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_file = {}
        for fpath in all_files:
            rel_path = os.path.relpath(fpath, source_dir)
            target_path = os.path.join(target_dir, rel_path)
            future_to_file[executor.submit(process_single_file, fpath, target_path)] = rel_path
            
        for i, future in enumerate(concurrent.futures.as_completed(future_to_file)):
            success, orig_size, opt_size = future.result()
            if success:
                total_success += 1
                total_original += orig_size
                total_optimized += opt_size
                
            if (i + 1) % 20 == 0:
                reduction = (1 - (total_optimized / total_original)) * 100 if total_original > 0 else 0
                print(f"  Progress: {i+1}/{len(all_files)} files... Current Reduction: {reduction:.1f}%")
                sys.stdout.flush()
                
    print("\n--- STEP 2 COMPLETE ---")
    print(f"Successfully processed: {total_success}")
    print(f"Total Original: {total_original/1024/1024:.2f} MB")
    print(f"Total Optimized: {total_optimized/1024/1024:.2f} MB")
    if total_original > 0:
        print(f"Total Space Saved: {(1 - (total_optimized/total_original))*100:.1f}%")
    sys.stdout.flush()

if __name__ == "__main__":
    run_step2_processing()
