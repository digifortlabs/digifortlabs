
"use client";

import { useEffect, useState } from 'react';
import {
    Building2,
    MapPin,
    Mail,
    Globe,
    CreditCard,
    Hash,
    Zap,
    Save,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import { apiFetch } from '@/config/api';

export default function CompanyProfileSettings() {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        async function fetchConfig() {
            try {
                const data = await apiFetch('/accounting/config');
                setConfig(data);
            } catch (error) {
                console.error("Failed to fetch platform config:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiFetch('/accounting/config', {
                method: 'POST',
                body: JSON.stringify(config)
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            alert("Failed to save platform profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="bg-white p-6 rounded-xl border border-slate-100 flex items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin" size={20} />
            <p className="text-sm font-medium">Loading platform profile...</p>
        </div>
    );

    if (!config) return null;

    const InputField = ({ label, icon: Icon, value, onChange, placeholder, uppercase = false }: any) => (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                {Icon && <Icon size={10} className="text-indigo-400" />} {label}
            </label>
            <input
                type="text"
                value={value || ''}
                onChange={e => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
                className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-sm transition-all placeholder:text-slate-300 ${uppercase ? 'uppercase' : ''}`}
                placeholder={placeholder}
            />
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-xl">
                        <Building2 className="text-indigo-600" size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Platform Company Profile</h2>
                        <p className="text-xs text-slate-500">Official details used in all generated invoices.</p>
                    </div>
                </div>
                {success && (
                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        <CheckCircle2 size={12} /> Saved
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <InputField
                            label="Legal Business Name"
                            icon={Building2}
                            value={config.company_name}
                            onChange={(v: string) => setConfig({ ...config, company_name: v })}
                            placeholder="e.g. Digifort Labs"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <InputField
                            label="Registered Office Address"
                            icon={MapPin}
                            value={config.company_address}
                            onChange={(v: string) => setConfig({ ...config, company_address: v })}
                            placeholder="Full business address"
                        />
                    </div>
                    <InputField
                        label="Official Email"
                        icon={Mail}
                        value={config.company_email}
                        onChange={(v: string) => setConfig({ ...config, company_email: v })}
                        placeholder="info@digifortlabs.com"
                    />
                    <InputField
                        label="Website"
                        icon={Globe}
                        value={config.company_website}
                        onChange={(v: string) => setConfig({ ...config, company_website: v })}
                        placeholder="www.digifortlabs.com"
                    />
                    <div className="md:col-span-2">
                        <InputField
                            label="GSTIN / VAT Number"
                            icon={Zap}
                            value={config.company_gst}
                            onChange={(v: string) => setConfig({ ...config, company_gst: v })}
                            placeholder="24XXXXXXXXXXXXX"
                            uppercase={true}
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-50">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <CreditCard size={14} /> Settlement Bank Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                            label="Bank Name"
                            value={config.company_bank_name}
                            onChange={(v: string) => setConfig({ ...config, company_bank_name: v })}
                            placeholder="e.g. HDFC BANK"
                            uppercase={true}
                        />
                        <InputField
                            label="IFSC Code"
                            value={config.company_bank_ifsc}
                            onChange={(v: string) => setConfig({ ...config, company_bank_ifsc: v })}
                            placeholder="HDFC000XXXX"
                            uppercase={true}
                        />
                        <div className="md:col-span-2">
                            <InputField
                                label="Account Number"
                                icon={Hash}
                                value={config.company_bank_acc}
                                onChange={(v: string) => setConfig({ ...config, company_bank_acc: v })}
                                placeholder="Bank Account Number"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 active:scale-95"
                    >
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        {saving ? 'Updating...' : 'Save Profile Details'}
                    </button>
                </div>
            </div>
        </div>
    );
}
