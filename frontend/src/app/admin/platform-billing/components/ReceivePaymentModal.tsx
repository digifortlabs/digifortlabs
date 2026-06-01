"use client";

import { useState, useEffect } from 'react';
import {
    X,
    Check,
    Loader2,
    DollarSign,
    CreditCard,
    Briefcase,
    Hash,
    Calendar as CalendarIcon,
    FileText,
    Trash2
} from 'lucide-react';
import { apiFetch } from '@/config/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface ReceivePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    invoiceId: number | null;
    invoiceNumber: string | null;
    amount: number | null;
    invoice?: any;
}

export default function ReceivePaymentModal({
    isOpen,
    onClose,
    onSuccess,
    invoiceId,
    invoiceNumber,
    amount,
    invoice
}: ReceivePaymentModalProps) {
    const [transactionId, setTransactionId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
    const [paymentDate, setPaymentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [userRole, setUserRole] = useState('');

    // TDS states
    const [deductTds, setDeductTds] = useState(false);
    const [tdsAmount, setTdsAmount] = useState<number>(0);
    const [receivedAmount, setReceivedAmount] = useState<number>(0);

    const isEditMode = invoice && invoice.status === 'PAID';

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setUserRole(localStorage.getItem('userRole') || '');
        }
    }, []);

    const canDeletePayment = isEditMode && ['superadmin', 'superadmin_staff', 'website_admin'].includes(userRole);

    const handleDeletePayment = async () => {
        if (!invoiceId) return;
        if (!confirm("Are you sure you want to delete this payment record? The invoice status will be reset to PENDING and the linked records will be marked as unpaid.")) {
            return;
        }

        setDeleteLoading(true);
        try {
            await apiFetch(`/accounting/${invoiceId}/delete-payment`, {
                method: 'POST'
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error deleting payment:", error);
            const errMsg = error?.message || "Failed to delete payment.";
            toast.error(errMsg);
        } finally {
            setDeleteLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                setTransactionId(invoice.transaction_id || '');
                setPaymentMethod(invoice.payment_method || 'BANK_TRANSFER');
                
                if (invoice.payment_date) {
                    try {
                        setPaymentDate(format(new Date(invoice.payment_date), 'yyyy-MM-dd'));
                    } catch (e) {
                        setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
                    }
                } else {
                    setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
                }
                
                const hasTds = invoice.tds_amount && invoice.tds_amount > 0;
                setDeductTds(!!hasTds);
                setTdsAmount(invoice.tds_amount || 0);
                setReceivedAmount(invoice.received_amount || invoice.total_amount || 0);
            } else if (amount) {
                // Default TDS is calculated as 10% of base amount (assuming 18% default GST on total)
                const baseAmount = amount / 1.18;
                const defaultTds = Math.round(baseAmount * 0.1 * 100) / 100;
                setTdsAmount(defaultTds);
                setReceivedAmount(Math.round((amount - defaultTds) * 100) / 100);
                setDeductTds(false); // Default to regular payment
                setTransactionId('');
                setPaymentMethod('BANK_TRANSFER');
                setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
            }
        }
    }, [isOpen, amount, invoice, isEditMode]);

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
                    payment_date: new Date(paymentDate).toISOString(),
                    tds_amount: deductTds ? tdsAmount : 0,
                    received_amount: deductTds ? receivedAmount : amount
                })
            });
            onSuccess();
            onClose();
            // Reset state
            setTransactionId('');
            setPaymentMethod('BANK_TRANSFER');
            setDeductTds(false);
        } catch (error: any) {
            console.error("Error recording payment:", error);
            const errMsg = error?.message || "Failed to record payment. Please check implementation.";
            toast.error(errMsg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const accentColor = isEditMode ? 'indigo' : 'emerald';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                            isEditMode ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                            <DollarSign size={24} />
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900">
                        {isEditMode ? 'Edit Payment' : 'Record Payment'}
                    </h2>
                    <p className="text-slate-500 mt-1 mb-8">
                        {isEditMode 
                            ? 'Editing payment receipt details for invoice ' 
                            : 'Confirming payment receipt for invoice '
                        }
                        <span className={`${isEditMode ? 'text-indigo-600' : 'text-emerald-600'} font-bold`}>#{invoiceNumber}</span>
                    </p>

                    <div className="bg-slate-50 p-4 rounded-2xl mb-8 flex items-center justify-between border border-slate-100">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                            {isEditMode ? 'Total Amount' : 'Total to Collect'}
                        </p>
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
                                className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 outline-none transition-all font-mono text-sm ${
                                    isEditMode ? 'focus:ring-indigo-500/20 focus:border-indigo-500' : 'focus:ring-emerald-500/20 focus:border-emerald-500'
                                }`}
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
                                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 outline-none transition-all text-sm ${
                                        isEditMode ? 'focus:ring-indigo-500/20 focus:border-indigo-500' : 'focus:ring-emerald-500/20 focus:border-emerald-500'
                                    }`}
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* TDS Deduction Section */}
                        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    className={`w-4 h-4 rounded border-slate-300 focus:ring-2 cursor-pointer ${
                                        isEditMode ? 'text-indigo-600 focus:ring-indigo-500/20' : 'text-emerald-600 focus:ring-emerald-500/20'
                                    }`}
                                    checked={deductTds}
                                    onChange={(e) => {
                                        setDeductTds(e.target.checked);
                                        if (!e.target.checked) {
                                            setTdsAmount(0);
                                        } else {
                                            const baseAmount = (amount || 0) / 1.18;
                                            const defaultTds = Math.round(baseAmount * 0.1 * 100) / 100;
                                            setTdsAmount(defaultTds);
                                            setReceivedAmount(Math.round(((amount || 0) - defaultTds) * 100) / 100);
                                        }
                                    }}
                                />
                                <div>
                                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Deduct TDS (Withholding)</span>
                                    <span className="text-[9px] text-slate-400 font-medium">Auto-calculates standard 10% TDS withholding.</span>
                                </div>
                            </label>

                            {deductTds && (
                                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200/50 animate-in fade-in duration-200">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">TDS Amount</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 outline-none text-xs font-black font-mono text-slate-700 ${
                                                isEditMode ? 'focus:ring-indigo-500/20 focus:border-indigo-500' : 'focus:ring-emerald-500/20 focus:border-emerald-500'
                                            }`}
                                            value={tdsAmount}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setTdsAmount(val);
                                                setReceivedAmount(Math.round(((amount || 0) - val) * 100) / 100);
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Cheque Amount</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 outline-none text-xs font-black font-mono ${
                                                isEditMode 
                                                    ? 'text-indigo-600 focus:ring-indigo-500/20 focus:border-indigo-500' 
                                                    : 'text-emerald-600 focus:ring-emerald-500/20 focus:border-emerald-500'
                                            }`}
                                            value={receivedAmount}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0;
                                                setReceivedAmount(val);
                                                setTdsAmount(Math.round(((amount || 0) - val) * 100) / 100);
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
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
                                        className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
                                            paymentMethod === method.id
                                                ? isEditMode 
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                    : 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200'
                                                : isEditMode
                                                    ? 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200'
                                        }`}
                                    >
                                        {method.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            disabled={loading || deleteLoading || !transactionId}
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white py-4 rounded-2xl font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                            {isEditMode ? 'Update Payment Details' : 'Confirm & Record Payment'}
                        </button>

                        {canDeletePayment && (
                            <button
                                type="button"
                                disabled={loading || deleteLoading}
                                onClick={handleDeletePayment}
                                className="w-full mt-3 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 disabled:opacity-50 text-red-600 hover:text-red-700 py-3.5 rounded-2xl font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {deleteLoading ? (
                                    <Loader2 size={18} className="animate-spin text-red-600" />
                                ) : (
                                    <Trash2 size={18} className="text-red-500" />
                                )}
                                Delete Payment Record
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
