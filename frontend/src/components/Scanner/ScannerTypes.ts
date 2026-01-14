export interface CapturedPage {
    id: string;
    originalUrl: string; // The raw capture
    processedUrl: string; // The version with filters/crop applied
    width: number;
    height: number;
    sizeBytes: number;
    filterMode: 'color' | 'grayscale' | 'bw';
}

export interface DigitizationScannerProps {
    onComplete: (file: File) => void;
    onCancel: () => void;
}
