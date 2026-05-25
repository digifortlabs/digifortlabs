"use client";

import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { apiFetch } from '@/config/api';

interface HospitalSelectionPromptProps {
    requiredModule?: string;
    storageKey?: string;
    onSelect: (hospitalId: number) => void;
}

export default function HospitalSelectionPrompt({ requiredModule, storageKey = 'globalHospitalId', onSelect }: HospitalSelectionPromptProps) {
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHospitals = async () => {
            try {
                const data = await apiFetch('hospitals/');
                if (data && Array.isArray(data)) {
                    // Filter hospitals based on the required module if provided
                    const filtered = requiredModule
                        ? data.filter(h => h.enabled_modules && h.enabled_modules.includes(requiredModule))
                        : data;
                    setHospitals(filtered);
                }
            } catch (error) {
                console.error("Failed to fetch hospitals:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHospitals();
    }, [requiredModule]);

    const handleSelect = (hospitalId: number) => {
        if (storageKey) {
            localStorage.setItem(storageKey, hospitalId.toString());
        }
        window.dispatchEvent(new CustomEvent('hospitalChanged', { detail: { hospitalId, storageKey } }));
        onSelect(hospitalId);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm font-medium mt-4">Loading hospitals...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <Building2 className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Select a Hospital</h2>
            <p className="text-sm font-bold text-slate-500 mb-8 text-center max-w-md">
                {requiredModule 
                    ? `Choose a hospital or clinic to view their ${requiredModule.charAt(0).toUpperCase() + requiredModule.slice(1)} records.`
                    : 'Choose a hospital or clinic to view their records.'}
                <br />
                <span className="text-xs text-slate-400 font-normal">
                    Only hospitals with the required module enabled are shown.
                </span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl px-4">
                {hospitals.length > 0 ? (
                    hospitals.map((h) => (
                        <button
                            key={h.hospital_id}
                            onClick={() => handleSelect(h.hospital_id)}
                            className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md hover:border-indigo-500/30 hover:bg-indigo-50/30 transition-all text-left flex flex-col items-start group"
                        >
                            <span className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                                {h.legal_name}
                            </span>
                            <span className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                {h.city || 'Unknown Location'} • {h.specialty || 'General'}
                            </span>
                            {h.enabled_modules && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                    {h.enabled_modules.slice(0, 3).map((mod: string) => (
                                        <span key={mod} className="text-[9px] uppercase tracking-wider font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                            {mod}
                                        </span>
                                    ))}
                                    {h.enabled_modules.length > 3 && (
                                        <span className="text-[9px] uppercase tracking-wider font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                            +{h.enabled_modules.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}
                        </button>
                    ))
                ) : (
                    <div className="col-span-full text-center py-8">
                        <p className="text-slate-500">No hospitals found with the required module ({requiredModule}).</p>
                    </div>
                )}
            </div>
        </div>
    );
}
