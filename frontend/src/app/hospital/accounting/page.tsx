"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/config/api';
import { toast } from 'sonner';
import { 
    Calendar, FileText, Search, Download, Filter, IndianRupee, Users, Plus, Mail, Send, Printer, ListCollapse, Loader2, CheckCircle2, Receipt, ArrowRight, Activity, PieChart
} from 'lucide-react';

interface PatientBilling {
    record_id: number;
    patient_u_id: string | null;
    full_name: string;
    admission_date: string | null;
    discharge_date: string | null;
    total_bill_amount: number | null;
    has_unbilled_records: boolean;
    pending_invoice_id: number | null;
}

interface PatientInvoice {
    invoice_id: number;
    invoice_number: string;
    patient_id: number;
    patient_name: string;
    mrd_number: string;
    patient_phone?: string;
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
            const data = await apiFetch('/patient-billing/dashboard-patients');
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
                                  (p.patient_u_id || '').toLowerCase().includes(searchQuery.toLowerCase());
            
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
            // Unbilled records to the top
            if (a.has_unbilled_records && !b.has_unbilled_records) return -1;
            if (!a.has_unbilled_records && b.has_unbilled_records) return 1;
            
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
    const pendingBillsCount = patients.filter(p => p.has_unbilled_records).length;

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
        const inv = invoices.find(i => i.invoice_id === invoiceId);
        if (!inv) return;
        
        const phone = inv.patient_phone || '';
        
        if (!phone) {
            toast.error("No phone number registered for this patient.");
            return;
        }
        
        let targetPhone = phone.replace(/\D/g, '');
        if (targetPhone.length === 10) {
            targetPhone = '91' + targetPhone;
        }
        
        const invoiceLink = `${window.location.origin}/hospital/accounting/invoices/${invoiceId}`;
        const text = `Hello ${inv.patient_name}, your invoice (${inv.invoice_number}) for ₹${inv.total_amount} is generated. You can view or download it here: ${invoiceLink}`;
        
        try {
            const encodedPhone = encodeURIComponent(targetPhone);
            const encodedText = encodeURIComponent(text);
            const whatsappLink = `digifort-wa://send?phone=${encodedPhone}&text=${encodedText}`;
            window.open(whatsappLink, '_self'); // Use _self for custom protocols
            toast.success("Opened WhatsApp Desktop!");
        } catch (error: any) {
            toast.error(error.message || "Failed to open WhatsApp.");
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 bg-slate-50 min-h-screen">
            {/* Header section with Glassmorphism */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-8 shadow-xl">
                {/* Decorative Elements */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-4">
                            <Activity size={12} /> Financial Dashboard
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white mb-2">
                            Billing & Accounts Manager
                        </h1>
                        <p className="text-indigo-200 font-medium text-lg max-w-xl">
                            Manage patient invoicing, billing ledger details, and daily collections seamlessly.
                        </p>
                    </div>

                    {/* Dashboard Action Triggers */}
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => router.push('/hospital/accounting/daily-report')}
                            className="group px-6 py-3.5 bg-white hover:bg-slate-50 text-indigo-900 rounded-xl text-sm font-black transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center justify-center gap-2 border border-white/20"
                        >
                            <PieChart size={18} className="text-indigo-600 group-hover:scale-110 transition-transform" /> 
                            Daily Revenue Report
                        </button>
                        <button 
                            onClick={() => router.push('/hospital/accounting/ipd-ledger')}
                            className="group px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black transition-all shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.5)] flex items-center justify-center gap-2"
                        >
                            <Activity size={18} className="text-white group-hover:scale-110 transition-transform" /> 
                            IPD Financial Ledger
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Summary Cards (Vibrant redesign) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10 flex items-start gap-4">
                        <div className="p-4 bg-emerald-100 rounded-2xl text-emerald-600 shadow-inner">
                            <IndianRupee className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Billed Revenue</p>
                            <p className="text-3xl font-black text-slate-800 tracking-tight">₹ {totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10 flex items-start gap-4">
                        <div className="p-4 bg-rose-100 rounded-2xl text-rose-600 shadow-inner">
                            <IndianRupee className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Bills</p>
                            <p className="text-3xl font-black text-slate-800 tracking-tight">{pendingBillsCount}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10 flex items-start gap-4">
                        <div className="p-4 bg-indigo-100 rounded-2xl text-indigo-600 shadow-inner">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Patient Records</p>
                            <p className="text-3xl font-black text-slate-800 tracking-tight">{patients.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Core Workspace Area */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {/* TABS CONTROL */}
                <div className="flex gap-6 border-b border-slate-200 px-6 pt-4 bg-slate-50/50">
                    <button
                        onClick={() => handleTabChange('patients')}
                        className={`pb-4 text-sm font-black tracking-wide transition-all border-b-2 relative ${
                            activeTab === 'patients' 
                            ? 'border-indigo-600 text-indigo-700' 
                            : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                        }`}
                    >
                        Outstanding Patients
                        {pendingBillsCount > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold text-white bg-rose-500 rounded-full animate-pulse">
                                {pendingBillsCount} Action Required
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => handleTabChange('invoices')}
                        className={`pb-4 text-sm font-black tracking-wide transition-all border-b-2 ${
                            activeTab === 'invoices' 
                            ? 'border-indigo-600 text-indigo-700' 
                            : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                        }`}
                    >
                        Generated Invoice History
                    </button>
                </div>

                {/* Filters panel */}
                <div className="p-6 bg-white border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:w-96 group">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search patient, MRD, or Invoice #..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all"
                        />
                    </div>

                    {activeTab === 'patients' && (
                        <div className="relative w-full sm:w-auto">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="pl-11 pr-10 py-3 w-full bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
                            >
                                <option value="All">All Years</option>
                                <option value="2026">2026</option>
                                <option value="2025">2025</option>
                            </select>
                            <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" />
                        </div>
                    )}
                </div>

                {/* MAIN DASHBOARD TABLES */}
                <div className="flex flex-col bg-white">
                    
                    {/* 1. Patients tab content */}
                    {activeTab === 'patients' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                                        <th className="py-4 px-6">Patient (MRD)</th>
                                        <th className="py-4 px-4">Admission Stay</th>
                                        <th className="py-4 px-4 text-right">Total Billed</th>
                                        <th className="py-4 px-6 text-center w-56">Billing Status & Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loadingPatients ? (
                                        <tr>
                                            <td colSpan={4} className="p-16 text-center">
                                                <Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} />
                                                <p className="text-slate-500 mt-4 font-bold tracking-wide">Syncing Clinical Ledger...</p>
                                            </td>
                                        </tr>
                                    ) : filteredPatients.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-16 text-center text-slate-500">
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Filter className="w-8 h-8 text-slate-400" />
                                                </div>
                                                <p className="font-bold text-slate-900 text-lg mb-1">No records found</p>
                                                <p className="text-sm">Try adjusting your search or year filter.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPatients.map(patient => (
                                            <tr key={patient.record_id} className={`transition-colors ${patient.has_unbilled_records ? 'bg-indigo-50/30 hover:bg-indigo-50/60' : 'hover:bg-slate-50/80'}`}>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-black text-slate-900">{patient.full_name}</p>
                                                            {patient.pending_invoice_id && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        router.push(`/hospital/accounting/invoices/${patient.pending_invoice_id}`);
                                                                    }}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                                                                >
                                                                    <IndianRupee size={10} /> View Pending Invoice
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500 font-mono font-bold mt-0.5">{patient.patient_u_id}</p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    {patient.admission_date ? (
                                                        <div className="text-xs font-bold text-slate-600 bg-slate-100 inline-flex px-3 py-1.5 rounded-lg border border-slate-200">
                                                            <span>{new Date(patient.admission_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                            {patient.discharge_date && (
                                                                <>
                                                                    <ArrowRight className="w-3 h-3 mx-2 inline text-slate-400" />
                                                                    <span>{new Date(patient.discharge_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    ) : <span className="text-slate-300 font-bold">—</span>}
                                                </td>
                                                <td className="py-4 px-4 text-right font-black text-slate-900 text-lg tracking-tight">
                                                    ₹ {(patient.total_bill_amount || 0).toLocaleString()}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    {patient.has_unbilled_records ? (
                                                        <button
                                                            onClick={() => router.push(`/hospital/accounting/invoices/new?patient_id=${patient.record_id}`)}
                                                            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-black transition-all shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5"
                                                        >
                                                            <Plus size={16} /> Compile Bill
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => router.push(`/hospital/accounting/invoices/new?patient_id=${patient.record_id}`)}
                                                            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black transition-all"
                                                        >
                                                            <Plus size={16} /> Create Custom Bill
                                                        </button>
                                                    )}
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
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                                        <th className="py-4 px-6">Invoice details</th>
                                        <th className="py-4 px-4">Patient info</th>
                                        <th className="py-4 px-4 text-right">Invoice total</th>
                                        <th className="py-4 px-4 text-center">Status</th>
                                        <th className="py-4 px-6 text-center w-72">Action panel</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loadingInvoices ? (
                                        <tr>
                                            <td colSpan={5} className="p-16 text-center">
                                                <Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} />
                                                <p className="text-slate-500 mt-4 font-bold tracking-wide">Loading invoices log...</p>
                                            </td>
                                        </tr>
                                    ) : filteredInvoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-16 text-center text-slate-500">
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <ListCollapse className="w-8 h-8 text-slate-400" />
                                                </div>
                                                <p className="font-bold text-slate-900 text-lg mb-1">No invoices compiled yet</p>
                                                <p className="text-sm">Generate your first invoice from the Outstanding Patients tab.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredInvoices.map(inv => (
                                            <tr key={inv.invoice_id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-4 px-6">
                                                    <p className="font-black font-mono text-indigo-600 text-sm">{inv.invoice_number}</p>
                                                    <p className="text-xs text-slate-500 font-bold mt-1">
                                                        {new Date(inv.bill_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <p className="font-black text-slate-900">{inv.patient_name}</p>
                                                    <p className="text-xs font-mono font-bold text-slate-400 mt-0.5">{inv.mrd_number}</p>
                                                </td>
                                                <td className="py-4 px-4 text-right font-black text-slate-900 text-lg tracking-tight">
                                                    ₹ {inv.total_amount.toLocaleString()}
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider ${
                                                        inv.status === 'PAID' 
                                                        ? 'bg-emerald-100 text-emerald-800' 
                                                        : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => router.push(`/hospital/accounting/invoices/${inv.invoice_id}`)}
                                                            className="p-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-xl text-xs font-bold transition-colors"
                                                            title="Print Invoice / Preview PDF"
                                                        >
                                                            <Printer size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleSendEmail(inv.invoice_id)}
                                                            disabled={emailLoading === inv.invoice_id}
                                                            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                                                        >
                                                            {emailLoading === inv.invoice_id ? (
                                                                <Loader2 size={14} className="animate-spin" />
                                                            ) : (
                                                                <Mail size={14} />
                                                            )}
                                                            Email
                                                        </button>
                                                        <button
                                                            onClick={() => handleSendWhatsApp(inv.invoice_id)}
                                                            disabled={whatsappLoading === inv.invoice_id}
                                                            className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                                                        >
                                                            {whatsappLoading === inv.invoice_id ? (
                                                                <Loader2 size={14} className="animate-spin" />
                                                            ) : (
                                                                <Send size={14} />
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
        </div>
    );
}
