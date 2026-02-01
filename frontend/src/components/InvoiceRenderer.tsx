"use client";

import React from 'react';
import { format } from 'date-fns';
import {
    Receipt,
    Building2,
    Calendar,
    User,
    MapPin,
    CreditCard,
    ShieldCheck,
    FileText
} from 'lucide-react';

interface InvoiceItem {
    item_id: number;
    file_id?: number;
    filename?: string;
    amount: number;
    discount: number;
    description: string;
    hsn_code: string;
}

interface InvoiceData {
    invoice_number: string;
    bill_date: string;
    created_at: string;
    hospital_name: string;
    hospital_address?: string;
    hospital_city?: string;
    hospital_state?: string;
    hospital_pincode?: string;
    hospital_gst?: string;
    hospital_pan?: string;
    hospital_bank_name?: string;
    hospital_bank_account_no?: string;
    hospital_bank_ifsc?: string;
    company_name?: string;
    company_address?: string;
    company_gst?: string;
    company_email?: string;
    company_website?: string;
    company_bank_name?: string;
    company_bank_acc?: string;
    company_bank_ifsc?: string;
    total_amount: number;
    tax_amount: number;
    gst_rate: number;
    amount_in_words?: string;
    is_gst_bill?: boolean;
    items: InvoiceItem[];
}

interface InvoiceRendererProps {
    invoice: InvoiceData;
    itemsPerPage?: number;
}

export default function InvoiceRenderer({ invoice, itemsPerPage = 25 }: InvoiceRendererProps) {
    if (!invoice) return null;

    const subtotal = invoice.items.reduce((acc, item) => acc + item.amount, 0);
    const taxTotal = invoice.tax_amount || (subtotal * (invoice.gst_rate / 100));
    const grandTotal = subtotal + taxTotal;

    const fileItems = invoice.items.filter(i => i.file_id);
    const otherItems = invoice.items.filter(i => !i.file_id);

    // Grouping file items into chunks for multi-page annexure
    const chunks = [];
    for (let i = 0; i < fileItems.length; i += itemsPerPage) {
        chunks.push(fileItems.slice(i, i + itemsPerPage));
    }
    const isGst = invoice.is_gst_bill !== false && invoice.gst_rate > 0;

    const PageHeader = () => (
        <div className="flex justify-between items-start mb-8 print:mb-6 relative z-10 break-inside-avoid">
            <div className="flex items-center gap-5">
                <div className="relative group">
                    <div className="absolute -inset-2 bg-indigo-500/10 rounded-2xl blur-lg transition-all group-hover:bg-indigo-500/20 print:hidden"></div>
                    <div className="relative bg-white p-2 print:p-0 rounded-2xl border border-slate-100 print:border-none shadow-sm print:shadow-none">
                        <img
                            src="/logo/longlogo.png"
                            alt="Logo"
                            className="h-12 w-auto object-contain print:h-10"
                            onError={(e) => {
                                (e.target as any).style.display = 'none';
                                const parent = (e.target as any).parentElement;
                                if (parent && !parent.querySelector('.fallback-icon')) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'fallback-icon bg-indigo-600 p-2 rounded-xl shadow-lg';
                                    fallback.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/></svg>`;
                                    parent.appendChild(fallback);
                                }
                            }}
                        />
                    </div>
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        DIGIFORT LABS
                        <span className="text-indigo-500 text-[7px] border border-indigo-200 px-1 py-0 rounded-full uppercase tracking-widest font-black print:scale-90">Official</span>
                    </h1>
                    <p className="text-[8px] uppercase tracking-widest font-black text-slate-400">Secure Digital Healthcare Solutions</p>
                </div>
            </div>
            <div className="text-right">
                <h2 className="text-lg font-black text-slate-900 leading-tight">{invoice.company_name || 'Digifort Labs'}</h2>
                <div className="text-[10px] text-slate-500 max-w-[220px] ml-auto mt-1 leading-relaxed">
                    {invoice.company_address || 'Gujarat, India'}<br />
                    {invoice.company_gst && invoice.company_gst !== "None" && (
                        <>
                            <span className="font-black text-slate-400">GSTIN:</span> <span className="text-indigo-600 font-bold">{invoice.company_gst}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    const PageFooter = (page: number, total: number) => (
        <div className="mt-auto pt-8 border-t border-slate-100 flex justify-between items-center opacity-40 grayscale">
            <span className="text-[9px] font-black tracking-widest text-slate-900">{(invoice.company_email || 'INFO@DIGIFORTLABS.COM').toUpperCase()}</span>
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                <span className="text-[10px] font-bold uppercase text-slate-600">Page {page} of {total}</span>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
            </div>
            <span className="text-[9px] font-black tracking-widest text-slate-900 uppercase">{(invoice.company_website || 'Secure Health Cloud').replace(/^https?:\/\//, '').toUpperCase()}</span>
        </div>
    );

    const mainPageTotal = 1 + chunks.length;

    return (
        <div className="flex flex-col items-center gap-8 print:gap-0 font-sans antialiased text-slate-900">
            {/* -- STYLE RESET -- */}
            <style jsx global>{`
                @media print {
                    @page { size: A4 portrait; margin: 0mm; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box !important; }
                    body { margin: 0 !important; padding: 0 !important; background: white !important; overflow: visible !important; }
                    .print-break { break-after: page; }
                }
                .watermark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 100px;
                    font-weight: 900;
                    color: rgba(15, 23, 42, 0.02);
                    white-space: nowrap;
                    pointer-events: none;
                    user-select: none;
                    z-index: -10;
                }
            `}</style>

            {/* --- PAGE 1: MAIN TAX INVOICE --- */}
            <div className="bg-white shadow-2xl border border-slate-200 print:shadow-none print:border-none print:m-0 w-[210mm] h-[297mm] print:h-[297mm] relative overflow-hidden flex flex-col px-[15mm] py-[12mm] print:py-[10mm] print:break-after-page">
                <div className="watermark">DIGIFORT LABS</div>
                <PageHeader />

                {/* Invoice Type Banner */}
                <div className="bg-slate-900 text-white text-center py-2 print:py-1.5 font-black tracking-[0.3em] text-[10px] uppercase mb-6 print:mb-4 rounded-sm">
                    {isGst ? "Tax Invoice (Original for Recipient)" : "Bill of Supply (Original for Recipient)"}
                </div>

                {/* Billing Info Grid */}
                <div className="grid grid-cols-2 gap-px bg-slate-200 border border-slate-200 rounded-xl print:rounded-lg overflow-hidden mb-6 print:mb-4 break-inside-avoid">
                    <div className="bg-white p-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Building2 size={12} className="text-indigo-500" /> Billed To
                        </h3>
                        <div className="font-black text-slate-900 text-xl leading-tight mb-2">{invoice.hospital_name}</div>
                        <div className="text-xs text-slate-600 space-y-1.5">
                            <p className="font-medium">{invoice.hospital_address || '-'}</p>
                            <p className="font-medium">{invoice.hospital_city || '-'}, {invoice.hospital_state || '-'} {invoice.hospital_pincode || ''}</p>
                            <div className="pt-4 border-t border-slate-50 mt-4 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase w-16">GSTIN:</span>
                                    <span className="font-black text-indigo-600">{invoice.hospital_gst || 'URD'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase w-16">PAN:</span>
                                    <span className="font-bold text-slate-900">{invoice.hospital_pan || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50/50 p-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Calendar size={12} className="text-indigo-500" /> Invoice Details
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-baseline">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Invoice No</span>
                                <span className="font-black text-slate-900 text-lg tracking-tight">{invoice.invoice_number}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Invoice Date</span>
                                <span className="font-black text-slate-900">{format(new Date(invoice.bill_date || invoice.created_at), 'dd MMM yyyy')}</span>
                            </div>
                            <div className="flex justify-between items-baseline pt-4 border-t border-slate-200/50">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Place of Supply</span>
                                <span className="font-black text-slate-900">GUJARAT (24)</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Terms</span>
                                <span className="font-black text-slate-900 uppercase">{isGst ? "TAXABLE INVOICE" : "EXEMPTED BILL"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="flex-1">
                    <table className="w-full text-[11px]">
                        <thead>
                            <tr className="border-b-2 border-slate-900">
                                <th className="py-2 text-left font-black uppercase text-[9px] text-slate-400 w-10">Sr.</th>
                                <th className="py-2 text-left font-black uppercase text-[9px]">Description of Service</th>
                                <th className="py-2 text-center font-black uppercase text-[9px] w-20">SAC Code</th>
                                <th className="py-2 text-right font-black uppercase text-[9px] w-28">Amount (INR)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {fileItems.length > 0 && (
                                <tr>
                                    <td className="py-3 font-black text-slate-300">01</td>
                                    <td className="py-3">
                                        <div className="font-black text-slate-900 text-[13px]">Processing of Patient Records</div>
                                        <div className="text-[10px] text-slate-500 mt-0.5 font-medium italic">
                                            Digitization and archival for {fileItems.length} records (See Annexure)
                                        </div>
                                    </td>
                                    <td className="py-3 text-center font-bold text-slate-400">998311</td>
                                    <td className="py-3 text-right font-black text-base">
                                        {fileItems.reduce((acc, item) => acc + item.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            )}

                            {otherItems.map((item, idx) => (
                                <tr key={item.item_id}>
                                    <td className="py-3 font-black text-slate-300">{(fileItems.length > 0 ? 2 : 1) + idx < 10 ? `0${(fileItems.length > 0 ? 2 : 1) + idx}` : (fileItems.length > 0 ? 2 : 1) + idx}</td>
                                    <td className="py-3">
                                        <div className="font-black text-slate-900 text-[13px]">{item.description}</div>
                                    </td>
                                    <td className="py-3 text-center font-bold text-slate-400">{item.hsn_code || '998311'}</td>
                                    <td className="py-3 text-right font-black text-base">
                                        {item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 pt-6 print:mt-4 print:pt-4 border-t-2 border-slate-100 break-inside-avoid">
                    <div className="flex justify-end">
                        <div className="w-72 space-y-2">
                            <div className="flex justify-between text-slate-500 font-bold uppercase text-[9px]">
                                <span>{isGst ? 'Sub-Total' : 'Total Net Amount'}</span>
                                <span className="text-slate-900 font-black text-[11px]">₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            {isGst && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-slate-400 font-medium text-[9px]">
                                        <span>Central GST ({invoice.gst_rate / 2}%)</span>
                                        <span className="text-slate-900 font-bold">₹ {(taxTotal / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400 font-medium text-[9px]">
                                        <span>State GST ({invoice.gst_rate / 2}%)</span>
                                        <span className="text-slate-900 font-bold">₹ {(taxTotal / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between items-center bg-slate-900 text-white p-3 rounded-xl mt-3">
                                <span className="font-black uppercase text-[9px] tracking-widest">Total Payable</span>
                                <span className="font-black text-lg">₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Amount in Words */}
                    <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl break-inside-avoid">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount in Words</div>
                        <div className="font-black text-slate-900 text-[10px] uppercase italic tracking-tight">{invoice.amount_in_words || 'NA'}</div>
                    </div>

                    {/* Bank & Seal */}
                    <div className="grid grid-cols-2 mt-6 gap-6 print:mt-4 print:gap-4 break-inside-avoid">
                        {invoice.company_bank_name && invoice.company_bank_name !== "None" ? (
                            <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-indigo-900/40 mb-2">Payment Details</h4>
                                <div className="grid grid-cols-2 gap-3 text-[10px]">
                                    <div>
                                        <div className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Bank</div>
                                        <div className="font-black text-slate-900 uppercase">{invoice.company_bank_name}</div>
                                    </div>
                                    <div>
                                        <div className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">IFSC</div>
                                        <div className="font-black text-slate-900 uppercase tracking-wider">{invoice.company_bank_ifsc}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Account Number</div>
                                        <div className="font-black text-slate-900 text-sm tracking-widest">{invoice.company_bank_acc}</div>
                                    </div>
                                </div>
                            </div>
                        ) : <div className="p-4 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Payment details upon request</p>
                        </div>}
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="relative mb-2">
                                <div className="w-20 h-20 border-2 border-slate-900/10 rounded-full flex items-center justify-center -rotate-12 italic text-slate-200 font-black text-[10px] uppercase tracking-tighter">
                                    Digitally Signed
                                </div>
                                <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500/20" size={40} />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Authorised Signatory</p>
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">For {invoice.company_name || 'Digifort Labs'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {PageFooter(1, mainPageTotal)}
            </div>

            {/* --- ANNEXURE PAGES --- */}
            {chunks.map((chunk, idx) => (
                <div key={idx} className="bg-white shadow-2xl border border-slate-200 print:shadow-none print:border-none print:m-0 w-[210mm] h-[297mm] print:h-[297mm] relative overflow-hidden flex flex-col px-[15mm] py-[10mm] print:break-after-page">
                    <div className="watermark text-[80px]">ANNEXURE</div>
                    <div className="flex items-center justify-between mb-4 border-b-2 border-slate-900 pb-4">
                        <div className="flex items-center gap-3">
                            <FileText className="text-indigo-600" size={20} />
                            <div>
                                <h2 className="text-lg font-black text-slate-900 tracking-tight">ANNEXURE - RECORD LIST</h2>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Linked to Invoice {invoice.invoice_number}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[9px] font-black text-slate-400 uppercase">Records on Page</div>
                            <div className="text-xl font-black text-indigo-600">{chunk.length}</div>
                        </div>
                    </div>

                    <div className="flex-1">
                        <table className="w-full text-[11px]">
                            <thead>
                                <tr className="bg-slate-50 border-y border-slate-100">
                                    <th className="py-2 text-left font-black uppercase text-[8px] text-slate-400 pl-2">Sr.</th>
                                    <th className="py-2 text-left font-black uppercase text-[8px] text-slate-400">Record Identification (MRD/Name)</th>
                                    <th className="py-2 text-right font-black uppercase text-[8px] text-slate-400 pr-2">Fee (INR)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {chunk.map((item, cidx) => (
                                    <tr key={item.item_id}>
                                        <td className="py-0.5 pl-2 font-bold text-slate-300">{(idx * itemsPerPage + cidx + 1).toString().padStart(2, '0')}</td>
                                        <td className="py-0.5 pr-4">
                                            <div className="font-bold text-slate-900 truncate max-w-[450px]">
                                                {item.description.replace('Processing MRD: ', '').replace('Processing of patient record: ', '')}
                                            </div>
                                            <div className="text-[8px] text-slate-400 font-mono">FILE_ID: {item.file_id}</div>
                                        </td>
                                        <td className="py-0.5 pr-2 text-right font-black text-slate-900">
                                            {item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t border-slate-900 break-inside-avoid">
                                <tr className="bg-slate-50 font-black">
                                    <td colSpan={2} className="py-2 text-right text-[8px] uppercase tracking-widest pl-2">Annexure Page Total</td>
                                    <td className="py-2 text-right pr-2">
                                        ₹ {chunk.reduce((acc, item) => acc + item.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {PageFooter(idx + 2, mainPageTotal)}
                </div>
            ))}
        </div>
    );
}
