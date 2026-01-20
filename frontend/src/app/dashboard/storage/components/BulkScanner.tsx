

import React, { useState, useEffect } from 'react';
import { ScanLine, Loader2, Trash2, Camera, StopCircle } from 'lucide-react';
import { Html5Qrcode } from "html5-qrcode";
import { API_URL } from '../../../../config/api';

interface BulkScannerProps {
    boxes: any[];
    refreshData: () => void;
}

const BulkScanner: React.FC<BulkScannerProps> = ({ boxes, refreshData }) => {
    const [bulkBoxId, setBulkBoxId] = useState<number | null>(null);
    const [bulkScannedItems, setBulkScannedItems] = useState<string[]>([]);
    const [bulkInput, setBulkInput] = useState('');
    const [isBulkSaving, setIsBulkSaving] = useState(false);

    // Auto-select if only one box is open
    useEffect(() => {
        const openBoxes = boxes.filter(b => b.status === "OPEN");
        if (openBoxes.length === 1) {
            setBulkBoxId(openBoxes[0].box_id);
        } else if (openBoxes.length === 0) {
            setBulkBoxId(null);
        }
    }, [boxes]);

    // Audio Feedback
    const playBeep = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = "sine";
        oscillator.frequency.value = 1000;
        gainNode.gain.value = 0.1;

        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
            audioContext.close();
        }, 150);
    };

    // Visual Feedback State
    const [scanMessage, setScanMessage] = useState<{ text: string, type: 'success' | 'warning' } | null>(null);

    // Camera State
    const [useCamera, setUseCamera] = useState(false);
    const [scannerInstance, setScannerInstance] = useState<any>(null);
    const scannedSetRef = React.useRef<Set<string>>(new Set());
    const lastScannedTimeRef = React.useRef<number>(0);

    // Sync Ref with State when state changes (for manual inputs or deletions)
    useEffect(() => {
        scannedSetRef.current = new Set(bulkScannedItems);
    }, [bulkScannedItems]);

    // Camera Effect
    useEffect(() => {
        if (useCamera) {
            const scanner = new Html5Qrcode("bulk-reader");
            setScannerInstance(scanner);

            scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => {
                    const now = Date.now();
                    // Throttle checks slightly to prevent message flickering
                    if (now - lastScannedTimeRef.current < 1000 && scannedSetRef.current.has(decodedText)) return;

                    if (!scannedSetRef.current.has(decodedText)) {
                        handleBulkCameraScan(decodedText);
                        setScanMessage({ text: `ADDED: ${decodedText}`, type: 'success' });
                        lastScannedTimeRef.current = now;
                    } else {
                        setScanMessage({ text: `ALREADY ADDED: ${decodedText}`, type: 'warning' });
                        lastScannedTimeRef.current = now;
                    }

                    // Clear message after 1.5s
                    setTimeout(() => setScanMessage(null), 1500);
                },
                (errorMessage) => { /* ignore */ }
            ).catch(err => {
                console.error("Camera start error", err);
                alert("Could not start camera.");
                setUseCamera(false);
            });

        }
        return () => {
            if (scannerInstance) {
                try {
                    if (scannerInstance.isScanning) {
                        scannerInstance.stop().then(() => scannerInstance.clear()).catch(console.error);
                    }
                } catch (e) { }
            }
        };
    }, [useCamera]);

    const stopCamera = () => {
        if (scannerInstance) {
            scannerInstance.stop().then(() => {
                scannerInstance.clear();
                setScannerInstance(null);
            }).catch(console.error);
        }
        setUseCamera(false);
    };

    const handleBulkCameraScan = (text: string) => {
        setBulkScannedItems(prev => {
            if (prev.includes(text)) return prev;
            playBeep(); // Trigger sound for new item
            return [text, ...prev];
        });
    };

    const handleBulkInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && bulkInput.trim()) {
            if (!bulkScannedItems.includes(bulkInput.trim())) {
                setBulkScannedItems(prev => [bulkInput.trim(), ...prev]);
                playBeep();
            }
            setBulkInput('');
        }
    };

    const handleBulkSave = async () => {
        if (!bulkBoxId || bulkScannedItems.length === 0) return;
        setIsBulkSaving(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${API_URL}/storage/files/bulk-assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    identifiers: bulkScannedItems,
                    box_id: bulkBoxId
                })
            });

            if (res.ok) {
                const data = await res.json();
                alert(data.message);
                if (data.errors && data.errors.length > 0) {
                    alert(`Some errors occurred:\n${data.errors.join('\n')}`);
                }
                setBulkScannedItems([]);
                setBulkBoxId(null);
                refreshData();
            } else {
                const err = await res.json();
                alert(err.detail || "Bulk assign failed");
            }
        } catch (e) {
            console.error(e);
            alert("Connection Error");
        } finally {
            setIsBulkSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 animate-in fade-in duration-500">
            <div className="text-center mb-8">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800">Bulk Assignment</h2>
                <p className="text-sm sm:text-base text-slate-400 font-medium">Rapidly scan multiple files into a single box.</p>
            </div>

            <div className="max-w-3xl mx-auto space-y-8">
                {/* Step 1: Select Box */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-3">1. Target Box (Active)</label>
                    <select
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={bulkBoxId || ''}
                        onChange={e => setBulkBoxId(Number(e.target.value))}
                    >
                        <option value="">-- Choose an Open Box --</option>
                        {boxes.filter(b => b.status === "OPEN").map(box => (
                            <option key={box.box_id} value={box.box_id}>
                                {box.label} ({box.location_code}) - {box.patient_count} Files
                            </option>
                        ))}
                    </select>
                    {boxes.filter(b => b.status === "OPEN").length === 0 && (
                        <p className="text-xs text-red-500 mt-2 font-bold flex items-center gap-1">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            System Locked: No open boxes. Open a box in Rack Manager to enable scanning.
                        </p>
                    )}
                </div>

                {/* Step 2: Scan Files */}
                <div className="p-6 rounded-3xl border-2 border-indigo-100 bg-indigo-50/30">
                    <label className="text-xs font-bold text-indigo-500 uppercase block mb-3">2. Scan Files</label>

                    {/* Camera Control */}
                    <div className="flex justify-center mb-4">
                        {!useCamera ? (
                            <button onClick={() => setUseCamera(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-200 font-bold text-indigo-600 rounded-xl hover:bg-indigo-50 transition shadow-sm">
                                <Camera size={18} /> Use Camera
                            </button>
                        ) : (
                            <button onClick={stopCamera} className="flex items-center gap-2 px-4 py-2 bg-red-100 font-bold text-red-600 rounded-xl hover:bg-red-200 transition shadow-sm">
                                <StopCircle size={18} /> Stop Camera
                            </button>
                        )}
                    </div>

                    {useCamera && (
                        <div className="max-w-sm mx-auto bg-black rounded-xl overflow-hidden mb-6 border-4 border-white shadow-lg relative">
                            <div id="bulk-reader" className="w-full"></div>
                            {scanMessage && (
                                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-4 rounded-xl shadow-2xl z-20 animate-in zoom-in duration-200 border-2 ${scanMessage.type === 'success'
                                    ? 'bg-emerald-500 text-white border-white'
                                    : 'bg-amber-500 text-white border-white'
                                    }`}>
                                    <div className="text-center">
                                        <p className="text-2xl font-black uppercase tracking-wider">{scanMessage.type === 'success' ? 'ADDED' : 'DUPLICATE'}</p>
                                        <p className="text-xs font-mono font-bold opacity-90 mt-1">{scanMessage.text.split(': ')[1]}</p>
                                    </div>
                                </div>
                            )}
                            <p className="text-center text-white text-xs py-1 font-bold absolute bottom-0 w-full bg-black/50 backdrop-blur-sm">Point at QR Code to Add</p>
                        </div>
                    )}

                    <div className="flex gap-4 mb-4">
                        <input
                            autoFocus
                            type="text"
                            className="flex-1 bg-white border-2 border-indigo-200 rounded-xl px-4 py-3 font-mono font-bold text-lg focus:ring-4 focus:ring-indigo-100 outline-none"
                            placeholder="Enter Barcode / MRD ID / UHID..."
                            value={bulkInput}
                            onChange={e => setBulkInput(e.target.value)}
                            onKeyDown={handleBulkInput}
                            disabled={!bulkBoxId}
                        />
                        <button
                            onClick={() => { if (bulkInput) handleBulkInput({ key: 'Enter' } as any) }}
                            disabled={!bulkInput || !bulkBoxId}
                            className="bg-indigo-600 text-white px-6 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            Add
                        </button>
                    </div>

                    {/* Scanned Items List */}
                    <div className="bg-white rounded-xl border border-slate-200 min-h-[200px] max-h-[300px] overflow-y-auto p-2">
                        {bulkScannedItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                <ScanLine size={32} className="mb-2 opacity-50" />
                                <p className="text-sm font-bold">List is empty</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {bulkScannedItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 group animate-in slide-in-from-left-2 duration-300">
                                        <span className="font-mono font-bold text-slate-700">#{bulkScannedItems.length - idx} - {item}</span>
                                        <button
                                            onClick={() => setBulkScannedItems(prev => prev.filter((_, i) => i !== idx))}
                                            className="text-red-400 hover:text-red-600 font-bold p-1 rounded hover:bg-red-50 transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="mt-2 text-right text-xs font-bold text-slate-400">Total Scanned: {bulkScannedItems.length}</div>
                </div>

                <button
                    onClick={handleBulkSave}
                    disabled={isBulkSaving || !bulkBoxId || bulkScannedItems.length === 0}
                    className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-lg hover:bg-emerald-600 transition shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:shadow-none"
                >
                    {isBulkSaving ? <Loader2 className="animate-spin mx-auto" /> : `Save ${bulkScannedItems.length} Files to Box`}
                </button>
            </div>
        </div>
    );
};

export default BulkScanner;

