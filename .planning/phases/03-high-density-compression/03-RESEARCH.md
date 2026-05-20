# Phase 3 Research: Compression Engine Tools

## Tool Availability
- **Ghostscript**: Available at `gswin64c` (v10.07.0).
- **ocrmypdf**: Available in `.venv` (v17.4.2).
- **Tesseract**: Available at `C:\Program Files\Tesseract-OCR\tesseract.exe`.
- **jbig2enc**: NOT FOUND.

## Findings
- `ocrmypdf` can be used for monochrome compression, but without `jbig2enc`, it will use other encoders. 
- Ghostscript's `-dPDFSETTINGS=/ebook` (150 DPI) or `/screen` (72 DPI) are excellent for size reduction while keeping text sharp.
- `pikepdf` is a dependency of `ocrmypdf` and can be used for metadata stripping and image optimization.

## Implementation Strategy
- Use `subprocess` to call `ocrmypdf` and `Ghostscript`.
- Implement a tiered approach:
  - **LOW**: Metadata stripping + basic optimization.
  - **BALANCED**: Ghostscript downsampling to 150 DPI.
  - **ULTRA**: OCRmyPDF with monochrome text layers and high downsampling.

## Risks
- Missing `jbig2enc` limits the "ULTRA" sharpness/size ratio compared to ideal monochrome compression.
- Ghostscript might require specific color management parameters to avoid blurring text.
