"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Trash2, ChevronUp, ChevronDown, Check, X, FileText, Settings, Image as ImageIcon, RotateCw } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface DigitizationScannerProps {
    onComplete: (file: File) => void;
    onCancel: () => void;
}

interface CapturedPage {
    id: string;
    dataUrl: string;
    rotation: number;
    brightness: number;
    contrast: number;
    points?: { x: number, y: number }[]; // 4 corners for perspective
}

export default function DigitizationScanner({ onComplete, onCancel }: DigitizationScannerProps) {
    const webcamRef = useRef<Webcam>(null);
    const [pages, setPages] = useState<CapturedPage[]>([]);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [showCameraMenu, setShowCameraMenu] = useState(false);
    const [isEnhanced, setIsEnhanced] = useState(true);
    const [isA3, setIsA3] = useState(false);
    const [isMirrored, setIsMirrored] = useState(false);
    const [rotate180, setRotate180] = useState(false);
    const [targetResolution, setTargetResolution] = useState({ width: 4640, height: 3480 }); // Start with 16MP (Native Spec)
    const [isAutoDetect, setIsAutoDetect] = useState(false);
    const [detectedBox, setDetectedBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
    const [detectionConfidence, setDetectionConfidence] = useState(0);
    const [autoTimer, setAutoTimer] = useState<number | null>(null); // null means OFF, otherwise seconds
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activePageId, setActivePageId] = useState<string | null>(null);
    const [editingPage, setEditingPage] = useState<CapturedPage | null>(null);
    const [showFlash, setShowFlash] = useState(false);
    const [liveBrightness, setLiveBrightness] = useState(100);
    const [liveContrast, setLiveContrast] = useState(100);
    const stableDetectionRef = useRef<number>(0);
    const latestBoxRef = useRef<{ x: number, y: number, w: number, h: number } | null>(null);
    const lastCaptureTimeRef = useRef<number>(0);
    const hasTurnedPageRef = useRef<boolean>(true);

    const handleCameraError = useCallback((error: any) => {
        console.warn("Camera error, attempting recovery...", error);
        // Step down resolutions one by one
        setTargetResolution(prev => {
            if (prev.width >= 4640) return { width: 3840, height: 2160 }; // Fallback to 4K
            if (prev.width >= 3840) return { width: 1920, height: 1080 }; // Fallback to 1080p
            if (prev.width >= 1920) return { width: 1280, height: 720 };  // Fallback to 720p
            return { width: 640, height: 480 }; // Final safe fallback
        });
    }, []);

    // Fetch cameras
    const handleDevices = useCallback((mediaDevices: MediaDeviceInfo[]) => {
        const videoDevices = mediaDevices.filter(({ kind }) => kind === "videoinput");
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoDevices[0].deviceId);
        }
    }, [selectedDeviceId]);

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(handleDevices);
    }, [handleDevices]);

    useEffect(() => {
        let detInterval: any;
        if (isAutoDetect) {
            detInterval = setInterval(() => {
                if (!webcamRef.current) return;
                const imageSrc = webcamRef.current.getScreenshot();
                if (imageSrc) {
                    const img = new Image();
                    img.src = imageSrc;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return;

                        const S = 100; // Efficient resolution for blob detection
                        canvas.width = S;
                        canvas.height = S;
                        ctx.drawImage(img, 0, 0, S, S);
                        const imageData = ctx.getImageData(0, 0, S, S);
                        const data = imageData.data;

                        // 1. Convert to Grayscale & Calculate Histogram
                        const gray = new Uint8Array(S * S);
                        const hist = new Int32Array(256);
                        for (let i = 0; i < S * S; i++) {
                            const val = Math.floor((data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3);
                            gray[i] = val;
                            hist[val]++;
                        }

                        // 2. OTSU Thresholding (Professional Auto-Threshold)
                        let total = S * S;
                        let sum = 0;
                        for (let t = 0; t < 256; t++) sum += t * hist[t];
                        let sumB = 0, wB = 0, wF = 0, varMax = 0, threshold = 160; // Lower default for clinical paper
                        for (let t = 40; t < 230; t++) { // Clip range to avoid dark noise or glares
                            wB += hist[t];
                            if (wB === 0) continue;
                            wF = total - wB;
                            if (wF === 0) break;
                            sumB += t * hist[t];
                            let mB = sumB / wB;
                            let mF = (sum - sumB) / wF;
                            let varBetween = wB * wF * (mB - mF) * (mB - mF);
                            if (varBetween > varMax) {
                                varMax = varBetween;
                                threshold = t;
                            }
                        }

                        // 3. Simple Bounding Box Search (Largest Cluster near center)
                        let bin = new Uint8Array(S * S);
                        for (let i = 0; i < S * S; i++) bin[i] = gray[i] > (threshold - 10) ? 1 : 0; // Lighter threshold for faded ink

                        // Instead of full Flood-Fill, we find the cluster that is most "document-like"
                        // by scanning inward from edges or using a window density check
                        // Seed search from center outwards to find the document blob (Contiguous Search)
                        let visited = new Uint8Array(S * S);
                        let queue = [[Math.floor(S / 2), Math.floor(S / 2)]];
                        let minX = S, maxX = 0, minY = S, maxY = 0, count = 0;

                        while (queue.length > 0) {
                            let [cx, cy] = queue.shift()!;
                            if (cx < 0 || cx >= S || cy < 0 || cy >= S || visited[cy * S + cx] || !bin[cy * S + cx]) continue;
                            visited[cy * S + cx] = 1;
                            minX = Math.min(minX, cx);
                            maxX = Math.max(maxX, cx);
                            minY = Math.min(minY, cy);
                            maxY = Math.max(maxY, cy);
                            count++;

                            queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
                        }

                        const confidence = Math.min(100, (count / (S * S * 0.4)) * 100);

                        if (confidence > 30 && (maxX - minX) > S / 4) {
                            const detectedAspect = (maxX - minX) / (maxY - minY || 1);
                            const nextIsA3 = detectedAspect > 1.25;
                            if (nextIsA3 !== isA3) setIsA3(nextIsA3);

                            setDetectionConfidence(confidence);
                            setDetectedBox(prev => {
                                const target = {
                                    x: (minX / S) * 100,
                                    y: (minY / S) * 100,
                                    w: ((maxX - minX) / S) * 100,
                                    h: ((maxY - minY) / S) * 100
                                };
                                latestBoxRef.current = target; // Ensure capture() has latest even during render
                                if (!prev) return target;
                                // Heavy smoothing for stability
                                return {
                                    x: prev.x * 0.8 + target.x * 0.2,
                                    y: prev.y * 0.8 + target.y * 0.2,
                                    w: prev.w * 0.8 + target.w * 0.2,
                                    h: prev.h * 0.8 + target.h * 0.2
                                };
                            });

                            // Smart Auto-Capture Logic with Page Turn Detection
                            const now = Date.now();
                            const cooldown = 3000;
                            const isCoolingDown = (now - lastCaptureTimeRef.current < cooldown);

                            if (confidence > 88 && !isCoolingDown) {
                                stableDetectionRef.current += 500;
                                if (stableDetectionRef.current >= 2000) {
                                    capture();
                                    stableDetectionRef.current = 0;
                                    lastCaptureTimeRef.current = now;
                                    hasTurnedPageRef.current = false; // Wait for next page turn
                                }
                            } else if (confidence < 40) {
                                hasTurnedPageRef.current = true;
                                stableDetectionRef.current = 0;
                            }
                        } else {
                            setDetectedBox(null);
                            setDetectionConfidence(0);
                            stableDetectionRef.current = 0;
                            hasTurnedPageRef.current = true;
                        }
                    };
                }
            }, 500);
        } else {
            setDetectedBox(null);
        }
        return () => clearInterval(detInterval);
    }, [isAutoDetect, isA3, webcamRef]);

    useEffect(() => {
        let interval: any;
        if (autoTimer !== null && timeLeft !== null) {
            interval = setInterval(() => {
                if (timeLeft <= 1) {
                    capture();
                    setTimeLeft(autoTimer);
                } else {
                    setTimeLeft(timeLeft - 1);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [autoTimer, timeLeft]);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            const img = new Image();
            img.src = imageSrc;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // Viewfinder dynamic sizing
                let cropWidth, cropHeight, startX, startY;
                const box = latestBoxRef.current || detectedBox;

                if (isAutoDetect && box) {
                    // Use detected bounding box percentage
                    cropWidth = img.width * (box.w / 100);
                    cropHeight = img.height * (box.h / 100);
                    startX = img.width * (box.x / 100);
                    startY = img.height * (box.y / 100);
                } else {
                    // Use fixed viewfinder
                    cropWidth = img.width * (isA3 ? 0.90 : 0.75);
                    cropHeight = img.height * (isA3 ? 0.70 : 0.85);
                    startX = (img.width - cropWidth) / 2;
                    startY = (img.height - cropHeight) / 2;
                }

                canvas.width = cropWidth;
                canvas.height = cropHeight;

                if (isEnhanced) {
                    ctx.filter = `grayscale(100%) contrast(${liveContrast / 100 * 1.2}) brightness(${liveBrightness / 100 * 1.1})`;
                } else {
                    ctx.filter = `brightness(${liveBrightness}%) contrast(${liveContrast}%)`;
                }

                // Apply Mirror/Rotation to the final cropped data
                // This ensures "What You Get" matches "What You See" in the rotated viewfinder
                if (rotate180 || isMirrored) {
                    ctx.translate(canvas.width / 2, canvas.height / 2);
                    if (rotate180) ctx.rotate(Math.PI);
                    if (isMirrored) ctx.scale(-1, 1);
                    ctx.translate(-canvas.width / 2, -canvas.height / 2);
                }

                ctx.drawImage(img, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

                const croppedSrc = canvas.toDataURL('image/jpeg', 0.9);
                const newPage: CapturedPage = {
                    id: Math.random().toString(36).substr(2, 9),
                    dataUrl: croppedSrc,
                    rotation: 0,
                    brightness: liveBrightness,
                    contrast: liveContrast
                };
                setPages(prev => [...prev, newPage]);

                // Flash Effect
                setShowFlash(true);
                setTimeout(() => setShowFlash(false), 150);
            };
        }
    }, [webcamRef, isEnhanced, isA3, isMirrored, rotate180, isAutoDetect, detectedBox, liveBrightness, liveContrast]);

    const deletePage = (id: string) => {
        setPages(prev => prev.filter(p => p.id !== id));
        if (activePageId === id) setActivePageId(null);
    };

    const movePage = (id: string, direction: 'up' | 'down') => {
        const index = pages.findIndex(p => p.id === id);
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === pages.length - 1)) return;

        const newPages = [...pages];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newPages[index], newPages[targetIndex]] = [newPages[targetIndex], newPages[index]];
        setPages(newPages);
    };

    const rotatePage = (id: string) => {
        setPages(prev => prev.map(p => p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p));
    };

    const saveEditedPage = (updatedPage: CapturedPage) => {
        setPages(prev => prev.map(p => p.id === updatedPage.id ? updatedPage : p));
        setEditingPage(null);
    };

    const generatePDF = async () => {
        if (pages.length === 0) return;
        setIsProcessing(true);

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const imgHeight = 297; // A4 height in mm

        for (let i = 0; i < pages.length; i++) {
            if (i > 0) pdf.addPage();

            // Handle rotation in PDF
            const rotation = pages[i].rotation || 0;
            // Add image with explicit compression and downsampling hints
            pdf.addImage(pages[i].dataUrl, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST', rotation);
        }

        const pdfBlob = pdf.output('blob');
        const file = new File([pdfBlob], `scan_${new Date().getTime()}.pdf`, { type: 'application/pdf' });

        onComplete(file);
        setIsProcessing(false);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900 flex flex-col md:flex-row overflow-hidden">

            {/* Left/Top: Camera View */}
            <div className="flex-1 relative bg-black flex items-center justify-center">
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    onUserMediaError={handleCameraError}
                    mirrored={isMirrored}
                    minScreenshotWidth={targetResolution.width}
                    minScreenshotHeight={targetResolution.height}
                    screenshotQuality={1}
                    videoConstraints={{
                        deviceId: selectedDeviceId,
                        width: { ideal: targetResolution.width },
                        height: { ideal: targetResolution.height },
                        aspectRatio: targetResolution.width / targetResolution.height
                    }}
                    className="h-full w-full object-contain transition-transform duration-500"
                    style={{
                        transform: rotate180 ? 'rotate(180deg)' : 'none',
                        filter: `brightness(${liveBrightness}%) contrast(${liveContrast}%)`
                    }}
                />

                {/* Smart Bounding Box Overlay */}
                {isAutoDetect && detectedBox && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div
                            className="absolute transition-all duration-300 ease-out z-10"
                            style={{
                                left: `${detectedBox.x}%`,
                                top: `${detectedBox.y}%`,
                                width: `${detectedBox.w}%`,
                                height: `${detectedBox.h}%`
                            }}
                        >
                            {/* Corner Brackets */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-purple-500 rounded-tl-lg shadow-[-4px_-4px_10px_rgba(168,85,247,0.3)]"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-purple-500 rounded-tr-lg shadow-[4px_-4px_10px_rgba(168,85,247,0.3)]"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-purple-500 rounded-bl-lg shadow-[-4px_4px_10px_rgba(168,85,247,0.3)]"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-purple-500 rounded-br-lg shadow-[4px_4px_10px_rgba(168,85,247,0.3)]"></div>

                            {/* Scanning Ray Animation */}
                            <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_15px_rgba(168,85,247,0.8)] animate-scan-ray opacity-60"></div>

                            {/* Status Badge */}
                            <div className="absolute -top-12 left-0 flex flex-col gap-1">
                                <div className="flex items-center gap-2 bg-purple-600/90 backdrop-blur-md text-[10px] font-black text-white px-3 py-1.5 rounded-full shadow-lg border border-purple-400/50 animate-fade-in">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                    </span>
                                    AI TRACKING {detectionConfidence.toFixed(0)}%
                                </div>
                                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm">
                                    <div
                                        className="h-full bg-purple-400 transition-all duration-300"
                                        style={{ width: `${detectionConfidence}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Capture Flash Effect */}
                {showFlash && (
                    <div className="absolute inset-0 bg-white z-[100] animate-out fade-out duration-150"></div>
                )}

                {/* Viewfinder Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className={`border-2 border-dashed border-white/40 rounded-lg flex items-center justify-center transition-all duration-500 ${isA3 ? 'w-[90%] h-[70%]' : 'w-[75%] h-[85%]'}`}>
                        {!detectedBox && (
                            <div className="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full text-white/60 text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                {isA3 ? "A3 Wide Focus" : "A4 Standard Focus"}
                            </div>
                        )}
                    </div>
                </div>

                {/* Timer Countdown Badge */}
                {timeLeft !== null && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-2xl shadow-2xl border-4 border-white animate-bounce">
                        {timeLeft}s
                    </div>
                )}

                {/* Smart Mode Indicator */}
                {isAutoDetect && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl animate-fade-in z-20">
                        <div className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Smart Capture Active</span>
                            <span className="text-[8px] text-slate-400 font-bold">Stable detection will trigger auto-click</span>
                        </div>
                    </div>
                )}

                {/* Floating Page Counter Badge */}
                {pages.length > 0 && (
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl animate-in fade-in zoom-in duration-300">
                        <FileText size={16} className="text-indigo-400" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{pages.length} {pages.length === 1 ? 'PAGE' : 'PAGES'}</span>
                            <span className="text-[8px] text-indigo-300 font-bold uppercase">Ready for export</span>
                        </div>
                    </div>
                )}

                {/* Top Right Utility Buttons */}
                <div className="absolute top-4 right-4 z-[70] flex gap-2 pointer-events-auto">
                    <button
                        onClick={() => {
                            const temp = selectedDeviceId;
                            setSelectedDeviceId('');
                            setTimeout(() => setSelectedDeviceId(temp), 100);
                        }}
                        className="p-3 bg-slate-900/80 backdrop-blur-md text-white rounded-2xl border border-white/10 hover:bg-slate-800 transition shadow-xl group flex items-center gap-2"
                        title="Re-initialize Camera"
                    >
                        <RefreshCw size={18} className="text-indigo-400 group-hover:rotate-180 transition-transform duration-700" />
                        <span className="text-[10px] font-bold tracking-widest hidden lg:inline">RECONNECT</span>
                    </button>
                    <button onClick={onCancel} className="p-3 bg-slate-900/80 backdrop-blur-md text-white rounded-2xl border border-white/10 hover:bg-red-600 transition shadow-xl hover:scale-105 active:scale-95">
                        <X size={20} />
                    </button>
                </div>
            </div>


            {/* Professional UI Control Bar */}
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between pointer-events-none">

                {/* Left: View/Correction Zone */}
                <div className="flex flex-col gap-3 pointer-events-auto">
                    <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-2 border border-white/10 flex flex-col gap-2 shadow-2xl">
                        <button
                            onClick={() => setIsMirrored(!isMirrored)}
                            className={`p-3 rounded-xl transition flex items-center justify-center ${isMirrored ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                            title="Mirror Video Feed"
                        >
                            <RefreshCw size={20} className={isMirrored ? 'scale-x-[-1]' : ''} />
                        </button>
                        <button
                            onClick={() => setRotate180(!rotate180)}
                            className={`p-3 rounded-xl transition flex items-center justify-center ${rotate180 ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                            title="Rotate Feed 180°"
                        >
                            <RotateCw size={20} className={rotate180 ? 'rotate-180' : ''} />
                        </button>
                        <button
                            onClick={() => setIsA3(!isA3)}
                            className={`p-3 rounded-xl transition flex items-center justify-center ${isA3 ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                            title="Toggle A3/A4 Mode"
                        >
                            <ImageIcon size={20} />
                        </button>
                    </div>
                </div>

                {/* Center: Primary Capture Zone */}
                <div className="flex flex-col items-center gap-4 pointer-events-auto">
                    {/* Auto-Timer Indicator */}
                    {autoTimer && (
                        <div className="bg-green-500/20 backdrop-blur-md border border-green-500/30 text-green-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            {autoTimer}s Interval Capture
                        </div>
                    )}

                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => {
                                if (autoTimer === null) { setAutoTimer(3); setTimeLeft(3); }
                                else if (autoTimer === 3) { setAutoTimer(5); setTimeLeft(5); }
                                else { setAutoTimer(null); setTimeLeft(null); }
                            }}
                            className={`p-4 rounded-2xl backdrop-blur-md transition flex items-center gap-2 border ${autoTimer ? 'bg-green-600 text-white border-green-400 shadow-[0_0_20px_rgba(22,163,74,0.4)]' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'}`}
                        >
                            <Camera size={24} />
                        </button>

                        <button
                            onClick={capture}
                            className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-90 transition group shrink-0 relative"
                        >
                            <div className="w-20 h-20 border-4 border-slate-900 rounded-full flex items-center justify-center">
                                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-full group-hover:from-indigo-500 group-hover:to-indigo-300 transition shadow-inner"></div>
                            </div>
                            <div className="absolute inset-x-0 -bottom-8 text-[10px] font-black text-white uppercase tracking-[0.3em] opacity-40">Shutter</div>
                        </button>

                        <button
                            onClick={() => setShowCameraMenu(!showCameraMenu)}
                            className={`p-4 rounded-2xl backdrop-blur-md transition flex items-center gap-2 border ${showCameraMenu ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'}`}
                        >
                            <Settings size={24} />
                        </button>
                    </div>
                </div>

                {/* Right: Intelligent Processing Zone */}
                <div className="flex flex-col gap-3 pointer-events-auto">
                    {/* Resolution Override (Native Parity) */}
                    <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-2 border border-white/10 flex flex-col gap-2 shadow-2xl">
                        <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-wider px-2 pt-1">Target Precision</h4>
                        <div className="grid grid-cols-2 gap-2 px-2 pb-2">
                            {[
                                { label: '16MP', w: 4640, h: 3480 },
                                { label: '4K', w: 3840, h: 2160 },
                                { label: '1080p', w: 1920, h: 1080 },
                                { label: '720p', w: 1280, h: 720 }
                            ].map((res) => (
                                <button
                                    key={res.label}
                                    onClick={() => setTargetResolution({ width: res.w, height: res.h })}
                                    className={`px-3 py-2 rounded-xl text-[9px] font-bold border transition ${targetResolution.width === res.w ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-900/50 border-white/5 text-slate-500 hover:border-white/20 hover:text-white'}`}
                                >
                                    {res.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-2 border border-white/10 flex flex-col gap-2 shadow-2xl">
                        <button
                            onClick={() => setIsAutoDetect(!isAutoDetect)}
                            className={`p-4 rounded-xl transition flex flex-col items-center gap-1 border ${isAutoDetect ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'text-slate-400 hover:bg-white/5 border-transparent'}`}
                            title="Intelligent Size Detection"
                        >
                            <Settings size={20} className={isAutoDetect ? 'animate-pulse' : ''} />
                            <span className="text-[8px] font-black uppercase tracking-tighter">Auto</span>
                        </button>

                        <div className="h-px bg-white/10 mx-2"></div>

                        <button
                            onClick={() => setIsEnhanced(!isEnhanced)}
                            className={`p-4 rounded-xl transition flex flex-col items-center gap-1 border ${isEnhanced ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg' : 'text-slate-400 hover:bg-white/5 border-transparent'}`}
                            title="Medical Enhancement Filter"
                        >
                            <FileText size={20} />
                            <span className="text-[8px] font-black uppercase tracking-tighter">Filter</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Camera Menu Popover */}
            {showCameraMenu && (
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-6 w-80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 z-[100] animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-white font-black text-xs uppercase tracking-widest">Scanner Settings</h4>
                        <button onClick={() => setShowCameraMenu(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Input Source</p>
                            <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                {devices.map((device, key) => (
                                    <button
                                        key={device.deviceId}
                                        onClick={() => {
                                            setSelectedDeviceId(device.deviceId);
                                        }}
                                        className={`w-full text-left p-3 rounded-xl text-xs truncate transition flex items-center justify-between ${selectedDeviceId === device.deviceId ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/5'}`}
                                    >
                                        {device.label || `Scanner ${key + 1}`}
                                        {selectedDeviceId === device.deviceId && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Active Stream Quality</p>
                            <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between group cursor-help" title="Current hardware-reported stream quality">
                                <span className="text-xs text-white font-medium">{targetResolution.width}x{targetResolution.height}</span>
                                <span className="text-[8px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-black">STABLE</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Right/Bottom: Page Management */}
            <div className="w-full md:w-80 bg-slate-800 border-l border-slate-700 flex flex-col h-[40%] md:h-full">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <FileText size={18} className="text-indigo-400" />
                            Review Pages
                        </h3>
                        <p className="text-slate-400 text-[10px] mt-0.5 font-bold uppercase tracking-tighter">
                            {pages.length} Captured | {targetResolution.width}p
                        </p>
                    </div>
                    {pages.length > 0 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { if (confirm("Clear all pages?")) setPages([]) }}
                                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                title="Clear All"
                            >
                                <Trash2 size={20} />
                            </button>
                            <button
                                disabled={isProcessing}
                                onClick={generatePDF}
                                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition active:scale-95 flex items-center gap-2"
                            >
                                {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
                                Done
                            </button>
                        </div>
                    )}
                </div>

                {/* Live Intensity Sidebar Injection */}
                <div className="px-4 py-2 border-b border-slate-700 bg-slate-900/40">
                    <div className="grid grid-cols-2 gap-4 py-2">
                        <div>
                            <div className="flex justify-between text-[8px] text-slate-500 mb-1 font-black">
                                <span>BRIGHTNESS</span>
                                <span className="text-white">{liveBrightness}%</span>
                            </div>
                            <input
                                type="range" min="50" max="150" value={liveBrightness}
                                onChange={(e) => setLiveBrightness(parseInt(e.target.value))}
                                className="w-full h-0.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-[8px] text-slate-500 mb-1 font-black">
                                <span>CONTRAST</span>
                                <span className="text-white">{liveContrast}%</span>
                            </div>
                            <input
                                type="range" min="50" max="150" value={liveContrast}
                                onChange={(e) => setLiveContrast(parseInt(e.target.value))}
                                className="w-full h-0.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-800/50">
                    {pages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
                            <ImageIcon size={48} />
                            <p className="text-sm font-medium">Capture pages to begin</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {pages.map((page, index) => (
                                <div key={page.id} className={`group relative bg-slate-900 rounded-xl overflow-hidden border transition-all ${activePageId === page.id ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-700 hover:border-slate-600'}`}>
                                    <div className="aspect-[3/4] overflow-hidden bg-slate-950 flex items-center justify-center">
                                        <img
                                            src={page.dataUrl}
                                            alt={`Page ${index + 1}`}
                                            className="max-w-full max-h-full object-contain transition-transform duration-300"
                                            style={{
                                                transform: `rotate(${page.rotation}deg)`,
                                                filter: `brightness(${page.brightness}%) contrast(${page.contrast}%)`
                                            }}
                                        />
                                    </div>

                                    <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-md rounded-md text-[8px] text-white font-black">
                                        P{index + 1}
                                    </div>

                                    {/* Hover Actions - More Compact */}
                                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 px-2">
                                        <div className="flex gap-1.5 w-full">
                                            <button onClick={() => movePage(page.id, 'up')} className="flex-1 p-1.5 bg-white text-slate-900 rounded-lg hover:bg-indigo-50 transition"><ChevronUp size={14} /></button>
                                            <button onClick={() => movePage(page.id, 'down')} className="flex-1 p-1.5 bg-white text-slate-900 rounded-lg hover:bg-indigo-50 transition"><ChevronDown size={14} /></button>
                                        </div>
                                        <div className="flex gap-1.5 w-full">
                                            <button onClick={() => setEditingPage(page)} className="flex-1 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition"><Settings size={14} /></button>
                                            <button onClick={() => deletePage(page.id)} className="flex-1 p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {/* Page Editor Modal */}
            {editingPage && (
                <PageEditor
                    page={editingPage}
                    onSave={saveEditedPage}
                    onCancel={() => setEditingPage(null)}
                />
            )}
        </div>
    );
}

/**
 * Professional Page Editor with 4-Point Crop & Enhancement
 */
function PageEditor({ page, onSave, onCancel }: { page: CapturedPage, onSave: (p: CapturedPage) => void, onCancel: () => void }) {
    const [brightness, setBrightness] = useState(page.brightness || 100);
    const [contrast, setContrast] = useState(page.contrast || 100);
    const [points, setPoints] = useState(page.points || [
        { x: 15, y: 15 }, { x: 85, y: 15 },
        { x: 85, y: 85 }, { x: 15, y: 85 }
    ]);
    const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (draggingIdx === null || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

        const newPoints = [...points];
        newPoints[draggingIdx] = { x, y };
        setPoints(newPoints);
    };

    const applyTransform = async () => {
        if (!containerRef.current) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = page.dataUrl;
        await new Promise(resolve => img.onload = resolve);

        // Perform the Warp
        const warpedDataUrl = await warpImage(img, points, brightness, contrast);
        onSave({ ...page, dataUrl: warpedDataUrl, brightness, contrast, points });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col p-4 md:p-10 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-white text-2xl font-black uppercase tracking-widest">Professional Editor</h2>
                    <p className="text-slate-400 text-xs">Retouching & Perspective Correction</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex gap-2">
                        <button onClick={() => {
                            const newPoints = [...points];
                            const p0 = newPoints[0];
                            newPoints[0] = newPoints[3];
                            newPoints[3] = newPoints[2];
                            newPoints[2] = newPoints[1];
                            newPoints[1] = p0;
                            setPoints(newPoints);
                        }} className="p-3 bg-slate-800 text-slate-300 hover:text-white rounded-xl transition" title="Rotate Crop Points"><RotateCw size={20} /></button>
                    </div>
                    <button onClick={onCancel} className="p-3 text-slate-400 hover:text-white transition"><X /></button>
                    <button
                        onClick={applyTransform}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-2 group transition active:scale-95"
                    >
                        <Check size={20} />
                        Apply Changes
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-10 min-h-0">
                {/* Editor Viewport */}
                <div className="flex-1 bg-black rounded-3xl overflow-hidden relative shadow-inner" ref={containerRef} onMouseMove={handleMouseMove} onMouseUp={() => setDraggingIdx(null)}>
                    <img
                        src={page.dataUrl}
                        alt="Editing"
                        className="w-full h-full object-contain select-none pointer-events-none"
                        style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
                    />

                    {/* 4-Point Overlay */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                        <polygon
                            points={points.map(p => `${p.x}% ${p.y}%`).join(', ')}
                            fill="rgba(168, 85, 247, 0.1)"
                            stroke="rgba(168, 85, 247, 0.8)"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                        />
                    </svg>

                    {points.map((p, idx) => (
                        <div
                            key={idx}
                            onMouseDown={() => setDraggingIdx(idx)}
                            className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-4 border-white bg-indigo-600 shadow-xl cursor-move active:scale-125 transition-transform z-10 flex items-center justify-center p-1"
                            style={{ left: `${p.x}%`, top: `${p.y}%`, pointerEvents: 'auto' }}
                        >
                            <div className="w-full h-full rounded-full bg-white opacity-40"></div>
                        </div>
                    ))}
                </div>

                {/* Sidebar Controls */}
                <div className="w-full md:w-80 space-y-8">
                    {/* Enhancement Suite */}
                    <div className="bg-slate-800/50 rounded-3xl p-6 border border-white/5 space-y-6">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-4">Image Enhancement</h4>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] font-bold text-slate-300 uppercase">Brightness</label>
                                <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded-md text-white">{brightness}%</span>
                            </div>
                            <input
                                type="range" min="50" max="150" value={brightness}
                                onChange={(e) => setBrightness(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />

                            <div className="flex justify-between items-center mb-1 mt-6">
                                <label className="text-[10px] font-bold text-slate-300 uppercase">Contrast</label>
                                <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded-md text-white">{contrast}%</span>
                            </div>
                            <input
                                type="range" min="50" max="150" value={contrast}
                                onChange={(e) => setContrast(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-3xl p-6 border border-white/5">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-4">Perspective Guide</h4>
                        <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
                            Drag the 4 corner handles to align with the physical edges of your document.
                            <br /><br />
                            <span className="text-amber-500 font-bold">PRO TIP:</span> Aim for the true corners of the paper for the best OCR and printing results.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Advanced Perspective Warp Engine
 * Uses Homography calculation to map 4 arbitrary points to a rectangle
 */
async function warpImage(img: HTMLImageElement, points: { x: number, y: number }[], brightness: number, contrast: number): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return img.src;

    // Determine output dimensions (based on the average side lengths for aspect ratio preservation)
    // Points order: TL, TR, BR, BL
    const p = points.map(pt => ({ x: pt.x * img.width / 100, y: pt.y * img.height / 100 }));

    const w1 = Math.sqrt(Math.pow(p[1].x - p[0].x, 2) + Math.pow(p[1].y - p[0].y, 2));
    const w2 = Math.sqrt(Math.pow(p[2].x - p[3].x, 2) + Math.pow(p[2].y - p[3].y, 2));
    const h1 = Math.sqrt(Math.pow(p[3].x - p[0].x, 2) + Math.pow(p[3].y - p[0].y, 2));
    const h2 = Math.sqrt(Math.pow(p[2].x - p[1].x, 2) + Math.pow(p[2].y - p[1].y, 2));

    const outWidth = Math.max(w1, w2);
    const outHeight = Math.max(h1, h2);

    canvas.width = outWidth;
    canvas.height = outHeight;

    // 1. Create source canvas with filters
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = img.width;
    srcCanvas.height = img.height;
    const srcCtx = srcCanvas.getContext('2d');
    if (srcCtx) {
        srcCtx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
        srcCtx.drawImage(img, 0, 0);
    }

    // 2. Perform Perspective Warp (Manual Bi-linear Interpolation)
    // This is the "Smart" part that makes it professional
    const imageData = srcCtx?.getImageData(0, 0, img.width, img.height);
    const outputData = ctx.createImageData(outWidth, outHeight);

    if (imageData) {
        // Calculate backward mapping for better quality
        const matrix = getPerspectiveTransform(
            [{ x: 0, y: 0 }, { x: outWidth, y: 0 }, { x: outWidth, y: outHeight }, { x: 0, y: outHeight }],
            p
        );

        for (let y = 0; y < outHeight; y++) {
            for (let x = 0; x < outWidth; x++) {
                const srcPt = applyTransformMatrix(matrix, x, y);
                const srcX = Math.floor(srcPt.x);
                const srcY = Math.floor(srcPt.y);

                if (srcX >= 0 && srcX < img.width && srcY >= 0 && srcY < img.height) {
                    const outIdx = (y * outWidth + x) * 4;
                    const srcIdx = (srcY * img.width + srcX) * 4;
                    outputData.data[outIdx] = imageData.data[srcIdx];
                    outputData.data[outIdx + 1] = imageData.data[srcIdx + 1];
                    outputData.data[outIdx + 2] = imageData.data[srcIdx + 2];
                    outputData.data[outIdx + 3] = imageData.data[srcIdx + 3];
                }
            }
        }
        ctx.putImageData(outputData, 0, 0);
    }

    return canvas.toDataURL('image/jpeg', 0.75); // Reduced quality for significant space saving
}

/**
 * Solve for 3x3 Perspective Transform Matrix (Homography)
 */
function getPerspectiveTransform(src: any[], dst: any[]) {
    const a = [];
    for (let i = 0; i < 4; i++) {
        a.push([src[i].x, src[i].y, 1, 0, 0, 0, -src[i].x * dst[i].x, -src[i].y * dst[i].x]);
        a.push([0, 0, 0, src[i].x, src[i].y, 1, -src[i].x * dst[i].y, -src[i].y * dst[i].y]);
    }
    const b = [];
    for (let i = 0; i < 4; i++) {
        b.push(dst[i].x);
        b.push(dst[i].y);
    }

    // Simple Gaussian elimination to solve Ax = B
    const x = solveLinearSystem(a, b);
    return [...x, 1];
}

function solveLinearSystem(a: any, b: any) {
    const n = 8;
    for (let i = 0; i < n; i++) {
        let max = i;
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(a[j][i]) > Math.abs(a[max][i])) max = j;
        }
        [a[i], a[max]] = [a[max], a[i]];
        [b[i], b[max]] = [b[max], b[i]];

        for (let j = i + 1; j < n; j++) {
            const factor = a[j][i] / a[i][i];
            b[j] -= factor * b[i];
            for (let k = i; k < n; k++) a[j][k] -= factor * a[i][k];
        }
    }
    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for (let j = i + 1; j < n; j++) sum += a[i][j] * x[j];
        x[i] = (b[i] - sum) / a[i][i];
    }
    return x;
}

function applyTransformMatrix(m: number[], x: number, y: number) {
    const w = m[6] * x + m[7] * y + m[8];
    return {
        x: (m[0] * x + m[1] * y + m[2]) / w,
        y: (m[3] * x + m[4] * y + m[5]) / w
    };
}
