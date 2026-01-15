import io
import sys

# Try imports for OCR
try:
    import pytesseract
    from pdf2image import convert_from_bytes
    from PIL import Image
    HAS_OCR = True
except ImportError:
    HAS_OCR = False
    print("Warning: OCR Dependencies missing. Falling back to text-only mode.")

from pypdf import PdfReader


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts text from a PDF file provided as bytes.
    1. Tries standard digital text extraction.
    2. If text is sparse and OCR is available, converts pages to images and runs Tesseract.
    """
    text = ""
    try:
        # 1. Digital Extraction
        reader = PdfReader(io.BytesIO(file_bytes))
        digital_text = ""
        for page in reader.pages:
            content = page.extract_text()
            if content:
                digital_text += content + "\n"
        
        text = digital_text.strip()
        
        # 2. OCR Fallback (if text is too short, likely a scan)
        if len(text) < 50 and HAS_OCR:
            print("🔍 Low text density detected. Attempting OCR...")
            try:
                images = convert_from_bytes(file_bytes)
                ocr_text = ""
                for img in images:
                    ocr_text += pytesseract.image_to_string(img) + "\n"
                
                # If OCR found significantly more text, append it
                if len(ocr_text.strip()) > len(text):
                    text += "\n" + ocr_text.strip()
                    print(f"✅ OCR Success. Extracted {len(ocr_text)} characters.")
            except Exception as e:
                print(f"⚠️ OCR Failed (Tesseract might be missing): {e}")

    except Exception as e:
        print(f"❌ Extraction Failed: {e}")
        return ""

    return text.strip()
