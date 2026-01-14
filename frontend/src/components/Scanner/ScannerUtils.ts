import { CapturedPage } from './ScannerTypes';

export const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const getTotalSize = (pages: CapturedPage[]) => pages.reduce((acc, curr) => acc + curr.sizeBytes, 0);

export const detectDocumentBounds = (width: number, height: number, data: Uint8ClampedArray, threshold = 80) => {
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const avg = (r + g + b) / 3;

            if (avg > threshold) {
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
                found = true;
            }
        }
    }

    if (!found) return null;

    return { minX, minY, maxX, maxY };
};

export const processImage = async (
    imageUrl: string,
    mode: 'color' | 'grayscale' | 'bw',
    bright: number,
    cont: number,
    thresh: number,
    rot: number,
    crop?: { x: number, y: number, w: number, h: number }
): Promise<{ url: string, size: number, w: number, h: number }> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Removed redundant initial context fetch awaiting rotation calc

            // 1. Setup Dimensions (Handle Rotation)
            const w = img.width;
            const h = img.height;
            const rad = (rot * Math.PI) / 180;
            const sin = Math.abs(Math.sin(rad));
            const cos = Math.abs(Math.cos(rad));
            const newW = Math.floor(w * cos + h * sin);
            const newH = Math.floor(w * sin + h * cos);

            canvas.width = newW;
            canvas.height = newH;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve({ url: imageUrl, size: 0, w: 0, h: 0 });
                return;
            }

            // 2. Draw & Rotate
            // Fill with white first to handle transparency/rotation gaps
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, newW, newH);

            ctx.translate(newW / 2, newH / 2);
            ctx.rotate(rad);
            ctx.drawImage(img, -w / 2, -h / 2);

            // We're good to go. No redundant context fetch.

            // Get data for pixel manipulation
            let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // 3. Apply Filters (Pixel Level for Accuracy)
            // Note: CSS filters are visual-only. For the PDF, we need actual pixel changes.
            // Brightness/Contrast formula:
            // factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
            // color = factor * (color - 128) + 128

            // Simplified linear multipliers for B/C
            const bVal = (bright - 100) * 2.55; // -255 to 255
            const cFactor = (259 * (cont + 255)) / (255 * (259 - cont)); // ~1 for 0

            for (let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];

                // Brightness
                r += bVal;
                g += bVal;
                b += bVal;

                // Contrast
                r = cFactor * (r - 128) + 128;
                g = cFactor * (g - 128) + 128;
                b = cFactor * (b - 128) + 128;

                // Clamping
                r = Math.min(255, Math.max(0, r));
                g = Math.min(255, Math.max(0, g));
                b = Math.min(255, Math.max(0, b));

                if (mode === 'grayscale' || mode === 'bw') {
                    // Luminance: 0.299R + 0.587G + 0.114B
                    const lumi = (r * 0.299 + g * 0.587 + b * 0.114);
                    if (mode === 'bw') {
                        const val = lumi > thresh ? 255 : 0;
                        data[i] = val;
                        data[i + 1] = val;
                        data[i + 2] = val;
                    } else {
                        data[i] = lumi;
                        data[i + 1] = lumi;
                        data[i + 2] = lumi;
                    }
                } else {
                    data[i] = r;
                    data[i + 1] = g;
                    data[i + 2] = b;
                }
            }

            ctx.putImageData(imageData, 0, 0);

            // 4. Crop (if needed)
            if (crop) {
                const cutCanvas = document.createElement('canvas');
                cutCanvas.width = crop.w;
                cutCanvas.height = crop.h;
                const cutCtx = cutCanvas.getContext('2d');
                if (cutCtx) {
                    cutCtx.drawImage(canvas, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
                    const finalData = cutCanvas.toDataURL('image/jpeg', 0.85); // 0.85 quality
                    // Estimate size
                    const head = 'data:image/jpeg;base64,';
                    const size = Math.round((finalData.length - head.length) * 3 / 4);
                    resolve({ url: finalData, size, w: crop.w, h: crop.h });
                    return;
                }
            }

            const finalData = canvas.toDataURL('image/jpeg', 0.85);
            const head = 'data:image/jpeg;base64,';
            const size = Math.round((finalData.length - head.length) * 3 / 4);

            resolve({ url: finalData, size, w: canvas.width, h: canvas.height });
        };
        img.src = imageUrl;
    });
};

export const scanDocumentAPI = async (blob: Blob): Promise<Blob> => {
    const formData = new FormData();
    formData.append('file', blob);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/scanner/process`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Scanning failed');
    }

    return await response.blob();
};
