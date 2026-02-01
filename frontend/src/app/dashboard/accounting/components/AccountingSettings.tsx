import { useEffect, useState } from 'react';
import {
    Settings2,
    Save,
    RefreshCcw,
    Calendar,
    Hash,
    ShieldAlert,
    CheckCircle2,
    Building2,
    MapPin,
    Mail,
    Globe,
    CreditCard,
    Zap
} from 'lucide-react';
import { apiFetch } from '@/config/api';

export default function AccountingSettings() {
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
                console.error("Failed to fetch accounting config:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchConfig();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await apiFetch('/accounting/config', {
                method: 'POST',
                body: JSON.stringify(config)
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            alert("Failed to save settings");
        } finally {
            setSaving(false);
        }
    }

    if (loading || !config) return <div className="p-12 text-center text-slate-400">Loading configurations...</div>;

    const InputField = ({ label, icon: Icon, value, onChange, placeholder, type = "text", uppercase = false }: any) => (
        <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 flex items-center gap-1.5">
                {Icon && <Icon size={10} className="text-indigo-400" />} {label}
            </label>
            <input
                type={type}
                value={value || ''}
                onChange={e => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
                className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold transition-all placeholder:text-slate-300 ${uppercase ? 'uppercase' : ''}`}
                placeholder={placeholder}
            />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex justify-between items-end border-b border-slate-200 pb-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-2xl">
                            <Settings2 className="text-indigo-600" size={24} />
                        </div>
                        Accounting Setup
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Manage your official company profile and document numbering rules.</p>
                </div>
                {success && (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 size={16} /> All Changes Saved
                    </div>
                )}
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Column 1: Company Profile */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-slate-50 pb-4">
                                <Building2 size={14} className="text-indigo-500" /> Official Business Profile
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <InputField
                                        label="Legal Business Name"
                                        icon={Building2}
                                        value={config.company_name}
                                        onChange={(v: string) => setConfig({ ...config, company_name: v })}
                                        placeholder="e.g. Digifort Labs Pvt Ltd"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <InputField
                                        label="Registered Office Address"
                                        icon={MapPin}
                                        value={config.company_address}
                                        onChange={(v: string) => setConfig({ ...config, company_address: v })}
                                        placeholder="Full business address for invoice header"
                                    />
                                </div>
                                <InputField
                                    label="Official Support Email"
                                    icon={Mail}
                                    value={config.company_email}
                                    onChange={(v: string) => setConfig({ ...config, company_email: v })}
                                    placeholder="info@yourcompany.com"
                                />
                                <InputField
                                    label="Official Website"
                                    icon={Globe}
                                    value={config.company_website}
                                    onChange={(v: string) => setConfig({ ...config, company_website: v })}
                                    placeholder="www.yourcompany.com"
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
                                    <p className="text-[10px] text-slate-400 mt-2 ml-1 italic">* Leave blank for non-GST billing/Bill of Supply defaults.</p>
                                </div>
                            </div>
                        </div>

                        {/* Bank Details section */}
                        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-slate-50 pb-4">
                                <CreditCard size={14} className="text-indigo-500" /> Payment & Bank Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputField
                                        label="Settlement Bank Name"
                                        icon={Building2}
                                        value={config.company_bank_name}
                                        onChange={(v: string) => setConfig({ ...config, company_bank_name: v })}
                                        placeholder="e.g. HDFC BANK LTD"
                                        uppercase={true}
                                    />
                                </div>
                                <div>
                                    <InputField
                                        label="Bank IFSC Code"
                                        icon={Hash}
                                        value={config.company_bank_ifsc}
                                        onChange={(v: string) => setConfig({ ...config, company_bank_ifsc: v })}
                                        placeholder="HDFC000XXXX"
                                        uppercase={true}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <InputField
                                        label="Settlement Account Number"
                                        icon={Hash}
                                        value={config.company_bank_acc}
                                        onChange={(v: string) => setConfig({ ...config, company_bank_acc: v })}
                                        placeholder="Account Number for Payments"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Document Sequencing */}
                    <div className="space-y-8">
                        <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl space-y-6 sticky top-8">
                            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/5 pb-4">
                                <Hash size={14} /> Document Sequencing
                            </h3>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-1.5 flex items-center gap-1.5">
                                        <Calendar size={10} /> Current FY
                                    </label>
                                    <input
                                        type="text"
                                        value={config.current_fy}
                                        onChange={e => setConfig({ ...config, current_fy: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 outline-none font-black text-white placeholder:text-white/10"
                                        placeholder="2025-26"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-1.5">GST Pref.</label>
                                        <input
                                            type="text"
                                            value={config.invoice_prefix}
                                            onChange={e => setConfig({ ...config, invoice_prefix: e.target.value.toUpperCase() })}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl font-black text-indigo-400 text-center"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-1.5">BOS Pref.</label>
                                        <input
                                            type="text"
                                            value={config.invoice_prefix_nongst}
                                            onChange={e => setConfig({ ...config, invoice_prefix_nongst: e.target.value.toUpperCase() })}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl font-black text-emerald-400 text-center"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
                                    <div>
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 block">Next GST #</label>
                                        <div className="text-2xl font-black text-white">{config.next_invoice_number}</div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 block">Next BOS #</label>
                                        <div className="text-2xl font-black text-white">{config.next_invoice_number_nongst}</div>
                                    </div>
                                </div>

                                <div className="pt-4 space-y-3">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!confirm("⚠️ RESET ALL COUNTERS?\n\nThis will reset ALL Invoice and Bill counters to 1.\n\nAre you sure?")) return;
                                            try {
                                                await apiFetch('/accounting/config/reset-counters', { method: 'POST' });
                                                const data = await apiFetch('/accounting/config');
                                                setConfig(data);
                                            } catch (error) { alert("Failed to reset"); }
                                        }}
                                        className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Reset Counters to 1
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-[28px] text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        {saving ? <RefreshCcw className="animate-spin" size={18} /> : <Save size={18} />}
                                        {saving ? 'Saving...' : 'Save Config'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* Live Preview of Numbers */}
            <div className="bg-indigo-600 rounded-[48px] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 blur-[100px] rounded-full"></div>
                <div className="relative z-10">
                    <h3 className="text-xs font-black text-indigo-200 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                        <Zap size={14} /> Live Document Sequencing Preview
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Next Tax Invoice Number</p>
                            <p className="text-4xl font-black font-mono tracking-tighter">
                                {config.number_format
                                    .replace("{prefix}", config.invoice_prefix)
                                    .replace("{fy}", config.current_fy)
                                    .replace("{number:04d}", String(config.next_invoice_number).padStart(4, '0'))}
                            </p>
                            <p className="text-[11px] text-indigo-200/60 font-medium italic">Format uses: {config.number_format}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Next Bill of Supply Number</p>
                            <p className="text-4xl font-black font-mono tracking-tighter text-emerald-400">
                                {config.number_format
                                    .replace("{prefix}", config.invoice_prefix_nongst || 'BOS')
                                    .replace("{fy}", config.current_fy)
                                    .replace("{number:04d}", String(config.next_invoice_number_nongst || 1).padStart(4, '0'))}
                            </p>
                            <p className="text-[11px] text-indigo-200/60 font-medium italic">Used for non-GST taxable entities</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
