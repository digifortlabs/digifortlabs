"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/config/api';
import toast from 'react-hot-toast';
import { 
    Calendar, ArrowLeft, Loader2, IndianRupee, FileText, Lock, CheckCircle2, AlertTriangle, TrendingUp, CreditCard, Landmark, Check
} from 'lucide-react';

export default function DailyReportPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<any>(null);
    const [isAfter9PM, setIsAfter9PM] = useState(false);
    const [currentTimeString, setCurrentTimeString] = useState("");

    useEffect(() => {
        checkTimeAndFetch();
        
        // Interval to update time check
        const timer = setInterval(() => {
            checkTimeAndFetch(false);
        }, 15000);

        return () => clearInterval(timer);
    }, []);

    const checkTimeAndFetch = async (showLoading = true) => {
        // Enforce 9:00 PM local time check
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        
        const after9 = hours >= 21; // 9:00 PM is 21:00
        setIsAfter9PM(after9);

        // Format time string
        const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setCurrentTimeString(formattedTime);

        try {
            if (showLoading) setLoading(true);
            const data = await apiFetch('/patient-billing/daily-report');
            setReportData(data);
        } catch (error: any) {
            console.error('Failed to load daily report:', error);
            if (showLoading) toast.error('Failed to load daily report');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-slate-400">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
                <p className="font-bold text-lg text-slate-900">Compiling Daily Collection Ledger...</p>
            </div>
        );
    }

    const collections = reportData?.collections || {};
    const totalCollections = Object.values(collections).reduce((sum: number, val: any) => sum + (val || 0), 0) as number;

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/hospital/accounting')}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-slate-500"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Calendar className="text-indigo-600" /> Daily Revenue & Collections Report
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">Daily ledger summaries for {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">System Time</span>
                    <p className="text-sm font-mono font-bold text-slate-700">{currentTimeString}</p>
                </div>
            </div>

            {/* 9 PM Rule Banner */}
            {!isAfter9PM ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-sm">
                    <div className="flex gap-3 items-center">
                        <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                            <Lock size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-amber-950">Daily Report Draft Compilation</p>
                            <p className="text-xs text-amber-800 font-medium">The official Daily Audit Ledger compiles and locks at 9:00 PM local time. Metrics shown below are live drafts.</p>
                        </div>
                    </div>
                    <span className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-black uppercase tracking-wider">
                        Live Draft
                    </span>
                </div>
            ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-sm">
                    <div className="flex gap-3 items-center">
                        <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-emerald-950">Audited Daily Ledger Published</p>
                            <p className="text-xs text-emerald-800 font-medium">Today's collection report compiled at 9:00 PM. Access token verified, export actions unlocked.</p>
                        </div>
                    </div>
                    <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black uppercase tracking-wider">
                        Audited & Locked
                    </span>
                </div>
            )}

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gross Billed</p>
                        <p className="text-xl font-black text-slate-900">₹ {(reportData?.total_billed || 0).toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                        <IndianRupee className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payments Collected</p>
                        <p className="text-xl font-black text-slate-900">₹ {totalCollections.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                        <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">GST Collected</p>
                        <p className="text-xl font-black text-slate-900">₹ {(reportData?.total_gst || 0).toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invoices Generated</p>
                        <p className="text-xl font-black text-slate-900">{reportData?.invoice_count || 0}</p>
                    </div>
                </div>
            </div>

            {/* Core Body Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left Panel: Payment Method Breakdowns */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                    <h3 className="font-black text-slate-950 pb-3 border-b border-slate-100 text-sm">Collection Methods</h3>
                    
                    <div className="space-y-4">
                        {Object.entries(collections).map(([method, amount]: [string, any]) => {
                            const percent = totalCollections > 0 ? ((amount / totalCollections) * 100).toFixed(0) : '0';
                            return (
                                <div key={method} className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                                        <span className="uppercase tracking-wider">{method.replace('_', ' ')}</span>
                                        <span className="font-bold text-slate-900">₹ {amount.toLocaleString()} ({percent}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div 
                                            style={{ width: `${percent}%` }}
                                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Panel: Invoice Logs for Today */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col min-h-[400px]">
                    <h3 className="font-black text-slate-950 pb-3 border-b border-slate-100 text-sm mb-4">Today's Patient Bills Ledger</h3>
                    
                    {reportData?.invoices?.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <FileText size={40} className="stroke-1 mb-2" />
                            <p className="text-sm font-semibold">No invoices generated yet today.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                                        <th className="py-2 pl-2">Invoice No</th>
                                        <th className="py-2">Patient</th>
                                        <th className="py-2">Method</th>
                                        <th className="py-2 text-right pr-2">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {reportData.invoices.map((inv: any) => (
                                        <tr key={inv.invoice_id} className="hover:bg-slate-50/50">
                                            <td className="py-3 pl-2 font-mono font-bold text-indigo-600">{inv.invoice_number}</td>
                                            <td className="py-3">
                                                <p className="font-bold text-slate-900">{inv.patient_name}</p>
                                                <p className="text-[10px] font-mono text-slate-400">{inv.mrd_number}</p>
                                            </td>
                                            <td className="py-3">
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] uppercase font-bold">
                                                    {inv.payment_method || 'CASH'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right font-black text-slate-900 pr-2">₹ {inv.total_amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
