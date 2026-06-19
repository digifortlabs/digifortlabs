"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/config/api';
import { toast } from 'sonner';
import { 
    FileText, ArrowLeft, Plus, Trash2, IndianRupee, Save, Loader2, CheckCircle2, Receipt, AlertCircle, ShoppingCart
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
        let sub = 0;
        items.forEach(item => {
            sub += (item.qty * item.unit_price) - item.discount;
        });

        const disc = Number(overallDiscount) || 0;
        const afterDisc = Math.max(0, sub - disc);
        
        const gRate = Number(gstRate) || 0;
        const gstAmt = (afterDisc * gRate) / 100;
        
        const finalAmt = afterDisc + gstAmt;

        return {
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
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-screen bg-slate-50/50 animate-in fade-in duration-500">
            
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => router.back()}
                    className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all shadow-sm group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Compile Invoice</h1>
                    <p className="text-slate-500 font-medium">Review unbilled clinical items and add custom charges</p>
                </div>
            </div>

            {pendingInvoice && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
                            <IndianRupee className="w-6 h-6 animate-pulse" />
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
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-black shadow-[0_4px_12px_rgba(217,119,6,0.3)] transition-all flex items-center justify-center gap-2"
                    >
                        <FileText size={16} />
                        View & Finalize Bill
                    </button>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8">
                
                <div className="flex-1 space-y-6">
                    
                    <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <p className="text-indigo-200 text-sm font-bold tracking-widest uppercase mb-1">Billing Account</p>
                                <h2 className="text-2xl font-black">{patient.full_name}</h2>
                                <p className="text-indigo-100 font-mono text-sm opacity-80">{patient.patient_u_id}</p>
                            </div>
                             <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
                                <IndianRupee className="text-indigo-300" size={20} />
                                <span className="font-bold text-sm tracking-wide">Pending Finalization</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-black text-slate-900 flex items-center gap-2 text-lg">
                                <AlertCircle className="text-amber-500" size={20} /> Unbilled Clinical Records
                            </h3>
                            <p className="text-sm text-slate-500 font-medium mt-1">Automatically pulled from IPD, OPD, and Dental records</p>
                        </div>

                        {serverItems.length === 0 ? (
                            <div className="p-12 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 size={32} />
                                </div>
                                <p className="text-slate-900 font-bold text-lg mb-1">No pending clinical charges</p>
                                <p className="text-slate-500 text-sm">All automated records have been billed.</p>
                            </div>
                        ) : (
                            <div className="p-6 space-y-4">
                                {serverItems.map((item, idx) => {
                                    const isSelected = selectedServerIndices.has(idx);
                                    return (
                                        <div 
                                            key={idx} 
                                            className={`p-4 rounded-2xl border-2 transition-all ${
                                                isSelected 
                                                ? 'border-indigo-500 bg-indigo-50/30 shadow-sm' 
                                                : 'border-slate-100 bg-white opacity-60'
                                            }`}
                                        >
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isSelected}
                                                        onChange={() => handleToggleServerItem(idx)}
                                                        className="mt-1.5 w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                    <div className="w-full">
                                                        <p className="font-bold text-slate-900">{item.description}</p>
                                                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black tracking-widest uppercase rounded">
                                                            {item.charge_type.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3 w-full md:w-auto ml-8 md:ml-0">
                                                    <div className="w-20">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Qty</label>
                                                        <input 
                                                            type="number" 
                                                            value={item.qty}
                                                            disabled={!isSelected}
                                                            onChange={(e) => handleUpdateServerItem(idx, 'qty', Number(e.target.value))}
                                                            className="w-full px-3 py-2 bg-white disabled:bg-transparent border border-slate-200 disabled:border-transparent rounded-xl text-sm text-center font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                                        />
                                                    </div>
                                                    <div className="w-28 relative">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Price</label>
                                                        <span className="absolute left-3 top-[30px] text-slate-400 font-medium">₹</span>
                                                        <input 
                                                            type="number" 
                                                            value={item.unit_price}
                                                            disabled={!isSelected}
                                                            onChange={(e) => handleUpdateServerItem(idx, 'unit_price', Number(e.target.value))}
                                                            className="w-full pl-7 pr-3 py-2 bg-white disabled:bg-transparent border border-slate-200 disabled:border-transparent rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                                        />
                                                    </div>
                                                    <div className="w-24 relative">
                                                        <label className="text-[10px] font-bold text-rose-400 uppercase ml-1">Disc</label>
                                                        <span className="absolute left-2.5 top-[30px] text-rose-400 font-medium">-₹</span>
                                                        <input 
                                                            type="number" 
                                                            value={item.discount}
                                                            disabled={!isSelected}
                                                            onChange={(e) => handleUpdateServerItem(idx, 'discount', Number(e.target.value))}
                                                            className="w-full pl-7 pr-3 py-2 bg-white disabled:bg-transparent border border-rose-200 disabled:border-transparent rounded-xl text-sm font-bold text-rose-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h3 className="font-black text-slate-900 flex items-center gap-2 text-lg">
                                    <ShoppingCart className="text-emerald-500" size={20} /> Additional Charges
                                </h3>
                                <p className="text-sm text-slate-500 font-medium mt-1">Add Pharmacy, Lab, or Misc charges manually</p>
                            </div>
                            <button 
                                onClick={handleAddCustomItem}
                                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-sm font-black transition-colors border border-emerald-200/50"
                            >
                                <Plus size={16} /> Add Item
                            </button>
                        </div>

                        {customItems.length === 0 ? (
                            <div className="p-10 text-center bg-slate-50/30">
                                <p className="text-slate-400 font-medium text-sm">No custom line items added yet.</p>
                            </div>
                        ) : (
                            <div className="p-6 space-y-4">
                                {customItems.map((item, idx) => (
                                    <div key={idx} className="flex flex-col md:flex-row items-start md:items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                                        <input 
                                            type="text" 
                                            placeholder="Charge description (e.g. Pharmacy, ECG)"
                                            value={item.description}
                                            onChange={(e) => handleUpdateCustomItem(idx, 'description', e.target.value)}
                                            className="flex-1 w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                        />
                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            <div className="w-20">
                                                <input 
                                                    type="number" 
                                                    placeholder="Qty"
                                                    value={item.qty}
                                                    min="1"
                                                    onChange={(e) => handleUpdateCustomItem(idx, 'qty', Number(e.target.value))}
                                                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="w-32 relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                                                <input 
                                                    type="number" 
                                                    placeholder="Price"
                                                    value={item.unit_price || ''}
                                                    onChange={(e) => handleUpdateCustomItem(idx, 'unit_price', Number(e.target.value))}
                                                    className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="w-28 relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 font-medium">-₹</span>
                                                <input 
                                                    type="number" 
                                                    placeholder="Disc"
                                                    value={item.discount || ''}
                                                    onChange={(e) => handleUpdateCustomItem(idx, 'discount', Number(e.target.value))}
                                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => handleRemoveCustomItem(idx)}
                                                className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full lg:w-[420px] space-y-6">
                    <div className="sticky top-6 space-y-6">
                        
                        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200 overflow-hidden relative">
                            <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
                            
                            <div className="p-6">
                                <h3 className="font-black text-xl text-slate-900 mb-6 flex items-center gap-2">
                                    <IndianRupee className="text-emerald-500" size={24} /> Live Receipt
                                </h3>
                                
                                <div className="space-y-4 text-sm font-bold border-b border-slate-100 pb-6 mb-6">
                                    <div className="flex justify-between items-center text-slate-600">
                                        <span>Total Line Items</span>
                                        <span className="text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">{totals.items.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-600">
                                        <span>Subtotal</span>
                                        <span className="text-slate-900 tracking-tight">₹ {totals.subtotal.toFixed(2)}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-rose-600">
                                        <span>Extra Discount</span>
                                        <div className="w-24 relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-medium">-₹</span>
                                            <input 
                                                type="number"
                                                value={overallDiscount}
                                                onChange={(e) => setOverallDiscount(e.target.value)}
                                                className="w-full pl-8 pr-2 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-slate-600">
                                        <span>Apply GST (%)</span>
                                        <div className="w-24 relative">
                                            <input 
                                                type="number"
                                                value={gstRate}
                                                onChange={(e) => setGstRate(e.target.value)}
                                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">%</span>
                                        </div>
                                    </div>
                                    {totals.gstAmount > 0 && (
                                        <div className="flex justify-between items-center text-slate-500 text-xs">
                                            <span>+ GST Amount</span>
                                            <span>₹ {totals.gstAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex justify-between items-end bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                                    <span className="font-bold text-indigo-900 uppercase tracking-widest text-[10px]">Grand Total</span>
                                    <span className="font-black text-3xl tracking-tighter text-indigo-700">₹ {totals.finalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
                            <h3 className="font-black text-slate-900 border-b border-slate-100 pb-3">Payment Details</h3>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Payment Method</label>
                                <select 
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
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
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Transaction ID (Optional)</label>
                                    <input 
                                        type="text"
                                        value={transactionId}
                                        onChange={(e) => setTransactionId(e.target.value)}
                                        placeholder="e.g. UTR or Ref number"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Invoice Remarks</label>
                                <textarea 
                                    rows={2}
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Internal notes or terms to print..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                                />
                            </div>

                            <button 
                                onClick={handleGenerateInvoice}
                                disabled={saving}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm transition-all shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
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
