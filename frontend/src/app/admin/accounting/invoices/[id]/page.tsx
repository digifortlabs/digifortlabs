"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/config/api';
import toast from 'react-hot-toast';
import { 
    Printer, Mail, Loader2, ChevronLeft, ShieldCheck, FileText, Send, Receipt
} from 'lucide-react';


export default function PatientInvoicePreviewPage() {
    const params = useParams();
    const router = useRouter();
    const invoiceId = params?.id;

    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [emailLoading, setEmailLoading] = useState(false);
    const [whatsappLoading, setWhatsappLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [zoom, setZoom] = useState(0.85);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.05, 1.3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.05, 0.6));

    useEffect(() => {
        if (invoiceId) {
            fetchInvoiceDetails();
        }
    }, [invoiceId]);

    const fetchInvoiceDetails = async () => {
        try {
            setLoading(true);
            const data = await apiFetch(`/patient-billing/invoices/${invoiceId}`);
            setInvoice(data);
        } catch (error: any) {
            console.error('Failed to load invoice:', error);
            toast.error(error.message || 'Failed to load invoice');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => window.print();

    const handleSendEmail = async () => {
        if (!invoiceId) return;
        setEmailLoading(true);
        try {
            await apiFetch(`/patient-billing/invoices/${invoiceId}/send-email`, { method: 'POST' });
            toast.success("Invoice statement emailed to patient successfully!");
            setEmailSent(true);
        } catch (error: any) {
            toast.error(error.message || "Failed to send invoice email.");
        } finally {
            setEmailLoading(false);
        }
    };

    const handleSendWhatsApp = async () => {
        if (!invoiceId) return;
        setWhatsappLoading(true);
        try {
            await apiFetch(`/patient-billing/invoices/${invoiceId}/send-whatsapp`, { method: 'POST' });
            toast.success("Invoice PDF statement link sent via WhatsApp!");
        } catch (error: any) {
            toast.error(error.message || "Failed to send WhatsApp message.");
        } finally {
            setWhatsappLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-slate-400">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
                <p className="font-bold text-lg text-slate-900">Preparing Print Invoice Renderer...</p>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-12 rounded-3xl shadow-xl flex flex-col items-center max-w-md text-center gap-6">
                    <h1 className="text-2xl font-bold text-slate-900">Invoice Not Found</h1>
                    <button onClick={() => router.push('/hospital/accounting')} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">
                        Back to Billing
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 print:bg-white print:h-auto print:block flex flex-col items-center pb-20 pt-6">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    body { 
                        margin: 0; padding: 0; 
                        background: white !important; 
                        width: 100%; height: auto;
                        -webkit-print-color-adjust: exact; print-color-adjust: exact; 
                    }
                    html { background: white !important; }
                    .print-hidden { display: none !important; }
                }
            `}} />

            {/* TOOLBAR */}
            <div className="sticky top-4 z-[100] w-full max-w-[210mm] px-4 print:hidden mb-6">
                <div className="bg-white/90 backdrop-blur-md border border-slate-200/50 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/hospital/accounting')} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-sm font-black text-slate-900 leading-tight">Patient Invoice Preview</h2>
                            <p className="text-[10px] text-slate-500 font-mono tracking-tighter">{invoice.invoice_number}</p>
                        </div>
                    </div>
                    {/* Zoom */}
                    <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/50">
                        <button onClick={handleZoomOut} className="px-2 py-1 hover:bg-white rounded-md text-xs font-bold text-slate-600 transition-all">-</button>
                        <span className="text-[10px] font-black text-slate-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
                        <button onClick={handleZoomIn} className="px-2 py-1 hover:bg-white rounded-md text-xs font-bold text-slate-600 transition-all">+</button>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button onClick={handleSendEmail} disabled={emailLoading} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">
                            {emailLoading ? <Loader2 className="animate-spin" size={14} /> : <Mail size={14} />} Email Statement
                        </button>
                        <button 
                            onClick={handleSendWhatsApp} 
                            disabled={whatsappLoading}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                                emailSent 
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" 
                                : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                            }`}
                        >
                            {whatsappLoading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />} Send via WhatsApp
                        </button>
                        <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-lg">
                            <Printer size={14} /> Print Bill
                        </button>
                    </div>
                </div>
            </div>

            {/* SCALABLE CONTAINER (A4 Layout) */}
            <div 
                style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top center',
                    width: '210mm',
                    height: '297mm',
                }}
                className="transition-transform duration-300 ease-out bg-white shadow-2xl border border-slate-200 print:shadow-none print:border-none print:m-0 print:!transform-none print:!w-full print:!h-auto px-[15mm] py-[12mm] flex flex-col justify-between"
            >
                <div>
                    {/* Invoice Brand Header */}
                    <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg">
                                <Receipt size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-slate-900 tracking-tight">Dixit Hospital</h1>
                                <p className="text-[10px] text-slate-500 font-medium">Empowering Healthcare Providers</p>
                            </div>
                        </div>
                        <div className="text-right text-[10px] text-slate-500 leading-relaxed">
                            <p className="font-bold text-slate-800 text-sm">Dixit Hospital & Clinic</p>
                            <p>Sector-4, GIDC Ind. Estate, Vapi</p>
                            <p>Gujarat, India. Pin: 396191</p>
                            <p>Phone: +91 260 2401234</p>
                        </div>
                    </div>

                    {/* Banner Title */}
                    <div className="bg-slate-900 text-white text-center py-1.5 font-black tracking-[0.2em] text-[9px] uppercase mb-6 rounded-md">
                        Patient Medical Statement / Tax Invoice
                    </div>

                    {/* Details Panel */}
                    <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-xl overflow-hidden mb-6 p-4 bg-slate-50/50">
                        <div className="space-y-1.5 text-xs">
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Patient Details</p>
                            <p className="text-sm font-black text-slate-900">{invoice.patient_name}</p>
                            <p className="text-slate-600"><span className="font-bold">MRD Number:</span> {invoice.mrd_number}</p>
                            <p className="text-slate-600"><span className="font-bold">Date of Bill:</span> {new Date(invoice.bill_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="space-y-1.5 text-xs text-right">
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Invoice Info</p>
                            <p className="text-sm font-mono font-black text-indigo-600">{invoice.invoice_number}</p>
                            <p className="text-slate-600"><span className="font-bold">Status:</span> <span className="font-bold text-emerald-600 uppercase">{invoice.status}</span></p>
                            <p className="text-slate-600"><span className="font-bold">Payment Mode:</span> {invoice.payment_method || 'CASH'}</p>
                        </div>
                    </div>

                    {/* Table of items */}
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-900 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                                <th className="py-2 pl-2">Sr.</th>
                                <th className="py-2">Description</th>
                                <th className="py-2">Type</th>
                                <th className="py-2 text-center">Qty</th>
                                <th className="py-2 text-right">Price</th>
                                <th className="py-2 text-right">Disc</th>
                                <th className="py-2 text-right pr-2">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoice.items && invoice.items.map((item: any, idx: number) => (
                                <tr key={item.item_id} className="hover:bg-slate-50/50">
                                    <td className="py-3 pl-2 font-bold text-slate-400">{(idx + 1).toString().padStart(2, '0')}</td>
                                    <td className="py-3 font-semibold text-slate-900">{item.description}</td>
                                    <td className="py-3 text-slate-500 font-bold text-[10px]">{item.charge_type.replace('_', ' ')}</td>
                                    <td className="py-3 text-center font-semibold">{item.qty}</td>
                                    <td className="py-3 text-right font-medium">₹ {item.unit_price.toLocaleString()}</td>
                                    <td className="py-3 text-right text-rose-600 font-medium">₹ {item.discount.toLocaleString()}</td>
                                    <td className="py-3 text-right font-bold text-slate-900 pr-2">₹ {item.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer totals & Guideline */}
                <div className="mt-8 border-t border-slate-200 pt-6">
                    <div className="flex justify-between items-start gap-8">
                        {/* Policy block */}
                        <div className="flex-1 text-[10px] text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                            <p className="font-bold text-slate-800 mb-1">Billing Guidelines & Remarks:</p>
                            <p>1. Payments are credited immediately; verify payment receipt status on dashboard.</p>
                            <p>2. This billing includes consultation fees, stay durations, and laboratory test charges.</p>
                            <p>3. This document is a digitally compiled tax invoice requiring no physical signature.</p>
                            {invoice.remarks && <p className="mt-2 text-indigo-700 italic"><b>Remarks:</b> {invoice.remarks}</p>}
                        </div>

                        {/* Summary Block */}
                        <div className="w-64 space-y-2 text-xs">
                            <div className="flex justify-between text-slate-500 font-medium">
                                <span>Subtotal:</span>
                                <span>₹ {invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-slate-500 font-medium">
                                <span>GST ({invoice.gst_rate}%):</span>
                                <span>₹ {invoice.tax_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-rose-600 font-medium">
                                <span>Discount:</span>
                                <span>- ₹ {invoice.discount_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-900 text-white p-3 rounded-xl font-bold mt-2">
                                <span className="uppercase text-[9px] tracking-wider">Total Billed</span>
                                <span className="text-base">₹ {invoice.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Authorized Signatory */}
                    <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-100">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">DIXIT HMS BILLING SYSTEM</span>
                        <div className="flex items-center gap-8">
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 border-2 border-slate-900/10 rounded-full flex items-center justify-center -rotate-12 italic text-slate-300 font-black text-[9px] uppercase tracking-tighter">
                                    Verified
                                </div>
                                <p className="text-[10px] font-black text-slate-800 mt-1">Authorized Signatory</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
