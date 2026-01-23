"use client";

import React, { useState, useEffect } from 'react';
import {
    X,
    Calendar,
    Save,
    Loader2,
    AlertCircle,
    FileEdit
} from 'lucide-react';
import { apiFetch } from '@/config/api';

interface EditInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    invoice: any;
}

export default function EditInvoiceModal({ isOpen, onClose, onSuccess, invoice }: EditInvoiceModalProps) {
    const [billDate, setBillDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [itemActionLoading, setItemActionLoading] = useState<number | null>(null);

    useEffect(() => {
        if (invoice) {
            setBillDate(invoice.bill_date ? new Date(invoice.bill_date).toISOString().split('T')[0] : '');
            setDueDate(invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : '');
            setStatus(invoice.status);
            setInvoiceNumber(invoice.invoice_number);
            // Fetch fresh details to get items
            fetchFullInvoice();
        }
    }, [invoice]);

    const fetchFullInvoice = async () => {
        if (!invoice?.invoice_id) return;
        try {
            const data = await apiFetch(`/accounting/${invoice.invoice_id}`);
            setItems(data.items || []);
        } catch (error) {
            console.error("Error fetching invoice items:", error);
        }
    };

    if (!isOpen || !invoice) return null;

    const handleRemoveItem = async (itemId: number) => {
        if (!confirm("Are you sure you want to remove this item? This record will be available for billing again.")) return;
        setItemActionLoading(itemId);
        try {
            await apiFetch(`/accounting/items/${itemId}`, { method: 'DELETE' });
            // Refresh items and totals
            await fetchFullInvoice();
            onSuccess(); // Refresh parent list
        } catch (error) {
            alert("Failed to remove item.");
        } finally {
            setItemActionLoading(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiFetch(`/accounting/${invoice.invoice_id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    bill_date: billDate,
                    due_date: dueDate,
                    invoice_number: invoiceNumber,
                    status: status
                })
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error updating invoice:", error);
            alert("Failed to update invoice.");
        } finally {
            setLoading(false);
        }
    };

    const subtotal = items.reduce((acc, item) => acc + item.amount, 0);
    const tax = (subtotal * 0.18);
    const total = subtotal + tax;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center">
                            <FileEdit size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Manage Invoice & Items</h2>
                            <p className="text-xs text-slate-500">#{invoice.invoice_number}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Items Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            Billed Items ({items.length})
                        </h3>
                        <div className="border border-slate-100 rounded-2xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-slate-500 font-bold">Description</th>
                                        <th className="px-4 py-2 text-right text-slate-500 font-bold">Amount</th>
                                        <th className="px-4 py-2 text-center text-slate-500 font-bold">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {items.map((item) => (
                                        <tr key={item.item_id}>
                                            <td className="px-4 py-3 text-slate-700">
                                                <p className="font-medium">{item.description}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">SAC: {item.hsn_code}</p>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-900">₹{item.amount.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleRemoveItem(item.item_id)}
                                                    disabled={itemActionLoading === item.item_id}
                                                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    {itemActionLoading === item.item_id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals Summary */}
                        <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
                            <div className="flex justify-between text-xs text-slate-500 font-bold">
                                <span>SUBTOTAL:</span>
                                <span>₹{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 font-bold">
                                <span>TAX (18% GST):</span>
                                <span>₹{tax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-900 font-black pt-2 border-t border-slate-200">
                                <span>GRAND TOTAL:</span>
                                <span>₹{total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 pt-4 border-t border-slate-100">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                Invoice Number
                            </label>
                            <input
                                type="text"
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                className="w-full px-4 py-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-bold text-indigo-900"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar size={14} /> Bill Date
                                </label>
                                <input
                                    type="date"
                                    value={billDate}
                                    onChange={(e) => setBillDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar size={14} /> Due Date
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                Invoice Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-700"
                            >
                                <option value="PENDING">Pending (Unpaid)</option>
                                <option value="PAID">Paid</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 italic text-[11px] text-indigo-700">
                            <AlertCircle size={16} className="shrink-0" />
                            <p>Removing items here will recalculate the invoice totals automatically. These records will reappear in the "Unbilled Files" list for your next billing cycle.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Finalize Invoice Changes
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
