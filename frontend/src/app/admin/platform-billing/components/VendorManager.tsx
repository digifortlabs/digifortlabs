"use client";

import { useEffect, useState } from 'react';
import {
    Truck,
    Plus,
    Search,
    ArrowUpRight,
    Loader2,
    Building,
    Mail,
    Phone,
    ArrowRightLeft,
    X
} from 'lucide-react';
import { apiFetch } from '@/config/api';

interface Vendor {
    vendor_id: number;
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    category?: string;
    balance?: number;
}

export default function VendorManager() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        category: 'Outsource Lab',
        gst_number: ''
    });

    const fetchVendors = async () => {
        try {
            const data = await apiFetch('/accounting-adv/vendors');
            // For each vendor, fetch balance from ledger
            const vendorsWithBalance = await Promise.all(data.map(async (v: any) => {
                const ledger = await apiFetch(`/accounting-adv/ledger/VENDOR/${v.vendor_id}`);
                return { ...v, balance: ledger.closing_balance || 0 };
            }));
            setVendors(vendorsWithBalance);
        } catch (error) {
            console.error("Fetch Vendors Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiFetch('/accounting-adv/vendors', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            setShowAddModal(false);
            setFormData({ name: '', contact_person: '', email: '', phone: '', category: 'Outsource Lab', gst_number: '' });
            fetchVendors();
        } catch (error) {
            alert("Failed to add vendor");
        }
    };

    const filtered = vendors.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-12 text-center text-slate-400">Loading procurement accounts...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search Vendors / Categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                    />
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-100"
                >
                    <Plus size={18} /> Register Vendor
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Supplier Name</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Contact</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Balance Due</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-12 text-center text-slate-300 italic">No vendors registered.</td>
                            </tr>
                        ) : filtered.map((v) => (
                            <tr key={v.vendor_id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                            <Truck size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 leading-tight">{v.name}</p>
                                            <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-md mt-1 inline-block">
                                                {v.category}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-slate-700">{v.contact_person || 'N/A'}</p>
                                        <div className="flex items-center gap-4 opacity-50">
                                            {v.email && <span title={v.email}><Mail size={12} /></span>}
                                            {v.phone && <span title={v.phone}><Phone size={12} /></span>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <p className={`text-lg font-black ${v.balance! > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        ₹{Math.abs(v.balance!).toLocaleString()}
                                    </p>
                                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-tighter">
                                        {v.balance! > 0 ? 'Payable (Cr)' : 'Settled (Dr)'}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button
                                        onClick={() => window.open(`/dashboard/accounting/ledger/vendor/${v.vendor_id}`, '_blank')}
                                        className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all active:scale-95"
                                    >
                                        <ArrowRightLeft size={14} /> Ledger
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Vendor Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                                    <Building size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 leading-tight">New Vendor Account</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Procurement Management</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors font-bold"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleAdd} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Company Name</label>
                                    <input
                                        type="text" required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        placeholder="e.g. SRL Diagnostics, Office Supplies Ltd..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Person</label>
                                        <input
                                            type="text"
                                            value={formData.contact_person}
                                            onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                                            className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        >
                                            {['Outsource Lab', 'Utility', 'IT / Software', 'Office Rent', 'Marketing', 'Consultant'].map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GST Identification Number (GSTIN)</label>
                                        <input
                                            type="text"
                                            value={formData.gst_number}
                                            onChange={e => setFormData({ ...formData, gst_number: e.target.value })}
                                            className="w-full mt-1.5 px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold"
                                            placeholder="e.g. 07AAAAA0000A1Z5"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                            >
                                Register Vendor
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
