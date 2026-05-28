"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/config/api';
import { Box, Layers, Archive, Printer, Plus, Shield, Search } from 'lucide-react';

export default function MRDDashboard() {
    const router = useRouter();
    const [hospitalId, setHospitalId] = useState<number | null>(null);
    const [serviceType, setServiceType] = useState('PORTAL_ONLY');
    const [racks, setRacks] = useState<any[]>([]);
    const [boxes, setBoxes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('boxes');

    useEffect(() => {
        const storedRole = localStorage.getItem('userRole') || '';
        const storedHospitalId = localStorage.getItem('hospital_id') ? parseInt(localStorage.getItem('hospital_id') as string) : null;
        
        if (!storedRole) {
            router.push('/login');
            return;
        }

        setHospitalId(storedHospitalId);

        if (storedHospitalId) {
            fetchHospitalData(storedHospitalId);
            fetchRacks();
            fetchBoxes();
        }
    }, []);

    const fetchHospitalData = async (id: number) => {
        try {
            const data = await apiFetch(`hospitals/${id}`);
            if (data && data.mrd_service_type) {
                setServiceType(data.mrd_service_type);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchRacks = async () => {
        try {
            const data = await apiFetch(`storage/racks`);
            setRacks(data || []);
        } catch (e) {
            console.error("Failed to fetch racks", e);
        }
    };

    const fetchBoxes = async () => {
        try {
            const data = await apiFetch(`storage/boxes`);
            setBoxes(data || []);
        } catch (e) {
            console.error("Failed to fetch boxes", e);
        } finally {
            setLoading(false);
        }
    };

    const printLabel = (boxLabel: string) => {
        // Quick label printing logic
        const w = window.open('', '_blank');
        if (w) {
            w.document.write(`
                <html>
                    <head>
                        <title>Print Label - ${boxLabel}</title>
                        <style>
                            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                            .label { border: 2px solid black; padding: 20px; width: 300px; text-align: center; }
                            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                            .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 40px; }
                        </style>
                        <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
                    </head>
                    <body onload="window.print(); window.close();">
                        <div class="label">
                            <div class="title">${boxLabel}</div>
                            <div class="barcode">*${boxLabel}*</div>
                            <p style="font-size: 12px; color: #555;">DigifortLabs MRD Storage</p>
                        </div>
                    </body>
                </html>
            `);
            w.document.close();
        }
    };

    return (
        <div className="px-4 sm:px-6 pb-20 pt-4 w-full mx-auto min-h-screen">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Archive className="text-indigo-600 w-6 h-6" /> 
                        MRD Dashboard
                    </h1>
                    <p className="text-slate-500 font-semibold text-xs mt-1">Medical Record Department Storage</p>
                </div>
                
                <div className="bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-900">
                        Tier: {serviceType.replace('_', ' ')}
                    </span>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl border border-slate-200/40 w-fit">
                <button
                    onClick={() => setActiveTab('boxes')}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-150 ${
                        activeTab === 'boxes' 
                            ? 'bg-white text-slate-950 shadow-xs border border-slate-200/20' 
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Box size={13} /> Boxes & Labels
                </button>
                <button
                    onClick={() => setActiveTab('racks')}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-150 ${
                        activeTab === 'racks' 
                            ? 'bg-white text-slate-950 shadow-xs border border-slate-200/20' 
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Layers size={13} /> Stacks & Racks
                </button>
            </div>

            {loading ? (
                <div className="text-slate-500">Loading MRD data...</div>
            ) : (
                <div className="max-w-6xl">
                    {/* Racks View */}
                    {activeTab === 'racks' && (
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs animate-in fade-in duration-500">
                            <h2 className="text-lg font-black text-slate-900 tracking-tight mb-4">Physical Racks</h2>
                            
                            {serviceType === 'FULL_MANAGED' ? (
                                <div className="p-6 bg-slate-50 text-slate-600 rounded-lg text-center text-sm font-semibold">
                                    Your racks are fully managed by DigifortLabs staff offsite.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {racks.map(rack => (
                                        <div key={rack.rack_id} className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-bold text-slate-800">{rack.label}</h3>
                                                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-semibold">Aisle {rack.aisle}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-1">Capacity: {rack.capacity}</p>
                                            <p className="text-xs text-slate-500">Grid: {rack.total_rows}x{rack.total_columns}</p>
                                        </div>
                                    ))}
                                    <button className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-colors h-[100px]">
                                        <Plus size={24} className="mb-1" />
                                        <span className="text-xs font-bold uppercase">Add Rack</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Boxes View */}
                    {activeTab === 'boxes' && (
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs animate-in fade-in duration-500">
                            <h2 className="text-lg font-black text-slate-900 tracking-tight mb-4">Storage Boxes</h2>
                            
                            {serviceType === 'FULL_MANAGED' ? (
                                <div className="p-6 bg-slate-50 text-slate-600 rounded-lg text-center text-sm font-semibold mb-6">
                                    Boxes are managed offsite. You can request files from these boxes.
                                </div>
                            ) : null}

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                            <th className="p-3">Box Label</th>
                                            <th className="p-3">Category</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Location</th>
                                            <th className="p-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {boxes.map(box => (
                                            <tr key={box.box_id} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="p-3 font-semibold text-slate-800">{box.label}</td>
                                                <td className="p-3 text-sm text-slate-600">{box.category}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${box.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                                                        {box.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-sm text-slate-600">{box.location_code || 'Unassigned'}</td>
                                                <td className="p-3 flex justify-end gap-2">
                                                    {(serviceType !== 'FULL_MANAGED') && (
                                                        <button 
                                                            onClick={() => printLabel(box.label)}
                                                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                            title="Print Label"
                                                        >
                                                            <Printer size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {serviceType !== 'FULL_MANAGED' && (
                                            <tr>
                                                <td colSpan={5} className="p-3">
                                                    <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 uppercase">
                                                        <Plus size={14} /> Create New Box
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
