"use client";

import { useEffect, useState } from 'react';
import {
    Plus,
    Search,
    ArrowDownLeft,
    Tag,
    Calendar,
    CreditCard,
    MoreHorizontal,
    TrendingDown,
    Loader2,
    X
} from 'lucide-react';
import { apiFetch } from '@/config/api';
import { format } from 'date-fns';

interface Expense {
    expense_id: number;
    description: string;
    amount: number;
    category: string;
    date: string;
    payment_method: string;
}

export default function ExpenseManager() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // New Expense Form
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'Salaries',
        payment_method: 'Bank Transfer'
    });

    const fetchExpenses = async () => {
        try {
            // Need a backend endpoint logic for listing expenses
            // For now, using the ledger/INTERNAL/ as a proxy or if implemented
            const ledger = await apiFetch('/accounting-adv/ledger/INTERNAL/0');
            const data = (ledger.transactions || []).filter((t: any) => t.voucher_type === 'EXPENSE');
            setExpenses(data.map((t: any) => ({
                expense_id: t.transaction_id,
                description: t.description,
                amount: t.debit,
                category: t.description.split('(')[1]?.replace(')', '') || 'Misc',
                date: t.date,
                payment_method: 'Electronic'
            })));
        } catch (error) {
            console.error("Failed to fetch expenses:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiFetch('/accounting-adv/expenses', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount)
                })
            });
            setShowAddModal(false);
            setFormData({ description: '', amount: '', category: 'Salaries', payment_method: 'Bank Transfer' });
            fetchExpenses();
        } catch (error) {
            alert("Failed to log expense");
        }
    }

    if (loading) return <div className="p-12 text-center text-slate-400">Loading expenses...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Expense Header */}
            <div className="flex items-center justify-between">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-4">
                        <div className="p-2 bg-rose-500 text-white rounded-lg">
                            <TrendingDown size={20} />
                        </div>
                        <div>
                            <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest">Total Out (MTD)</p>
                            <h3 className="text-xl font-black text-rose-600">₹{expenses.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all active:scale-95"
                >
                    <Plus size={18} /> Log Expense
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Description</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Category</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Mode</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-12 text-center text-slate-300 italic">No expenses logged this month.</td>
                            </tr>
                        ) : expenses.map((exp) => (
                            <tr key={exp.expense_id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-4">
                                    <p className="font-bold text-slate-800">{exp.description}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{format(new Date(exp.date), 'MMM dd, yyyy')}</p>
                                </td>
                                <td className="px-8 py-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                        {exp.category}
                                    </span>
                                </td>
                                <td className="px-8 py-4 text-slate-500 text-sm font-medium italic">{exp.payment_method}</td>
                                <td className="px-8 py-4 text-right">
                                    <span className="text-lg font-black text-rose-600">₹{exp.amount.toLocaleString()}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Expense Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-100">
                                    <ArrowDownLeft size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 leading-tight">New Expenditure</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Log Company Costs</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleAdd} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason/Description</label>
                                    <input
                                        type="text" required
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                                        placeholder="e.g. Server hosting fee, Staff salary..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Amount (₹)</label>
                                        <input
                                            type="number" required
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500/20 outline-none font-bold"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                                        >
                                            {['Salaries', 'Server & IT', 'Office Rent', 'Electricity', 'Marketing', 'Misc'].map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                            >
                                Record Expense
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
