'use client';

import React, { useEffect, useState, useRef } from 'react';
import { X, Shield, Lock, AlertCircle, Loader2, Download, ZoomIn, ZoomOut, Maximize, RotateCw } from 'lucide-react';
import { API_URL } from '@/config/api';
import { Document, Page, pdfjs } from 'react-pdf';

// Core PDF worker setup for Next.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SecurePDFViewerProps {
    fileId: number;
    filename: string;
    onClose: () => void;
}

const SecurePDFViewer: React.FC<SecurePDFViewerProps> = ({ fileId, filename, onClose }) => {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [numPages, setNumPages] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string>('Confidential');
    const [scale, setScale] = useState(1.0); // 1.0 = 100%
    const [rotation, setRotation] = useState(0);
    const [remainingRequests, setRemainingRequests] = useState<number | 'Unlimited' | null>(null);
    const [pdfWidth, setPdfWidth] = useState<number | null>(null);
    const [isRequesting, setIsRequesting] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentBoxSize) {
                    const width = entry.contentBoxSize[0].inlineSize;
                    // Calculate "Fit Width" with padding (64px) and max-width (1000px) cap for readability
                    // Subtracting padding (approx 3rem/48px) to prevent scrollbar flicker
                    setPdfWidth(Math.min(width - 50, 1000));
                }
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        const fetchFile = async () => {
            const token = localStorage.getItem('token');
            const email = localStorage.getItem('userEmail') || 'Confidential';
            setUserEmail(email);

            if (!token) {
                setError("Authentication required");
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_URL}/patients/files/${fileId}/serve?token=${token}`, {
                    method: 'GET'
                });

                if (res.ok) {
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    setPdfUrl(url);
                } else {
                    const errData = await res.json().catch(() => ({ detail: "Failed to load document" }));
                    setError(errData.detail || "Access Denied");
                }
            } catch (e) {
                console.error(e);
                setError("Network error while loading secure viewer");
            } finally {
                // Don't set loading false here, wait for PDF Document onLoadSuccess
            }
        };

        fetchFile();

        return () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
    }, [fileId]);

    // Prevent Print & Shortcuts
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && (e.key === 'p' || e.key === 's' || e.key === 'u')) {
                e.preventDefault();
                alert("Security Protocol: Saving and Printing is disabled.");
            }
        };

        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setLoading(false);
    };

    const handleRequestDownload = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setIsRequesting(true);
        try {
            const res = await fetch(`${API_URL}/patients/files/${fileId}/request-download`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                alert(data.message);
                if (data.remaining_requests !== undefined) {
                    setRemainingRequests(data.remaining_requests);
                }
            } else {
                const err = await res.json();
                alert(err.detail || "Request failed");
            }
        } catch (e) {
            console.error(e);
            alert("Error sending request");
        } finally {
            setIsRequesting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[999] bg-slate-950 flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 md:px-6 shadow-xl z-50">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <Shield size={18} className="text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            {filename}
                            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30 flex items-center gap-1">
                                <Lock size={10} /> SECURE
                            </span>
                        </h2>
                        <p className="text-[10px] text-slate-500">User: <span className="text-slate-300">{userEmail}</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-800 rounded-lg p-1 mr-2 border border-slate-700">
                        <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
                            <ZoomOut size={16} />
                        </button>
                        <span className="text-[10px] font-bold text-slate-300 w-10 text-center">{Math.round(scale * 100)}%</span>
                        <button onClick={() => setScale(s => Math.min(2.5, s + 0.1))} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
                            <ZoomIn size={16} />
                        </button>
                        <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white ml-1 border-l border-slate-700 pl-2">
                            <RotateCw size={16} />
                        </button>
                    </div>

                    <button
                        onClick={handleRequestDownload}
                        disabled={isRequesting || remainingRequests === 0}
                        className={`px-3 py-1.5 text-white text-xs font-bold rounded-lg border transition-colors flex items-center gap-2 ${remainingRequests === 0 || isRequesting ? 'bg-slate-700 border-slate-600 opacity-50 cursor-not-allowed' : 'bg-rose-600 border-rose-500 hover:bg-rose-700'}`}
                    >
                        {isRequesting ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Requesting...</span>
                            </>
                        ) : (
                            <>
                                <Download size={14} />
                                <span>{remainingRequests === 0 ? 'Limit Reached' : 'Request'}</span>
                            </>
                        )}
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Main Viewer Area */}
            <div className="flex-1 relative bg-slate-900 overflow-auto flex justify-center p-8" ref={containerRef}>
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <AlertCircle className="text-red-500 mb-4" size={48} />
                        <p className="text-white font-bold">{error}</p>
                    </div>
                ) : !pdfUrl ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 className="animate-spin text-indigo-500" size={48} />
                        <p className="text-slate-400 mt-4 animate-pulse">Initializing Secure Environment...</p>
                    </div>
                ) : (
                    <div className="relative shadow-2xl" onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}>

                        {/* React PDF Document */}
                        <Document
                            file={pdfUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={
                                <div className="flex flex-col items-center mt-20">
                                    <Loader2 className="animate-spin text-indigo-500" size={48} />
                                    <p className="text-slate-400 mt-4">Decrypting Document...</p>
                                </div>
                            }
                            error={
                                <div className="text-red-400 text-sm bg-red-900/20 p-4 rounded-lg border border-red-900/50">
                                    Failed to render PDF document.
                                </div>
                            }
                            className="flex flex-col gap-8"
                        >
                            {Array.from(new Array(numPages), (el, index) => (
                                <div key={`page_${index + 1}`} className="relative bg-white shadow-lg">
                                    <Page
                                        pageNumber={index + 1}
                                        width={pdfWidth ? pdfWidth * scale : undefined}
                                        rotate={rotation}
                                        renderTextLayer={false} // Disable text selection for security
                                        renderAnnotationLayer={false} // Clean view
                                        className="shadow-md"
                                        loading={<div className="h-[800px] w-[600px] bg-white animate-pulse" />}
                                    />

                                    {/* Per-Page Watermark for perfect alignment */}
                                    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden select-none mix-blend-multiply opacity-[0.15]">
                                        <div className="w-full h-full grid grid-cols-3 grid-rows-4 gap-4 p-8 rotate-[-15deg] scale-105">
                                            {Array.from({ length: 12 }).map((_, i) => (
                                                <div key={i} className="flex flex-col items-center justify-center">
                                                    <p className="text-2xl font-black text-slate-900 uppercase">DIGIFORTLABS</p>
                                                    <p className="text-xs font-bold text-slate-700 tracking-[0.5em]">CONFIDENTIAL</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Document>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .react-pdf__Page__canvas {
                    margin: 0 auto;
                    user-select: none;
                }
                @media print { body { display: none !important; } }
            `}} />
        </div>
    );
};

export default SecurePDFViewer;
