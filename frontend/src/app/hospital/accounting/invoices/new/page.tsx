"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/config/api';
import { toast } from 'sonner';
import { 
    FileText, Plus, Trash2, IndianRupee, Save, ArrowLeft, Loader2, CheckSquare, Square
} from 'lucide-react';

interface UnbilledItem {
    description: string;
    qty: number;
    unit_price: number;
    discount: number;
    charge_type: string;
    reference_id: number;
    date?: string;
}

interface CustomItem {
    description: string;
    qty: number;
    unit_price: number;
    discount: number;
    charge_type: string;
}

export default function NewPatientInvoicePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const patientId = searchParams?.get('patient_id');

    const [loading, setLoading] = useState(true);
    const [patientInfo, setPatientInfo] = useState<any>(null);
    const [hospitalHasGst, setHospitalHasGst] = useState<boolean>(true);
    
    // Unbilled items fetched from server
    const [serverItems, setServerItems] = useState<UnbilledItem[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

    // Custom items added by user
    const [customItems, setCustomItems] = useState<CustomItem[]>([]);
    
    // Billing options
    const [gstRate, setGstRate] = useState<number>(18.0);
    const [overallDiscount, setOverallDiscount] = useState<number>(0.0);
    const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
    const [transactionId, setTransactionId] = useState<string>("");
    const [remarks, setRemarks] = useState<string>("");

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (patientId) {
            fetchUnbilledRecords();
        } else {
            toast.error("No patient selected");
            router.push('/hospital/accounting');
        }
    }, [patientId]);

    const fetchUnbilledRecords = async () => {
        try {
            setLoading(true);
            const data = await apiFetch(`/patient-billing/unbilled/${patientId}`);
            setPatientInfo(data.patient);
            setHospitalHasGst(data.hospital_has_gst ?? true);
            if (data.hospital_has_gst === false) {
                setGstRate(0);
            }
            setServerItems(data.unbilled_items || []);
            // Auto-select all unbilled items by default
            setSelectedIndices((data.unbilled_items || []).map((_: any, idx: number) => idx));
        } catch (error: any) {
            console.error('Failed to load unbilled records:', error);
            toast.error(error.message || 'Failed to load patient records');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectItem = (index: number) => {
        setSelectedIndices(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleAddCustomItem = () => {
        setCustomItems(prev => [
            ...prev,
            { description: "", qty: 1, unit_price: 0, discount: 0, charge_type: "CUSTOM" }
        ]);
    };

    const handleUpdateCustomItem = (index: number, field: keyof CustomItem, value: any) => {
        setCustomItems(prev => {
            const copy = [...prev];
            copy[index] = {
                ...copy[index],
                [field]: value
            };
            return copy;
        });
    };

    const handleRemoveCustomItem = (index: number) => {
        setCustomItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateServerItem = (index: number, field: keyof UnbilledItem, value: any) => {
        setServerItems(prev => {
            const copy = [...prev];
            copy[index] = {
                ...copy[index],
                [field]: value
            };
            return copy;
        });
    };

    // Calculate totals
    const subtotal = (() => {
        let total = 0.0;
        // Selected unbilled items
        selectedIndices.forEach(idx => {
            const item = serverItems[idx];
            if (item) {
                const qty = Number(item.qty) || 0;
                const price = Number(item.unit_price) || 0;
                const disc = Number(item.discount) || 0;
                total += (qty * price) - disc;
            }
        });
        // Custom items
        customItems.forEach(item => {
            const qty = Number(item.qty) || 0;
            const price = Number(item.unit_price) || 0;
            const disc = Number(item.discount) || 0;
            total += (qty * price) - disc;
        });
        return total;
    })();

    const taxAmount = (subtotal * gstRate) / 100.0;
    const totalAmount = Math.max(0, subtotal - overallDiscount + taxAmount);

    const handleGenerateInvoice = async () => {
        const selectedItems = selectedIndices.map(idx => ({
            description: serverItems[idx].description,
            qty: Number(serverItems[idx].qty) || 0,
            unit_price: Number(serverItems[idx].unit_price) || 0,
            discount: Number(serverItems[idx].discount) || 0,
            charge_type: serverItems[idx].charge_type,
            reference_id: serverItems[idx].reference_id
        }));

        const validatedCustomItems = customItems.filter(i => i.description.trim() !== "").map(i => ({
            description: i.description,
            qty: Number(i.qty) || 0,
            unit_price: Number(i.unit_price) || 0,
            discount: Number(i.discount) || 0,
            charge_type: i.charge_type
        }));

        const allItems = [...selectedItems, ...validatedCustomItems];

        if (allItems.length === 0) {
            toast.error("Please add at least one line item to generate the invoice");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                patient_id: Number(patientId),
                items: allItems,
                discount_amount: Number(overallDiscount),
                gst_rate: Number(gstRate),
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
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-slate-400">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
                <p className="font-bold text-lg text-slate-900">Loading Patient Records...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/hospital/accounting')}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-slate-500"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <FileText className="text-indigo-600" /> Compile Patient Invoice
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">Create a patient bill from unbilled visits or custom charges.</p>
                    </div>
                </div>
            </div>

            {/* Patient Card */}
            {patientInfo && (
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Patient Name</p>
                        <p className="font-black text-lg text-indigo-300 mt-0.5">{patientInfo.name}</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">MRD / UHID</p>
                        <p className="font-bold text-sm mt-0.5 font-mono text-white">{patientInfo.mrd_number}</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phone</p>
                        <p className="font-semibold text-sm mt-0.5">{patientInfo.phone || '-'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email</p>
                        <p className="font-semibold text-sm mt-0.5 text-slate-300">{patientInfo.email || '-'}</p>
                    </div>
                </div>
            )}

            {/* Main Billing Compiler Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Side: Items selection and creation */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Unbilled Records from Server */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                        <h3 className="font-black text-slate-950 flex items-center gap-2">
                            <CheckSquare className="text-indigo-600" size={18} /> Selected Unbilled Records ({selectedIndices.length})
                        </h3>
                        
                        {serverItems.length === 0 ? (
                            <p className="text-slate-400 text-sm font-medium py-4 text-center border border-dashed border-slate-200 rounded-xl">
                                No outstanding unbilled visits, treatments, or stays found for this patient.
                            </p>
                        ) : (
                            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                                {serverItems.map((item, idx) => {
                                    const isSelected = selectedIndices.includes(idx);
                                    return (
                                        <div 
                                            key={idx} 
                                            className={`p-4 flex flex-col md:flex-row items-start md:items-center gap-4 transition-colors ${
                                                isSelected ? 'bg-indigo-50/5' : 'bg-slate-50/30'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 w-full md:w-auto">
                                                <div 
                                                    onClick={() => toggleSelectItem(idx)}
                                                    className="text-indigo-600 cursor-pointer hover:scale-105 transition-transform"
                                                >
                                                    {isSelected ? <CheckSquare size={22} /> : <Square size={22} />}
                                                </div>
                                                <div className="flex-1 md:hidden">
                                                    <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                                                        {item.charge_type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 min-w-0 space-y-1 w-full">
                                                <input 
                                                    type="text"
                                                    value={item.description}
                                                    disabled={!isSelected}
                                                    onChange={(e) => handleUpdateServerItem(idx, 'description', e.target.value)}
                                                    className="w-full px-3 py-1.5 bg-white disabled:bg-slate-50 border border-slate-200 disabled:border-slate-100 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all"
                                                    placeholder="Description"
                                                />
                                                <div className="hidden md:flex items-center gap-2">
                                                    <span className="text-[9px] uppercase tracking-wider font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                                        {item.charge_type.replace('_', ' ')}
                                                    </span>
                                                    {item.date && (
                                                        <span className="text-[10px] text-slate-400 font-semibold">
                                                            Date: {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                                                <div className="w-16">
                                                    <span className="block md:hidden text-[9px] uppercase font-bold text-slate-400 mb-1">Qty</span>
                                                    <input 
                                                        type="number" 
                                                        placeholder="Qty"
                                                        value={item.qty}
                                                        min="1"
                                                        disabled={!isSelected}
                                                        onChange={(e) => handleUpdateServerItem(idx, 'qty', Number(e.target.value))}
                                                        className="w-full px-2 py-1.5 bg-white disabled:bg-slate-50 border border-slate-200 disabled:border-slate-100 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                                                    />
                                                </div>
                                                
                                                <div className="w-28 relative">
                                                    <span className="block md:hidden text-[9px] uppercase font-bold text-slate-400 mb-1">Price (₹)</span>
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                                                        <input 
                                                            type="number" 
                                                            placeholder="Price"
                                                            value={item.unit_price}
                                                            disabled={!isSelected}
                                                            onChange={(e) => handleUpdateServerItem(idx, 'unit_price', Number(e.target.value))}
                                                            className="w-full pl-6 pr-2 py-1.5 bg-white disabled:bg-slate-50 border border-slate-200 disabled:border-slate-100 rounded-lg text-sm font-black text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="w-24 relative">
                                                    <span className="block md:hidden text-[9px] uppercase font-bold text-slate-400 mb-1">Disc (₹)</span>
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">-₹</span>
                                                        <input 
                                                            type="number" 
                                                            placeholder="Discount"
                                                            value={item.discount}
                                                            disabled={!isSelected}
                                                            onChange={(e) => handleUpdateServerItem(idx, 'discount', Number(e.target.value))}
                                                            className="w-full pl-5 pr-2 py-1.5 bg-white disabled:bg-slate-50 border border-slate-200 disabled:border-slate-100 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm text-rose-600 font-bold"
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

                    {/* Custom charges compiler */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-slate-950 flex items-center gap-2">
                                <Plus className="text-indigo-600" size={18} /> Additional Custom Charges
                            </h3>
                            <button 
                                onClick={handleAddCustomItem}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
                            >
                                <Plus size={14} /> Add Line Item
                            </button>
                        </div>

                        {customItems.length === 0 ? (
                            <p className="text-slate-400 text-sm font-medium py-6 text-center border border-dashed border-slate-200 rounded-xl">
                                Click "Add Line Item" to add pharmacy, laboratory, or misc charges.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {customItems.map((item, idx) => (
                                    <div key={idx} className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl animate-in slide-in-from-top-1 duration-200">
                                        <input 
                                            type="text" 
                                            placeholder="Charge description (e.g. Pharmacy, ECG)"
                                            value={item.description}
                                            onChange={(e) => handleUpdateCustomItem(idx, 'description', e.target.value)}
                                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                                        />
                                        <div className="flex items-center gap-2 w-full md:w-auto">
                                            <div className="w-16">
                                                <input 
                                                    type="number" 
                                                    placeholder="Qty"
                                                    value={item.qty}
                                                    min="1"
                                                    onChange={(e) => handleUpdateCustomItem(idx, 'qty', Number(e.target.value))}
                                                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                                                />
                                            </div>
                                            <div className="w-28 relative">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                                                <input 
                                                    type="number" 
                                                    placeholder="Price"
                                                    value={item.unit_price || ''}
                                                    onChange={(e) => handleUpdateCustomItem(idx, 'unit_price', Number(e.target.value))}
                                                    className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm font-bold"
                                                />
                                            </div>
                                            <div className="w-24 relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">-₹</span>
                                                <input 
                                                    type="number" 
                                                    placeholder="Disc"
                                                    value={item.discount || ''}
                                                    onChange={(e) => handleUpdateCustomItem(idx, 'discount', Number(e.target.value))}
                                                    className="w-full pl-5 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm text-rose-600 font-bold"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => handleRemoveCustomItem(idx)}
                                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
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

                {/* Right Side: Total Summary Panel & Payment settings */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 sticky top-6">
                        <h3 className="font-black text-slate-950 pb-3 border-b border-slate-100">Invoice Settings & Summary</h3>
                        
                        {/* Summary details */}
                        <div className="space-y-3 text-sm font-medium">
                            <div className="flex justify-between text-slate-500">
                                <span>Subtotal</span>
                                <span className="font-bold text-slate-900">₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            
                            {/* GST Rate */}
                            {hospitalHasGst && (
                                <>
                                    <div className="flex items-center justify-between gap-4 py-1.5 border-y border-slate-50">
                                        <span className="text-slate-500">GST Rate (%)</span>
                                        <div className="w-20">
                                            <select 
                                                value={gstRate}
                                                onChange={(e) => setGstRate(Number(e.target.value))}
                                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center font-bold focus:outline-none"
                                            >
                                                <option value="0">0%</option>
                                                <option value="5">5%</option>
                                                <option value="12">12%</option>
                                                <option value="18">18%</option>
                                                <option value="28">28%</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between text-slate-500">
                                        <span>Calculated GST</span>
                                        <span className="font-bold text-slate-900">₹ {taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </>
                            )}

                            {/* Overall Discount */}
                            <div className="flex items-center justify-between gap-4 py-1.5 border-b border-slate-50">
                                <span className="text-slate-500">Invoice Discount</span>
                                <div className="w-28 relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                                    <input 
                                        type="number"
                                        value={overallDiscount || ''}
                                        onChange={(e) => setOverallDiscount(Number(e.target.value))}
                                        placeholder="Discount"
                                        className="w-full pl-5 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm text-right font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-indigo-50 text-indigo-900 p-4 rounded-xl">
                                <span className="font-black text-xs uppercase tracking-wider">Total Amount</span>
                                <span className="text-xl font-black flex items-center gap-0.5">
                                    <IndianRupee className="w-4 h-4" /> {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        {/* Payment settings */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider">Payment Details</h4>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Method</label>
                                    <select 
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                        <option value="CASH">Cash Payment</option>
                                        <option value="CARD">Debit/Credit Card</option>
                                        <option value="QR_CODE">QR Code Transfer</option>
                                        <option value="VOUCHER">Medical Voucher</option>
                                        <option value="GOVT_SCHEME">Govt. Scheme / Insurance</option>
                                    </select>
                                </div>

                                {paymentMethod !== "CASH" && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Transaction / Reference ID</label>
                                        <input 
                                            type="text"
                                            value={transactionId}
                                            onChange={(e) => setTransactionId(e.target.value)}
                                            placeholder="Enter Txn ID / Approval Code"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Billing Remarks</label>
                                    <textarea 
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder="Optional internal remarks"
                                        rows={2}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Trigger */}
                        <button 
                            onClick={handleGenerateInvoice}
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-lg disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} /> Generating Invoice...
                                </>
                            ) : (
                                <>
                                    <Save size={18} /> Generate Bill & Print
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
