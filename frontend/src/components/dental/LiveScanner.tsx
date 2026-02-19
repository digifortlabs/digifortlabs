import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Check, Trash2, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LiveScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (files: File[]) => Promise<void>;
}

export default function LiveScanner({ isOpen, onClose, onSave }: LiveScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
    const [capturedImages, setCapturedImages] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // 1. Enumerate Devices
    useEffect(() => {
        if (isOpen) {
            getDevices();
        } else {
            stopStream();
        }
        return () => stopStream();
    }, [isOpen]);

    const getDevices = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true }); // Request permission first
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
            setDevices(videoDevices);
            if (videoDevices.length > 0) {
                setSelectedDeviceId(videoDevices[0].deviceId);
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please allow permissions.");
        }
    };

    // 2. Start Stream when device changes
    useEffect(() => {
        if (selectedDeviceId && isOpen) {
            startStream(selectedDeviceId);
        }
    }, [selectedDeviceId, isOpen]);

    const startStream = async (deviceId: string) => {
        stopStream();
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: { exact: deviceId },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
        } catch (err) {
            console.error("Error starting stream:", err);
        }
    };

    const stopStream = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    // 3. Capture Image
    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                setCapturedImages(prev => [...prev, dataUrl]);
            }
        }
    };

    const removeImage = (index: number) => {
        setCapturedImages(prev => prev.filter((_, i) => i !== index));
    };

    // 4. Save Logic
    const handleSave = async () => {
        if (capturedImages.length === 0) return;
        setIsSaving(true);

        // Convert DataURLs to Files
        const files: File[] = [];
        for (let i = 0; i < capturedImages.length; i++) {
            const dataUrl = capturedImages[i];
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            files.push(new File([blob], `scan_${Date.now()}_${i}.jpg`, { type: 'image/jpeg' }));
        }

        await onSave(files);
        setIsSaving(false);
        setCapturedImages([]);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-950 text-white border-slate-800">
                <DialogHeader className="p-4 bg-slate-900 border-b border-slate-800 flex flex-row items-center justify-between">
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-blue-400" />
                        Live Scanner
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                            <SelectTrigger className="w-[200px] bg-slate-800 border-slate-700 text-white h-8 text-xs">
                                <SelectValue placeholder="Select Camera" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                {devices.map(d => (
                                    <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 5)}...`}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Video Feed */}
                    <div className="flex-1 bg-black relative flex items-center justify-center">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="max-h-full max-w-full object-contain"
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Overlay Controls */}
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                            <Button
                                onClick={captureImage}
                                className="h-14 w-14 rounded-full bg-white hover:bg-slate-200 text-black border-4 border-slate-300/50 shadow-xl flex items-center justify-center transition-transform active:scale-95"
                            >
                                <Camera className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>

                    {/* Sidebar / Gallery */}
                    <div className="w-full md:w-64 bg-slate-900 border-l border-slate-800 flex flex-col">
                        <div className="p-4 border-b border-slate-800">
                            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Captured ({capturedImages.length})</h4>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {capturedImages.length === 0 ? (
                                <div className="text-center py-10 text-slate-600 text-xs">
                                    No images captured yet.
                                </div>
                            ) : (
                                capturedImages.map((img, idx) => (
                                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-700">
                                        <img src={img} alt={`Capture ${idx}`} className="w-full h-auto object-cover" />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 bg-red-600/80 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 text-white"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 bg-slate-900 border-t border-slate-800">
                            <Button
                                onClick={handleSave}
                                disabled={capturedImages.length === 0 || isSaving}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white gap-2"
                            >
                                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {isSaving ? 'Saving...' : 'Save All'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
