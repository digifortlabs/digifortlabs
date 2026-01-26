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
const ITEMS_PER_PAGE = 20; // Exact count to ensure footer availability

// --- REUSABLE COMPONENTS ---

const InvoiceHeader = () => (
    <div className="flex justify-between items-start mb-8">
        <div className="space-y-1">
            <div className="flex items-center gap-3">
                <img
                    src="/logo/longlogo.png"
                    alt="Digifort Labs"
                    className="h-16 w-auto object-contain"
                    onError={(e) => {
                        (e.target as any).style.display = 'none';
                        const parent = (e.target as any).parentElement;
                        const h1 = document.createElement('h1');
                        h1.className = "text-2xl font-black text-indigo-900 tracking-tight";
                        h1.innerText = "DIGIFORT LABS";
                        parent.appendChild(h1);
                    }}
                />
            </div>
            <p className="text-[11px] uppercase tracking-widest font-black text-slate-400">Empowering Healthcare Providers</p>
        </div>
        <div className="text-right">
            <h2 className="text-xl font-black text-slate-900 leading-tight">Digifort Labs Pvt. Ltd.</h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] ml-auto">
                A-502, Tech Park, GIDC Estate,<br />
                Vapi 396191, Gujarat, India.<br />
                Contact: +91 99999 88888
            </p>
        </div>
    </div>
);

const InvoiceFooter = () => (
    <div className="mt-auto text-center pt-8 border-t border-slate-100 flex justify-between items-center opacity-30">
        <span className="text-[9px] font-black tracking-[0.3em] text-slate-900">DIGIFORTLABS.COM</span>
        <div className="flex items-center gap-1.5 grayscale">
            <Receipt size={12} />
            <span className="text-[10px] font-bold uppercase">Automated Billing System v2.0</span>
        </div>
        <span className="text-[9px] font-black tracking-[0.3em] text-slate-900">SECURE HEALTH CLOUD</span>
    </div>
);

const InvoicePageWrapper = ({ children, className = "", breakAfter = true }: { children: React.ReactNode, className?: string, breakAfter?: boolean }) => (
    <div className={`bg-white shadow-2xl border border-slate-200 print:shadow-none print:border-none print:m-0 w-[210mm] h-[297mm] print:w-full print:h-auto relative overflow-hidden flex flex-col px-[15mm] py-[15mm] print:px-[15mm] print:py-[15mm] ${breakAfter ? 'print:break-after-page' : ''} ${className}`}>
        <InvoiceHeader />
        {children}
        <InvoiceFooter />
    </div>
);

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
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-slate-400">
                <Loader2 className="animate-spin" size={48} />
                <p className="font-bold text-lg">Preparing your Tax Invoice...</p>
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

    // --- CALCULATIONS ---
    const subtotal = invoice?.items?.reduce((acc: number, item: any) => acc + item.amount, 0) || 0;
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;

    const fileItems = invoice?.items?.filter((i: any) => i.file_id) || [];
    const nonFileItems = invoice?.items?.filter((i: any) => !i.file_id && i.description !== "One-time Registration Fee") || [];
    const regFeeItem = invoice?.items?.find((i: any) => i.description === "One-time Registration Fee");

    // Chunk logic for Annexure Pages
    const chunkedFileItems = [];
    for (let i = 0; i < fileItems.length; i += ITEMS_PER_PAGE) {
        chunkedFileItems.push(fileItems.slice(i, i + ITEMS_PER_PAGE));
    }

    return (
        <div className="min-h-screen bg-slate-100/50 print:bg-white print:h-auto print:block flex flex-col items-center font-sans antialiased text-slate-900 pb-20">
            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { 
                        margin: 0; padding: 0; 
                        background: white !important; 
                        width: 100%; height: 100vh;
                        -webkit-print-color-adjust: exact; print-color-adjust: exact; 
                    }
                    html { background: white !important; width: 100%; height: 100vh; }
                    .print-hidden { display: none !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>

            {/* TOOLBAR */}
            <div className="sticky top-4 z-[100] w-full max-w-[210mm] px-4 print-hidden mb-8">
                <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-3 rounded-2xl shadow-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => window.close()} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 leading-tight">Invoice Preview</h2>
                            <p className="text-[10px] text-slate-500 font-mono tracking-tighter">{invoice.invoice_number}</p>
                        </div>
                    </div>
                    {/* Zoom */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        <button onClick={handleZoomOut} className="p-1.5 hover:bg-white rounded-md text-slate-500 transition-all shadow-sm"><span className="text-xs font-bold">-</span></button>
                        <span className="text-[10px] font-bold text-slate-600 w-8 text-center">{Math.round(zoom * 100)}%</span>
                        <button onClick={handleZoomIn} className="p-1.5 hover:bg-white rounded-md text-slate-500 transition-all shadow-sm"><span className="text-xs font-bold">+</span></button>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button onClick={handleSendEmail} disabled={emailLoading} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">
                            {emailLoading ? <Loader2 className="animate-spin" size={14} /> : <Mail size={14} />} Email
                        </button>
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                            <Printer size={14} /> Print
                        </button>
                    </div>
                </div>
            </div>

            {/* SCALABLE CONTAINER */}
            <div
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                className="transition-transform duration-200 ease-out flex flex-col items-center gap-8 print:!block print:!gap-0 print:!transform-none print:!bg-white"
            >
                {/* --- PAGE 1: SUMMARY --- */}
                <InvoicePageWrapper breakAfter={chunkedFileItems.length > 0}>
                    <div className="bg-slate-900 text-white text-center py-2.5 font-black tracking-[0.3em] mb-0 text-xs uppercase border border-slate-900">
                        {invoice.is_gst_bill !== false ? "Tax Invoice (Original for Recipient)" : "Bill of Supply (Original for Recipient)"}
                    </div>

                    <div className="grid grid-cols-2 border-x border-b border-slate-900">
                        <div className="p-6 border-r border-slate-900">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Customer Details (Billed To)</h3>
                            <div className="font-black text-slate-900 text-lg">{invoice.hospital_name}</div>
                            <div className="text-xs text-slate-600 mt-2 space-y-1 leading-relaxed">
                                <p className="font-medium">{invoice.hospital_address || '-'}</p>
                                <p className="font-medium">{invoice.hospital_city || '-'}, {invoice.hospital_state || '-'} {invoice.hospital_pincode || ''}</p>
                                <div className="pt-3 space-y-1">
                                    <p><span className="text-slate-400 font-bold uppercase mr-2 text-[10px]">GSTIN/UIN:</span><span className="font-black text-slate-900">{invoice.hospital_gst || 'URD'}</span></p>
                                    <p><span className="text-slate-400 font-bold uppercase mr-2 text-[10px]">PAN:</span><span className="font-black text-slate-900">{invoice.hospital_pan || '-'}</span></p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Invoice & Payment Details</h3>
                            <div className="text-xs space-y-3">
                                <div className="flex justify-between items-center"><span className="text-slate-500 font-bold uppercase text-[10px]">Invoice Number:</span><span className="font-black text-slate-900 text-base tracking-tight">{invoice.invoice_number}</span></div>
                                <div className="flex justify-between items-center"><span className="text-slate-500 font-bold uppercase text-[10px]">Bill Date:</span><span className="font-black text-slate-900">{format(new Date(invoice.bill_date || invoice.created_at), 'dd-MMM-yyyy')}</span></div>
                                <div className="flex justify-between items-center pt-3 border-t border-slate-100"><span className="text-slate-500 font-bold uppercase text-[10px]">Place of Supply:</span><span className="font-black text-slate-900 uppercase">GUJARAT (24)</span></div>
                                <div className="flex justify-between items-center"><span className="text-slate-500 font-bold uppercase text-[10px]">Company PAN:</span><span className="font-black text-slate-900">AAFCD9999A</span></div>
                                <div className="flex justify-between items-center"><span className="text-slate-500 font-bold uppercase text-[10px]">Company GSTIN:</span><span className="font-black text-slate-900 text-base">24AAFCD9999A1ZP</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-2 text-center text-[10px] font-black uppercase tracking-widest border-x border-slate-900 border-b text-slate-400">Summary of Charges & Fees</div>

                    <table className="w-full text-xs border-collapse border-x border-b border-slate-900">
                        <thead className="bg-slate-100/50">
                            <tr className="border-b border-slate-900">
                                <th className="p-3 border-r border-slate-900 w-14 font-black uppercase text-[9px]">Sr.</th>
                                <th className="p-3 border-r border-slate-900 text-left font-black uppercase text-[9px]">Description of Services</th>
                                <th className="p-3 border-r border-slate-900 w-28 font-black uppercase text-[9px] text-center">HSN/SAC</th>
                                <th className="p-3 w-36 text-right font-black uppercase text-[9px]">Amount (INR)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {regFeeItem && (
                                <tr>
                                    <td className="p-3 border-r border-slate-900 text-center font-black text-slate-400">01</td>
                                    <td className="p-3 border-r border-slate-900"><div className="font-black text-slate-800">{regFeeItem.description}</div><div className="text-[9px] text-slate-400 font-bold uppercase">One-time facility setup & registration</div></td>
                                    <td className="p-3 border-r border-slate-900 text-center font-bold">998311</td>
                                    <td className="p-3 text-right font-black text-slate-900">{regFeeItem.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                            )}
                            {fileItems.length > 0 && (
                                <tr>
                                    <td className="p-3 border-r border-slate-900 text-center font-black text-slate-400">{regFeeItem ? '02' : '01'}</td>
                                    <td className="p-3 border-r border-slate-900"><div className="font-black text-slate-800 uppercase">Record Processing Fees</div><div className="text-[10px] text-slate-500 font-bold">Digitization & Cloud Archiving of {fileItems.length} Patient MRDs</div></td>
                                    <td className="p-3 border-r border-slate-900 text-center font-bold">998311</td>
                                    <td className="p-3 text-right font-black text-slate-900">{fileItems.reduce((acc: number, item: any) => acc + item.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                            )}
                            {nonFileItems.map((item: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="p-3 border-r border-slate-900 text-center font-black text-slate-400">{(idx + (regFeeItem ? 1 : 0) + (fileItems.length > 0 ? 1 : 0) + 1).toString().padStart(2, '0')}</td>
                                    <td className="p-3 border-r border-slate-900"><div className="font-black text-slate-800 uppercase">{item.description}</div></td>
                                    <td className="p-3 border-r border-slate-900 text-center font-bold">{item.hsn_code || '998311'}</td>
                                    <td className="p-3 text-right font-black text-slate-900">{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                            {/* TOTALS */}
                            <tr className="border-t-2 border-slate-900">
                                <td colSpan={3} className="p-3 border-r border-slate-900 text-right font-black uppercase text-[10px] tracking-tight text-slate-500">Sub-Total (Taxable Value)</td>
                                <td className="p-3 text-right font-black text-slate-900">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr className="text-[10px] bg-slate-50/50">
                                <td colSpan={3} className="p-2 border-r border-slate-900 text-right font-bold text-slate-500">Central GST (CGST) @ 9.00%</td>
                                <td className="p-2 text-right font-bold text-slate-700">{cgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr className="text-[10px] bg-slate-50/50">
                                <td colSpan={3} className="p-2 border-r border-slate-900 text-right font-bold text-slate-500">State GST (SGST) @ 9.00%</td>
                                <td className="p-2 text-right font-bold text-slate-700">{sgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr className="bg-slate-900 text-white">
                                <td colSpan={3} className="p-3 border-r border-white/20 text-right font-black uppercase tracking-[0.2em] text-[11px]">Total Invoice Value (Inclusive of GST)</td>
                                <td className="p-3 text-right font-black text-base">₹{(subtotal + cgst + sgst).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                                <td colSpan={4} className="p-5 bg-slate-50 border-y border-slate-900">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total in Words</div>
                                    <div className="font-black text-slate-900 text-xs uppercase tracking-tight italic">{invoice.amount_in_words || 'NA'}</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* BANK & SIGNATURE */}
                    <div className="grid grid-cols-3 mt-8 border border-slate-900 overflow-hidden rounded-sm print:break-inside-avoid">
                        <div className="col-span-2 p-8 border-r border-slate-900 bg-slate-50/30">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-slate-400">
                                <div className="w-2 h-4 bg-indigo-600 rounded-sm"></div> Remittance Details
                            </h3>
                            <div className="grid grid-cols-2 gap-x-12 gap-y-5">
                                <div><span className="text-slate-400 font-bold uppercase block text-[8px] tracking-widest mb-1">Bank Name</span><span className="font-black text-slate-900 text-xs">HDFC Bank Ltd.</span></div>
                                <div><span className="text-slate-400 font-bold uppercase block text-[8px] tracking-widest mb-1">IFS Code</span><span className="font-black text-slate-900 text-xs tracking-wider">HDFC0001234</span></div>
                                <div><span className="text-slate-400 font-bold uppercase block text-[8px] tracking-widest mb-1">Account Number</span><span className="font-black text-slate-900 text-sm tracking-[0.2em]">50200012345678</span></div>
                                <div><span className="text-slate-400 font-bold uppercase block text-[8px] tracking-widest mb-1">Account Beneficiary</span><span className="font-black text-slate-900 text-xs uppercase">Digifort Labs Pvt. Ltd.</span></div>
                            </div>
                        </div>
                        <div className="p-8 text-center flex flex-col justify-between items-center bg-white">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Digital Auth / Seal</span>
                            <div className="relative w-28 h-28 flex items-center justify-center">
                                <div className="absolute inset-0 border-4 border-dashed border-indigo-50/50 rounded-full animate-spin-slow"></div>
                                <div className="w-24 h-24 border-2 border-slate-900/10 rounded-full flex flex-col items-center justify-center -rotate-12 italic text-slate-300 font-black text-[12px] text-center leading-tight">
                                    <span className="text-slate-200 uppercase">Digitally</span>
                                    <span className="text-slate-200 uppercase">Signed</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-900 uppercase block tracking-tighter">Authorised Signatory</span>
                                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Digifort Labs Admin Side</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 text-[9px] text-slate-400 space-y-1.5 italic leading-relaxed border-l-2 border-slate-100 pl-4 py-2 print:break-inside-avoid">
                        <p>• Certified that the particulars given above are true and correct. This is a computer-generated Tax Invoice.</p>
                        <p>• Goods/Services once billed are non-refundable. All disputes are subject to Vapi (Gujarat) Jurisdiction.</p>
                        <p>• Interest @ 18% p.a. will be charged if the bill is not paid within the due date.</p>
                    </div>
                </InvoicePageWrapper>

                {/* --- DYNAMIC ANNEXURE PAGES --- */}
                {chunkedFileItems.map((chunk, pageIndex) => (
                    <InvoicePageWrapper key={pageIndex} breakAfter={pageIndex < chunkedFileItems.length - 1}>
                        <div className="bg-slate-900 text-white px-4 py-1.5 font-black text-[9px] uppercase tracking-[0.1em] mb-2 flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <span>Invoiced Records Analysis</span>
                                <span className="text-indigo-400 opacity-60 font-bold text-[7px] tracking-normal px-2 border-l border-white/20">Detailed Manifest - Page {pageIndex + 1}</span>
                            </span>
                            <div className="text-right flex items-center gap-2">
                                <span className="text-[7px] font-bold uppercase opacity-50">Page Records:</span>
                                <span className="text-sm font-black">{chunk.length}</span>
                            </div>
                        </div>

                        <table className="w-full text-[8.5px] border-collapse border border-slate-900">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-900">
                                    <th className="p-1 border-r border-slate-900 w-10 font-black uppercase text-[7.5px]">S.No</th>
                                    <th className="p-1 border-r border-slate-900 text-left font-black uppercase text-[7.5px]">Identifier</th>
                                    <th className="p-1 border-r border-slate-900 text-left font-black uppercase text-[7.5px]">Patient Master Details (ID & Name)</th>
                                    <th className="p-1 w-24 text-right font-black uppercase text-[7.5px]">Charge</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {chunk.map((item: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-1 border-r border-slate-200 text-center font-bold text-slate-300">{(pageIndex * ITEMS_PER_PAGE + idx + 1).toString().padStart(2, '0')}</td>
                                        <td className="p-1 border-r border-slate-200 font-bold text-indigo-600">FILE-{item.file_id}</td>
                                        <td className="p-1 border-r border-slate-200">
                                            <div className="font-bold text-slate-800 text-[9px] tracking-tight leading-none py-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[450px]">
                                                {item.description.replace('Processing MRD: ', '')}
                                            </div>
                                        </td>
                                        <td className="p-1 text-right font-black text-slate-900">₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                                {pageIndex === chunkedFileItems.length - 1 && (
                                    <tr className="bg-slate-900 text-white font-black uppercase text-[8.5px]">
                                        <td colSpan={3} className="p-1.5 border-r border-white/20 text-right tracking-widest">Grand Manifest Total</td>
                                        <td className="p-1.5 text-right">₹{fileItems.reduce((acc: number, item: any) => acc + item.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </InvoicePageWrapper>
                ))}
            </div>
        </div>
    );
}
