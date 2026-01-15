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
                # Get page count first
                reader = PdfReader(io.BytesIO(file_bytes))
                total_pages = len(reader.pages)
                
                ocr_text = ""
                # Process one page at a time to save memory
                for i in range(1, total_pages + 1):
                    print(f"📄 OCR: Processing page {i}/{total_pages}...")
                    try:
                        page_images = convert_from_bytes(file_bytes, first_page=i, last_page=i, size=(1600, None))
                        if page_images:
                            ocr_text += pytesseract.image_to_string(page_images[0]) + "\n"
                            # Explicitly close image to free memory
                            page_images[0].close()
                    except Exception as pe:
                        print(f"⚠️ Page {i} OCR failed: {pe}")
                
                # If OCR found significantly more text, append it
                if len(ocr_text.strip()) > len(text):
                    text = (text + "\n" + ocr_text.strip()).strip()
                    print(f"✅ OCR Success. Extracted {len(ocr_text)} characters.")
            except Exception as e:
                print(f"⚠️ OCR Failed (Tesseract might be missing): {e}")

    except Exception as e:
        print(f"❌ Extraction Failed: {e}")
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

    return tags
