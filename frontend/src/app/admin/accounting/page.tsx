"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/config/api';
import { toast } from 'sonner';
import { 
    Calendar, FileText, Search, Download, Filter, IndianRupee, Users, Plus, Mail, Send, Printer, ListCollapse, Loader2
} from 'lucide-react';


interface PatientBilling {
    record_id: number;
    patient_u_id: string;
    full_name: string;
    admission_date: string | null;
    discharge_date: string | null;
    total_bill_amount: number | null;
}

interface PatientInvoice {
    invoice_id: number;
    invoice_number: string;
    patient_id: number;
    patient_name: string;
    mrd_number: string;
    bill_date: string;
    total_amount: number;
    status: string;
    payment_method: string;
}

export default function PatientBillingDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'patients' | 'invoices'>('patients');
    const [patients, setPatients] = useState<PatientBilling[]>([]);
    const [invoices, setInvoices] = useState<PatientInvoice[]>([]);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

    // Notification states
    const [emailLoading, setEmailLoading] = useState<number | null>(null);
    const [whatsappLoading, setWhatsappLoading] = useState<number | null>(null);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            setLoadingPatients(true);
            const data = await apiFetch('/patients/');
            setPatients(data);
        } catch (error: any) {
            console.error('Failed to fetch patients:', error);
            toast.error(error.message || 'Failed to load patients billing data');
        } finally {
            setLoadingPatients(false);
        }
    };

    const fetchInvoices = async () => {
        try {
            setLoadingInvoices(true);
            const data = await apiFetch('/patient-billing/invoices');
            setInvoices(data);
        } catch (error: any) {
            console.error('Failed to fetch patient invoices:', error);
            toast.error(error.message || 'Failed to load invoice history');
        } finally {
            setLoadingInvoices(false);
        }
    };

    const handleTabChange = (tab: 'patients' | 'invoices') => {
        setActiveTab(tab);
        if (tab === 'invoices') {
            fetchInvoices();
        }
    };

    // Filtered lists
    const filteredPatients = useMemo(() => {
        return patients.filter(p => {
            const matchesSearch = p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  p.patient_u_id.toLowerCase().includes(searchQuery.toLowerCase());
            
            let matchesYear = false;
            if (selectedYear === 'All') {
                matchesYear = true;
            } else {
                const admYear = p.admission_date ? new Date(p.admission_date).getFullYear().toString() : null;
                const disYear = p.discharge_date ? new Date(p.discharge_date).getFullYear().toString() : null;
                matchesYear = admYear === selectedYear || disYear === selectedYear;
            }

            return matchesSearch && matchesYear;
        }).sort((a, b) => {
            if (!a.admission_date) return 1;
            if (!b.admission_date) return -1;
            return new Date(b.admission_date).getTime() - new Date(a.admission_date).getTime();
        });
    }, [patients, selectedYear, searchQuery]);

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            return inv.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   inv.mrd_number.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [invoices, searchQuery]);

    const totalRevenue = patients.reduce((sum, p) => sum + (p.total_bill_amount || 0), 0);

    const handleSendEmail = async (invoiceId: number) => {
        setEmailLoading(invoiceId);
        try {
            await apiFetch(`/patient-billing/invoices/${invoiceId}/send-email`, { method: 'POST' });
            toast.success("Invoice statement emailed to patient successfully!");
        } catch (error: any) {
            toast.error(error.message || "Failed to send email statement.");
        } finally {
            setEmailLoading(null);
        }
    };

    const handleSendWhatsApp = async (invoiceId: number) => {
        setWhatsappLoading(invoiceId);
        try {
            await apiFetch(`/patient-billing/invoices/${invoiceId}/send-whatsapp`, { method: 'POST' });
            toast.success("Invoice PDF statement link sent via WhatsApp!");
        } catch (error: any) {
            toast.error(error.message || "Failed to send WhatsApp message.");
        } finally {
            setWhatsappLoading(null);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <FileText className="w-6 h-6" />
                        </div>
                        Billing & Accounts Manager
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Manage patient invoicing, billing ledger details, and daily collections.</p>
                </div>

                {/* Dashboard Action Triggers */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <button 
                        onClick={() => router.push('/hospital/accounting/daily-report')}
                        className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 border border-indigo-100"
                    >
                        <Calendar size={14} /> View 9 PM Daily Report
                    </button>
                </div>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                        <IndianRupee className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Billed Revenue</p>
                        <p className="text-2xl font-black text-slate-900">₹ {totalRevenue.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Patient Records</p>
                        <p className="text-2xl font-black text-slate-900">{patients.length}</p>
                    </div>
                </div>
            </div>

            {/* TABS CONTROL */}
            <div className="flex gap-2 border-b border-slate-200 pb-px">
                <button
                    onClick={() => handleTabChange('patients')}
                    className={`px-5 py-3 text-sm font-bold tracking-tight transition-all border-b-2 ${
                        activeTab === 'patients' 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    Outstanding Patients list
                </button>
                <button
                    onClick={() => handleTabChange('invoices')}
                    className={`px-5 py-3 text-sm font-bold tracking-tight transition-all border-b-2 ${
                        activeTab === 'invoices' 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    Generated Invoice History
                </button>
            </div>

            {/* Filters panel */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search patient, MRD, or Invoice #..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    />
                </div>

                {activeTab === 'patients' && (
                    <div className="relative w-full sm:w-auto">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="pl-9 pr-8 py-2 w-full bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none shadow-sm text-slate-700"
                        >
                            <option value="All">All Years</option>
                            <option value="2026">2026</option>
                            <option value="2025">2025</option>
                        </select>
                        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                )}
            </div>

            {/* MAIN DASHBOARD TABLES */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                
                {/* 1. Patients tab content */}
                {activeTab === 'patients' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                    <th className="p-4 pl-6">Patient (MRD)</th>
                                    <th className="p-4">Admission stay</th>
                                    <th className="p-4 text-right">Total Billed</th>
                                    <th className="p-4 text-center pr-6 w-48">Billing Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loadingPatients ? (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center">
                                            <Loader2 className="animate-spin text-indigo-600 mx-auto" size={24} />
                                            <p className="text-slate-500 mt-2 font-medium">Loading patients list...</p>
                                        </td>
                                    </tr>
                                ) : filteredPatients.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-slate-500">
                                            <Filter className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                            <p className="font-bold text-slate-900">No records found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPatients.map(patient => (
                                        <tr key={patient.record_id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 pl-6">
                                                <p className="font-bold text-slate-900">{patient.full_name}</p>
                                                <p className="text-xs text-slate-500 font-mono font-bold">{patient.patient_u_id}</p>
                                            </td>
                                            <td className="p-4">
                                                {patient.admission_date ? (
                                                    <div className="text-xs font-semibold text-slate-600">
                                                        <span>{new Date(patient.admission_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                        {patient.discharge_date && (
                                                            <span> to {new Date(patient.discharge_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                        )}
                                                    </div>
                                                ) : <span className="text-slate-400 text-xs">—</span>}
                                            </td>
                                            <td className="p-4 text-right font-bold text-slate-900">
                                                ₹ {(patient.total_bill_amount || 0).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-center pr-6">
                                                <button
                                                    onClick={() => router.push(`/hospital/accounting/invoices/new?patient_id=${patient.record_id}`)}
                                                    className="flex items-center gap-1 mx-auto px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                                >
                                                    <Plus size={14} /> Generate Bill
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 2. Invoice History tab content */}
                {activeTab === 'invoices' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                    <th className="p-4 pl-6">Invoice details</th>
                                    <th className="p-4">Patient info</th>
                                    <th className="p-4 text-right">Invoice total</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-center pr-6 w-72">Action panel</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loadingInvoices ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center">
                                            <Loader2 className="animate-spin text-indigo-600 mx-auto" size={24} />
                                            <p className="text-slate-500 mt-2 font-medium">Loading invoices log...</p>
                                        </td>
                                    </tr>
                                ) : filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-500">
                                            <ListCollapse className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                            <p className="font-bold text-slate-900">No invoices compiled yet</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map(inv => (
                                        <tr key={inv.invoice_id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 pl-6">
                                                <p className="font-bold font-mono text-indigo-600 text-xs">{inv.invoice_number}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">
                                                    {new Date(inv.bill_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-bold text-slate-900 text-xs">{inv.patient_name}</p>
                                                <p className="text-[10px] font-mono text-slate-400">{inv.mrd_number}</p>
                                            </td>
                                            <td className="p-4 text-right font-black text-slate-900 text-sm">
                                                ₹ {inv.total_amount.toLocaleString()}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black ${
                                                    inv.status === 'PAID' 
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                }`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center pr-6">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => router.push(`/hospital/accounting/invoices/${inv.invoice_id}`)}
                                                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                                                        title="Print Invoice / Preview PDF"
                                                    >
                                                        <Printer size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleSendEmail(inv.invoice_id)}
                                                        disabled={emailLoading === inv.invoice_id}
                                                        className="px-2.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                                    >
                                                        {emailLoading === inv.invoice_id ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <Mail size={12} />
                                                        )}
                                                        Email
                                                    </button>
                                                    <button
                                                        onClick={() => handleSendWhatsApp(inv.invoice_id)}
                                                        disabled={whatsappLoading === inv.invoice_id}
                                                        className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                                    >
                                                        {whatsappLoading === inv.invoice_id ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <Send size={12} />
                                                        )}
                                                        WhatsApp
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
