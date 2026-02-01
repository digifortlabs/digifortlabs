"use client";

import React, { useState, useEffect } from 'react';
import {
    X,
    Calendar,
    Save,
    Loader2,
    AlertCircle,
    FileEdit,
    Plus,
    Trash2,
    Building2,
    CheckCircle2,
    Hash
} from 'lucide-react';
import { apiFetch } from '@/config/api';

interface InvoiceItem {
    item_id?: number;
    description: string;
    amount: number;
    discount: number;
    hsn_code: string;
}

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
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [isGstBill, setIsGstBill] = useState(true);
    const [loading, setLoading] = useState(false);

    // Custom item form states
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemHSN, setNewItemHSN] = useState('998311');

    useEffect(() => {
        if (invoice) {
            setBillDate(invoice.bill_date ? new Date(invoice.bill_date).toISOString().split('T')[0] : '');
            setDueDate(invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : '');
            setStatus(invoice.status || 'PENDING');
            setInvoiceNumber(invoice.invoice_number || '');
            setIsGstBill((invoice.gst_rate || 0) > 0);

            // Fetch fresh details with items
            fetchFullInvoice();
        }
    }, [invoice]);

    const fetchFullInvoice = async () => {
        if (!invoice?.invoice_id) return;
        try {
            const data = await apiFetch(`/accounting/${invoice.invoice_id}`);
            setItems(data.items || []);
            setIsGstBill((data.gst_rate || 0) > 0);
        } catch (error) {
            console.error("Error fetching invoice items:", error);
        }
    };

    if (!isOpen || !invoice) return null;

    const handleAddItem = () => {
        if (!newItemDesc || !newItemPrice) return;
        const newItem: InvoiceItem = {
            description: newItemDesc,
            amount: parseFloat(newItemPrice),
            discount: 0,
            hsn_code: newItemHSN
        };
        setItems([...items, newItem]);
        setNewItemDesc('');
        setNewItemPrice('');
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
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
                    status: status,
                    is_gst_bill: isGstBill,
                    items: items // Send full items array for complete replacement
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

    // Calculations (matches backend logic)
    const subtotal = items.reduce((acc, item) => acc + (item.amount - (item.discount || 0)), 0);
    const taxRate = isGstBill ? 0.18 : 0;
    const taxAmount = subtotal * taxRate;
    const grandTotal = Math.round(subtotal + taxAmount);
    const roundOff = grandTotal - (subtotal + taxAmount);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <FileEdit size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Manage Invoice & Items</h2>
                            <p className="text-xs font-bold text-slate-400 font-mono tracking-wider">#{invoice.invoice_number}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
                            <button
                                onClick={() => setIsGstBill(true)}
                                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${isGstBill ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                GST INVOICE
                            </button>
                            <button
                                onClick={() => setIsGstBill(false)}
                                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${!isGstBill ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                NON-GST
                            </button>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-10 scrollbar-thin scrollbar-thumb-slate-200">

                    {/* Items Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                Billed Items ({items.length})
                            </h3>
                        </div>

                        <div className="border border-slate-100 rounded-[1.5rem] overflow-hidden bg-white shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                                        <th className="px-6 py-3 text-left">Description</th>
                                        <th className="px-6 py-3 text-right">Amount</th>
                                        <th className="px-6 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-800">{item.description}</p>
                                                <p className="text-[10px] text-indigo-500 font-bold tracking-tighter uppercase mt-0.5">SAC: {item.hsn_code}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-black text-slate-900">₹{item.amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <X size={18} strokeWidth={3} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Add Item Row */}
                                    <tr className="bg-indigo-50/30">
                                        <td className="px-6 py-4">
                                            <input
                                                className="w-full bg-transparent font-bold text-slate-800 placeholder:text-slate-300 outline-none"
                                                placeholder="Add new item description..."
                                                value={newItemDesc}
                                                onChange={e => setNewItemDesc(e.target.value)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-indigo-100 shadow-sm">
                                                <span className="text-indigo-300 font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    className="w-20 text-right font-black text-slate-900 outline-none bg-transparent"
                                                    value={newItemPrice}
                                                    onChange={e => setNewItemPrice(e.target.value)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={handleAddItem}
                                                className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-110 active:scale-95 transition-all"
                                            >
                                                <Plus size={18} strokeWidth={3} />
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Totals Summary Card */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex items-start gap-4">
                                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/10">
                                    <AlertCircle size={20} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-indigo-900 uppercase tracking-wider">Financial Note</p>
                                    <p className="text-[11px] text-indigo-700/80 leading-relaxed italic">
                                        Modifying items will force a complete recalculation of taxes and round-offs.
                                        Submitting these changes will also update the accounting ledger entries.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-900 p-6 rounded-[2rem] space-y-3 shadow-xl">
                                <div className="flex justify-between text-[11px] text-slate-400 font-black tracking-widest uppercase">
                                    <span>SUBTOTAL:</span>
                                    <span>₹{subtotal.toLocaleString()}</span>
                                </div>
                                {isGstBill && (
                                    <div className="flex justify-between text-[11px] text-indigo-400 font-black tracking-widest uppercase">
                                        <span>TAX (18% GST):</span>
                                        <span>₹{taxAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-[10px] text-slate-500 font-bold italic">
                                    <span>Round Off:</span>
                                    <span>{roundOff > 0 ? '+' : ''}{roundOff.toFixed(2)}</span>
                                </div>
                                <div className="h-px bg-white/10 my-2"></div>
                                <div className="flex justify-between text-lg text-white font-black items-baseline">
                                    <span className="tracking-tight">GRAND TOTAL:</span>
                                    <span className="text-2xl text-indigo-400 tracking-tighter">₹{grandTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Section */}
                    <form onSubmit={handleSubmit} className="space-y-8 pt-8 border-t border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                    <Hash size={12} /> Invoice Number
                                </label>
                                <input
                                    type="text"
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono font-black text-indigo-600"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                    Invoice Status
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                                >
                                    <option value="PENDING">Pending (Unpaid)</option>
                                    <option value="PAID">Paid</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                    <Calendar size={12} /> Bill Date
                                </label>
                                <input
                                    type="date"
                                    value={billDate}
                                    onChange={(e) => setBillDate(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                    <Calendar size={12} /> Due Date
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 px-8 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 shadow-2xl shadow-slate-900/20 active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                            Finalize Invoice Changes
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
