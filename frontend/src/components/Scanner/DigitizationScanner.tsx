"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import jsPDF from 'jspdf';
import { Camera, Settings, X, Save, Crop, RotateCw, Trash2, Check, FileText, Image as ImageIcon, Sun, Moon, Maximize, Minimize, Sparkles } from 'lucide-react';
import { CapturedPage, DigitizationScannerProps } from './ScannerTypes';
import { formatBytes, getTotalSize, detectDocumentBounds, processImage, scanDocumentAPI } from './ScannerUtils';

// --- Constants ---

// --- Constants ---
const A4_RATIO = 210 / 297; // 0.707

export default function DigitizationScanner({ onComplete, onCancel }: DigitizationScannerProps) {
    // --- State ---
    const webcamRef = useRef<Webcam>(null);
    const editorImgRef = useRef<HTMLImageElement>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

    // Scan Settings
    const [resolution, setResolution] = useState<{ width: number, height: number }>({ width: 3840, height: 2160 }); // Default 4K
    const [dpi, setDpi] = useState<number>(200);
    const [filterMode, setFilterMode] = useState<'color' | 'grayscale' | 'bw'>('color');
    const [brightness, setBrightness] = useState<number>(100); // %
    const [contrast, setContrast] = useState<number>(100); // %
    const [threshold, setThreshold] = useState<number>(128); // For B&W

    // Data
    const [pages, setPages] = useState<CapturedPage[]>([]);

    // UI State
    const [view, setView] = useState<'camera' | 'edit'>('camera');
    const [editingPageId, setEditingPageId] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    // Video View State
    const [viewMode, setViewMode] = useState<'fit' | 'zoom'>('fit');
    const [showGuide, setShowGuide] = useState(true);

    // Editor State
    const [cropRect, setCropRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
    const [rotation, setRotation] = useState(0);
    const [liveRotation, setLiveRotation] = useState(0); // For live camera feed
    const [isLiveCrop, setIsLiveCrop] = useState(false);
    const [liveCropRect, setLiveCropRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // --- Initialization ---

    useEffect(() => {
        // Enumerate Devices
        navigator.mediaDevices.enumerateDevices().then(data => {
            const videoDevices = data.filter(d => d.kind === 'videoinput');
            setDevices(videoDevices);
            if (videoDevices.length > 0) setSelectedDeviceId(videoDevices[0].deviceId);
        });
    }, []);

    // --- Live Auto Crop Loop ---
    useEffect(() => {
        let animationFrameId: number;

        const loop = () => {
            if (isLiveCrop && webcamRef.current && view === 'camera') {
                const video = webcamRef.current.video;
                if (video && video.readyState === 4) {
                    const videoW = video.videoWidth;
                    const videoH = video.videoHeight;

                    // Create minimal canvas for processing
                    const scale = Math.min(1, 256 / videoW); // Process at low res
                    const canvas = document.createElement('canvas');
                    canvas.width = videoW * scale;
                    canvas.height = videoH * scale;
                    const ctx = canvas.getContext('2d');

                    if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                        const bounds = detectDocumentBounds(canvas.width, canvas.height, imageData.data);

                        if (bounds) {
                            // Map back to Display Coordinates
                            // We need the bounding rect of the video element ON SCREEN
                            const videoRect = video.getBoundingClientRect();
                            // Scaling factor from ProcessingCanvas -> VideoElement
                            // W_proc / W_vid = scale
                            // W_disp / W_vid = displayScale

                            // Let's go: Process -> Video (Natural)
                            const pad = 5 * scale;
                            const minX = Math.max(0, bounds.minX - pad);
                            const minY = Math.max(0, bounds.minY - pad);
                            const maxX = Math.min(canvas.width, bounds.maxX + pad);
                            const maxY = Math.min(canvas.height, bounds.maxY + pad);

                            if (maxX > minX && maxY > minY) {
                                // Normalized coords (0..1)
                                const normX = minX / canvas.width;
                                const normY = minY / canvas.height;
                                const normW = (maxX - minX) / canvas.width;
                                const normH = (maxY - minY) / canvas.height;

                                // Map to Display Rect (which is absolute on screen, but we want relative to container?)
                                // No, an overlay ON TOP of the video should match videoRect

                                // BUT: CSS object-fit: contain/cover changes things.
                                // If 'fit' (contain):
                                // The video is centered in the container.
                                // We need to calculate the actual rendered rect of the video within the parent.

                                // Simplification: Just render overlay on top of video element using Absolute.
                                // If we put the overlay INSIDE the div that holds Webcam, and that div is flex-centered...
                                // We can compute relative to the video element itself if we can.

                                // Alternative: Calculate 'displayed' dimensions of video
                                const ratio = videoW / videoH;
                                const contW = videoRect.width;
                                const contH = videoRect.height;

                                // Actually, videoRect IS the element size. 
                                // But if object-fit is contain, the 'image' might be smaller than element.
                                // React-Webcam creates a <video> tag. 
                                // If we style it with 'max-w-full max-h-full', it sizes itself?
                                // Our classes: `max-w-full max-h-full object-contain`
                                // So the <video> element ITSELF shrinks to fit? 
                                // Yes, usually <video> with max-w-full behaves like <img>, it maintains aspect ratio and takes space.
                                // So videoRect should match the visible image exactly!

                                setLiveCropRect({
                                    x: normX * videoRect.width,
                                    y: normY * videoRect.height,
                                    w: normW * videoRect.width,
                                    h: normH * videoRect.height
                                });
                            }
                        }
                    }
                }
            } else {
                setLiveCropRect(null);
            }
            animationFrameId = requestAnimationFrame(loop);
        };

        if (isLiveCrop) {
            loop();
        } else {
            setLiveCropRect(null);
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [isLiveCrop, view]);

    // --- Split Page Logic ---
    const splitPage = (pageId: string) => {
        const pageIndex = pages.findIndex(p => p.id === pageId);
        if (pageIndex === -1) return;

        const page = pages[pageIndex];
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const w = img.width;
            const h = img.height;

            // Create 2 canvases
            const canvasL = document.createElement('canvas');
            const canvasR = document.createElement('canvas');

            // Assuming L is 0-50%, R is 50%-100%
            const halfW = Math.floor(w / 2);

            canvasL.width = halfW;
            canvasL.height = h;
            canvasR.width = w - halfW;
            canvasR.height = h;

            const ctxL = canvasL.getContext('2d');
            const ctxR = canvasR.getContext('2d');

            if (ctxL && ctxR) {
                // Left
                ctxL.drawImage(img, 0, 0, halfW, h, 0, 0, halfW, h);
                // Right
                ctxR.drawImage(img, halfW, 0, w - halfW, h, 0, 0, w - halfW, h);

                const urlL = canvasL.toDataURL('image/jpeg', 0.9);
                const urlR = canvasR.toDataURL('image/jpeg', 0.9);

                const idL = Date.now().toString();
                const idR = (Date.now() + 1).toString(); // Ensure unique

                // Estimate sizes roughly
                const sizeL = Math.floor(page.sizeBytes / 2);

                const newPageL: CapturedPage = {
                    ...page, id: idL, originalUrl: urlL, processedUrl: urlL,
                    width: halfW, height: h, sizeBytes: sizeL
                };
                const newPageR: CapturedPage = {
                    ...page, id: idR, originalUrl: urlR, processedUrl: urlR,
                    width: w - halfW, height: h, sizeBytes: sizeL
                };

                // Replace in array
                const newPages = [...pages];
                newPages.splice(pageIndex, 1, newPageL, newPageR);
                setPages(newPages);

                // If we were editing this page, close editor or switch to first new one
                if (editingPageId === pageId) {
                    setEditingPageId(null);
                }
            }
        };
        img.src = page.processedUrl;
    };





    // --- Actions ---

    const capture = useCallback(async () => {
        if (!webcamRef.current) return;
        setIsProcessing(true);

        // Force capture at the configured resolution
        const imageSrc = webcamRef.current.getScreenshot({
            width: resolution.width,
            height: resolution.height
        });

        if (!imageSrc) {
            setIsProcessing(false);
            return;
        }

        try {
            let blobToSend: Blob;
            let finalOriginalUrl = imageSrc;

            // Check if we have rotation to apply (Live 180 or Straighten slider)
            const totalRotation = liveRotation + rotation;

            if (totalRotation !== 0) {
                // Pre-rotate on client using existing utility
                // We use 'color' mode to preserve image data without thresholding yet
                const rotated = await processImage(
                    imageSrc,
                    'color',
                    100, // brightness default
                    100, // contrast default
                    0,   // threshold ignored
                    totalRotation
                );
                blobToSend = await (await fetch(rotated.url)).blob();
                finalOriginalUrl = rotated.url;
            } else {
                blobToSend = await (await fetch(imageSrc)).blob();
            }

            // Use backend scanner service
            const scannedBlob = await scanDocumentAPI(blobToSend);
            const scannedUrl = URL.createObjectURL(scannedBlob);

            const img = new Image();
            img.onload = () => {
                const newPage: CapturedPage = {
                    id: Math.random().toString(36).substr(2, 9),
                    originalUrl: finalOriginalUrl,
                    processedUrl: scannedUrl,
                    width: img.width,
                    height: img.height,
                    sizeBytes: scannedBlob.size,
                    filterMode: 'bw'
                };
                setPages(prev => [...prev, newPage]);
                setIsProcessing(false);
                setRotation(0);
            };
            img.onerror = () => {
                console.error("Failed to load processed image");
                setIsProcessing(false);
            };
            img.src = scannedUrl;

        } catch (e) {
            console.error(e);
            alert("Scan failed. Is backend running?");
            setIsProcessing(false);
        }
    }, [webcamRef, resolution, liveRotation, rotation]);

    const handleSaveEdit = async () => {
        if (!editingPageId) return;
        const page = pages.find(p => p.id === editingPageId);
        if (!page) return;

        // Calculate Crop Coordinates mapped to valid image resolution
        let finalCrop = undefined;
        if (cropRect && editorImgRef.current) {
            const img = editorImgRef.current;
            const rect = img.getBoundingClientRect(); // visible size

            // We need to map cropRect (relative to container? No, absolute in container)
            // cropRect is {x, y, w, h} relative to the container.
            // img is also inside the container.
            // We assume img is centered.

            // Simplification: We only support crop if we can accurately map it.
            // Let's get the rendered size of the image on screen

            const renderW = rect.width;
            const renderH = rect.height;
            const naturalW = img.naturalWidth;
            const naturalH = img.naturalHeight;

            // If rotated 90 or 270, natural dimensions are swapped relative to visual
            // But processImage rotates FIRST, so the intermediate canvas matches variable 'rotation'
            // So if rotation is 90, the intermediate canvas is H x W. (Logical W = naturalH)

            let scaleX = 1;
            let scaleY = 1;

            // Determine intermediate logical size (The size of the canvas we are cropping from)
            let logicalW = naturalW;
            let logicalH = naturalH;

            if (rotation % 180 !== 0) {
                logicalW = naturalH;
                logicalH = naturalW;
            }

            // Scale = Real Pixels / Screen Pixels
            scaleX = logicalW / renderW;
            scaleY = logicalH / renderH;

            // Calculate offset of image within container (if strictly centered)
            // Our layout is flex-center.
            // The crop rect is relative to the *container*.
            // The image might be smaller than container.

            const container = img.parentElement;
            if (container) {
                const contRect = container.getBoundingClientRect();
                // Image is centered.
                const imgLeft = (contRect.width - renderW) / 2;
                const imgTop = (contRect.height - renderH) / 2;

                // Adjust crop rect to be relative to image
                const relX = cropRect.x - imgLeft;
                const relY = cropRect.y - imgTop;

                // Map to logical coordinates
                finalCrop = {
                    x: Math.max(0, relX * scaleX),
                    y: Math.max(0, relY * scaleY),
                    w: cropRect.w * scaleX,
                    h: cropRect.h * scaleY
                };
            }
        }

        const processed = await processImage(
            page.originalUrl,
            filterMode,
            brightness,
            contrast,
            threshold,
            rotation,
            finalCrop
        );

        setPages(prev => prev.map(p => p.id === editingPageId ? {
            ...p,
            processedUrl: processed.url,
            width: processed.w,
            height: processed.h,
            sizeBytes: processed.size,
            filterMode: filterMode
        } : p));

        setView('camera');
        setEditingPageId(null);
        setCropRect(null);
        setRotation(0);
        // Reset filters to defaults for next scan or keep them? Keep them is usually better workflow.
    };

    // --- Keyboard Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only trigger if no modal/input is active (simple check)
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

            if (e.code === 'Space') {
                e.preventDefault();
                if (view === 'camera') {
                    capture();
                }
            } else if (e.code === 'Enter') {
                e.preventDefault();
                // If in camera view and we have pages, generate PDF
                if (pages.length > 0) {
                    generatePDF();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [view, pages, capture]);

    const startEdit = (id: string) => {
        const page = pages.find(p => p.id === id);
        if (!page) return;
        setEditingPageId(id);
        // Load page settings into controls
        // Note: For now we reset to defaults or keep current?
        // Let's keep current as "tool settings", but we might want to load page-specific metadata later.
        setView('edit');
    };

    const deletePage = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setPages(prev => prev.filter(p => p.id !== id));
    };

    const generatePDF = () => {
        if (pages.length === 0) return;

        // Use the first page to initialize the doc (dimensions in points)
        // jsPDF unit 'px' treats 1 unit = 1 pixel
        const firstPage = pages[0];
        const doc = new jsPDF({
            orientation: firstPage.width > firstPage.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [firstPage.width, firstPage.height]
        });

        // Add first image
        doc.addImage(firstPage.processedUrl, 'JPEG', 0, 0, firstPage.width, firstPage.height);

        // Add subsequent pages
        for (let i = 1; i < pages.length; i++) {
            const p = pages[i];
            doc.addPage([p.width, p.height], p.width > p.height ? 'landscape' : 'portrait');
            doc.addImage(p.processedUrl, 'JPEG', 0, 0, p.width, p.height);
        }

        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], `scan_${new Date().getTime()}.pdf`, { type: 'application/pdf' });
        onComplete(file);
    };

    // --- Render ---

    return (
        <div className="flex w-full h-full bg-slate-950 text-slate-100 overflow-hidden font-sans">

            {/* LEFT SIDEBAR - GALLERV & SETTINGS TRIGGER */}
            <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 z-10">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <FileText className="text-indigo-500" />
                        Pages <span className="text-slate-500 text-sm">({pages.length})</span>
                    </h2>
                    <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-full hover:bg-slate-800 transition ${showSettings ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'}`}>
                        <Settings size={20} />
                    </button>
                </div>

                {/* Settings Panel (Expandable) */}
                {showSettings && (
                    <div className="p-4 bg-slate-800/50 border-b border-slate-700 space-y-4 animate-in slide-in-from-top-2">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Camera</label>
                            <select
                                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white"
                                value={selectedDeviceId}
                                onChange={(e) => setSelectedDeviceId(e.target.value)}
                            >
                                {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 5)}...`}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Input Resolution</label>
                            <select
                                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white"
                                value={resolution.width}
                                onChange={(e) => {
                                    const w = parseInt(e.target.value);
                                    let h = 0;
                                    // Aspect Ratio handling
                                    if (w === 4608) h = 3456; // 16MP (4:3)
                                    else if (w === 4032) h = 3024; // 12MP (4:3)
                                    else if (w === 3264) h = 2448; // 8MP (4:3)
                                    else if (w === 3840) h = 2160; // 4K (16:9)
                                    else h = Math.round(w * 0.75); // Automatic 4:3 fallbacks

                                    setResolution({ width: w, height: h });
                                }}
                            >
                                <option value="4608">16MP - CZUR Lens Pro (Ultimate)</option>
                                <option value="4032">12MP - CZUR Lens 1200 Pro</option>
                                <option value="3264">8MP - CZUR Lens 800 Pro</option>
                                <option value="3840">4K Ultra HD (16:9)</option>
                                <option value="1920">1080p Full HD</option>
                                <option value="1280">720p HD (Fast)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">DPI Tag (PDF)</label>
                            <select
                                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white"
                                value={dpi}
                                onChange={(e) => setDpi(parseInt(e.target.value))}
                            >
                                <option value="150">150 DPI (Screen)</option>
                                <option value="200">200 DPI (Standard)</option>
                                <option value="300">300 DPI (Print)</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Gallery List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {pages.map((p, i) => (
                        <div
                            key={p.id}
                            onClick={() => startEdit(p.id)}
                            className="relative group cursor-pointer border-2 border-transparent hover:border-indigo-500 rounded-lg overflow-hidden transition-all bg-black/20"
                        >
                            <img src={p.processedUrl} className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-md">
                                Page {i + 1}
                            </div>
                            <div className="absolute bottom-2 left-2 text-[10px] text-slate-300 bg-black/60 px-1 rounded">
                                {formatBytes(p.sizeBytes)}
                            </div>
                            <button
                                onClick={(e) => deletePage(p.id, e)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                    {pages.length === 0 && (
                        <div className="text-center py-12 text-slate-700 italic text-sm">
                            No pages scanned yet.<br />Click the camera button!
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 flex justify-between">
                    <span>Total Size:</span>
                    <span className={`font-bold ${getTotalSize(pages) > 25 * 1024 * 1024 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {formatBytes(getTotalSize(pages))}
                    </span>
                </div>
            </div>

            {/* MAIN VIEW AREA */}
            <div className="flex-1 flex flex-col relative bg-black">

                {/* TOOLBAR OVERLAY */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-slate-900/80 backdrop-blur-md p-2 rounded-full border border-slate-700 shadow-xl">
                    <button
                        onClick={() => {
                            setFilterMode('color');
                            // Verify filters are reset effectively
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 ${filterMode === 'color' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50' : 'text-slate-400 hover:text-white'}`}
                    >
                        <ImageIcon size={14} /> Color
                    </button>
                    <button
                        onClick={() => setFilterMode('grayscale')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 ${filterMode === 'grayscale' ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Sun size={14} /> Gray
                    </button>
                    <button
                        onClick={() => setFilterMode('bw')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 ${filterMode === 'bw' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Moon size={14} /> B&W
                    </button>

                    {view === 'camera' && (
                        <>
                            <div className="w-px h-6 bg-slate-700 mx-2"></div>
                            <button
                                onClick={() => setLiveRotation(r => (r + 90) % 360)}
                                className="px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-700 border border-slate-600"
                            >
                                <RotateCw size={14} /> Rot {liveRotation}°
                            </button>
                            <button
                                onClick={() => setViewMode(v => v === 'fit' ? 'zoom' : 'fit')}
                                className="px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-700 border border-slate-600"
                            >
                                {viewMode === 'fit' ? <Maximize size={14} /> : <Minimize size={14} />} {viewMode === 'fit' ? 'Fit' : 'Fill'}
                            </button>
                            <button
                                onClick={() => setShowGuide(g => !g)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 border border-slate-600 ${showGuide ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                            >
                                <Settings size={14} /> Guide
                            </button>
                            <button
                                onClick={async () => {
                                    if (webcamRef.current && webcamRef.current.stream) {
                                        const track = webcamRef.current.stream.getVideoTracks()[0];
                                        const capabilities = track.getCapabilities();
                                        // @ts-ignore - TS might likely complain about focusMode
                                        if (capabilities.focusMode) {
                                            try {
                                                await track.applyConstraints({
                                                    // @ts-ignore
                                                    advanced: [{ focusMode: 'continuous' }]
                                                });
                                                // Trigger a manual focus sweep if possible or just re-assert continuous
                                                // Some cameras need a toggle
                                                await track.applyConstraints({
                                                    // @ts-ignore
                                                    advanced: [{ focusMode: 'manual', focusDistance: 0.5 }]
                                                });
                                                setTimeout(async () => {
                                                    await track.applyConstraints({
                                                        // @ts-ignore
                                                        advanced: [{ focusMode: 'continuous' }]
                                                    });
                                                }, 200);

                                            } catch (e) {
                                                console.error("Focus failed", e);
                                            }
                                        }
                                    }
                                }}
                                className="px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-700 border border-slate-600"
                                title="Trigger Auto Focus"
                            >
                                <div className="w-3 h-3 border-2 border-white rounded-full flex items-center justify-center">
                                    <div className="w-1 h-1 bg-white rounded-full"></div>
                                </div> Focus
                            </button>

                            {/* LIVE CROP TOGGLE */}
                            <button
                                onClick={() => setIsLiveCrop(!isLiveCrop)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 border ${isLiveCrop ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-600 text-gray-300 hover:bg-slate-700'}`}
                                title="Toggle Live Auto-Crop Overlay"
                            >
                                <Sparkles size={14} className={isLiveCrop ? "fill-white" : ""} /> Live Crop
                            </button>
                        </>
                    )}
                </div>

                {/* CLOSE BUTTON */}
                <button onClick={onCancel} className="absolute top-4 right-4 z-30 p-2 bg-black/50 hover:bg-red-500/80 text-white rounded-full transition backdrop-blur-sm">
                    <X size={24} />
                </button>

                {/* MAIN CONTENT CANVAS / WEBCAM */}
                <div className="flex-1 flex items-center justify-center relative overflow-hidden p-8">

                    {view === 'camera' ? (
                        <>
                            <div className="relative w-full h-full flex items-center justify-center">
                                <Webcam
                                    key={`${selectedDeviceId}-${resolution.width}x${resolution.height}`}
                                    ref={webcamRef}
                                    audio={false}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{
                                        deviceId: selectedDeviceId,
                                        width: { ideal: resolution.width },
                                        height: { ideal: resolution.height }
                                    }}
                                    className={`shadow-2xl transition-all duration-300 ${viewMode === 'fit' ? 'w-full h-full object-contain' : 'w-full h-full object-cover'}`}
                                    style={{
                                        filter: `brightness(${brightness}%) contrast(${filterMode === 'bw' ? contrast * 2 : contrast}%) grayscale(${filterMode === 'color' ? 0 : 100}%)`,
                                        transform: `rotate(${liveRotation}deg)`
                                    }}
                                />

                                {/* Live Crop Overlay */}
                                {isLiveCrop && liveCropRect && (
                                    <div
                                        className="absolute border-2 border-blue-400 bg-blue-500/10 pointer-events-none transition-all duration-100 z-20"
                                        style={{
                                            left: liveCropRect.x,
                                            top: liveCropRect.y,
                                            width: liveCropRect.w,
                                            height: liveCropRect.h
                                        }}
                                    >
                                        <div className="absolute top-0 right-0 -mt-6 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                                            Auto Detect
                                        </div>
                                    </div>
                                )}
                                {/* Guide Overlay for A4 */}
                                {showGuide && (
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                        <div className="border-2 border-white/50 border-dashed w-[80%] h-[90%] rounded-lg opacity-80 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-500 -mt-0.5 -ml-0.5"></div>
                                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-500 -mt-0.5 -mr-0.5"></div>
                                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-500 -mb-0.5 -ml-0.5"></div>
                                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-500 -mb-0.5 -mr-0.5"></div>
                                            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-white/80 bg-black/50 px-2 rounded tracking-widest font-bold">ALIGN DOCUMENT CENTER</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="relative w-full h-full flex items-center justify-center bg-slate-900/50 p-4">
                            {/* Editor View */}
                            {editingPageId && (
                                <div className="relative shadow-2xl">
                                    <img
                                        ref={editorImgRef}
                                        src={pages.find(p => p.id === editingPageId)?.originalUrl}
                                        className="max-h-[80vh] shadow-lg"
                                        style={{
                                            transform: `rotate(${rotation}deg)`,
                                            filter: `brightness(${brightness}%) contrast(${filterMode === 'bw' ? contrast * 2 : contrast}%) grayscale(${filterMode === 'color' ? 0 : 100}%)`,
                                            transition: 'transform 0.3s ease'
                                        }}
                                        onLoad={() => {
                                            // Reset crop when image loads or rotates?
                                            setCropRect(null);
                                        }}
                                    />
                                    {/* Simplified Crop Overlay - Visual Only Use for now */}
                                    {/* Interactive Crop Overlay */}
                                    {cropRect && (
                                        <div
                                            className="absolute border-2 border-indigo-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
                                            style={{
                                                left: `${cropRect.x}px`,
                                                top: `${cropRect.y}px`,
                                                width: `${cropRect.w}px`,
                                                height: `${cropRect.h}px`
                                            }}
                                            onMouseDown={(e) => {
                                                // Simple drag implementation
                                                const startX = e.clientX;
                                                const startY = e.clientY;
                                                const startRect = { ...cropRect };

                                                const handleDrag = (ev: MouseEvent) => {
                                                    setCropRect({
                                                        ...startRect,
                                                        x: startRect.x + (ev.clientX - startX),
                                                        y: startRect.y + (ev.clientY - startY)
                                                    });
                                                };

                                                const stopDrag = () => {
                                                    window.removeEventListener('mousemove', handleDrag);
                                                    window.removeEventListener('mouseup', stopDrag);
                                                };

                                                window.addEventListener('mousemove', handleDrag);
                                                window.addEventListener('mouseup', stopDrag);
                                            }}
                                        >
                                            {/* Handlers Function */}
                                            {(() => {
                                                const createResizeHandler = (corner: 'tl' | 'tr' | 'bl' | 'br') => (e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    const startX = e.clientX;
                                                    const startY = e.clientY;
                                                    const startRect = { ...cropRect };

                                                    const handleResize = (ev: MouseEvent) => {
                                                        const deltaX = ev.clientX - startX;
                                                        const deltaY = ev.clientY - startY;
                                                        let newRect = { ...startRect };

                                                        if (corner === 'tl') {
                                                            newRect.x = startRect.x + deltaX;
                                                            newRect.y = startRect.y + deltaY;
                                                            newRect.w = startRect.w - deltaX;
                                                            newRect.h = startRect.h - deltaY;
                                                        } else if (corner === 'tr') {
                                                            newRect.y = startRect.y + deltaY;
                                                            newRect.w = startRect.w + deltaX;
                                                            newRect.h = startRect.h - deltaY;
                                                        } else if (corner === 'bl') {
                                                            newRect.x = startRect.x + deltaX;
                                                            newRect.w = startRect.w - deltaX;
                                                            newRect.h = startRect.h + deltaY;
                                                        } else if (corner === 'br') {
                                                            newRect.w = startRect.w + deltaX;
                                                            newRect.h = startRect.h + deltaY;
                                                        }

                                                        // Min constraints
                                                        if (newRect.w < 20) newRect.w = 20;
                                                        if (newRect.h < 20) newRect.h = 20;

                                                        setCropRect(newRect);
                                                    };

                                                    const stopResize = () => {
                                                        window.removeEventListener('mousemove', handleResize);
                                                        window.removeEventListener('mouseup', stopResize);
                                                    };

                                                    window.addEventListener('mousemove', handleResize);
                                                    window.addEventListener('mouseup', stopResize);
                                                };

                                                return (
                                                    <>
                                                        <div onMouseDown={createResizeHandler('tl')} className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full cursor-nw-resize z-50"></div>
                                                        <div onMouseDown={createResizeHandler('tr')} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full cursor-ne-resize z-50"></div>
                                                        <div onMouseDown={createResizeHandler('bl')} className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full cursor-sw-resize z-50"></div>
                                                        <div onMouseDown={createResizeHandler('br')} className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full cursor-se-resize z-50"></div>
                                                    </>
                                                );
                                            })()}

                                            <div className="absolute -top-8 left-0 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded shadow">
                                                Drag corners to resize
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Editor Toolbar Overlay */}
                            {editingPageId && !cropRect && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
                                    <button
                                        onClick={() => {
                                            // Auto Crop Algorithm (Static)
                                            const img = editorImgRef.current;
                                            if (!img) return;

                                            const canvas = document.createElement('canvas');
                                            const w = img.naturalWidth;
                                            const h = img.naturalHeight;

                                            // Downsample for speed
                                            const scale = Math.min(1, 512 / w);
                                            canvas.width = w * scale;
                                            canvas.height = h * scale;
                                            const ctx = canvas.getContext('2d');
                                            if (!ctx) return;

                                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

                                            const bounds = detectDocumentBounds(canvas.width, canvas.height, data);

                                            // Fallback if no bounds found
                                            let minX = 0, minY = 0, maxX = 0, maxY = 0;

                                            if (bounds) {
                                                minX = bounds.minX;
                                                minY = bounds.minY;
                                                maxX = bounds.maxX;
                                                maxY = bounds.maxY;
                                            } else {
                                                // Default to full
                                                minX = 0; minY = 0; maxX = canvas.width; maxY = canvas.height;
                                            }

                                            // Add padding
                                            const pad = 10 * scale;
                                            minX = Math.max(0, minX - pad);
                                            minY = Math.max(0, minY - pad);
                                            maxX = Math.min(canvas.width, maxX + pad);
                                            maxY = Math.min(canvas.height, maxY + pad);

                                            if (maxX > minX && maxY > minY) {
                                                // Map back to Display Coordinates
                                                const displayRect = img.getBoundingClientRect();

                                                // Scale from small canvas -> natural
                                                const detectedW = (maxX - minX) / scale;
                                                const detectedH = (maxY - minY) / scale;
                                                const detectedX = minX / scale;
                                                const detectedY = minY / scale;

                                                // Map natural -> display (Assuming fit logic in view)
                                                // NOTE: This depends on how image is displayed (object-contain)
                                                // Re-use logic: scaleX = Natural / Rendered

                                                const scaleRender = img.naturalWidth / displayRect.width;

                                                // Actually we set cropRect in SCREEN COORDINATES relative to container?
                                                // No, logic is relative to Container.
                                                // Wait, cropRect is relative to container (absolute position).
                                                // Image is centered in container.

                                                const container = img.parentElement;
                                                if (container) {
                                                    const contRect = container.getBoundingClientRect();
                                                    const imgLeft = (contRect.width - displayRect.width) / 2;
                                                    const imgTop = (contRect.height - displayRect.height) / 2;

                                                    setCropRect({
                                                        x: imgLeft + (detectedX / scaleRender),
                                                        y: imgTop + (detectedY / scaleRender),
                                                        w: detectedW / scaleRender,
                                                        h: detectedH / scaleRender
                                                    });
                                                }
                                            }
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full shadow-lg font-bold text-xs flex items-center gap-2"
                                    >
                                        <Sparkles size={14} /> Auto Crop
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="p-6 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-between gap-8 z-20">

                    {/* View Specific Controls */}
                    {view === 'camera' ? (
                        <>
                            {/* Adjustments */}
                            <div className="flex-1 flex gap-6 items-center">
                                <div className="flex-1">
                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1 uppercase font-bold tracking-wider">
                                        <span>Brightness</span>
                                        <span>{brightness}%</span>
                                    </div>
                                    <input
                                        type="range" min="50" max="150" value={brightness}
                                        onChange={(e) => setBrightness(parseInt(e.target.value))}
                                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1 uppercase font-bold tracking-wider">
                                        <span>Contrast</span>
                                        <span>{contrast}%</span>
                                    </div>
                                    <input
                                        type="range" min="50" max="150" value={contrast}
                                        onChange={(e) => setContrast(parseInt(e.target.value))}
                                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1 uppercase font-bold tracking-wider">
                                        <span>Straighten</span>
                                        <span>{rotation}°</span>
                                    </div>
                                    <input
                                        type="range" min="-45" max="45" value={rotation}
                                        onChange={(e) => setRotation(parseInt(e.target.value))}
                                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                </div>
                                {filterMode === 'bw' && (
                                    <div className="flex-1">
                                        <div className="flex justify-between text-[10px] text-slate-400 mb-1 uppercase font-bold tracking-wider">
                                            <span>Threshold</span>
                                            <span>{threshold}</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="255" value={threshold}
                                            onChange={(e) => setThreshold(parseInt(e.target.value))}
                                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-white"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* CAPTURE BUTTON */}
                            <div className="flex-none">
                                <button
                                    onClick={capture}
                                    disabled={isProcessing}
                                    className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all shadow-2xl shadow-indigo-500/50 group ${isProcessing ? 'bg-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95'}`}
                                >
                                    {isProcessing ? (
                                        <div className="w-10 h-10 rounded-full border-4 border-white border-t-transparent animate-spin"></div>
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-white group-active:scale-90 transition-transform"></div>
                                    )}
                                </button>
                            </div>

                            <div className="flex-1 flex justify-end">
                                <button
                                    onClick={generatePDF}
                                    disabled={pages.length === 0}
                                    className="bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all"
                                >
                                    <Check size={20} /> Convert to PDF
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-white" title="Rotate 90°">
                                    <RotateCw size={20} />
                                </button>
                                <button
                                    onClick={() => {
                                        // Initialize centered crop rect
                                        if (!cropRect) {
                                            setCropRect({ x: 50, y: 50, w: 200, h: 200 }); // Placeholder relative logic needed really
                                        } else {
                                            setCropRect(null); // Toggle off
                                        }
                                    }}
                                    className={`p-3 rounded-lg text-white transition ${cropRect ? 'bg-indigo-600' : 'bg-slate-800 hover:bg-slate-700'}`}
                                    title="Toggle Crop Box"
                                >
                                    <Crop size={20} />
                                </button>
                                {/* Re-use filter sliders here for editing */}
                                <div className="flex gap-4 w-64">
                                    <input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} className="w-full h-1 accent-indigo-500" />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => { setView('camera'); setEditingPageId(null); }} className="px-6 py-2 rounded-lg text-slate-400 hover:text-white font-bold">
                                    Cancel
                                </button>
                                <button onClick={handleSaveEdit} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2 rounded-lg font-bold shadow-lg">
                                    <Save size={18} className="inline mr-2" /> Save Changes
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
