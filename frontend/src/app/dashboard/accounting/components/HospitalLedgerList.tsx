"use client";

import { useEffect, useState } from 'react';
import {
    Building2,
    ChevronRight,
    ArrowRightLeft,
    Clock,
    Search,
    Download
} from 'lucide-react';
import { apiFetch } from '@/config/api';

interface HospitalBalance {
    hospital_id: number;
    legal_name: string;
    city: string;
    balance: number;
    last_bill_date?: string;
}

export default function HospitalLedgerList() {
    const [hospitals, setHospitals] = useState<HospitalBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch hospitals first
                const hospitalsData = await apiFetch('/hospitals/');

                // Fetch ledger balances for each hospital
                const results = await Promise.all(hospitalsData.map(async (h: any) => {
                    const ledger = await apiFetch(`/accounting-adv/ledger/HOSPITAL/${h.hospital_id}`);
                    return {
                        hospital_id: h.hospital_id,
                        legal_name: h.legal_name,
                        city: h.city,
                        balance: ledger.closing_balance || 0,
                        last_bill_date: ledger.transactions?.[ledger.transactions.length - 1]?.date
                    };
                }));

                setHospitals(results);
            } catch (error) {
                console.error("Failed to fetch ledger balances:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const filtered = hospitals.filter(h =>
        h.legal_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-12 text-center text-slate-400">Loading party ledgers...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search Hospital Account..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                    <Download size={16} /> Export All Balances
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Hospital Name</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Location</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Closing Balance</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map((h) => (
                            <tr key={h.hospital_id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 leading-tight">{h.legal_name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                                                Acc ID: H-{h.hospital_id}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <span className="text-sm font-medium text-slate-600 italic">{h.city || 'N/A'}</span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <p className={`text-lg font-black ${h.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        ₹{h.balance.toLocaleString()}
                                    </p>
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                                        {h.balance > 0 ? 'To be Collected' : 'Settled'}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button
                                        onClick={() => window.open(`/dashboard/accounting/ledger/${h.hospital_id}`, '_blank')}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95"
                                    >
                                        <ArrowRightLeft size={14} /> View Ledger
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
