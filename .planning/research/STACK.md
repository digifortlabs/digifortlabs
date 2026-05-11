# Stack Research: Advanced PDF Compression

**Analysis Date:** 2026-05-11

## Recommended Libraries

### 1. OCRmyPDF (Primary Recommendation)
The most robust tool for medical record optimization. It combines several utilities into a single, high-quality pipeline.
- **Why**: It includes `jbig2enc` support, which is specifically designed for high-efficiency compression of scanned text (bi-level images). It preserves the text layer while dramatically reducing image size.
- **Integration**: Best used via CLI or the `ocrmypdf` Python library. Requires external binaries (`jbig2enc`, `tesseract`, `unpaper`).
- **Optimization Level**: `--optimize 3` enables JBIG2 and provides the "sharp and clean" look requested.

### 2. Ghostscript (Standard Optimization)
Used for general-purpose PDF downsampling and vector optimization.
- **Why**: Excellent for reducing the resolution of embedded images and cleaning up PDF object streams.
- **Integration**: CLI-based (`gs` command). Can be used to "re-print" PDFs into optimized versions.
- **Trade-off**: Harder to configure for JBIG2 specifically compared to OCRmyPDF.

### 3. PyMuPDF (fitz)
High-performance PDF manipulation library.
- **Why**: Fastest library for reading/writing PDF objects. Can be used to strip redundant metadata, remove unused resources, and handle page-level operations.
- **Integration**: Pure Python/C library, very easy to integrate into FastAPI.

## Strategy: Hybrid Compression Pipeline

To achieve the ~500KB target with "clean and sharp" text:

1. **Preprocessing**: Use PyMuPDF to analyze the PDF. If it's already digital text, perform lossless optimization.
2. **Monochrome Conversion**: If it's a scan, convert to grayscale or monochrome. Monochrome (1-bit) with JBIG2 compression is significantly smaller than JPEG while being sharper for text.
3. **JBIG2 Encoding**: Use `jbig2enc` (via OCRmyPDF) to encode the text layers.
4. **Metadata Stripping**: Use PyMuPDF to remove XML metadata, thumbnails, and other non-essential data.

## Deployment Requirements
- **Binaries**: The Docker container must include `ocrmypdf`, `tesseract-ocr`, `ghostscript`, and `jbig2enc`.
- **Infrastructure**: Celery workers are mandatory for this stack as `ocrmypdf` is CPU-intensive.

---
*Research: 2026-05-11*
