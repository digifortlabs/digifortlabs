import os
os.environ["ENCRYPTION_KEY"] = "a1z-3mNXYRp0yKAcP6xVpX6pjK6O38h039zisZMjE1U="
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.encryption import encrypt_file, decrypt_data
from app.services.compression import CompressionService
from fpdf import FPDF

def create_demo_encrypted_pdf(filename="encrypted_demo.pdf"):
    # 1. Create a large-ish PDF
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("helvetica", size=12)
    pdf.cell(190, 10, text="Digifort Labs - Encrypted Compression Test", align='C')
    pdf.ln(20)
    for i in range(100):
        pdf.multi_cell(190, 10, text=f"Line {i}: This is some placeholder text to make the file larger. " * 5)
    
    pdf.output(filename)
    original_size = os.path.getsize(filename)
    print(f"[OK] Created original PDF: {filename} ({original_size/1024:.2f} KB)")
    
    # 2. Encrypt it
    enc_path = encrypt_file(filename)
    enc_size = os.path.getsize(enc_path)
    print(f"[SECURE] Encrypted PDF: {enc_path} ({enc_size/1024:.2f} KB)")
    
    # Clean up original
    os.remove(filename)
    return enc_path

def compress_encrypted_pdf(enc_path, level="BALANCED"):
    print(f"[PROCESS] Processing encrypted file: {enc_path}")
    
    # 1. Decrypt
    try:
        with open(enc_path, 'rb') as f:
            encrypted_bytes = f.read()
        decrypted_bytes = decrypt_data(encrypted_bytes)
        
        temp_pdf = "temp_decrypted.pdf"
        with open(temp_pdf, 'wb') as f:
            f.write(decrypted_bytes)
        print(f"[OK] Decrypted to temporary file: {temp_pdf}")
    except Exception as e:
        print(f"[ERROR] Decryption failed: {e}")
        return

    # 2. Compress
    try:
        output_pdf = "compressed_decrypted.pdf"
        print(f"[PROCESS] Compressing with level: {level}...")
        
        result = CompressionService.optimize_pdf(temp_pdf, output_pdf, level=level)
        
        if not result['success']:
            print(f"[WARN] {level} failed (likely missing GS), falling back to FAST...")
            result = CompressionService.optimize_pdf(temp_pdf, output_pdf, level="FAST")
            
    except Exception as e:
        print(f"[ERROR] Compression failed: {e}")
        if os.path.exists(temp_pdf): os.remove(temp_pdf)
        return

    # 3. Re-encrypt
    from app.services.encryption import encrypt_file
    final_enc_path = encrypt_file(output_pdf)
    final_size = os.path.getsize(final_enc_path)
    
    print(f"[SECURE] Re-encrypted compressed file: {final_enc_path} ({final_size/1024:.2f} KB)")
    
    # Cleanup
    if os.path.exists(temp_pdf): os.remove(temp_pdf)
    if os.path.exists(output_pdf): os.remove(output_pdf)
    
    return final_enc_path

if __name__ == "__main__":
    enc_file = create_demo_encrypted_pdf()
    compress_encrypted_pdf(enc_file)
