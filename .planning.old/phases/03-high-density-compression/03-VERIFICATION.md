# Phase 3 Verification: High-Density Compression

## UAT Criteria
- [ ] **Size Reduction**: A 10MB test file should be reduced to <1MB on `ULTRA` settings.
- [ ] **Sharpness**: Monochrome text must remain legible and "sharp" at 200% zoom.
- [ ] **Searchability**: OCR text layer must be preserved (verified via `pdfgrep` or manual selection).
- [ ] **Background Processing**: Task must not block the main API thread.

## Test Cases

### 1. Basic Compression (FAST)
- Input: `test_input.pdf`
- Action: `CompressionService.compress_pdf(..., level='FAST')`
- Expectation: Size reduction >10%, valid PDF.

### 2. High-Ratio Compression (BALANCED)
- Input: `test_input.pdf`
- Action: `CompressionService.compress_pdf(..., level='BALANCED')`
- Expectation: Size reduction >50%, text remains very sharp.

### 3. Ultimate Compression (ULTRA)
- Input: `test_input.pdf`
- Action: `CompressionService.compress_pdf(..., level='ULTRA')`
- Expectation: Maximum size reduction, monochrome optimized.

## Automated Verification Script
Create `backend/app/scripts/benchmark_compression.py` to automate these tests and output a summary table.
