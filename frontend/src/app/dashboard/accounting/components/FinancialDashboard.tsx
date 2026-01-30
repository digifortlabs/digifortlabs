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

export default function FinancialDashboard({ onViewAging }: { onViewAging: () => void }) {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const data = await apiFetch('/accounting-adv/dashboard/overview');
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading || !stats) {
        return <div className="p-12 text-center text-slate-400">Calculations in progress...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-2xl flex flex-col justify-between h-44 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Net Cash in Hand</p>
                        <h3 className="text-3xl font-black mt-2">₹{stats.cash_in_hand.toLocaleString()}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                        <TrendingUp size={14} /> Corrected for Expenses
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm flex flex-col justify-between h-44">
                    <div className="flex items-center justify-between">
                        <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
                            <ArrowUpRight size={20} />
                        </div>
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Receivables</span>
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase">To be Collected</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">₹{stats.total_receivables.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm flex flex-col justify-between h-44">
                    <div className="flex items-center justify-between">
                        <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                            <BarChart3 size={20} />
                        </div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Sales (MTD)</span>
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase">This Month</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">₹{stats.total_sales_mtd.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between h-44">
                    <div className="flex items-center justify-between">
                        <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                            <DollarSign size={20} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Net Profit</span>
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase">Estimated Profit</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">₹{stats.net_profit_mtd.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* Detailed Charts / Lists Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-6 uppercase text-xs tracking-widest">
                        <Clock className="text-amber-500" size={16} /> Outstanding Collections
                    </h4>
                    <div className="space-y-4">
                        <p className="text-slate-400 text-sm italic">Connect with hospitals to clear pending invoices...</p>
                        <button onClick={onViewAging} className="text-xs font-bold text-indigo-600 hover:underline">View Aging Report &rarr;</button>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-6 uppercase text-xs tracking-widest">
                        <ArrowDownLeft className="text-rose-500" size={16} /> Top Expense Categories
                    </h4>
                    <div className="flex items-end gap-2 h-32">
                        <div className="flex-1 bg-slate-100 rounded-lg h-[80%] relative group">
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Salaries</div>
                        </div>
                        <div className="flex-1 bg-indigo-100 rounded-lg h-[40%] relative group">
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Server</div>
                        </div>
                        <div className="flex-1 bg-slate-100 rounded-lg h-[60%] relative group">
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Office</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
