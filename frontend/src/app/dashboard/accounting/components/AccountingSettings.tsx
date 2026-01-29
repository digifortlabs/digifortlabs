"use client";

import { useEffect, useState } from 'react';
import {
    Settings2,
    Save,
    RefreshCcw,
    Calendar,
    Hash,
    ShieldAlert,
    CheckCircle2
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

    const handleFYClose = () => {
        if (!confirm("CRITICAL ACTION: Are you sure you want to CLOSE the current financial year? This will reset all voucher counters to 1. Ensure you have updated the 'Current FY' string first.")) return;

        setConfig({
            ...config,
            next_invoice_number: 1,
            next_receipt_number: 1,
            next_expense_number: 1
        });
        alert("Counters set to 1. Please click 'Save All Changes' to apply.");
    }

    if (loading || !config) return <div className="p-12 text-center text-slate-400">Loading configurations...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="border-b border-slate-200 pb-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Settings2 className="text-indigo-600" /> Document Sequencing & Setup
                </h2>
                <p className="text-slate-500 text-sm mt-1">Configure how your invoices and vouchers are numbered across financial years.</p>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Prefix & Format Section */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Hash size={14} /> Prefixes & Format
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company GSTIN</label>
                            <input
                                type="text"
                                value={config.company_gst || ''}
                                onChange={e => setConfig({ ...config, company_gst: e.target.value })}
                                className="w-full mt-1.5 px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-indigo-900"
                                placeholder="Enter Your GST Number"
                            />
                        </div>

                        <div className="pt-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Invoice Prefix</label>
                                <input
                                    type="text"
                                    value={config.invoice_prefix}
                                    onChange={e => setConfig({ ...config, invoice_prefix: e.target.value })}
                                    className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Receipt Prefix</label>
                                    <input
                                        type="text"
                                        value={config.receipt_prefix}
                                        onChange={e => setConfig({ ...config, receipt_prefix: e.target.value })}
                                        className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expense Prefix</label>
                                    <input
                                        type="text"
                                        value={config.expense_prefix}
                                        onChange={e => setConfig({ ...config, expense_prefix: e.target.value })}
                                        className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Numbering Format</label>
                                <input
                                    type="text"
                                    value={config.number_format}
                                    onChange={e => setConfig({ ...config, number_format: e.target.value })}
                                    className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono text-sm"
                                />
                                <p className="text-[10px] text-slate-400 mt-2 ml-1">Use keywords: <code className="text-indigo-600">{"{prefix}"}</code>, <code className="text-indigo-600">{"{fy}"}</code>, <code className="text-indigo-600">{"{number:04d}"}</code></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Counter & FY Section */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <RefreshCcw size={14} /> Active Counters
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Financial Year</label>
                            <input
                                type="text"
                                value={config.current_fy}
                                onChange={e => setConfig({ ...config, current_fy: e.target.value })}
                                className="w-full mt-1.5 px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-black text-indigo-900"
                                placeholder="e.g. 2026-27"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Next Inv #</label>
                                <input
                                    type="number"
                                    value={config.next_invoice_number}
                                    onChange={e => setConfig({ ...config, next_invoice_number: parseInt(e.target.value) || 1 })}
                                    className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Next Rcpt #</label>
                                <input
                                    type="number"
                                    value={config.next_receipt_number}
                                    onChange={e => setConfig({ ...config, next_receipt_number: parseInt(e.target.value) || 1 })}
                                    className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 space-y-3">
                        <button
                            type="button"
                            onClick={async () => {
                                if (!confirm("⚠️ RESET ALL COUNTERS?\n\nThis will reset Invoice, Receipt, and Expense counters to 1.\n\nAre you sure?")) return;
                                try {
                                    await apiFetch('/accounting/config/reset-counters', { method: 'POST' });
                                    // Refresh config
                                    const data = await apiFetch('/accounting/config');
                                    setConfig(data);
                                    alert("✅ All counters have been reset to 1!");
                                } catch (error) {
                                    alert("Failed to reset counters");
                                }
                            }}
                            className="w-full py-4 bg-amber-50 text-amber-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCcw size={16} /> Reset All Counters to 1
                        </button>
                        <button
                            type="button"
                            onClick={handleFYClose}
                            className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <ShieldAlert size={16} /> Close Financial Year (Reset)
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2 flex justify-end gap-4">
                    {success && <span className="flex items-center gap-2 text-emerald-600 text-sm font-bold"><CheckCircle2 size={18} /> Settings Saved!</span>}
                    <button
                        disabled={saving}
                        className="flex items-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Save size={18} /> {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            </form>

            {/* Preview Section */}
            <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px]"></div>
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6">Document Preview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Sample Invoice ID</p>
                        <p className="text-xl font-black font-mono">
                            {config.number_format
                                .replace("{prefix}", config.invoice_prefix)
                                .replace("{fy}", config.current_fy)
                                .replace("{number:04d}", String(config.next_invoice_number).padStart(4, '0'))}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Sample Receipt ID</p>
                        <p className="text-xl font-black font-mono">
                            {config.number_format
                                .replace("{prefix}", config.receipt_prefix)
                                .replace("{fy}", config.current_fy)
                                .replace("{number:04d}", String(config.next_receipt_number).padStart(4, '0'))}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Sample Expense ID</p>
                        <p className="text-xl font-black font-mono">
                            {config.number_format
                                .replace("{prefix}", config.expense_prefix)
                                .replace("{fy}", config.current_fy)
                                .replace("{number:04d}", String(config.next_expense_number).padStart(4, '0'))}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
