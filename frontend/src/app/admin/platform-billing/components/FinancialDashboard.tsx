"use client";

import { useEffect, useState } from 'react';
import {
    DollarSign,
    ArrowUpRight,
    ArrowDownLeft,
    TrendingUp,
    Building2,
    Clock,
    CheckCircle2,
    Calendar,
    BarChart3
} from 'lucide-react';
import { apiFetch } from '@/config/api';

interface Stats {
    total_receivables: number;
    total_payables: number;
    total_sales_mtd: number;
    total_expenses_mtd: number;
    net_profit_mtd: number;
    cash_in_hand: number;
}

interface PendingInvoice {
    invoice_number: string;
    hospital_name: string;
    total_amount: number;
    due_date: string;
}

interface ExpenseCategory {
    name: string;
    amount: number;
}

export default function FinancialDashboard({ onViewAging }: { onViewAging: () => void }) {
    const [stats, setStats] = useState<Stats | null>(null);
    const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const [statsData, invoicesData, ledgerData] = await Promise.all([
                    apiFetch('/accounting-adv/dashboard/overview'),
                    apiFetch('/accounting'),
                    apiFetch('/accounting-adv/ledger/INTERNAL/0')
                ]);
                
                setStats(statsData);

                // Process Outstanding Collections
                if (invoicesData && Array.isArray(invoicesData)) {
                    const pending = invoicesData
                        .filter((inv: any) => inv.status === 'PENDING')
                        .sort((a: any, b: any) => new Date(a.due_date || a.bill_date).getTime() - new Date(b.due_date || b.bill_date).getTime())
                        .slice(0, 3)
                        .map((inv: any) => ({
                            invoice_number: inv.invoice_number,
                            hospital_name: inv.hospital_name,
                            total_amount: inv.total_amount,
                            due_date: inv.due_date || inv.bill_date
                        }));
                    setPendingInvoices(pending);
                }

                // Process Top Expense Categories
                if (ledgerData && ledgerData.transactions) {
                    const expenses = ledgerData.transactions.filter((t: any) => t.voucher_type === 'EXPENSE');
                    const catMap: Record<string, number> = {};
                    
                    expenses.forEach((t: any) => {
                        const categoryMatch = t.description.match(/\((.*?)\)/);
                        const category = categoryMatch ? categoryMatch[1] : 'Misc';
                        catMap[category] = (catMap[category] || 0) + t.debit;
                    });

                    const sortedCategories = Object.keys(catMap)
                        .map(key => ({ name: key, amount: catMap[key] }))
                        .sort((a, b) => b.amount - a.amount)
                        .slice(0, 3);
                    
                    setExpenseCategories(sortedCategories);
                }

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchDashboardData();
    }, []);

    if (loading || !stats) {
        return <div className="p-12 text-center text-slate-400">Calculations in progress...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-col justify-between h-36 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div>
                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Net Cash in Hand</p>
                        <h3 className="text-2xl font-black mt-1">₹{stats.cash_in_hand.toLocaleString()}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold">
                        <TrendingUp size={12} /> Corrected for Expenses
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-between h-36">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                            <ArrowUpRight size={16} />
                        </div>
                        <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Receivables</span>
                    </div>
                    <div>
                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">To be Collected</p>
                        <h3 className="text-xl font-black text-slate-900 mt-1">₹{stats.total_receivables.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm flex flex-col justify-between h-36">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <BarChart3 size={16} />
                        </div>
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Sales (MTD)</span>
                    </div>
                    <div>
                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">This Month</p>
                        <h3 className="text-xl font-black text-slate-900 mt-1">₹{stats.total_sales_mtd.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between h-36">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <DollarSign size={16} />
                        </div>
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Net Profit</span>
                    </div>
                    <div>
                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Estimated Profit</p>
                        <h3 className="text-xl font-black text-slate-900 mt-1">₹{stats.net_profit_mtd.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* Detailed Charts / Lists Dynamic View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                    <h4 className="font-bold text-slate-900 flex items-center justify-between mb-6 uppercase text-xs tracking-widest">
                        <span className="flex items-center gap-2"><Clock className="text-amber-500" size={16} /> Outstanding Collections</span>
                        <button onClick={onViewAging} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">View All &rarr;</button>
                    </h4>
                    <div className="space-y-4 flex-1">
                        {pendingInvoices.length > 0 ? (
                            <div className="space-y-3">
                                {pendingInvoices.map((inv, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">{inv.hospital_name}</p>
                                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{inv.invoice_number}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-rose-600">₹{inv.total_amount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 opacity-50">
                                <CheckCircle2 size={32} className="text-emerald-400" />
                                <p className="text-xs font-bold uppercase tracking-widest">All caught up!</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-6 uppercase text-xs tracking-widest">
                        <ArrowDownLeft className="text-rose-500" size={16} /> Top Expense Categories
                    </h4>
                    <div className="flex items-end gap-3 h-32 flex-1 pt-4">
                        {expenseCategories.length > 0 ? (
                            expenseCategories.map((cat, idx) => {
                                const maxAmount = expenseCategories[0].amount;
                                const heightPercentage = Math.max((cat.amount / maxAmount) * 100, 15); // min 15% height for visibility
                                const colors = ['bg-rose-100', 'bg-indigo-100', 'bg-emerald-100'];
                                
                                return (
                                    <div key={idx} className={`flex-1 rounded-t-lg relative group transition-all duration-500 ${colors[idx % 3]}`} style={{ height: `${heightPercentage}%` }}>
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                            {cat.name} (₹{cat.amount.toLocaleString()})
                                        </div>
                                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-500 uppercase tracking-tighter truncate w-full text-center">
                                            {cat.name}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="w-full flex items-center justify-center h-full text-slate-400 text-xs italic">
                                No expense data available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
