import React, { useState, useEffect } from 'react';
import { Save, Hash, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '@/config/api';

export default function NumberSetup({ hospitalId }: { hospitalId: string }) {
    const [settings, setSettings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Fetch current config from backend
                const res = await apiFetch(`hospitals/${hospitalId}`);
                const config = res.number_config ? JSON.parse(res.number_config) : {};
                
                // Default categories
                const categories = [
                    { key: 'uhid', label: 'Patient UHID', prefix: config.uhid?.prefix || 'UHID', suffix: config.uhid?.suffix || '', length: config.uhid?.length || 6 },
                    { key: 'mrd', label: 'MRD Number', prefix: config.mrd?.prefix || 'MRD', suffix: config.mrd?.suffix || '', length: config.mrd?.length || 6 },
                    { key: 'ipd', label: 'IPD Number', prefix: config.ipd?.prefix || 'IPD', suffix: config.ipd?.suffix || '', length: config.ipd?.length || 6 },
                    { key: 'lab', label: 'Lab Order ID', prefix: config.lab?.prefix || 'LAB', suffix: config.lab?.suffix || '', length: config.lab?.length || 6 },
                    { key: 'pharmacy', label: 'Pharmacy Receipt', prefix: config.pharmacy?.prefix || 'PHR', suffix: config.pharmacy?.suffix || '', length: config.pharmacy?.length || 6 },
                ];
                setSettings(categories);
            } catch (error) {
                console.error("Failed to load number config", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [hospitalId]);

    const handleUpdate = (index: number, field: string, value: string | number) => {
        const updated = [...settings];
        updated[index] = { ...updated[index], [field]: value };
        setSettings(updated);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const configObj: Record<string, any> = {};
            settings.forEach(s => {
                configObj[s.key] = {
                    prefix: s.prefix,
                    suffix: s.suffix,
                    length: Number(s.length)
                };
            });
            
            await apiFetch(`hospitals/${hospitalId}`, {
                method: 'PATCH',
                body: JSON.stringify({ number_config: JSON.stringify(configObj) })
            });
            toast.success("Number generation settings saved.");
        } catch (error) {
            toast.error("Failed to save settings.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="py-8 text-center text-slate-500">Loading number settings...</div>;

    return (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <Hash className="text-indigo-600" size={20} />
                <div>
                    <h2 className="text-lg font-black text-slate-900">Auto-Number Generation</h2>
                    <p className="text-xs font-medium text-slate-500 mt-1">Configure prefixes, suffixes, and padding for auto-generated IDs.</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-12 gap-4 pb-2 border-b border-slate-100 font-bold text-xs text-slate-500 uppercase tracking-wider">
                    <div className="col-span-4">Category</div>
                    <div className="col-span-3">Prefix</div>
                    <div className="col-span-2">Digits Length</div>
                    <div className="col-span-3">Suffix</div>
                </div>

                {settings.map((item, idx) => (
                    <div key={item.key} className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4 font-semibold text-sm text-slate-700">
                            {item.label}
                        </div>
                        <div className="col-span-3">
                            <input 
                                type="text"
                                value={item.prefix}
                                onChange={e => handleUpdate(idx, 'prefix', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                placeholder="e.g. UHID"
                            />
                        </div>
                        <div className="col-span-2">
                            <input 
                                type="number"
                                min={3}
                                max={10}
                                value={item.length}
                                onChange={e => handleUpdate(idx, 'length', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="col-span-3">
                            <input 
                                type="text"
                                value={item.suffix}
                                onChange={e => handleUpdate(idx, 'suffix', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                placeholder="e.g. -2026"
                            />
                        </div>
                    </div>
                ))}

                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Save Setup
                    </button>
                </div>
            </div>
        </div>
    );
}
