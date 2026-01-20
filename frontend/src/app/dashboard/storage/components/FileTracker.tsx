
import React, { useState, useEffect } from 'react';
import { Html5Qrcode } from "html5-qrcode";
import {
    Loader2,
    Camera,
    StopCircle,
    Scan,
    CheckCircle2,
    MapPin,
    ArrowLeftRight
} from 'lucide-react';
import { API_URL } from '../../../../config/api';

interface FileTrackerProps {
    refreshLogs: () => void;
}

const FileTracker: React.FC<FileTrackerProps> = ({ refreshLogs }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [scanInput, setScanInput] = useState('');
    const [useCamera, setUseCamera] = useState(false);
    const [scannerInstance, setScannerInstance] = useState<any>(null);

    // Camera Effect
    useEffect(() => {
        if (useCamera && !scanResult) {
            const scanner = new Html5Qrcode("reader");
            setScannerInstance(scanner);

            scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => {
                    handleRealScan(decodedText);
                    setUseCamera(false);
                    scanner.stop().then(() => scanner.clear()).catch(console.error);
                },
                (errorMessage) => { /* ignore */ }
            ).catch(err => {
                console.error("Camera start error", err);
                alert("Could not start camera. Please ensure permissions are granted.");
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

    const handleRealScan = async (overrideInput?: string) => {
        const inputToUse = overrideInput || scanInput;
        if (!inputToUse) return;
        setIsScanning(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${API_URL}/patients/?q=${encodeURIComponent(inputToUse)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const results = await res.json();
                if (results.length > 0) {
                    const patient = results[0];
                    setScanResult({
                        name: patient.full_name,
                        uhid: patient.uhid || patient.patient_u_id,
                        record_id: patient.record_id
                    });
                    setScanInput('');
                } else {
                    alert("No patient found.");
                    setScanResult(null);
                }
            } else {
                alert("Scan failed.");
            }
        } catch (e) {
            console.error(e);
            alert("Connection Error");
        } finally {
            setIsScanning(false);
        }
    };

    const processMovement = async (type: 'CHECK-IN' | 'CHECK-OUT') => {
        const token = localStorage.getItem('token');
        if (!token || !scanResult) return;

        const dest = type === 'CHECK-IN' ? 'MRD Warehouse' : 'Doctor OPD';

        try {
            const res = await fetch(`${API_URL}/storage/move`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: type,
                    uhid: scanResult.uhid,
                    name: scanResult.name,
                    dest: dest
                })
            });

            if (res.ok) {
                refreshLogs();
                setScanResult(null);
            }
        } catch (e) {
            console.error("Move error", e);
        }
    };

    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-4 sm:p-8 animate-in fade-in duration-500">
            <div className="text-center mb-8">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800">File Tracker</h2>
                <p className="text-sm sm:text-base text-slate-400 font-medium">Scan patient files for check-in/check-out</p>
            </div>

            {!scanResult ? (
                <div className="space-y-8">
                    <div className="flex justify-center mb-6">
                        {!useCamera ? (
                            <button onClick={() => setUseCamera(true)} className="flex items-center gap-2 px-6 py-3 bg-slate-100 font-bold text-slate-600 rounded-full hover:bg-slate-200 transition">
                                <Camera size={20} /> Use Camera
                            </button>
                        ) : (
                            <button onClick={stopCamera} className="flex items-center gap-2 px-6 py-3 bg-red-100 font-bold text-red-600 rounded-full hover:bg-red-200 transition">
                                <StopCircle size={20} /> Stop Scanning
                            </button>
                        )}
                    </div>

                    {useCamera ? (
                        <div className="max-w-md mx-auto bg-slate-100 rounded-2xl overflow-hidden border-4 border-slate-200">
                            <div id="reader" className="w-full"></div>
                        </div>
                    ) : (
                        <div className="max-w-md mx-auto relative">
                            <input
                                autoFocus
                                type="text"
                                className="w-full bg-slate-50 border-2 border-indigo-100 rounded-2xl px-6 py-6 font-mono text-2xl font-bold text-center text-slate-800 focus:ring-4 focus:ring-indigo-100 outline-none"
                                placeholder="Scan Barcode / MRD ID..."
                                value={scanInput}
                                onChange={e => setScanInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleRealScan()}
                                disabled={isScanning}
                            />
                            {isScanning && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 className="animate-spin text-indigo-600" /></div>}
                        </div>
                    )}

                    {!useCamera && (
                        <div className="flex justify-center">
                            <button
                                onClick={() => handleRealScan()}
                                disabled={isScanning || !scanInput}
                                className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-xl shadow-indigo-100 disabled:opacity-50"
                            >
                                <Scan size={20} /> {isScanning ? 'Searching...' : 'Process Scan'}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate-in zoom-in-95 duration-300">
                    <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 inline-flex items-center gap-4 mb-8">
                        <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg"><CheckCircle2 size={24} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Scan Successful</p>
                            <h3 className="font-black text-slate-800 text-lg">{scanResult.name}</h3>
                            <p className="text-xs font-bold text-slate-500">{scanResult.uhid}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <button onClick={() => processMovement('CHECK-IN')} className="p-6 rounded-[2rem] border-2 border-emerald-100 bg-emerald-50 hover:bg-emerald-100 transition flex flex-col items-center gap-2">
                            <MapPin className="text-emerald-600" size={32} />
                            <span className="font-black text-slate-800">Check-In</span>
                        </button>
                        <button onClick={() => processMovement('CHECK-OUT')} className="p-6 rounded-[2rem] border-2 border-blue-100 bg-blue-50 hover:bg-blue-100 transition flex flex-col items-center gap-2">
                            <ArrowLeftRight className="text-blue-600" size={32} />
                            <span className="font-black text-slate-800">Check-Out</span>
                        </button>
                    </div>
                    <button onClick={() => setScanResult(null)} className="text-slate-400 font-bold text-sm hover:text-slate-600 underline">Cancel</button>
                </div>
            )}
        </div>
    );
};

export default FileTracker;
