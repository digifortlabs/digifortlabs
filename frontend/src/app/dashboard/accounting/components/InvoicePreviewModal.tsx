"use client";

import React, { useState, useEffect } from 'react';
import {
    X,
    Download,
    Printer,
    Mail,
    Building2,
    Calendar,
    Receipt,
    CheckCircle2,
    Loader2,
    FileText,
    Percent,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { apiFetch } from '@/config/api';

import InvoiceRenderer from '@/components/InvoiceRenderer';

interface InvoicePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoiceId: number | null;
}

export default function InvoicePreviewModal({ isOpen, onClose, invoiceId }: InvoicePreviewModalProps) {
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);

    useEffect(() => {
        if (isOpen && invoiceId) {
            fetchInvoiceDetails();
        }
    }, [isOpen, invoiceId]);

    const fetchInvoiceDetails = async () => {
        setLoading(true);
        try {
            const data = await apiFetch(`/accounting/${invoiceId}`);
            setInvoice(data);
        } catch (error) {
            console.error("Error fetching invoice details:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    const handleSendEmail = async () => {
        if (!invoiceId) return;
        setEmailLoading(true);
        try {
            await apiFetch(`/accounting/${invoiceId}/send-email`, { method: 'POST' });
            alert("Invoice email sent successfully!");
        } catch (error) {
            alert("Failed to send invoice email.");
        } finally {
            setEmailLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/40 backdrop-blur-sm print:p-0 print:bg-white print:overflow-visible">
            <div className="min-h-full flex items-start justify-center p-4 md:p-8 print:p-0">
                <div className="bg-white w-full max-w-fit rounded-3xl shadow-2xl flex flex-col overflow-hidden a4-container print:my-0 print:mx-0 print:rounded-none print:overflow-visible print:w-full relative">
                    {/* Modal Toolbar (Non-printable) */}
                    <div className="sticky top-0 z-[70] px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between print:hidden">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                                <Receipt size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 leading-tight">
                                    {invoice?.is_gst_bill ? 'Tax Invoice Preview' : 'Bill of Supply Preview'}
                                </h2>
                                <p className="text-xs text-slate-500">{invoice?.invoice_number || 'Loading...'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSendEmail}
                                disabled={emailLoading || !invoice}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                            >
                                {emailLoading ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}
                                Send Email
                            </button>
                            <button
                                onClick={handlePrint}
                                disabled={!invoice}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                <Printer size={16} />
                                Print / PDF
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors ml-2"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Invoice Content Area */}
                    <div className="p-8 md:p-12 bg-slate-50 print:p-0 print:bg-white min-h-[500px] flex justify-center">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-40 gap-4 text-slate-400">
                                <Loader2 className="animate-spin" size={40} />
                                <p className="font-medium animate-pulse">Preparing high-fidelity render...</p>
                            </div>
                        ) : !invoice ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-rose-500 bg-white m-12 rounded-2xl shadow-xl p-12 max-w-md text-center">
                                <AlertCircle size={48} />
                                <p className="font-bold text-lg text-slate-900">Failed to load invoice</p>
                                <p className="text-sm text-slate-500 leading-relaxed">The invoice might have been deleted or there was a secure connection error.</p>
                                <button
                                    onClick={fetchInvoiceDetails}
                                    className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <InvoiceRenderer invoice={invoice} itemsPerPage={25} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
