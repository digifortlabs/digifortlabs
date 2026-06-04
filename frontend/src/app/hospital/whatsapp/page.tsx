"use client";

import { useState, useEffect } from 'react';
import { Smartphone, QrCode, Trash2, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/config/api';
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
    const [hospital, setHospital] = useState<Hospital | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<InstanceStatus | null>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loadingAction, setLoadingAction] = useState(false);

    useEffect(() => {
        const hid = localStorage.getItem('hospital_id');
        if (hid) {
            fetchHospital(parseInt(hid));
        } else {
            toast.error("No hospital ID found in session.");
            setLoading(false);
        }
    }, []);

    const fetchHospital = async (hospitalId: number) => {
        setLoading(true);
        try {
            const res = await apiFetch(`/hospitals/${hospitalId}`);
            setHospital(res);
            await fetchStatus(hospitalId);
        } catch (error) {
            console.error("Failed to load hospital", error);
            toast.error("Failed to load hospital data");
        } finally {
            setLoading(false);
        }
    };

    const fetchStatus = async (hospitalId: number) => {
        try {
            const res = await apiFetch(`/whatsapp/instances/${hospitalId}/status`);
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            } else {
                setStatus(null);
            }
        } catch (error) {
            console.error(`Failed to load status for hospital ${hospitalId}`, error);
        }
    };

    const handleConnect = async () => {
        if (!hospital) return;
        setLoadingAction(true);
        try {
            // Create instance
            await apiFetch('/whatsapp/instances/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hospital.hospital_id)
            });

            // Fetch QR
            const res = await apiFetch(`/whatsapp/instances/${hospital.hospital_id}/qr`);
            
            if (res.ok) {
                const data = await res.json();
                if (data.base64) {
                    setQrCode(data.base64);
                } else {
                    toast.error("Instance is already connected or loading.");
                    fetchStatus(hospital.hospital_id);
                }
            }
        } catch (error) {
            console.error("Failed to connect", error);
            toast.error("Failed to fetch QR code");
        } finally {
            setLoadingAction(false);
        }
    };

    const handleDelete = async () => {
        if (!hospital) return;
        if (!confirm("Are you sure you want to disconnect your WhatsApp number?")) return;
        setLoadingAction(true);
        try {
            await apiFetch(`/whatsapp/instances/${hospital.hospital_id}`, { method: 'DELETE' });
            toast.success("Disconnected successfully");
            setQrCode(null);
            setStatus(null);
        } catch (error) {
            toast.error("Failed to disconnect");
        } finally {
            setLoadingAction(false);
        }
    };

    const handleRefresh = () => {
        if (hospital) {
            fetchStatus(hospital.hospital_id);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Smartphone className="w-6 h-6 text-green-600" />
                        WhatsApp Connection
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        Manage your hospital's dedicated WhatsApp number.
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold shadow-sm transition-all"
                >
                    <RefreshCcw className="w-4 h-4" />
                    Refresh Status
                </button>
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-slate-400 mt-3 font-semibold">Loading data...</p>
                </div>
            ) : hospital ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">{hospital.legal_name}</h3>
                            <p className="text-xs text-slate-500">ID: {hospital.hospital_id}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            status?.state === 'open' ? 'bg-green-100 text-green-700' : 
                            status?.state === 'connecting' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-slate-100 text-slate-600'
                        }`}>
                            {status?.state || 'Not Connected'}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-xl border border-slate-100 mb-6">
                        {status?.state === 'open' ? (
                            <div className="text-center space-y-3">
                                <div className="w-16 h-16 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-base font-black text-slate-700">WhatsApp is Connected</p>
                                    <p className="text-xs text-slate-500 mt-1">Your automated messages are active.</p>
                                </div>
                            </div>
                        ) : qrCode ? (
                            <div className="text-center space-y-5">
                                <div className="bg-white p-3 border border-slate-200 rounded-2xl inline-block shadow-sm">
                                    <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                                </div>
                                <div className="max-w-[250px] mx-auto space-y-2">
                                    <p className="text-sm font-bold text-slate-700">Scan to Connect</p>
                                    <p className="text-xs text-slate-500 font-medium">
                                        1. Open WhatsApp on your phone<br/>
                                        2. Tap Menu <span className="font-bold">⋮</span> or Settings ⚙️<br/>
                                        3. Tap <span className="font-bold">Linked Devices</span><br/>
                                        4. Tap <span className="font-bold">Link a Device</span><br/>
                                        5. Point your phone to this screen to capture the code
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-3">
                                <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400 shadow-sm">
                                    <Smartphone className="w-8 h-8" />
                                </div>
                                <p className="text-sm font-bold text-slate-500">No WhatsApp Number Linked</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 mt-auto">
                        {status?.state !== 'open' && !qrCode && (
                            <button 
                                onClick={handleConnect}
                                disabled={loadingAction}
                                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl text-sm font-black shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                                {loadingAction ? 'Loading...' : (
                                    <><QrCode className="w-4 h-4" /> Generate QR Code</>
                                )}
                            </button>
                        )}
                        {qrCode && status?.state !== 'open' && (
                            <button 
                                onClick={handleRefresh}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl text-sm font-black shadow-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" /> I've Scanned It
                            </button>
                        )}
                        {(status?.state === 'open' || qrCode) && (
                            <button 
                                onClick={handleDelete}
                                disabled={loadingAction}
                                className="bg-red-50 text-red-600 hover:bg-red-100 px-6 py-3 rounded-xl text-sm font-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50 border border-red-100"
                                title="Disconnect and Delete Instance"
                            >
                                <Trash2 className="w-4 h-4" /> {status?.state === 'open' ? 'Disconnect WhatsApp' : 'Cancel'}
                            </button>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
