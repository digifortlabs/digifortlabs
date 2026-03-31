"use client";

import { useState } from 'react';
import {
    X,
    Check,
    Loader2,
    DollarSign,
    CreditCard,
    Briefcase,
    Hash,
    Calendar as CalendarIcon,
    FileText
} from 'lucide-react';
import { apiFetch } from '@/config/api';
import { format } from 'date-fns';

interface ReceivePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    invoiceId: number | null;
    invoiceNumber: string | null;
    amount: number | null;
}

export default function ReceivePaymentModal({
    isOpen,
    onClose,
    onSuccess,
    invoiceId,
    invoiceNumber,
    amount
}: ReceivePaymentModalProps) {
    const [transactionId, setTransactionId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
    const [paymentDate, setPaymentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoiceId) return;

        setLoading(true);
        try {
            await apiFetch(`/accounting/${invoiceId}/receive-payment`, {
                method: 'POST',
                body: JSON.stringify({
                    transaction_id: transactionId,
                    payment_method: paymentMethod,
                    payment_date: new Date(paymentDate).toISOString()
                })
            });
            onSuccess();
            onClose();
            // Reset state
            setTransactionId('');
            setPaymentMethod('BANK_TRANSFER');
        } catch (error) {
            console.error("Error recording payment:", error);
            alert("Failed to record payment. Please check implementation.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                            <DollarSign size={24} />
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900">Record Payment</h2>
                    <p className="text-slate-500 mt-1 mb-8">Confirming payment receipt for invoice <span className="text-indigo-600 font-bold">#{invoiceNumber}</span></p>

                    <div className="bg-slate-50 p-4 rounded-2xl mb-8 flex items-center justify-between border border-slate-100">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total to Collect</p>
                        <p className="text-2xl font-black text-slate-900">₹{amount?.toLocaleString()}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                                <Hash size={10} /> Transaction Reference / ID
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. TXN-98231-XYZ"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono text-sm"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                                <CalendarIcon size={10} /> Date of Payment (Received)
                            </label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    required
                                    type="date"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                                <CreditCard size={10} /> Payment Method
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: <Briefcase size={14} /> },
                                    { id: 'CHEQUE', label: 'Cheque', icon: <FileText size={14} /> },
                                    { id: 'CASH', label: 'Cash', icon: <DollarSign size={14} /> },
                                    { id: 'OTHER', label: 'Other', icon: <Hash size={14} /> }
                                ].map((method) => (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => setPaymentMethod(method.id)}
                                        className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold border transition-all ${paymentMethod === method.id
                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200'
                                            }`}
                                    >
                                        {method.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            disabled={loading || !transactionId}
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white py-4 rounded-2xl font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                            Confirm & Record Payment
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

