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
    tax_amount: number;
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

                const expenseItems = Object.entries(expenseMap).map(([cat, amount]) => ({ category: cat, amount }));
                
                // Sum expenses dynamically to ensure consistency with displayed line items
                const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);

                // Fetch invoices to get exact GST tax collected for MTD
                let taxCollected = 0;
                try {
                    const invoices = await apiFetch('/accounting');
                    if (Array.isArray(invoices)) {
                        const currentMonth = new Date().getMonth();
                        const currentYear = new Date().getFullYear();
                        const monthlyInvoices = invoices.filter((inv: any) => {
                            const d = new Date(inv.bill_date);
                            return d.getMonth() === currentMonth && d.getFullYear() === currentYear && inv.status !== 'CANCELLED';
                        });
                        taxCollected = monthlyInvoices.reduce((sum: number, inv: any) => sum + (inv.tax_amount || 0), 0);
                    }
                } catch (e) {
                    console.error("Failed to fetch invoices for tax calculation:", e);
                }

                setData({
                    revenue_items: [{ category: 'Professional Services (Medical Archiving)', amount: stats.total_sales_mtd }],
                    expense_items: expenseItems,
                    total_revenue: stats.total_sales_mtd,
                    total_expenses: totalExpenses || stats.total_expenses_mtd || 0,
                    tax_amount: taxCollected,
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
            <div className="bg-slate-900 text-white p-12 rounded-[40px] shadow-2xl flex flex-col lg:flex-row justify-between items-center gap-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full"></div>

                <div className="space-y-4 relative z-10 max-w-md w-full">
                    <div>
                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Net Financial Position</h3>
                        <h4 className="text-4xl font-black tracking-tighter">Operating Net Profit</h4>
                        <p className="text-slate-400 text-xs font-medium mt-1">Earnings calculated after factoring in full GST tax liabilities and operational costs.</p>
                    </div>
                    
                    {/* Micro breakdown panel */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 font-semibold text-xs tracking-wide">
                        <div className="flex justify-between items-center text-slate-300">
                            <span>Total Income (Gross)</span>
                            <span className="font-black text-white">₹{data.total_revenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                            <span>Less: Total Expenses</span>
                            <span className="font-black text-rose-400">-₹{data.total_expenses.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                            <span>Less: GST Tax Collected</span>
                            <span className="font-black text-amber-400">-₹{Math.round(data.tax_amount).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-12 relative z-10 w-full lg:w-auto justify-end">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Post-Tax Net Earnings</p>
                        <p className={`text-6xl md:text-7xl font-black tracking-tighter ${data.total_revenue - data.total_expenses - data.tax_amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ₹{Math.round(data.total_revenue - data.total_expenses - data.tax_amount).toLocaleString()}
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
