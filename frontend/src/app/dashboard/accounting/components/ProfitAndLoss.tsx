"use client";

import { useEffect, useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    Download,
    PieChart,
    ArrowRight
} from 'lucide-react';
import { apiFetch } from '@/config/api';

interface PLData {
    revenue_items: { category: string; amount: number }[];
    expense_items: { category: string; amount: number }[];
    total_revenue: number;
    total_expenses: number;
    gross_profit: number;
}

export default function ProfitAndLoss() {
    const [data, setData] = useState<PLData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPL() {
            try {
                // Fetch stats as primary data source
                const stats = await apiFetch('/accounting-adv/dashboard/overview');

                // Fetch detailed ledger to categorize
                const internal = await apiFetch('/accounting-adv/ledger/INTERNAL/0');
                const expenseMap: Record<string, number> = {};

                internal.transactions.forEach((t: any) => {
                    if (t.voucher_type === 'EXPENSE') {
                        const cat = t.description.split('(')[1]?.replace(')', '') || 'Misc';
                        expenseMap[cat] = (expenseMap[cat] || 0) + t.debit;
                    }
                });

                setData({
                    revenue_items: [{ category: 'Professional Services (Medical Archiving)', amount: stats.total_sales_mtd }],
                    expense_items: Object.entries(expenseMap).map(([cat, amount]) => ({ category: cat, amount })),
                    total_revenue: stats.total_sales_mtd,
                    total_expenses: stats.total_expenses_mtd,
                    gross_profit: stats.net_profit_mtd
                });
            } catch (error) {
                console.error("PL Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchPL();
    }, []);

    if (loading || !data) return <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Analyzing accounts...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
            {/* Report Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-4 border-slate-900 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Profit & Loss Statement</h1>
                    <p className="text-slate-500 font-bold mt-2 flex items-center gap-2">
                        <Calendar size={18} className="text-indigo-600" /> Current Financial Month
                    </p>
                </div>
                <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
                    <Download size={18} /> Export Export Account
                </button>
            </div>

            {/* Main P&L Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 border-2 border-slate-200 rounded-[32px] overflow-hidden shadow-2xl">

                {/* Left Side: Revenue (Income) */}
                <div className="p-10 bg-white space-y-8">
                    <h2 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                        <TrendingUp size={16} /> Revenue / Income
                    </h2>
                    <div className="space-y-6">
                        {data.revenue_items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center group">
                                <p className="text-slate-600 font-bold text-sm tracking-tight">{item.category}</p>
                                <p className="text-slate-900 font-black">₹{item.amount.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                    <div className="pt-8 border-t-2 border-slate-100 flex justify-between items-center">
                        <p className="font-black text-slate-900 uppercase text-xs tracking-widest">Total Income</p>
                        <p className="text-2xl font-black text-emerald-600">₹{data.total_revenue.toLocaleString()}</p>
                    </div>
                </div>

                {/* Right Side: Expenses (Expenditure) */}
                <div className="p-10 bg-white space-y-8">
                    <h2 className="text-xs font-black text-rose-600 uppercase tracking-[0.2em] flex items-center gap-2">
                        <TrendingDown size={16} /> Expenditure / Costs
                    </h2>
                    <div className="space-y-6">
                        {data.expense_items.length === 0 ? (
                            <p className="text-slate-300 italic text-sm">No expenses recorded.</p>
                        ) : data.expense_items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <p className="text-slate-600 font-bold text-sm tracking-tight">{item.category}</p>
                                <p className="text-slate-900 font-black">₹{item.amount.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                    <div className="pt-8 border-t-2 border-slate-100 flex justify-between items-center">
                        <p className="font-black text-slate-900 uppercase text-xs tracking-widest">Total Expenses</p>
                        <p className="text-2xl font-black text-rose-600">₹{data.total_expenses.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Bottom: Gross Profit Calculation */}
            <div className="bg-slate-900 text-white p-12 rounded-[40px] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full"></div>

                <div>
                    <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Net Financial Position</h3>
                    <h4 className="text-4xl font-black tracking-tighter">Operating Gross Profit</h4>
                </div>

                <div className="flex items-center gap-12">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pre-Tax Earnings</p>
                        <p className={`text-6xl font-black tracking-tighter ${data.gross_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ₹{data.gross_profit.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-8">
                &copy; THE DIGIFORT LABS - Professional Accounting Archive
            </p>
        </div>
    );
}
