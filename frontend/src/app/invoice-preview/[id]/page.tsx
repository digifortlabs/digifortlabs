"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Printer,
    Mail,
    Receipt,
    Loader2,
    AlertCircle,
    ChevronLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { apiFetch } from '@/config/api';

// --- CONSTANTS ---
const ITEMS_PER_PAGE = 25; // Exact count to ensure footer availability

import InvoiceRenderer from '@/components/InvoiceRenderer';

export default function InvoicePreviewPage() {
    const params = useParams();
    const router = useRouter();
    const invoiceId = params.id;

    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [emailLoading, setEmailLoading] = useState(false);
    const [zoom, setZoom] = useState(0.8);

    // Zoom Handlers
    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));

    useEffect(() => {
        if (invoiceId) fetchInvoiceDetails();
    }, [invoiceId]);

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

    const handlePrint = () => window.print();

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

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 text-slate-400">
                <Loader2 className="animate-spin" size={48} />
                <p className="font-bold text-lg text-slate-900">Preparing high-fidelity render...</p>
                <p className="text-sm">Scaling to A4 dimensions for perfect printing.</p>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-12 rounded-3xl shadow-xl flex flex-col items-center max-w-md text-center gap-6">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center"><AlertCircle size={40} /></div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900">Invoice Not Found</h1>
                        <p className="text-slate-500">The invoice you are looking for may have been deleted or moved.</p>
                    </div>
                    <button onClick={() => router.back()} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">
                        <ChevronLeft size={20} /> Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 print:bg-white print:h-auto print:block flex flex-col items-center font-sans antialiased text-slate-900 pb-20">
            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { 
                        margin: 0; padding: 0; 
                        background: white !important; 
                        width: 100%; height: auto;
                        -webkit-print-color-adjust: exact; print-color-adjust: exact; 
                    }
                    html { background: white !important; }
                    .print-hidden { display: none !important; }
                }
            `}</style>

            {/* TOOLBAR */}
            <div className="sticky top-4 z-[100] w-full max-w-[210mm] px-4 print:hidden mb-12">
                <div className="bg-white/80 backdrop-blur-xl border border-white p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 leading-tight">
                                {invoice?.is_gst_bill ? 'Tax Invoice Preview' : 'Bill of Supply Preview'}
                            </h2>
                            <p className="text-[10px] text-slate-500 font-mono tracking-tighter">{invoice.invoice_number}</p>
                        </div>
                    </div>
                    {/* Zoom */}
                    <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/50">
                        <button onClick={handleZoomOut} className="p-1.5 hover:bg-white rounded-md text-slate-500 transition-all shadow-sm"><span className="text-xs font-bold">-</span></button>
                        <span className="text-[10px] font-black text-slate-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
                        <button onClick={handleZoomIn} className="p-1.5 hover:bg-white rounded-md text-slate-500 transition-all shadow-sm"><span className="text-xs font-bold">+</span></button>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button onClick={handleSendEmail} disabled={emailLoading} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">
                            {emailLoading ? <Loader2 className="animate-spin" size={14} /> : <Mail size={14} />} Email
                        </button>
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                            <Printer size={14} /> Print / PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* SCALABLE CONTAINER */}
            <div
                style={{
                    transform: typeof window !== 'undefined' && window.innerWidth < 768 ? 'scale(0.4)' : `scale(${zoom})`,
                    transformOrigin: 'top center'
                }}
                className="transition-transform duration-300 ease-out flex flex-col items-center gap-12 print:!block print:!gap-0 print:!transform-none print:!bg-white print:!w-full"
            >
                <InvoiceRenderer invoice={invoice} itemsPerPage={25} />
            </div>
        </div>
    );
}
