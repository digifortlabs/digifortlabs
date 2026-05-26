import logging
logger = logging.getLogger(__name__)
import io
import sys

import os
import shutil

# Try imports for OCR
try:
    import pytesseract
    import fitz # PyMuPDF
    from PIL import Image
    from app.core.config import settings
    
    HAS_OCR = True
    
    # --- CONFIGURE EXTERNAL TOOLS ---
    
    # 1. Tesseract Configuration
    if settings.TESSERACT_CMD:
        pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
        logger.info(f"[OK] OCR Config: Using Tesseract at {settings.TESSERACT_CMD}")
    else:
        logger.info("[WARN] OCR Config: Tesseract binary not found in settings or PATH.")

except ImportError:
    HAS_OCR = False
    logger.info("Warning: OCR Dependencies missing. Falling back to text-only mode.")


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
            logger.info("[INFO] Low text density detected. Attempting OCR...")
            try:
                doc = fitz.open("pdf", file_bytes)
                total_pages = len(doc)
                
                ocr_text = ""
                # Process one page at a time to save memory
                for i in range(total_pages):
                    logger.info(f"[INFO] OCR: Processing page {i + 1}/{total_pages}...")
                    try:
                        page = doc[i]
                        # 150 DPI is a good balance of speed and OCR accuracy
                        pix = page.get_pixmap(dpi=150)
                        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
                        
                        page_text = str(pytesseract.image_to_string(img))
                        if page_text:
                            ocr_text += page_text + "\n"
                            
                        # Explicitly clear objects
                        img.close()
                    except Exception as pe:
                        logger.info(f"[WARN] Page {i + 1} OCR failed: {pe}")
                
                doc.close()
                
                # If OCR found significantly more text, append it
                if len(ocr_text.strip()) > len(text):
                    text = (text + "\n" + ocr_text.strip()).strip()
                    logger.info(f"[OK] OCR Success. Extracted {len(ocr_text)} characters.")
            except Exception as e:
                logger.info(f"[WARN] OCR Failed (Tesseract might be missing): {e}")

    except Exception as e:
        logger.info(f"[ERROR] Extraction Failed: {e}")
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
        logger.info(f"[INFO] Auto-Tagged: {tags} (Matches found in {len(text)} chars)")

    return tags

import re

def find_icd11_candidates(text: str) -> list[str]:
    """
    Scans text for potential ICD-11 codes using Regex.
    Common patterns: 
    - 4 alphanumeric characters (e.g. CA01, NA02)
    - Optional dot suffix (e.g. CA01.0, NA02.1)
    """
    if not text:
        return []
        
    # Pattern: Word boundary, 4 chars (at least one letter?), optional dot + alphanumeric
    pattern = r"\b[A-Z0-9][A-Z0-9]{3}(?:\.[A-Z0-9]+)?\b"
    
    matches = re.findall(pattern, text)
    unique_candidates = sorted(list(set(matches)))
    
    # Filter out common false positives (e.g. dates 2024, words LIKE) if strictly uppercase
    filtered = [m for m in unique_candidates if not (m.isdigit() and (m.startswith('19') or m.startswith('20')))]
    
    return filtered

def extract_text_from_image(file_bytes: bytes) -> str:
    """
    Extracts text from an image file (bytes) using Tesseract.
    """
    if not HAS_OCR:
        logger.info("[WARN] OCR disabled. Cannot extract text from image.")
        return ""
        
    try:
        from PIL import Image
        image = Image.open(io.BytesIO(file_bytes))
        text = str(pytesseract.image_to_string(image))
        image.close()
        return text.strip()
    except Exception as e:
        logger.info(f"[ERROR] Image OCR Failed: {e}")
        return ""

