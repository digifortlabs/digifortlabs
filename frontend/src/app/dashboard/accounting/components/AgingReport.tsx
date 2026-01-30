"use client";

import { useEffect, useState } from 'react';
import { apiFetch } from '@/config/api';
import { differenceInDays, parseISO, format } from 'date-fns';
import {
    Clock,
    AlertCircle,
    ArrowLeft,
    Calendar,
    Building2,
    Receipt,
    Download
} from 'lucide-react';
import { arrayToCSV, downloadCSV } from '@/lib/reportUtils';

interface Invoice {
    invoice_id: number;
    invoice_number: string;
    hospital_name: string;
    total_amount: number;
    bill_date: string;
    created_at: string;
    status: string;
}

interface AgingBucket {
    label: string;
    count: number;
    amount: number;
    color: string;
    invoices: Invoice[];
}

export default function AgingReport({ onBack }: { onBack: () => void }) {
    const [loading, setLoading] = useState(true);
    const [buckets, setBuckets] = useState<AgingBucket[]>([]);
    const [grandTotal, setGrandTotal] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await apiFetch('/accounting/');
            const pending = data.filter((inv: Invoice) => inv.status === 'PENDING');

            const today = new Date();
            const newBuckets: AgingBucket[] = [
                { label: '0-30 Days', count: 0, amount: 0, color: 'text-emerald-600', invoices: [] },
                { label: '31-60 Days', count: 0, amount: 0, color: 'text-amber-500', invoices: [] },
                { label: '61-90 Days', count: 0, amount: 0, color: 'text-orange-500', invoices: [] },
                { label: '90+ Days', count: 0, amount: 0, color: 'text-rose-600', invoices: [] },
            ];

            let total = 0;

            pending.forEach((inv: Invoice) => {
                const billDate = parseISO(inv.bill_date || inv.created_at);
                const daysOverdue = differenceInDays(today, billDate);

                let bucketIndex = 0;
                if (daysOverdue > 90) bucketIndex = 3;
                else if (daysOverdue > 60) bucketIndex = 2;
                else if (daysOverdue > 30) bucketIndex = 1;

                newBuckets[bucketIndex].count++;
                newBuckets[bucketIndex].amount += inv.total_amount;
                newBuckets[bucketIndex].invoices.push(inv);
                total += inv.total_amount;
            });

            setBuckets(newBuckets);
            setGrandTotal(total);
        } catch (error) {
            console.error("Failed to fetch aging data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const rows: any[] = [];
        buckets.forEach(bucket => {
            bucket.invoices.forEach(inv => {
                rows.push({
                    'Aging Category': bucket.label,
                    'Invoice No': inv.invoice_number,
                    'Hospital': inv.hospital_name,
                    'Amount': inv.total_amount,
                    'Bill Date': format(parseISO(inv.bill_date || inv.created_at), 'dd/MM/yyyy'),
                    'Days Overdue': differenceInDays(new Date(), parseISO(inv.bill_date || inv.created_at))
                });
            });
        });

        const csv = arrayToCSV(rows);
        downloadCSV(`Aging_Report_${new Date().toISOString().split('T')[0]}.csv`, csv);
    };

    if (loading) return <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Analyzing open invoices...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-bold mb-2 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Aging Analysis Report</h1>
                    <p className="text-slate-500 font-medium">Breakdown of outstanding receivables by age</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Outstanding</p>
                    <p className="text-4xl font-black text-slate-900">₹{grandTotal.toLocaleString()}</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {buckets.map((bucket, i) => (
                    <div key={i} className={`bg-white p-6 rounded-2xl border ${bucket.amount > 0 ? 'border-slate-300 shadow-md' : 'border-slate-100'} relative overflow-hidden`}>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{bucket.label}</span>
                            <div className={`p-2 rounded-lg bg-slate-50 ${bucket.color}`}>
                                {i === 0 ? <Clock size={18} /> : <AlertCircle size={18} />}
                            </div>
                        </div>
                        <h3 className={`text-2xl font-black mb-1 ${bucket.amount > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                            ₹{bucket.amount.toLocaleString()}
                        </h3>
                        <p className="text-xs font-bold text-slate-500">{bucket.count} Invoices</p>

                        {/* Progress Bar Visual */}
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100">
                            <div
                                className={`h-full ${bucket.amount > 0 ? bucket.color.replace('text-', 'bg-') : 'bg-transparent'}`}
                                style={{ width: `${grandTotal > 0 ? (bucket.amount / grandTotal) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end">
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                    <Download size={18} /> Export Report
                </button>
            </div>

            {/* Detailed Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {buckets.map((bucket, i) => (
                    bucket.invoices.length > 0 && (
                        <div key={i} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                                <h4 className={`font-black uppercase text-xs tracking-widest ${bucket.color}`}>
                                    {bucket.label}
                                </h4>
                                <span className="text-xs font-bold text-slate-400">Total: ₹{bucket.amount.toLocaleString()}</span>
                            </div>
                            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                                {bucket.invoices.map(inv => (
                                    <div key={inv.invoice_id} className="p-5 hover:bg-slate-50 transition-colors flex justify-between items-center group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center">
                                                <Receipt size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{inv.hospital_name}</p>
                                                <p className="text-xs text-slate-500 font-mono mt-0.5">#{inv.invoice_number}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-slate-900 text-sm">₹{inv.total_amount.toLocaleString()}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center justify-end gap-1 mt-1">
                                                <Calendar size={10} />
                                                {format(parseISO(inv.bill_date || inv.created_at), 'dd/MM/yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}
