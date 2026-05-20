import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
if not os.getenv("GHOSTSCRIPT_CMD"):
    os.environ["GHOSTSCRIPT_CMD"] = r"C:\Program Files\gs\gs10.07.0\bin\gswin64c.exe"

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent))

from app.services.compression import CompressionService

def compress_test_file():
    input_pdf = r"E:\Digifort_Decrypted_Raw\Dixit_Hospital\2025\02\D756268_3bdba0ec.pdf"
    output_pdf = r"E:\Digifort_Decrypted_Raw\Dixit_Hospital\2025\02\D756268_3bdba0ec_compressed.pdf"
    
    print(f"--- COMPRESSION TEST ---")
    print(f"Input: {input_pdf} ({os.path.getsize(input_pdf)/1024:.2f} KB)")
    
    # Run BALANCED (Ghostscript)
    result = CompressionService.optimize_pdf(input_pdf, output_pdf, level="BALANCED")
    
    if result['success']:
        print(f"SUCCESS!")
        print(f"Output: {output_pdf} ({os.path.getsize(output_pdf)/1024:.2f} KB)")
        reduction = (1 - (os.path.getsize(output_pdf) / os.path.getsize(input_pdf))) * 100
        print(f"Reduction from Raw PDF: {reduction:.1f}%")
    else:
        print(f"FAILED: {result.get('error')}")

if __name__ == "__main__":
    compress_test_file()
