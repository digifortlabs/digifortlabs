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
    Percent
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
    const [includeRegFee, setIncludeRegFee] = useState(true);
    const [regFeeAmount, setRegFeeAmount] = useState<string>('1000');
    const [customItems, setCustomItems] = useState<CustomItem[]>([]);
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemDiscount, setNewItemDiscount] = useState('');
    const [newItemHSN, setNewItemHSN] = useState('998311');

    useEffect(() => {
        if (isOpen && step === 1) {
            fetchHospitals();
        }
    }, [isOpen, step]);

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
            // Default select all
            setSelectedFileIds(data.map((f: UnbilledFile) => f.file_id));
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
        if (!selectedHospital || selectedFileIds.length === 0) return;

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
                    registration_fee_amount: includeRegFee ? (parseFloat(regFeeAmount) || 0) : null
                })
            });
            onSuccess();
            onClose();
            // Reset state
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
    const taxAmount = (subtotal * 0.18); // 18% GST
    const grandTotal = subtotal + taxAmount;

    const addCustomItem = () => {
        if (!newItemDesc || !newItemPrice) return;
        setCustomItems([...customItems, {
            description: newItemDesc,
            amount: parseFloat(newItemPrice),
            discount: parseFloat(newItemDiscount) || 0,
            hsn_code: newItemHSN
        }]);
        setNewItemDesc('');
        setNewItemPrice('');
        setNewItemDiscount('');
    };

    const removeCustomItem = (index: number) => {
        setCustomItems(customItems.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-6xl h-[95vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                {/* Modal Header */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Generate New Invoice</h2>
                        <p className="text-sm text-slate-500">Step {step} of 2: {step === 1 ? 'Select Hospital' : 'Review Items'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
                    {step === 1 ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search hospital by name or city..."
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    value={searchHospital}
                                    onChange={(e) => setSearchHospital(e.target.value)}
                                />
                            </div>

                            <div className="max-h-[350px] overflow-y-auto space-y-2 pr-2">
                                {filteredHospitals.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <Building2 size={40} className="mx-auto mb-2 opacity-20" />
                                        <p>No hospitals found.</p>
                                    </div>
                                ) : (
                                    filteredHospitals.map(hospital => (
                                        <button
                                            key={hospital.hospital_id}
                                            onClick={() => handleSelectHospital(hospital)}
                                            className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group active:scale-[0.99]"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                                    <Building2 size={24} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold text-slate-900">{hospital.legal_name}</p>
                                                    <p className="text-xs text-slate-500">{hospital.city}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Review Section */}
                            <div className="flex items-center justify-between bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none">Selected Hospital</p>
                                        <p className="font-bold text-slate-900 mt-1">{selectedHospital?.legal_name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:underline"
                                >
                                    <ArrowLeft size={14} /> Change
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                        <FileText size={18} className="text-slate-400" />
                                        Billable Items ({selectedFileIds.length})
                                    </h3>
                                    <button
                                        onClick={() => setSelectedFileIds(selectedFileIds.length === unbilledFiles.length ? [] : unbilledFiles.map(f => f.file_id))}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                                    >
                                        {selectedFileIds.length === unbilledFiles.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>

                                <div className="max-h-[400px] overflow-y-auto space-y-2 border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                                            <Loader2 className="animate-spin" size={32} />
                                            <p className="text-sm">Calculating costs...</p>
                                        </div>
                                    ) : unbilledFiles.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400">
                                            <AlertCircle size={32} className="mx-auto mb-2 opacity-20" />
                                            <p>No unpaid files available for billing.</p>
                                        </div>
                                    ) : (
                                        unbilledFiles.map(file => (
                                            <button
                                                key={file.file_id}
                                                onClick={() => toggleFileSelection(file.file_id)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${selectedFileIds.includes(file.file_id)
                                                    ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-50'
                                                    : 'bg-transparent border-transparent opacity-60 hover:opacity-100'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedFileIds.includes(file.file_id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'
                                                        }`}>
                                                        {selectedFileIds.includes(file.file_id) && <Check size={12} strokeWidth={3} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 truncate max-w-[250px]">{file.filename}</p>
                                                        <p className="text-[10px] text-slate-500 uppercase font-black">
                                                            <span className="text-indigo-600">MRD: {file.mrd_id}</span> • {file.patient_name} • {file.page_count} Pages
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-slate-900">₹{file.suggested_amount.toLocaleString()}</p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Additional Charges Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                        <Plus size={18} className="text-slate-400" />
                                        Additional Charges & Discounts
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 gap-3 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                                    {/* Registration Fee Toggle */}
                                    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-200 transition-all">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div
                                                onClick={() => setIncludeRegFee(!includeRegFee)}
                                                className={`w-5 h-5 cursor-pointer rounded-md border flex items-center justify-center transition-colors ${includeRegFee ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}
                                            >
                                                {includeRegFee && <Check size={12} strokeWidth={3} />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-900">One-time Registration Fee</p>
                                                <p className="text-[10px] text-slate-500 uppercase font-black">Initial setup & licensing fee</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-400 font-bold text-sm">₹</span>
                                            <input
                                                type="number"
                                                className="w-20 font-bold text-slate-900 text-sm bg-slate-50 border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                value={regFeeAmount}
                                                onChange={(e) => setRegFeeAmount(e.target.value)}
                                                disabled={!includeRegFee}
                                            />
                                        </div>
                                    </div>

                                    {/* Custom Items List */}
                                    {customItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl group">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{item.description}</p>
                                                <p className="text-[10px] text-slate-500 uppercase font-black">HSN: {item.hsn_code} • Price: ₹{item.amount}</p>
                                                {item.discount && item.discount > 0 && (
                                                    <p className="text-[10px] text-emerald-600 uppercase font-black">Discount: -₹{item.discount}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <p className="font-bold text-slate-900 text-sm">₹{(item.amount - (item.discount || 0)).toLocaleString()}</p>
                                                <button onClick={() => removeCustomItem(idx)} className="text-slate-300 hover:text-red-500 p-1">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Custom Item Form */}
                                    <div className="grid grid-cols-12 gap-2 mt-2 items-center">
                                        <input
                                            type="text"
                                            placeholder="Item Description"
                                            className="col-span-5 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                                            value={newItemDesc}
                                            onChange={(e) => setNewItemDesc(e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            className="col-span-3 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                                            value={newItemPrice}
                                            onChange={(e) => setNewItemPrice(e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Disc."
                                            className="col-span-2 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                                            value={newItemDiscount}
                                            onChange={(e) => setNewItemDiscount(e.target.value)}
                                        />
                                        <button
                                            onClick={addCustomItem}
                                            className="col-span-2 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1 h-full"
                                        >
                                            <Plus size={14} /> Add
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Bill Date (Requested)</label>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="date"
                                                value={billDate}
                                                onChange={(e) => setBillDate(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Due Date</label>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="date"
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-3 shadow-xl">
                                    <div className="flex justify-between items-center text-slate-400">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text">Files ({selectedFileIds.length})</span>
                                        <span className="font-bold text-xs">₹{filesTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-400 lg:">
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Other Charges (Net)</span>
                                        <span className="font-bold text-xs">₹{(customTotal + regFeeTotal).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-emerald-400/80 border-t border-slate-800 pt-2 border-dashed">
                                        <div className="flex items-center gap-1.5">
                                            <Percent size={10} strokeWidth={3} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">GST (18%)</span>
                                        </div>
                                        <span className="font-bold text-xs">₹{taxAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-1">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Grand Total</p>
                                        <p className="text-3xl font-black mt-1 tracking-tighter text-indigo-400">₹{grandTotal.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    {step === 2 && (
                        <button
                            disabled={loading || selectedFileIds.length === 0}
                            onClick={handleGenerate}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:scale-100 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            Generate Invoice
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
