import io
import sys

import os
import shutil

# Try imports for OCR
try:
    import pytesseract
    from pdf2image import convert_from_bytes
    from PIL import Image
    HAS_OCR = True
    
    # --- AUTO-CONFIGURE EXTERNAL TOOLS ---
    
    # 1. Tesseract Configuration
    # Check standard install locations if not in PATH
    tesseract_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        shutil.which("tesseract")
    ]
    
    found_tesseract = False
    for path in tesseract_paths:
        if path and os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            print(f"[OK] OCR Config: Found Tesseract at {path}")
            found_tesseract = True
            break
            
    if not found_tesseract:
        print("[WARN] OCR Config: Tesseract binary not found. OCR will fail unless added to PATH.")
        # We don't disable HAS_OCR yet, we let it fail gracefully in the function or rely on user PATH later

    # 2. Poppler Configuration (for pdf2image)
    # Check project-local poppler first
    project_root = os.getcwd()
    local_poppler_bin = os.path.join(project_root, "poppler-25.12.0", "Library", "bin")
    
    POPPLER_PATH = None
    if os.path.exists(local_poppler_bin):
        POPPLER_PATH = local_poppler_bin
        # Add to PATH temporarily for this process to ensure other tools prefer it
        os.environ["PATH"] = local_poppler_bin + os.pathsep + os.environ["PATH"]
        print(f"[OK] OCR Config: Using local Poppler at {local_poppler_bin}")
    else:
        # Check if default is available
        if not shutil.which("pdftoppm"):
             print("[WARN] OCR Config: Poppler not found locally or in PATH. PDF processing may fail.")

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
            print("[INFO] Low text density detected. Attempting OCR...")
            try:
                # Get page count first
                reader = PdfReader(io.BytesIO(file_bytes))
                total_pages = len(reader.pages)
                
                ocr_text = ""
                # Process one page at a time to save memory
                for i in range(1, total_pages + 1):
                    print(f"[INFO] OCR: Processing page {i}/{total_pages}...")
                    try:
                        page_images = convert_from_bytes(
                            file_bytes, 
                            first_page=i, 
                            last_page=i, 
                            size=(1600, None),
                            poppler_path=POPPLER_PATH # Use configured path
                        )
                        if page_images:
                            ocr_text += pytesseract.image_to_string(page_images[0]) + "\n"
                            # Explicitly close image to free memory
                            page_images[0].close()
                    except Exception as pe:
                        print(f"[WARN] Page {i} OCR failed: {pe}")
                
                # If OCR found significantly more text, append it
                if len(ocr_text.strip()) > len(text):
                    text = (text + "\n" + ocr_text.strip()).strip()
                    print(f"[OK] OCR Success. Extracted {len(ocr_text)} characters.")
            except Exception as e:
                print(f"[WARN] OCR Failed (Tesseract might be missing): {e}")

    except Exception as e:
        print(f"[ERROR] Extraction Failed: {e}")
        return ""

    return text.strip()


def classify_document(text: str) -> list[str]:
    """
    Analyzes text to find matching medical categories.
    Returns a list of tags.
    """
    if not text:
        return []

    text_lower = text.lower()
    categories = {
        "Discharge Summary": ["discharge summary", "condition on discharge", "advice on discharge", "date of discharge"],
        "Lab Report": ["laboratory report", "lab report", "blood test", "biochemistry", "hematology", "pathology"],
        "Imaging Report": ["radiology", "imaging report", "x-ray", "ct scan", "mri report", "ultrasound", "sonography"],
        "Prescription": ["prescription", "rx", "medications", "dosage", "twice daily", "daily dose"],
        "Medical Certificate": ["medical certificate", "fit to work", "sick leave", "illness"],
        "Inpatient Record": ["admission note", "ward visit", "vitals chart", "inpatient record"],
        "Consultation": ["consultation note", "opd visit", "follow up", "chief complaint"]
    }

    tags = []
    for category, keywords in categories.items():
        # Scored matching
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            tags.append(category)
            
    if tags:
        print(f"[INFO] Auto-Tagged: {tags} (Matches found in {len(text)} chars)")

    return tags
