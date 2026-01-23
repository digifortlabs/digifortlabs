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

    const subtotal = invoice?.items?.reduce((acc: number, item: any) => acc + item.amount, 0) || 0;
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;

    // Grouping logic for summary table
    const fileItems = invoice?.items?.filter((i: any) => i.file_id) || [];
    const nonFileItems = invoice?.items?.filter((i: any) => !i.file_id && i.description !== "One-time Registration Fee") || [];
    const regFeeItem = invoice?.items?.find((i: any) => i.description === "One-time Registration Fee");

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/80 backdrop-blur-md print:p-0 print:bg-white print:overflow-visible">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        -webkit-print-color-adjust: exact;
                    }
                    .print-hidden {
                        display: none !important;
                    }
                    .a4-container {
                        box-shadow: none !important;
                        margin: 0 !important;
                        border: none !important;
                    }
                }
            `}</style>

            <div className="min-h-full flex items-start justify-center p-4 md:p-8">
                <div className="bg-white w-full max-w-[230mm] rounded-3xl shadow-2xl flex flex-col overflow-hidden a4-container print:my-0 print:rounded-none print:overflow-visible">
                    {/* Modal Toolbar (Non-printable) */}
                    <div className="sticky top-0 z-[70] px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print-hidden">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                                <Receipt size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 leading-tight">Tax Invoice Preview</h2>
                                <p className="text-xs text-slate-500">{invoice?.invoice_number} • A4 Layout</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSendEmail}
                                disabled={emailLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors"
                            >
                                {emailLoading ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}
                                Send Email
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors"
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
                    <div className="p-8 bg-slate-100/50 print:p-0 print:bg-white flex flex-col items-center">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
                                <Loader2 className="animate-spin" size={40} />
                                <p className="font-medium">Scaling to A4 dimensions...</p>
                            </div>
                        ) : !invoice ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-rose-500 bg-white m-12 rounded-2xl shadow-xl p-12">
                                <AlertCircle size={48} />
                                <p className="font-bold text-lg text-slate-900">Failed to load invoice details</p>
                                <p className="text-sm text-slate-500">The invoice might have been deleted or there was a server error.</p>
                                <button
                                    onClick={fetchInvoiceDetails}
                                    className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            /* THE ACTUAL TAX INVOICE GRID (Strict A4: 210mm x 297mm) */
                            <div
                                id="invoice-render"
                                className="bg-white shadow-2xl p-12 border border-slate-200 print:shadow-none print:border-none print:p-12 print:mx-0 w-[210mm] min-h-[297mm] print:min-h-0 box-border mb-12"
                            >
                                {/* Brand Header */}
                                <div className="flex justify-between items-start mb-8">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src="/logo/longlogo.png"
                                                alt="Digifort Labs"
                                                className="h-16 w-auto object-contain"
                                                onError={(e) => {
                                                    // Fallback to text if image fails
                                                    (e.target as any).style.display = 'none';
                                                    const parent = (e.target as any).parentElement;
                                                    const h1 = document.createElement('h1');
                                                    h1.className = "text-2xl font-black text-indigo-900 tracking-tight";
                                                    h1.innerText = "DIGIFORT LABS";
                                                    parent.appendChild(h1);
                                                }}
                                            />
                                        </div>
                                        <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">Empowering Healthcare Providers</p>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-lg font-bold text-slate-800">Digifort Labs Pvt. Ltd.</h2>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">
                                            A-502, Tech Park, GIDC Estate,<br />
                                            Vapi 396191, Gujarat, India.<br />
                                            Contact: +91 99999 88888
                                        </p>
                                    </div>
                                </div>

                                {/* Tax Invoice Banner */}
                                <div className="bg-slate-900/90 text-white text-center py-2 font-bold tracking-[0.2em] mb-0 text-xs border border-slate-900 uppercase">
                                    Tax Invoice (Original for Recipient)
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 border-x border-b border-slate-900">
                                    <div className="p-4 border-r border-slate-900">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Customer Details</h3>
                                        <div className="font-bold text-slate-900 text-sm">{invoice.hospital_name}</div>
                                        <div className="text-[11px] text-slate-600 mt-1 space-y-1 leading-relaxed">
                                            <p>{invoice.hospital_address || '-'}</p>
                                            <p>{invoice.hospital_city || '-'}, {invoice.hospital_state || '-'} {invoice.hospital_pincode || ''}</p>
                                            <div className="pt-2">
                                                <p><span className="text-slate-400 font-bold uppercase mr-2">GSTIN:</span><span className="font-bold text-slate-900">{invoice.hospital_gst || 'URD'}</span></p>
                                                <p><span className="text-slate-400 font-bold uppercase mr-2">PAN:</span><span className="font-bold text-slate-900">{invoice.hospital_pan || '-'}</span></p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Invoice Details</h3>
                                        <div className="text-[11px] space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 font-bold uppercase">Invoice No:</span>
                                                <span className="font-black text-slate-900">{invoice.invoice_number}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 font-bold uppercase">Date:</span>
                                                <span className="font-bold">{format(new Date(invoice.bill_date || invoice.created_at), 'dd-MMM-yyyy')}</span>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t border-slate-100">
                                                <span className="text-slate-500 font-bold uppercase tracking-tighter">Place of Supply:</span>
                                                <span className="font-bold text-slate-900 uppercase">GUJARAT (24)</span>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t border-slate-100">
                                                <span className="text-slate-500 font-bold uppercase text-[9px]">Company PAN:</span>
                                                <span className="font-bold">AAFCD9999A</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500 font-bold uppercase text-[9px]">Company GSTIN:</span>
                                                <span className="font-bold">{invoice.company_gst || '24AAFCD9999A1ZP'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary Table Header */}
                                <div className="bg-slate-100 p-2 text-center text-xs font-black uppercase tracking-widest border-x border-slate-900 border-b">
                                    Summary Table for all charges
                                </div>

                                {/* Summary Items */}
                                <table className="w-full text-xs border-collapse border-x border-b border-slate-900">
                                    <thead className="bg-slate-50">
                                        <tr className="border-b border-slate-900">
                                            <th className="p-2 border-r border-slate-900 w-12 font-black">Sr</th>
                                            <th className="p-2 border-r border-slate-900 text-left font-black">Description of Service</th>
                                            <th className="p-2 border-r border-slate-900 w-24 font-black">SAC code</th>
                                            <th className="p-2 border-r border-slate-900 w-24 text-right font-black">Gross</th>
                                            <th className="p-2 border-r border-slate-900 w-20 text-right font-black">Disc.</th>
                                            <th className="p-2 w-28 text-right font-black">Net Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Handle Registration Fee first */}
                                        {regFeeItem && (
                                            <tr className="border-b border-slate-200">
                                                <td className="p-2 border-r border-slate-900 text-center font-bold">1</td>
                                                <td className="p-2 border-r border-slate-900 font-medium">{regFeeItem.description}</td>
                                                <td className="p-2 border-r border-slate-900 text-center">{regFeeItem.hsn_code || '998311'}</td>
                                                <td className="p-2 border-r border-slate-900 text-right text-slate-400">{(regFeeItem.amount + (regFeeItem.discount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-2 border-r border-slate-900 text-right text-slate-400">{(regFeeItem.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="p-2 text-right font-bold">{regFeeItem.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        )}

                                        {/* Handle Grouped Files */}
                                        {fileItems.length > 0 && (
                                            <tr className="border-b border-slate-200">
                                                <td className="p-2 border-r border-slate-900 text-center font-bold">{regFeeItem ? 2 : 1}</td>
                                                <td className="p-2 border-r border-slate-900 font-medium">Processing & Digitization of {fileItems.length} Patient Records</td>
                                                <td className="p-2 border-r border-slate-900 text-center">998311</td>
                                                <td className="p-2 border-r border-slate-900 text-right text-slate-400">
                                                    {(fileItems.reduce((acc: number, item: any) => acc + item.amount + (item.discount || 0), 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-2 border-r border-slate-900 text-right text-slate-400">
                                                    {(fileItems.reduce((acc: number, item: any) => acc + (item.discount || 0), 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-2 text-right font-bold">
                                                    {fileItems.reduce((acc: number, item: any) => acc + item.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        )}

                                        {/* Handle Custom Items */}
                                        {nonFileItems.map((item: any, idx: number) => {
                                            const startIdx = (regFeeItem ? 1 : 0) + (fileItems.length > 0 ? 1 : 0) + 1;
                                            return (
                                                <tr key={idx} className="border-b border-slate-200 last:border-b-0">
                                                    <td className="p-2 border-r border-slate-900 text-center font-bold">{startIdx + idx}</td>
                                                    <td className="p-2 border-r border-slate-900 font-medium">{item.description}</td>
                                                    <td className="p-2 border-r border-slate-900 text-center">{item.hsn_code || '998311'}</td>
                                                    <td className="p-2 border-r border-slate-900 text-right text-slate-400">{(item.amount + (item.discount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="p-2 border-r border-slate-900 text-right text-slate-400">{(item.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="p-2 text-right font-bold">{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            );
                                        })}

                                        {/* Spacing Row */}
                                        <tr style={{ height: '40px' }}><td colSpan={6} className="border-r border-slate-900"></td></tr>

                                        {/* Totals Section */}
                                        <tr className="border-t border-slate-900">
                                            <td colSpan={5} className="p-2 border-r border-slate-900 text-right font-black uppercase tracking-tighter">Sub-Total (Excl. taxes)</td>
                                            <td className="p-2 text-right font-black">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr className="text-[10px]">
                                            <td colSpan={5} className="p-1 px-2 border-r border-slate-900 text-right">Central GST (CGST) @ 9.00%</td>
                                            <td className="p-1 px-2 text-right">{cgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr className="text-[10px] border-b border-slate-400">
                                            <td colSpan={5} className="p-1 px-2 border-r border-slate-900 text-right">State GST (SGST) @ 9.00%</td>
                                            <td className="p-1 px-2 text-right">{sgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr className="bg-slate-900 text-white border-b border-slate-900">
                                            <td colSpan={5} className="p-2 border-r border-slate-900 text-right font-black uppercase tracking-widest">Total Invoice Value (Incl. Tax)</td>
                                            <td className="p-2 text-right font-black text-sm">₹{(subtotal + cgst + sgst).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={6} className="p-4 bg-slate-50 italic font-black text-[10px] uppercase border-b border-slate-900">
                                                Total Amount in Words: {invoice.amount_in_words || 'N/A'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Bank Details */}
                                <div className="grid grid-cols-3 mt-12 border border-slate-900">
                                    <div className="col-span-2 p-6 border-r border-slate-900 bg-slate-50/50">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-3 bg-indigo-600 rounded-full"></div>
                                            Service Provider Bank Details
                                        </h3>
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[11px]">
                                            <div>
                                                <span className="text-slate-400 font-bold uppercase block text-[9px]">Bank Name</span>
                                                <span className="font-black text-slate-800">HDFC Bank Ltd.</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 font-bold uppercase block text-[9px]">IFS Code</span>
                                                <span className="font-black text-slate-800 tracking-wider">HDFC0001234</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 font-bold uppercase block text-[9px]">Account Number</span>
                                                <span className="font-black text-slate-800 tracking-widest">50200012345678</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 font-bold uppercase block text-[9px]">Account Name</span>
                                                <span className="font-black text-slate-800 uppercase">Digifort Labs Pvt. Ltd.</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 text-center flex flex-col justify-between items-center">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Common Seal / Signature</span>
                                        <div className="w-24 h-24 border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center -rotate-12 italic text-slate-300 font-bold text-[10px]">
                                            DIGITALLY SIGNED
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-700 uppercase">Authorised Signatory</span>
                                    </div>
                                </div>

                                {/* Terms */}
                                <div className="mt-6 text-[9px] text-slate-400 space-y-1 italic leading-tight">
                                    <p>* This is a Digital Tax Invoice and does not require a physical stamp or signature under IT Act 2000.</p>
                                    <p>* Goods/Services once billed are non-refundable. Subject to Vapi (Gujarat) Jurisdiction.</p>
                                    <p>* Late payment penalty of 1.5% per month will be applicable post 15 days of due date.</p>
                                </div>

                                {/* Footer Branding */}
                                <div className="mt-12 text-center pt-6 border-t border-slate-100 flex justify-between items-center opacity-40 grayscale">
                                    <span className="text-[9px] font-black tracking-widest cursor-default">WWW.DIGIFORTLABS.COM</span>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 bg-slate-900 rounded-full"></div>
                                        <div className="w-1 h-1 bg-slate-900 rounded-full"></div>
                                        <div className="w-1 h-1 bg-slate-900 rounded-full"></div>
                                    </div>
                                    <span className="text-[9px] font-black tracking-widest cursor-default uppercase">Secure Health Cloud</span>
                                </div>

                                {/* Detailed Records Listing (Page Breakdown Style) - FORCE NEW PAGE */}
                                <div className="mt-20 print:before:break-before-page">
                                    <div className="bg-slate-900 text-white px-6 py-3 font-black text-[10px] uppercase tracking-[0.3em] mb-4 flex justify-between items-center">
                                        <span>Invoiced Record Details Summary</span>
                                        <span className="text-[8px] font-normal tracking-normal opacity-50">Total Records: {fileItems.length}</span>
                                    </div>
                                    <table className="w-full text-[10px] border-collapse border border-slate-900">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="p-2 border border-slate-900 w-12 font-bold uppercase text-[9px] text-center">Sr</th>
                                                <th className="p-2 border border-slate-900 text-left font-bold uppercase text-[9px] w-28">Record Id</th>
                                                <th className="p-2 border border-slate-900 text-left font-bold uppercase text-[9px]">MRD No / Patient Name</th>
                                                <th className="p-2 border border-slate-900 text-right font-bold uppercase text-[9px] w-24">Gross</th>
                                                <th className="p-2 border border-slate-900 text-right font-bold uppercase text-[9px] w-20">Disc.</th>
                                                <th className="p-2 border border-slate-900 text-right font-bold uppercase text-[9px] w-24">Net Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-300">
                                            {fileItems.map((item: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td className="p-1.5 border-x border-slate-300 text-center font-bold text-slate-400">{idx + 1}</td>
                                                    <td className="p-1.5 border-x border-slate-300 font-black text-indigo-900">FILE-{item.file_id}</td>
                                                    <td className="p-1.5 border-x border-slate-300">
                                                        <span className="font-bold text-slate-700">{item.description.replace('Processing MRD: ', '')}</span>
                                                    </td>
                                                    <td className="p-1.5 border-x border-slate-300 text-right text-slate-400">₹{(item.amount + (item.discount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="p-1.5 border-x border-slate-300 text-right text-slate-400">₹{(item.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="p-1.5 border-x border-slate-300 text-right font-bold">₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        {fileItems.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-slate-400 italic font-bold">No patient files linked to this invoice.</td>
                                            </tr>
                                        )}
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
