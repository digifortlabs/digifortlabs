"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/config/api';
import { toast } from 'react-hot-toast';

interface ModuleConfig {
    prefix: string;
    padding: number;
    mode: 'auto' | 'semi-auto' | 'manual';
    reset_cycle: 'none' | 'yearly' | 'monthly';
    allow_repeat_suffix?: boolean;
    sync_with_uhid?: boolean;
}

interface NumberSettings {
    [key: string]: ModuleConfig;
}

const MODULES = [
    { id: 'uhid', label: 'UHID (Patient ID)' },
    { id: 'mrd', label: 'MRD Number' },
    { id: 'ipd', label: 'IPD Number' },
    { id: 'opd', label: 'OPD Number' },
    { id: 'er', label: 'ER Number' },
    { id: 'ent', label: 'ENT Number' },
    { id: 'maternity', label: 'Maternity Number' },
    { id: 'dental_opd', label: 'Dental OPD' },
    { id: 'pathlab_order', label: 'Pathlab Order' },
    { id: 'pharma_bill', label: 'Pharmacy Bill' },
    { id: 'invoice', label: 'Patient Invoice' },
    { id: 'receipt_voucher', label: 'Receipt Voucher' },
    { id: 'expense', label: 'Expense Voucher' },
];

export default function NumberSetup({ hospitalId }: { hospitalId: number }) {
    const [settings, setSettings] = useState<NumberSettings>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, [hospitalId]);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const res = await apiFetch(`/hospitals/${hospitalId}`);
            setSettings(res.id_generation_settings || {});
        } catch (error) {
            console.error("Failed to load settings", error);
            toast.error("Failed to load number setup");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await apiFetch(`/hospitals/${hospitalId}/number-setup`, {
                method: 'PUT',
                body: JSON.stringify({ id_generation_settings: settings })
            });
            toast.success("Number setup saved successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save number setup");
        }
    };

    const updateModule = (moduleId: string, field: keyof ModuleConfig, value: any) => {
        setSettings(prev => ({
            ...prev,
            [moduleId]: {
                ...(prev[moduleId] || { prefix: '', padding: 4, mode: 'auto', reset_cycle: 'none' }),
                [field]: value
            }
        }));
    };

    if (loading) return <div>Loading setup...</div>;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Advanced Number Setup</h2>
                <button 
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
                >
                    Save Changes
                </button>
            </div>
            
            <p className="text-gray-600 mb-6">
                Configure how IDs and numbers are generated across the platform. You can use dynamic variables in the prefix such as <code>{'{YYYY}'}</code> or <code>{'{MM}'}</code>.
            </p>

            <div className="space-y-6">
                {MODULES.map(mod => {
                    const conf = settings[mod.id] || { prefix: '', padding: 4, mode: 'auto', reset_cycle: 'none' };
                    
                    return (
                        <div key={mod.id} className="border border-gray-200 rounded p-4">
                            <h3 className="font-semibold text-lg text-gray-800 mb-3">{mod.label}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Prefix</label>
                                    <input 
                                        type="text"
                                        value={conf.prefix || ''}
                                        onChange={e => updateModule(mod.id, 'prefix', e.target.value)}
                                        placeholder="e.g. UHID-{YYYY}-"
                                        className="w-full border rounded p-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Padding (Length)</label>
                                    <input 
                                        type="number"
                                        value={conf.padding || 4}
                                        onChange={e => updateModule(mod.id, 'padding', parseInt(e.target.value))}
                                        className="w-full border rounded p-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Generation Mode</label>
                                    <select 
                                        value={conf.mode || 'auto'}
                                        onChange={e => updateModule(mod.id, 'mode', e.target.value)}
                                        className="w-full border rounded p-2 text-sm"
                                    >
                                        <option value="auto">Auto (Locked)</option>
                                        <option value="semi-auto">Semi-Auto (Editable)</option>
                                        <option value="manual">Manual</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Reset Cycle</label>
                                    <select 
                                        value={conf.reset_cycle || 'none'}
                                        onChange={e => updateModule(mod.id, 'reset_cycle', e.target.value)}
                                        className="w-full border rounded p-2 text-sm"
                                    >
                                        <option value="none">Never Reset</option>
                                        <option value="yearly">Yearly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                            </div>
                            
                            {/* Special Flags */}
                            <div className="mt-4 flex gap-6 text-sm">
                                {mod.id === 'mrd' && (
                                    <label className="flex items-center gap-2">
                                        <input 
                                            type="checkbox" 
                                            checked={!!conf.sync_with_uhid}
                                            onChange={e => updateModule(mod.id, 'sync_with_uhid', e.target.checked)}
                                        />
                                        <span>Sync identical to UHID</span>
                                    </label>
                                )}
                                {(mod.id === 'uhid' || mod.id === 'ipd' || mod.id === 'mrd') && (
                                    <label className="flex items-center gap-2">
                                        <input 
                                            type="checkbox" 
                                            checked={!!conf.allow_repeat_suffix}
                                            onChange={e => updateModule(mod.id, 'allow_repeat_suffix', e.target.checked)}
                                        />
                                        <span>Allow /02 suffix on repeat</span>
                                    </label>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
