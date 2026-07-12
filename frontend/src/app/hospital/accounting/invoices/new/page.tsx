"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/config/api';
import toast from 'react-hot-toast';
import { 
    FileText, ArrowLeft, Plus, Trash2, IndianRupee, Save, Loader2, CheckCircle2, AlertCircle, ShoppingCart,
    CheckSquare, Square, Stethoscope, BedDouble, Beaker
} from 'lucide-react';

interface InvoiceItem {
    description: string;
    qty: number;
    unit_price: number;
    discount: number;
    charge_type: string;
    reference_id?: number;
}

export default function CompileInvoicePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const patientId = searchParams.get('patient_id');

    const [patient, setPatient] = useState<any>(null);
    const [hospital, setHospital] = useState<any>(null);
    const [pendingInvoice, setPendingInvoice] = useState<any>(null);
    
    // items from unbilled records
    const [serverItems, setServerItems] = useState<any[]>([]);
    // indices of selected server items
    const [selectedServerIndices, setSelectedServerIndices] = useState<Set<number>>(new Set());

    // items manually added
    const [customItems, setCustomItems] = useState<any[]>([]);

    const [overallDiscount, setOverallDiscount] = useState<number | string>('');
    const [advanceDeduction, setAdvanceDeduction] = useState<number | string>('');
    const [cashlessDeduction, setCashlessDeduction] = useState<number | string>('');
    const [gstRate, setGstRate] = useState<number | string>(18);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [transactionId, setTransactionId] = useState('');
    const [remarks, setRemarks] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!patientId) {
            router.push('/hospital/accounting');
            return;
        }
        loadData();
    }, [patientId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const pData = await apiFetch(`patients/${patientId}`);
            setPatient(pData);
            
            if (pData.hospital_id) {
                const hData = await apiFetch(`hospitals/${pData.hospital_id}`);
                setHospital(hData);
            }
            
            if (pData.advance_balance > 0) {
                setAdvanceDeduction(pData.advance_balance);
            }
            if (pData.cashless_approved_amount > 0) {
                setCashlessDeduction(pData.cashless_approved_amount);
            }

            const unbilledData = await apiFetch(`/patient-billing/unbilled/${patientId}`);
            const items = unbilledData?.unbilled_items || [];
            setServerItems(items);
            setSelectedServerIndices(new Set(items.map((_: any, idx: number) => idx)));

            if (unbilledData?.pending_invoice) {
                setPendingInvoice(unbilledData.pending_invoice);
            } else {
                setPendingInvoice(null);
            }

        } catch (error: any) {
            console.error('Failed to load billing data:', error);
            toast.error(error.message || 'Failed to load billing data');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleServerItem = (idx: number) => {
        const newSet = new Set(selectedServerIndices);
        if (newSet.has(idx)) {
            newSet.delete(idx);
        } else {
            newSet.add(idx);
        }
        setSelectedServerIndices(newSet);
    };

    const handleUpdateServerItem = (idx: number, field: string, value: any) => {
        const copy = [...serverItems];
        copy[idx] = { ...copy[idx], [field]: value };
        setServerItems(copy);
    };

    const handleRemoveServerItem = (idx: number) => {
        const copyItems = [...serverItems];
        copyItems.splice(idx, 1);
        setServerItems(copyItems);

        const newSet = new Set<number>();
        selectedServerIndices.forEach(i => {
            if (i < idx) newSet.add(i);
            else if (i > idx) newSet.add(i - 1);
        });
        setSelectedServerIndices(newSet);
    };

    const handleAddCustomItem = () => {
        setCustomItems([...customItems, {
            description: '',
            qty: 1,
            unit_price: '',
            discount: '',
            charge_type: 'CUSTOM'
        }]);
    };

    const handleUpdateCustomItem = (idx: number, field: string, value: any) => {
        const copy = [...customItems];
        copy[idx] = { ...copy[idx], [field]: value };
        setCustomItems(copy);
    };

    const handleRemoveCustomItem = (idx: number) => {
        const copy = [...customItems];
        copy.splice(idx, 1);
        setCustomItems(copy);
    };

    const getValidatedSelectedItems = () => {
        const selected = Array.from(selectedServerIndices).map(idx => ({
            description: serverItems[idx].description,
            qty: Number(serverItems[idx].qty) || 0,
            unit_price: Number(serverItems[idx].unit_price) || 0,
            discount: Number(serverItems[idx].discount) || 0,
            charge_type: serverItems[idx].charge_type,
            reference_id: serverItems[idx].reference_id
        }));

        const validatedCustom = customItems.filter(i => i.description.trim() !== "").map(i => ({
            description: i.description,
            qty: Number(i.qty) || 0,
            unit_price: Number(i.unit_price) || 0,
            discount: Number(i.discount) || 0,
            charge_type: i.charge_type
        }));

        return [...selected, ...validatedCustom];
    };

    const totals = useMemo(() => {
        const items = getValidatedSelectedItems();
        let opdTotal = 0;
        let ipdTotal = 0;
        let otherTotal = 0;
        let sub = 0;

        items.forEach(item => {
            const amt = (item.qty * item.unit_price) - item.discount;
            sub += amt;
            if (item.charge_type.includes('OPD')) opdTotal += amt;
            else if (item.charge_type.includes('IPD')) ipdTotal += amt;
            else otherTotal += amt;
        });

        const disc = Number(overallDiscount) || 0;
        const advDeduct = Number(advanceDeduction) || 0;
        const cshlessDeduct = Number(cashlessDeduction) || 0;
        
        const afterDisc = Math.max(0, sub - disc - advDeduct - cshlessDeduct);
        
        const gRate = Number(gstRate) || 0;
        const gstAmt = (sub * gRate) / 100;
        
        const finalAmt = Math.max(0, afterDisc + gstAmt);

        return {
            opdTotal,
            ipdTotal,
            otherTotal,
            subtotal: sub,
            afterDiscount: afterDisc,
            gstAmount: gstAmt,
            finalAmount: finalAmt,
            items
        };
    }, [serverItems, selectedServerIndices, customItems, overallDiscount, gstRate]);

    const handleGenerateInvoice = async () => {
        const allItems = getValidatedSelectedItems();

        if (allItems.length === 0) {
            toast.error("Please add at least one line item to generate the invoice");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                patient_id: Number(patientId),
                items: allItems,
                discount_amount: Number(overallDiscount) || 0,
                advance_deduction: Number(advanceDeduction) || 0,
                cashless_deduction: Number(cashlessDeduction) || 0,
                gst_rate: Number(gstRate) || 0,
                payment_method: paymentMethod,
                transaction_id: transactionId || null,
                remarks: remarks || null
            };

            const invoice = await apiFetch('/patient-billing/invoices', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            toast.success("Patient invoice generated successfully!");
            router.push(`/hospital/accounting/invoices/${invoice.invoice_id}`);
        } catch (error: any) {
            console.error('Failed to generate patient invoice:', error);
            toast.error(error.message || 'Failed to save invoice');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <p className="font-bold tracking-widest uppercase text-sm">Compiling Ledger Data...</p>
            </div>
        );
    }

    if (!patient) {
        return <div className="p-8 text-center text-rose-500">Patient not found</div>;
    }

    return (
        <div className="p-3 md:p-6 lg:p-8 max-w-[1400px] mx-auto min-h-screen bg-slate-50/50 animate-in fade-in duration-500">
            
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                <button 
                    onClick={() => router.back()}
                    className="p-2 md:p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all shadow-sm group"
                >
                    <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Compile Invoice</h1>
                    <p className="text-xs md:text-sm text-slate-500 font-medium">Review unbilled records and finalize charges</p>
                </div>
            </div>

            {pendingInvoice && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-3">
                        <div className="p-2 md:p-3 bg-amber-100 text-amber-800 rounded-xl">
                            <IndianRupee className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
                        </div>
                        <div>
                            <p className="font-black text-amber-900 text-sm">
                                Pending Invoice Detected ({pendingInvoice.invoice_number})
                            </p>
                            <p className="text-amber-700 text-xs font-semibold">
                                An active pending invoice of <span className="font-bold text-amber-900">₹{pendingInvoice.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> already exists for this patient.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push(`/hospital/accounting/invoices/${pendingInvoice.invoice_id}`)}
                        className="px-4 py-2 md:px-5 md:py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-black shadow-[0_4px_12px_rgba(217,119,6,0.3)] transition-all flex items-center justify-center gap-2"
                    >
                        <FileText size={16} />
                        View & Finalize Bill
                    </button>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-6">
                
                <div className="flex-1 space-y-6">
                    
                    <div className="bg-indigo-900 text-white p-5 md:p-6 rounded-3xl shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-indigo-200 text-xs md:text-sm font-bold tracking-widest uppercase mb-1">Billing Account</p>
                                <h2 className="text-xl md:text-2xl font-black">{patient.full_name}</h2>
                                <p className="text-indigo-100 font-mono text-xs md:text-sm opacity-80">{patient.patient_u_id}</p>
                            </div>
                             <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 md:px-4 py-2 md:py-2.5 rounded-2xl border border-white/10 w-fit">
                                <IndianRupee className="text-indigo-300" size={18} />
                                <span className="font-bold text-xs md:text-sm tracking-wide">Pending Finalization</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h3 className="font-black text-slate-900 flex items-center gap-2 text-base md:text-lg">
                                    <AlertCircle className="text-amber-500" size={18} /> Unbilled Clinical Records
                                </h3>
                                <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Automatically pulled from IPD, OPD, and Dental records</p>
                            </div>
                        </div>

                        {serverItems.length === 0 ? (
                            <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 size={24} className="md:w-8 md:h-8" />
                                </div>
                                <p className="text-slate-900 font-bold text-base md:text-lg mb-1">No pending clinical charges</p>
                                <p className="text-slate-500 text-xs md:text-sm">All automated records have been billed.</p>
                            </div>
                        ) : (
                            <div className="p-4 md:p-6 space-y-6">
                                {(() => {
                                    const opdItems = serverItems.map((item, idx) => ({ ...item, originalIdx: idx })).filter(item => item.charge_type.includes('OPD'));
                                    const ipdItems = serverItems.map((item, idx) => ({ ...item, originalIdx: idx })).filter(item => item.charge_type.includes('IPD'));
                                    const otherServerItems = serverItems.map((item, idx) => ({ ...item, originalIdx: idx })).filter(item => !item.charge_type.includes('OPD') && !item.charge_type.includes('IPD'));

                                    const renderList = (items: any[], title: string, icon: React.ReactNode, colorClass: string, bgColorClass: string, borderColorClass: string) => {
                                        if (items.length === 0) return null;
                                        return (
                                            <div className="space-y-3">
                                                <h4 className={`text-[10px] md:text-xs uppercase font-black flex items-center gap-1.5 ${colorClass}`}>
                                                    {icon} {title}
                                                </h4>
                                                <div className="space-y-2 md:space-y-3">
                                                    {items.map((item) => {
                                                        const isSelected = selectedServerIndices.has(item.originalIdx);
                                                        return (
                                                            <div 
                                                                key={item.originalIdx} 
                                                                className={`p-3 md:p-4 rounded-2xl border-2 transition-all ${
                                                                    isSelected 
                                                                    ? `border-${borderColorClass}-500 ${bgColorClass} shadow-sm` 
                                                                    : 'border-slate-100 bg-white opacity-60'
                                                                }`}
                                                            >
                                                                <div className="flex flex-col xl:flex-row gap-3 xl:gap-4 xl:items-center">
                                                                    <div 
                                                                        className="flex items-start gap-3 flex-1 cursor-pointer"
                                                                        onClick={() => handleToggleServerItem(item.originalIdx)}
                                                                    >
                                                                        <div className={isSelected ? colorClass : 'text-slate-300'}>
                                                                            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                                                        </div>
                                                                        <div className="w-full">
                                                                            <p className="font-bold text-slate-900 text-xs md:text-sm">{item.description}</p>
                                                                            <span className="inline-block mt-1 px-1.5 py-0.5 bg-white border border-slate-200 text-slate-500 text-[9px] md:text-[10px] font-black tracking-widest uppercase rounded">
                                                                                {item.charge_type.replace(/_/g, ' ')}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center gap-2 xl:gap-3 w-full xl:w-auto mt-2 xl:mt-0 pl-7 xl:pl-0">
                                                                        <div className="w-16 md:w-20">
                                                                            <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase ml-1">Qty</label>
                                                                            <input 
                                                                                type="number" 
                                                                                value={item.qty}
                                                                                disabled={!isSelected}
                                                                                onChange={(e) => handleUpdateServerItem(item.originalIdx, 'qty', Number(e.target.value))}
                                                                                className="w-full px-2 py-1.5 md:px-3 md:py-2 bg-white disabled:bg-transparent border border-slate-200 disabled:border-transparent rounded-xl text-xs md:text-sm text-center font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                                                            />
                                                                        </div>
                                                                        <div className="w-24 md:w-28 relative">
                                                                            <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase ml-1">Price</label>
                                                                            <span className="absolute left-2.5 top-[26px] md:top-[30px] text-slate-400 font-medium text-xs md:text-sm">₹</span>
                                                                            <input 
                                                                                type="number" 
                                                                                value={item.unit_price}
                                                                                disabled={!isSelected}
                                                                                onChange={(e) => handleUpdateServerItem(item.originalIdx, 'unit_price', Number(e.target.value))}
                                                                                className="w-full pl-6 pr-2 py-1.5 md:pl-7 md:pr-3 md:py-2 bg-white disabled:bg-transparent border border-slate-200 disabled:border-transparent rounded-xl text-xs md:text-sm font-black text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                                                            />
                                                                        </div>
                                                                        <div className="w-20 md:w-24 relative">
                                                                            <label className="text-[9px] md:text-[10px] font-bold text-rose-400 uppercase ml-1">Disc</label>
                                                                            <span className="absolute left-2 top-[26px] md:top-[30px] text-rose-400 font-medium text-xs md:text-sm">-₹</span>
                                                                            <input 
                                                                                type="number" 
                                                                                value={item.discount}
                                                                                disabled={!isSelected}
                                                                                onChange={(e) => handleUpdateServerItem(item.originalIdx, 'discount', Number(e.target.value))}
                                                                                className="w-full pl-6 pr-2 py-1.5 md:pl-7 md:pr-3 md:py-2 bg-white disabled:bg-transparent border border-rose-200 disabled:border-transparent rounded-xl text-xs md:text-sm font-bold text-rose-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                                                                            />
                                                                        </div>
                                                                        {isSelected && (
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => handleRemoveServerItem(item.originalIdx)}
                                                                                className="p-2 md:p-3 mt-4 md:mt-5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors bg-white border border-rose-100 shadow-sm"
                                                                                title="Remove Item"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    };

                                    return (
                                        <>
                                            {renderList(opdItems, "OPD Charges", <Stethoscope size={14} />, "text-indigo-600", "bg-indigo-50/40", "indigo")}
                                            {renderList(ipdItems, "IPD Charges", <BedDouble size={14} />, "text-emerald-600", "bg-emerald-50/40", "emerald")}
                                            {renderList(otherServerItems, "Other / Diagnostics", <Beaker size={14} />, "text-amber-600", "bg-amber-50/40", "amber")}
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 md:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h3 className="font-black text-slate-900 flex items-center gap-2 text-base md:text-lg">
                                    <ShoppingCart className="text-emerald-500" size={18} /> Additional Charges
                                </h3>
                                <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Add Pharmacy, Lab, or Misc charges manually</p>
                            </div>
                            <button 
                                onClick={handleAddCustomItem}
                                className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs md:text-sm font-black transition-colors border border-emerald-200/50"
                            >
                                <Plus size={16} /> Add Custom Item
                            </button>
                        </div>

                        {customItems.length === 0 ? (
                            <div className="p-8 md:p-10 text-center bg-slate-50/30">
                                <p className="text-slate-400 font-medium text-xs md:text-sm">No custom line items added yet.</p>
                            </div>
                        ) : (
                            <div className="p-4 md:p-6 space-y-4">
                                {customItems.map((item, idx) => (
                                    <div key={idx} className="flex flex-col xl:flex-row items-start xl:items-center gap-3 p-3 md:p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                                        <input 
                                            type="text" 
                                            placeholder="Charge description (e.g. Pharmacy, ECG)"
                                            value={item.description}
                                            onChange={(e) => handleUpdateCustomItem(idx, 'description', e.target.value)}
                                            className="w-full xl:flex-1 px-3 py-2 md:px-4 md:py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                        />
                                        <div className="flex items-center gap-2 xl:gap-3 w-full xl:w-auto">
                                            <div className="w-16 md:w-20">
                                                <input 
                                                    type="number" 
                                                    placeholder="Qty"
                                                    value={item.qty}
                                                    min="1"
                                                    onChange={(e) => handleUpdateCustomItem(idx, 'qty', Number(e.target.value))}
                                                    className="w-full px-2 py-2 md:px-3 md:py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="w-24 md:w-32 relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs md:text-sm">₹</span>
                                                <input 
                                                    type="number" 
                                                    placeholder="Price"
                                                    value={item.unit_price || ''}
                                                    onChange={(e) => handleUpdateCustomItem(idx, 'unit_price', Number(e.target.value))}
                                                    className="w-full pl-6 md:pl-8 pr-2 py-2 md:py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="w-24 md:w-28 relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-rose-400 font-medium text-xs md:text-sm">-₹</span>
                                                <input 
                                                    type="number" 
                                                    placeholder="Disc"
                                                    value={item.discount || ''}
                                                    onChange={(e) => handleUpdateCustomItem(idx, 'discount', Number(e.target.value))}
                                                    className="w-full pl-6 md:pl-8 pr-2 py-2 md:py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => handleRemoveCustomItem(idx)}
                                                className="p-2.5 md:p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors bg-white border border-rose-100 shadow-sm"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full lg:w-[360px] xl:w-[400px] space-y-6">
                    <div className="sticky top-6 space-y-6">
                        
                        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200 overflow-hidden relative">
                            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
                            
                            <div className="p-5 md:p-6">
                                <h3 className="font-black text-lg md:text-xl text-slate-900 mb-5 flex items-center gap-2">
                                    <IndianRupee className="text-emerald-500" size={20} /> Live Receipt
                                </h3>
                                
                                <div className="space-y-3 md:space-y-4 text-xs md:text-sm font-bold border-b border-slate-100 pb-5 mb-5">
                                    <div className="flex justify-between items-center text-slate-600">
                                        <span>Total Line Items</span>
                                        <span className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">{totals.items.length}</span>
                                    </div>
                                    
                                    {totals.opdTotal > 0 && (
                                        <div className="flex justify-between items-center text-indigo-600">
                                            <span>OPD Charges</span>
                                            <span>₹ {totals.opdTotal.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {totals.ipdTotal > 0 && (
                                        <div className="flex justify-between items-center text-emerald-600">
                                            <span>IPD Charges</span>
                                            <span>₹ {totals.ipdTotal.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {totals.otherTotal > 0 && (
                                        <div className="flex justify-between items-center text-amber-600">
                                            <span>Other Charges</span>
                                            <span>₹ {totals.otherTotal.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center text-slate-500 pt-2 border-t border-slate-100">
                                        <span>Subtotal</span>
                                        <span className="text-slate-900 tracking-tight">₹ {totals.subtotal.toFixed(2)}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-rose-600 pt-1">
                                        <span>Extra Discount</span>
                                        <div className="w-20 md:w-24 relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-medium">-₹</span>
                                            <input 
                                                type="number"
                                                value={overallDiscount}
                                                onChange={(e) => setOverallDiscount(e.target.value)}
                                                className="w-full pl-7 pr-2 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-xs md:text-sm"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                    
                                    {(patient?.advance_balance > 0 || advanceDeduction !== '') && (
                                        <div className="flex justify-between items-center text-indigo-600 pt-1">
                                            <span>Advance Deposit Deduction <br/><span className="text-[9px] text-slate-400">Available: ₹{patient?.advance_balance || 0}</span></span>
                                            <div className="w-20 md:w-24 relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-medium">-₹</span>
                                                <input 
                                                    type="number"
                                                    value={advanceDeduction}
                                                    onChange={(e) => setAdvanceDeduction(e.target.value)}
                                                    className="w-full pl-7 pr-2 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs md:text-sm"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {(patient?.cashless_approved_amount > 0 || cashlessDeduction !== '') && (
                                        <div className="flex justify-between items-center text-emerald-600 pt-1">
                                            <span>Cashless / TPA Deduction <br/><span className="text-[9px] text-slate-400">Approved: ₹{patient?.cashless_approved_amount || 0}</span></span>
                                            <div className="w-20 md:w-24 relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-medium">-₹</span>
                                                <input 
                                                    type="number"
                                                    value={cashlessDeduction}
                                                    onChange={(e) => setCashlessDeduction(e.target.value)}
                                                    className="w-full pl-7 pr-2 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs md:text-sm"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-between items-center text-slate-600">
                                        <span>Apply GST (%)</span>
                                        <div className="w-20 md:w-24 relative">
                                            <input 
                                                type="number"
                                                value={gstRate}
                                                onChange={(e) => setGstRate(e.target.value)}
                                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs md:text-sm"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs md:text-sm">%</span>
                                        </div>
                                    </div>
                                    {totals.gstAmount > 0 && (
                                        <div className="flex justify-between items-center text-slate-500 text-[10px] md:text-xs">
                                            <span>+ GST Amount</span>
                                            <span>₹ {totals.gstAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex justify-between items-end bg-indigo-50 p-3 md:p-4 rounded-2xl border border-indigo-100">
                                    <span className="font-bold text-indigo-900 uppercase tracking-widest text-[9px] md:text-[10px]">Grand Total</span>
                                    <span className="font-black text-2xl md:text-3xl tracking-tighter text-indigo-700">₹ {totals.finalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-4 md:space-y-5">
                            <h3 className="font-black text-slate-900 border-b border-slate-100 pb-2 md:pb-3 text-sm md:text-base">Payment Details</h3>
                            
                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 md:mb-2">Payment Method</label>
                                <select 
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-3 py-2.5 md:px-4 md:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                                >
                                    <option value="CASH">Cash Payment</option>
                                    <option value="UPI">UPI / QR Code</option>
                                    <option value="CARD">Credit/Debit Card</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="PENDING">Mark as Pending/Due</option>
                                </select>
                            </div>
                            
                            {paymentMethod !== 'CASH' && paymentMethod !== 'PENDING' && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 md:mb-2">Transaction ID (Optional)</label>
                                    <input 
                                        type="text"
                                        value={transactionId}
                                        onChange={(e) => setTransactionId(e.target.value)}
                                        placeholder="e.g. UTR or Ref number"
                                        className="w-full px-3 py-2 md:px-4 md:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 md:mb-2">Invoice Remarks</label>
                                <textarea 
                                    rows={2}
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Internal notes or terms to print..."
                                    className="w-full px-3 py-2 md:px-4 md:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                                />
                            </div>

                            <button 
                                onClick={handleGenerateInvoice}
                                disabled={saving}
                                className="w-full py-3 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs md:text-sm transition-all shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 md:w-5 md:h-5" />
                                )}
                                {saving ? 'Finalizing Ledger...' : 'Generate Official Invoice'}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
