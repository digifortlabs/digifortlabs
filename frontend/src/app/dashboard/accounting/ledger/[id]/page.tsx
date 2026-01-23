"use client";

import { useEffect, useState, use } from 'react';
import {
    ArrowLeft,
    Printer,
    Download,
    Calendar,
    Building2,
    FileText,
    ArrowUpRight,
    ArrowDownLeft,
    Search
} from 'lucide-react';
import { apiFetch } from '@/config/api';
import { format } from 'date-fns';
import Link from 'next/link';

interface Transaction {
    transaction_id: number;
    date: string;
    voucher_type: string;
    voucher_number: string;
    description: string;
    debit: number;
    credit: number;
}

interface LedgerData {
    party_name: string;
    opening_balance: number;
    closing_balance: number;
    transactions: Transaction[];
}

export default function PartyLedgerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [data, setData] = useState<LedgerData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLedger() {
            try {
                const result = await apiFetch(`/accounting-adv/ledger/HOSPITAL/${id}`);
                setData(result);
            } catch (error) {
                console.error("Failed to fetch ledger:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchLedger();
    }, [id]);

    const handlePrint = () => window.print();

    if (loading) return <div className="p-12 text-center text-slate-400">Loading ledger account...</div>;
    if (!data) return <div className="p-12 text-center text-rose-500 font-bold">Account not found.</div>;

    // Calculate running balance
    let currentBalance = data.opening_balance || 0;
    const transactionsWithBalance = data.transactions.map(t => {
        currentBalance = currentBalance + t.debit - t.credit;
        return { ...t, running_balance: currentBalance };
    });

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 bg-white min-h-screen">
            {/* Header / Toolbar (Hidden on Print) */}
            <div className="flex items-center justify-between print:hidden">
                <Link href="/dashboard/accounting" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold uppercase text-xs tracking-widest">
                    <ArrowLeft size={16} /> Back to Hub
                </Link>
                <div className="flex items-center gap-3">
                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all">
                        <Printer size={16} /> Print Statement
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
                        <Download size={16} /> Download CSV
                    </button>
                </div>
            </div>

            {/* Statement Header */}
            <div className="border-b-2 border-slate-900 pb-8 flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="space-y-4">
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Statement of Account</h1>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Account Party</p>
                            <h2 className="text-xl font-black text-slate-900 mt-1">{data.party_name}</h2>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 min-w-[240px]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Closing Balance</p>
                    <h3 className={`text-3xl font-black ${data.closing_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ₹{data.closing_balance.toLocaleString()}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tighter italic">
                        {data.closing_balance > 0 ? 'Dr (Money to receive)' : 'Cr (Settled)'}
                    </p>
                </div>
            </div>

            {/* Transaction Table */}
            <div className="mt-8 border rounded-3xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Date</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Particulars / Voucher No.</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Debit (₹)</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Credit (₹)</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Balance (₹)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {/* Opening Balance Row */}
                        <tr className="bg-slate-50 font-bold border-b border-slate-200">
                            <td className="px-6 py-4 text-xs">---</td>
                            <td className="px-6 py-4 text-xs uppercase tracking-widest text-slate-500">Opening Balance</td>
                            <td className="px-6 py-4 text-xs text-right">-</td>
                            <td className="px-6 py-4 text-xs text-right">-</td>
                            <td className="px-6 py-4 text-xs text-right">₹{(data.opening_balance || 0).toLocaleString()}</td>
                        </tr>

                        {transactionsWithBalance.map((t) => (
                            <tr key={t.transaction_id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 text-sm font-medium text-slate-700">
                                    {format(new Date(t.date), 'dd MMM yyyy')}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`p-1.5 rounded-lg ${t.debit > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {t.debit > 0 ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                        </span>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{t.description}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {t.voucher_type} #{t.voucher_number || t.transaction_id}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">
                                    {t.debit > 0 ? `₹${t.debit.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">
                                    {t.credit > 0 ? `₹${t.credit.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-6 py-4 text-sm font-black text-slate-900 text-right">
                                    ₹{t.running_balance.toLocaleString()}
                                    <span className="text-[10px] ml-1 text-slate-400">{t.running_balance > 0 ? 'Dr' : 'Cr'}</span>
                                </td>
                            </tr>
                        ))}

                        {/* Totals Row */}
                        <tr className="bg-slate-900 text-white font-black">
                            <td colSpan={2} className="px-6 py-4 text-right text-[10px] uppercase tracking-widest">Year-to-Date Totals</td>
                            <td className="px-6 py-4 text-sm text-right">
                                ₹{data.transactions.reduce((acc, curr) => acc + curr.debit, 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-right">
                                ₹{data.transactions.reduce((acc, curr) => acc + curr.credit, 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-right">
                                ₹{data.closing_balance.toLocaleString()}
                                <span className="text-[10px] ml-1 opacity-50">{data.closing_balance > 0 ? 'Dr' : 'Cr'}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Footer / Legal (Visible on Print) */}
            <div className="hidden print:block pt-12 space-y-8">
                <div className="grid grid-cols-2 gap-12">
                    <div className="border-t border-slate-300 pt-4">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-8">Party Signature</p>
                        <div className="h-20"></div>
                    </div>
                    <div className="border-t border-slate-300 pt-4 text-right">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-8">Authorized Signatory</p>
                        <p className="text-sm font-bold text-slate-900">THE DIGIFORT LABS</p>
                    </div>
                </div>
                <p className="text-center text-[8px] text-slate-400 uppercase tracking-widest">
                    This is a computer generated statement and does not require a physical signature.
                </p>
            </div>
        </div>
    );
}
