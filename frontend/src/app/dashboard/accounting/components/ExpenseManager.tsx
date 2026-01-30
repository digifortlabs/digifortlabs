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
    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    // New Expense Form
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        tax_amount: '',
        category: 'Salaries',
        payment_method: 'Bank Transfer',
        vendor_id: '',
        reference_number: '',
        date: new Date().toISOString().split('T')[0]
    });

    const fetchData = async () => {
        try {
            const [ledger, vendorsData] = await Promise.all([
                apiFetch('/accounting-adv/ledger/INTERNAL/0'),
                apiFetch('/accounting-adv/vendors')
            ]);

            const data = (ledger.transactions || []).filter((t: any) => t.voucher_type === 'EXPENSE');
            setExpenses(data.map((t: any) => ({
                id: t.transaction_id, // Unique Key for React
                expense_id: t.voucher_id,
                description: t.description.split(' (')[0].replace('Expense: ', ''),
                amount: t.debit, // This is technically total amount (base + tax) in the ledger view provided by backend
                category: t.description.split('(')[1]?.replace(')', '') || 'Misc',
                date: t.date,
                payment_method: 'Electronic'
            })));
            setVendors(vendorsData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount),
                tax_amount: parseFloat(formData.tax_amount) || 0,
                vendor_id: formData.vendor_id ? parseInt(formData.vendor_id) : null
            };

            if (editingExpense) {
                await apiFetch(`/accounting-adv/expenses/${editingExpense.expense_id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
            } else {
                await apiFetch('/accounting-adv/expenses', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            }

            setShowAddModal(false);
            setEditingExpense(null);
            setFormData({
                description: '', amount: '', tax_amount: '', category: 'Salaries',
                payment_method: 'Bank Transfer', vendor_id: '', reference_number: '',
                date: new Date().toISOString().split('T')[0]
            });
            fetchData();
        } catch (error) {
            alert("Failed to save expense");
        }
    }

    const handleEdit = (exp: Expense) => {
        setEditingExpense(exp);
        // Note: For full edit support including vendor/tax, backend needs to return those fields in list or we fetch individual
        // For now, mapping what we have
        setFormData({
            description: exp.description,
            amount: exp.amount.toString(),
            tax_amount: '0', // Basic ledger view doesn't separate tax, usually lumped in debit
            category: exp.category,
            payment_method: exp.payment_method,
            vendor_id: '',
            reference_number: '',
            date: exp.date.split('T')[0]
        });
        setShowAddModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this expense? This will also revert the ledger entry.")) return;
        try {
            await apiFetch(`/accounting-adv/expenses/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Failed to delete expense");
        }
    };

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
                    onClick={() => {
                        setEditingExpense(null);
                        setFormData({
                            description: '', amount: '', tax_amount: '', category: 'Salaries',
                            payment_method: 'Bank Transfer', vendor_id: '', reference_number: '',
                            date: new Date().toISOString().split('T')[0]
                        });
                        setShowAddModal(true);
                    }}
                    className="flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all active:scale-95"
                >
                    <Plus size={18} /> Record Purchase Bill
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Description</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Category</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Total Amount</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-12 text-center text-slate-300 italic">No expenses logged this month.</td>
                            </tr>
                        ) : expenses.map((exp) => (
                            <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-4">
                                    <p className="font-bold text-slate-800">{exp.description}</p>
                                </td>
                                <td className="px-8 py-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                        {exp.category}
                                    </span>
                                </td>
                                <td className="px-8 py-4 text-slate-500 text-sm font-medium">
                                    {format(new Date(exp.date), 'MMM dd, yyyy')}
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <span className="text-lg font-black text-rose-600">₹{exp.amount.toLocaleString()}</span>
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(exp)}
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                            title="Edit Expense"
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(exp.expense_id)}
                                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                                            title="Delete Expense"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Expense Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-100">
                                    <ArrowDownLeft size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 leading-tight">{editingExpense ? 'Edit Bill / Expense' : 'New Purchase Bill'}</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Record Vendor Invoices & Expenses</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vendor (Optional)</label>
                                    <select
                                        value={formData.vendor_id}
                                        onChange={e => setFormData({ ...formData, vendor_id: e.target.value })}
                                        className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                                    >
                                        <option value="">-- Direct Expense (No Vendor) --</option>
                                        {vendors.map(v => (
                                            <option key={v.vendor_id} value={v.vendor_id}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bill / Reference No.</label>
                                    <input
                                        type="text"
                                        value={formData.reference_number}
                                        onChange={e => setFormData({ ...formData, reference_number: e.target.value })}
                                        className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500/20 outline-none uppercase font-bold text-slate-600"
                                        placeholder="BILL-001"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bill Date</label>
                                        <input
                                            type="date" required
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500/20 outline-none font-bold text-slate-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                                        >
                                            {['Inventory Purchase', 'Asset Purchase', 'Salaries', 'Server & IT', 'Office Rent', 'Electricity', 'Marketing', 'Consulting', 'Misc'].map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description / Items</label>
                                    <input
                                        type="text" required
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500/20 outline-none"
                                        placeholder="e.g. Purchase of 500 Lab Kits..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Taxable Amount (₹)</label>
                                        <input
                                            type="number" required
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500/20 outline-none font-bold"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tax / GST Amount (₹)</label>
                                        <input
                                            type="number"
                                            value={formData.tax_amount}
                                            onChange={e => setFormData({ ...formData, tax_amount: e.target.value })}
                                            className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500/20 outline-none font-bold text-rose-600"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-500">Total Payable</span>
                                    <span className="text-xl font-black text-slate-900">
                                        ₹{((parseFloat(formData.amount) || 0) + (parseFloat(formData.tax_amount) || 0)).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                            >
                                {editingExpense ? 'Update Bill' : 'Record Purchase Bill'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
