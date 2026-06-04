"use client";

import { useState, useEffect } from 'react';
import { Smartphone, QrCode, Trash2, RefreshCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import toast from 'react-hot-toast';

interface Hospital {
    hospital_id: number;
    legal_name: string;
}

interface InstanceStatus {
    instanceName: string;
    state: string;
}

export default function WhatsAppConnectionsPage() {
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);
    const [statuses, setStatuses] = useState<Record<number, InstanceStatus>>({});
    const [qrCodes, setQrCodes] = useState<Record<number, string>>({});
    const [loadingAction, setLoadingAction] = useState<number | null>(null);

    useEffect(() => {
        fetchHospitals();
    }, []);

    const fetchHospitals = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/hospitals/');
            if (res.ok) {
                const data = await res.json();
                setHospitals(data);
                data.forEach((h: Hospital) => fetchStatus(h.hospital_id));
            }
        } catch (error) {
            console.error("Failed to load hospitals", error);
            toast.error("Failed to load hospitals");
        } finally {
            setLoading(false);
        }
    };

    const fetchStatus = async (hospitalId: number) => {
        try {
            const res = await apiFetch(`/whatsapp/instances/${hospitalId}/status`);
            if (res.ok) {
                const data = await res.json();
                setStatuses(prev => ({ ...prev, [hospitalId]: data }));
            }
        } catch (error) {
            console.error(`Failed to load status for hospital ${hospitalId}`, error);
        }
    };

    const handleConnect = async (hospitalId: number) => {
        setLoadingAction(hospitalId);
        try {
            // First try to create the instance (it's safe if it already exists)
            await apiFetch('/whatsapp/instances/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hospitalId)
            });

            // Now fetch the QR code
            const res = await apiFetch(`/whatsapp/instances/${hospitalId}/qr`);
            if (res.ok) {
                const data = await res.json();
                if (data.base64) {
                    setQrCodes(prev => ({ ...prev, [hospitalId]: data.base64 }));
                } else {
                    toast.error("Instance is already connected or loading.");
                    fetchStatus(hospitalId);
                }
            }
        } catch (error) {
            console.error("Failed to connect", error);
            toast.error("Failed to fetch QR code");
        } finally {
            setLoadingAction(null);
        }
    };

    const handleDelete = async (hospitalId: number) => {
        if (!confirm("Are you sure you want to disconnect this WhatsApp number?")) return;
        setLoadingAction(hospitalId);
        try {
            await apiFetch(`/whatsapp/instances/${hospitalId}`, { method: 'DELETE' });
            toast.success("Disconnected successfully");
            setQrCodes(prev => { const newQrs = {...prev}; delete newQrs[hospitalId]; return newQrs; });
            fetchStatus(hospitalId);
        } catch (error) {
            toast.error("Failed to disconnect");
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Smartphone className="w-6 h-6 text-green-600" />
                        WhatsApp Connections
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        Manage dedicated WhatsApp numbers for each hospital on the platform.
                    </p>
                </div>
                <button
                    onClick={fetchHospitals}
                    className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold shadow-sm transition-all"
                >
                    <RefreshCcw className="w-4 h-4" />
                    Refresh Statuses
                </button>
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-slate-400 mt-3 font-semibold">Loading hospitals...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {hospitals.map((hospital) => {
                        const status = statuses[hospital.hospital_id];
                        const state = status?.state || 'checking...';
                        const isConnected = state === 'open';
                        const isConnecting = state === 'connecting';
                        const qrCodeBase64 = qrCodes[hospital.hospital_id];

                        return (
                            <div key={hospital.hospital_id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900">{hospital.legal_name}</h3>
                                        <p className="text-xs text-slate-500">ID: {hospital.hospital_id}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                        isConnected ? 'bg-green-100 text-green-700' : 
                                        isConnecting ? 'bg-yellow-100 text-yellow-700' : 
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                        {state}
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col items-center justify-center py-6">
                                    {isConnected ? (
                                        <div className="text-center space-y-3">
                                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600">
                                                <CheckCircle2 className="w-8 h-8" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-700">WhatsApp is Connected</p>
                                        </div>
                                    ) : qrCodeBase64 ? (
                                        <div className="text-center space-y-4">
                                            <div className="bg-white p-2 border border-slate-200 rounded-2xl inline-block shadow-sm">
                                                <img src={qrCodeBase64} alt="QR Code" className="w-48 h-48" />
                                            </div>
                                            <p className="text-xs text-slate-500 font-semibold max-w-[200px] mx-auto">
                                                Open WhatsApp on your phone &gt; Linked Devices &gt; Scan QR
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center space-y-3">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                                <Smartphone className="w-8 h-8" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-500">Not Connected</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
                                    {!isConnected && !qrCodeBase64 && (
                                        <button 
                                            onClick={() => handleConnect(hospital.hospital_id)}
                                            disabled={loadingAction === hospital.hospital_id}
                                            className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-xl text-xs font-black shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                        >
                                            {loadingAction === hospital.hospital_id ? 'Loading...' : (
                                                <><QrCode className="w-4 h-4" /> Generate QR</>
                                            )}
                                        </button>
                                    )}
                                    {qrCodeBase64 && !isConnected && (
                                        <button 
                                            onClick={() => fetchStatus(hospital.hospital_id)}
                                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-xs font-black shadow-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> I've Scanned It
                                        </button>
                                    )}
                                    {(isConnected || qrCodeBase64) && (
                                        <button 
                                            onClick={() => handleDelete(hospital.hospital_id)}
                                            disabled={loadingAction === hospital.hospital_id}
                                            className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2.5 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                            title="Disconnect and Delete Instance"
                                        >
                                            <Trash2 className="w-4 h-4" /> {isConnected ? 'Disconnect' : ''}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
