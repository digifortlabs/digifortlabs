"use client";

import { useState, useEffect } from 'react';
import {
    X,
    Search,
    Building2,
    FileText,
    Check,
    ChevronRight,
    AlertCircle,
    Loader2,
    Calendar as CalendarIcon,
    ArrowLeft,
    Plus,
    Trash2,
    Percent,
    CheckCircle2 // Added missing import
} from 'lucide-react';
import { apiFetch } from '@/config/api';
import { format } from 'date-fns';

interface Hospital {
    hospital_id: number;
    legal_name: string;
    city: string;
}

interface UnbilledFile {
    file_id: number;
    filename: string;
    patient_name: string;
    mrd_id: string;
    page_count: number;
    created_at: string;
    suggested_amount: number;
}

interface CustomItem {
    description: string;
    amount: number;
    discount?: number; // Added discount field
    hsn_code: string;
}

interface InvoiceGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function InvoiceGenerationModal({ isOpen, onClose, onSuccess }: InvoiceGenerationModalProps) {
    const [step, setStep] = useState(1);
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
    const [unbilledFiles, setUnbilledFiles] = useState<UnbilledFile[]>([]);
    const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchHospital, setSearchHospital] = useState('');
    const [billDate, setBillDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [dueDate, setDueDate] = useState<string>(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));

    // New States for Invoice Numbering
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [config, setConfig] = useState<any>(null);

    const [includeRegFee, setIncludeRegFee] = useState(false); // Default unchecked
    const [regFeeAmount, setRegFeeAmount] = useState<string>('1000');
    const [customItems, setCustomItems] = useState<CustomItem[]>([]);
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemDiscount, setNewItemDiscount] = useState('');
    const [newItemDiscountType, setNewItemDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
    const [newItemHSN, setNewItemHSN] = useState('998311');
    const [isGSTBill, setIsGSTBill] = useState(true); // Added GST Toggle State

    useEffect(() => {
        if (isOpen && step === 1) {
            fetchHospitals();
            fetchConfig();
        }
    }, [isOpen, step]);

    useEffect(() => {
        // Auto-update number on toggle change if config exists
        if (config) {
            updateInvoiceNumberPreview();
        }
    }, [isGSTBill, config]);

    const fetchConfig = async () => {
        try {
            const data = await apiFetch('/accounting/config');
            setConfig(data);
        } catch (error) {
            console.error("Error fetching config:", error);
        }
    };

    const updateInvoiceNumberPreview = () => {
        if (!config) return;

        let prefix = isGSTBill ? config.invoice_prefix : (config.invoice_prefix_nongst || "BOS");
        let number = isGSTBill ? config.next_invoice_number : (config.next_invoice_number_nongst || 1);

        // Use default format logic
        // Format: {prefix}-{fy}-{number:03d}
        // We will do a simple construction here
        const numStr = number.toString().padStart(3, '0');
        const preview = `${prefix}-${config.current_fy}-${numStr}`;
        setInvoiceNumber(preview);
    };

    const fetchHospitals = async () => {
        try {
            const data = await apiFetch('/hospitals/');
            setHospitals(data);
        } catch (error) {
            console.error("Error fetching hospitals:", error);
        }
    };

    const fetchUnbilledFiles = async (hospitalId: number) => {
        setLoading(true);
        try {
            const data = await apiFetch(`/accounting/unbilled/${hospitalId}`);
            setUnbilledFiles(data);
            setSelectedFileIds([]); // Default uncheck all
        } catch (error) {
            console.error("Error fetching unbilled files:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectHospital = (hospital: Hospital) => {
        setSelectedHospital(hospital);
        fetchUnbilledFiles(hospital.hospital_id);
        setStep(2);
    };

    const toggleFileSelection = (id: number) => {
        setSelectedFileIds(prev =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        if (!selectedHospital) return;

        // Validation check for empty invoice
        const hasFiles = selectedFileIds.length > 0;
        const hasCustomItems = customItems.length > 0;
        const hasRegFee = includeRegFee && parseFloat(regFeeAmount) > 0;

        if (!hasFiles && !hasCustomItems && !hasRegFee) {
            alert("Please select at least one item (file, custom item, or registration fee) to generate an invoice.");
            return;
        }

        setLoading(true);
        try {
            await apiFetch('/accounting/generate', {
                method: 'POST',
                body: JSON.stringify({
                    hospital_id: selectedHospital.hospital_id,
                    file_ids: selectedFileIds,
                    custom_items: customItems,
                    due_date: new Date(dueDate).toISOString(),
                    bill_date: new Date(billDate).toISOString(),
                    include_registration_fee: includeRegFee,
                    registration_fee_amount: includeRegFee ? (parseFloat(regFeeAmount) || 0) : null,
                    is_gst_bill: isGSTBill,
                    custom_invoice_number: invoiceNumber // Added semi-auto numbering
                })
            });
            onSuccess();
            onClose();
            setStep(1);
            setSelectedHospital(null);
            setSelectedFileIds([]);
            setCustomItems([]);
        } catch (error) {
            console.error("Error generating invoice:", error);
            alert("Failed to generate invoice. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredHospitals = hospitals.filter(h =>
        h.legal_name.toLowerCase().includes(searchHospital.toLowerCase()) ||
        h.city.toLowerCase().includes(searchHospital.toLowerCase())
    );

    const filesTotal = unbilledFiles
        .filter(f => selectedFileIds.includes(f.file_id))
        .reduce((sum, f) => sum + f.suggested_amount, 0);

    const customTotal = customItems.reduce((sum, item) => sum + (item.amount - (item.discount || 0)), 0);
    const regFeeTotal = includeRegFee ? (parseFloat(regFeeAmount) || 0) : 0;

    const subtotal = filesTotal + customTotal + regFeeTotal;
    const taxAmount = isGSTBill ? (subtotal * 0.18) : 0;
    const grandTotal = subtotal + taxAmount;

    // Round Off Logic
    const roundedTotal = Math.round(grandTotal);
    const roundOffDiff = roundedTotal - grandTotal;

    const addCustomItem = () => {
        if (!newItemDesc || !newItemPrice) return;

        const price = parseFloat(newItemPrice);
        let discount = parseFloat(newItemDiscount) || 0;
        let finalDesc = newItemDesc;

        if (newItemDiscountType === 'PERCENT' && discount > 0) {
            const percent = discount;
            discount = (price * percent) / 100;
            finalDesc = `${newItemDesc} (${percent}% Off)`;
        }

        setCustomItems([...customItems, {
            description: finalDesc,
            amount: price,
            discount: discount,
            hsn_code: newItemHSN
        }]);
        setNewItemDesc('');
        setNewItemPrice('');
        setNewItemDiscount('');
        setNewItemDiscountType('FIXED');
    };

    const removeCustomItem = (index: number) => {
        setCustomItems(customItems.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`bg-white w-full ${step === 2 ? 'max-w-7xl' : 'max-w-4xl'} max-h-[85vh] h-[75vh] flex flex-col rounded-[1.5rem] shadow-2xl overflow-hidden transition-all duration-500`}>

                {/* Header */}
                <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">New Tax Invoice</h2>
                        <p className="text-xs font-medium text-slate-500">Create a professional GST invoice</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-slate-100 rounded-full p-1">
                            <div className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${step === 1 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>1. Select Client</div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${step === 2 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>2. Add Items</div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {step === 1 ? (
                        <div className="h-full flex flex-col p-8 max-w-2xl mx-auto">
                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search hospital..."
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    value={searchHospital}
                                    onChange={(e) => setSearchHospital(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
                                {filteredHospitals.map(hospital => (
                                    <button
                                        key={hospital.hospital_id}
                                        onClick={() => handleSelectHospital(hospital)}
                                        className="w-full flex items-center p-4 rounded-2xl border border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all group text-left"
                                    >
                                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors mr-4">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 group-hover:text-indigo-700 text-lg">{hospital.legal_name}</p>
                                            <p className="text-sm text-slate-500">{hospital.city}</p>
                                        </div>
                                        <ChevronRight className="ml-auto text-slate-300 group-hover:text-indigo-600" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">

                            {/* LEFT PANE: Items Selection */}
                            <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
                                {/* Toolbar */}
                                <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-4">
                                    <button onClick={() => setStep(1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm">
                                        <ArrowLeft size={16} /> Change Client
                                    </button>
                                    <div className="h-4 w-px bg-slate-200"></div>
                                    <div className="flex items-center gap-2">
                                        <Building2 size={16} className="text-indigo-600" />
                                        <span className="font-bold text-slate-900">{selectedHospital?.legal_name}</span>
                                    </div>
                                    <div className="ml-auto flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                                        <button
                                            onClick={() => setIsGSTBill(true)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${isGSTBill ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                        >
                                            GST Invoice
                                        </button>
                                        <button
                                            onClick={() => setIsGSTBill(false)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!isGSTBill ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                        >
                                            Bill of Supply
                                        </button>
                                    </div>
                                </div>

                                {/* Scrollable Content */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                                    {/* 1. Unbilled Files Table */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                <FileText size={20} className="text-slate-400" />
                                                Billable Records
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs">{unbilledFiles.length}</span>
                                            </h3>
                                            <button
                                                onClick={() => setSelectedFileIds(selectedFileIds.length === unbilledFiles.length ? [] : unbilledFiles.map(f => f.file_id))}
                                                className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded-lg transition"
                                            >
                                                {selectedFileIds.length === unbilledFiles.length ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>

                                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-400 font-bold tracking-wider">
                                                    <tr>
                                                        <th className="px-4 py-3 w-10">
                                                            <div className="w-4 h-4 border-2 border-slate-300 rounded mx-auto" ></div>
                                                        </th>
                                                        <th className="px-4 py-3">Record Details</th>
                                                        <th className="px-4 py-3 text-right">Pages</th>
                                                        <th className="px-4 py-3 text-right">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-sm">
                                                    {loading ? (
                                                        <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" /></td></tr>
                                                    ) : unbilledFiles.length === 0 ? (
                                                        <tr><td colSpan={4} className="p-8 text-center text-slate-400">No unbilled files found.</td></tr>
                                                    ) : unbilledFiles.map(file => (
                                                        <tr
                                                            key={file.file_id}
                                                            onClick={() => toggleFileSelection(file.file_id)}
                                                            className={`cursor-pointer transition-colors ${selectedFileIds.includes(file.file_id) ? 'bg-indigo-50/60' : 'hover:bg-slate-50'}`}
                                                        >
                                                            <td className="px-3 py-2 text-center">
                                                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selectedFileIds.includes(file.file_id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                                                    {selectedFileIds.includes(file.file_id) && <Check size={10} className="text-white" strokeWidth={4} />}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <div className="font-bold text-slate-800 text-sm">{file.patient_name}</div>
                                                                <div className="text-[10px] text-slate-500 font-mono">MRD: {file.mrd_id} • {format(new Date(file.created_at), 'dd MMM yyyy')}</div>
                                                            </td>
                                                            <td className="px-3 py-2 text-right text-slate-600 font-mono text-xs">{file.page_count}</td>
                                                            <td className="px-3 py-2 text-right font-bold text-slate-900 text-sm">₹{file.suggested_amount}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* 2. Additional Charges */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <Plus size={20} className="text-slate-400" /> Additional Line Items
                                        </h3>

                                        {/* Reg Fee Card */}
                                        <div
                                            onClick={() => setIncludeRegFee(!includeRegFee)}
                                            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${includeRegFee ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${includeRegFee ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                                {includeRegFee && <Check size={12} className="text-white" strokeWidth={4} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-slate-800">One-time Registration Fee</div>
                                                <div className="text-xs text-slate-500">Initial platform setup & licensing</div>
                                            </div>
                                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                                                <span className="text-slate-400 font-bold text-xs">₹</span>
                                                <input
                                                    type="number"
                                                    className="w-20 text-right font-bold text-slate-900 outline-none"
                                                    value={regFeeAmount}
                                                    onChange={(e) => setRegFeeAmount(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    disabled={!includeRegFee}
                                                />
                                            </div>
                                        </div>

                                        {/* Custom Items List */}
                                        {customItems.length > 0 && (
                                            <div className="space-y-2">
                                                {customItems.map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                                                        <div>
                                                            <p className="font-bold text-slate-800">{item.description}</p>
                                                            <p className="text-xs text-slate-500">HSN: {item.hsn_code} {item.discount ? `• Disc: ₹${item.discount}` : ''}</p>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="font-bold text-slate-900">₹{item.amount - (item.discount || 0)}</span>
                                                            <button onClick={() => removeCustomItem(idx)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add Item Form */}
                                        <div className="grid grid-cols-12 gap-2">
                                            <input className="col-span-4 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500" placeholder="Description" value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} />
                                            <input className="col-span-3 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500" placeholder="HSN Code" value={newItemHSN} onChange={e => setNewItemHSN(e.target.value)} />
                                            <input className="col-span-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500" type="number" placeholder="Price" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} />
                                            <div className="col-span-3 flex border border-slate-200 rounded-lg bg-white overflow-hidden">
                                                <input
                                                    className="w-full px-3 py-2 text-sm outline-none"
                                                    type="number"
                                                    placeholder="Disc"
                                                    value={newItemDiscount}
                                                    onChange={e => setNewItemDiscount(e.target.value)}
                                                />
                                                <div className="flex border-l border-slate-100">
                                                    <button
                                                        onClick={() => setNewItemDiscountType('FIXED')}
                                                        className={`px-2 text-xs font-bold transition-colors ${newItemDiscountType === 'FIXED' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >₹</button>
                                                    <button
                                                        onClick={() => setNewItemDiscountType('PERCENT')}
                                                        className={`px-2 text-xs font-bold transition-colors ${newItemDiscountType === 'PERCENT' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                                                    >%</button>
                                                </div>
                                            </div>
                                            <button onClick={addCustomItem} className="col-span-1 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors"><Plus size={18} /></button>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* RIGHT PANE: Summary & Actions (Sticky) */}
                            <div className="w-[380px] bg-white flex flex-col h-full border-l border-slate-100 shadow-2xl z-10">
                                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-4">Invoice Summary</h3>

                                        {/* Invoice Number Preview */}
                                        <div className="space-y-1 mb-6">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice Number (Auto)</label>
                                            <input
                                                type="text"
                                                value={invoiceNumber}
                                                onChange={e => setInvoiceNumber(e.target.value)}
                                                className="w-full bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 font-black text-indigo-700 outline-none focus:border-indigo-500 transition-colors"
                                            />
                                        </div>

                                        {/* Date Pickers */}
                                        <div className="space-y-3 mb-6">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Issue Date</label>
                                                <input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 outline-none focus:border-indigo-500" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Due Date</label>
                                                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 outline-none focus:border-indigo-500" />
                                            </div>
                                        </div>

                                        {/* Totals */}
                                        <div className="bg-slate-50 rounded-2xl p-2 space-y-2 border border-slate-100">
                                            <div className="flex justify-between text-xs text-slate-600">
                                                <span>Records ({selectedFileIds.length})</span>
                                                <span className="font-bold text-slate-900">₹{filesTotal.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-600">
                                                <span>Other Items</span>
                                                <span className="font-bold text-slate-900">₹{(customTotal + regFeeTotal).toLocaleString()}</span>
                                            </div>
                                            <div className="h-px bg-slate-200 my-1"></div>
                                            <div className="flex justify-between text-sm font-bold text-slate-700">
                                                <span>Taxable Value</span>
                                                <span>₹{subtotal.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>GST ({isGSTBill ? '18%' : '0%'})</span>
                                                <span>₹{taxAmount.toLocaleString()}</span>
                                            </div>

                                            {/* Round Off Display */}
                                            <div className="flex justify-between text-xs text-slate-400 italic">
                                                <span>Round Off</span>
                                                <span>{roundOffDiff > 0 ? '+' : ''}{roundOffDiff.toFixed(2)}</span>
                                            </div>

                                            <div className="h-px bg-slate-200 my-1"></div>
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-base font-black text-slate-900">Total</span>
                                                <span className="text-xl font-black text-indigo-600">₹{roundedTotal.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0 pt-2">
                                        <button
                                            onClick={handleGenerate}
                                            disabled={loading}
                                            className="w-full bg-slate-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/10"
                                        >
                                            {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                            Generate Invoice
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
