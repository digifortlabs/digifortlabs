"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Receipt,
    Search,
    Filter,
    Download,
    Mail,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronRight,
    Plus,
    Building2,
    Calendar,
    DollarSign,
    MoreVertical,
    ArrowUpRight,
    ArrowDownLeft,
    Loader2,
    Percent,
    Trash2,
    Eye,
    Settings2,
    PieChart,
    Truck,
    RefreshCcw,
    FileText,
    FileJson,
    Printer,
    FileEdit
} from 'lucide-react';
import { apiFetch, API_URL } from '@/config/api';
import { format } from 'date-fns';

interface InvoiceItem {
    item_id: number;
    description: string;
    amount: number;
}

interface Invoice {
    invoice_id: number;
    invoice_number: string;
    hospital_name: string;
    total_amount: number;
    tax_amount: number;
    gst_rate: number;
    status: 'PENDING' | 'PAID' | 'CANCELLED';
    created_at: string;
    bill_date: string;
    due_date: string;
    payment_method?: string;
    items: InvoiceItem[];
}

import InvoiceGenerationModal from './components/InvoiceGenerationModal';
import ReceivePaymentModal from './components/ReceivePaymentModal';
import EditInvoiceModal from './components/EditInvoiceModal';
import FinancialDashboard from './components/FinancialDashboard';
import HospitalLedgerList from './components/HospitalLedgerList';
import ExpenseManager from './components/ExpenseManager';
import ProfitAndLoss from './components/ProfitAndLoss';
import AccountingSettings from './components/AccountingSettings';
import VendorManager from './components/VendorManager';
import InventoryManager from './components/InventoryManager';
import AgingReport from './components/AgingReport';
import toast from 'react-hot-toast';

export default function AccountingPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({
        total_pending: 0,
        total_paid: 0,
        total_invoices: 0
    });
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Modal states
    const [showGenModal, setShowGenModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
    const [emailLoading, setEmailLoading] = useState<number | null>(null);
    const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'parties' | 'expenses' | 'reports' | 'setup' | 'vendors' | 'inventory' | 'aging'>('invoices');

    const fetchInvoices = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const data = await apiFetch('/accounting');
            const invoiceList = Array.isArray(data) ? data : [];
            setInvoices(invoiceList);

            // Calculate stats
            const pending = invoiceList.filter((inv: Invoice) => inv.status === 'PENDING').reduce((acc: number, inv: Invoice) => acc + inv.total_amount, 0);
            const paid = invoiceList.filter((inv: Invoice) => inv.status === 'PAID').reduce((acc: number, inv: Invoice) => acc + inv.total_amount, 0);
            const totalRevenue = invoiceList.filter((inv: Invoice) => inv.status !== 'CANCELLED').reduce((acc: number, inv: Invoice) => acc + inv.total_amount, 0);

            setStats({
                total_pending: pending,
                total_paid: paid,
                total_revenue: totalRevenue,
                total_invoices: invoiceList.length
            });
        } catch (error: any) {
            console.error("Error fetching invoices:", error);
            setFetchError(error?.message || 'Failed to load invoices. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Role is safely retrieved from localStorage set during login
        if (typeof window !== 'undefined') {
            const role = localStorage.getItem('userRole');
            const isSuperAdmin = role === 'superadmin' || role === 'superadmin_staff' || role === 'website_admin';
            if (isSuperAdmin) {
                setIsAuthorized(true);
                fetchInvoices();
            } else {
                router.push('/admin');
            }
        }
    }, [router]);

    const handleSendEmail = async (invoiceId: number) => {
        setEmailLoading(invoiceId);
        try {
            await apiFetch(`/accounting/${invoiceId}/send-email`, { method: 'POST' });
            toast.success("Invoice email sent successfully!");
        } catch (error) {
            console.error("Error sending email:", error);
            toast.error("Failed to send invoice email.");
        } finally {
            setEmailLoading(null);
        }
    };

    const handleReceivePayment = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setShowPayModal(true);
    };

    const handlePreview = (invoiceId: number) => {
        window.open(`/invoice-preview/${invoiceId}`, '_blank');
    };

    const handleEditManual = (invoice: Invoice) => {
        setEditInvoice(invoice);
        setShowEditModal(true);
    };

    const handleDeleteInvoice = async (invoiceId: number) => {
        if (!confirm("Are you sure you want to cancel and delete this invoice? The linked records will be available for billing again.")) return;

        setDeleteLoading(invoiceId);
        try {
            await apiFetch(`/accounting/${invoiceId}`, { method: 'DELETE' });
            fetchInvoices();
        } catch (error) {
            console.error("Error deleting invoice:", error);
            toast.error("Failed to delete invoice.");
        } finally {
            setDeleteLoading(null);
        }
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesStatus = filterStatus === 'ALL' || inv.status === filterStatus;
        const invNum = inv.invoice_number || '';
        const hospName = inv.hospital_name || '';
        const search = searchTerm || '';
        const matchesSearch = invNum.toLowerCase().includes(search.toLowerCase()) ||
            hospName.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PAID':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'PENDING':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'CANCELLED':
                return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
            default:
                return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PAID':
                return <CheckCircle2 size={14} />;
            case 'PENDING':
                return <Clock size={14} />;
            case 'CANCELLED':
                return <AlertCircle size={14} />;
            default:
                return null;
        }
    };

    if (!isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-3 lg:p-4 pt-0">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-2">
                <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5 leading-none">
                        <Receipt size={20} className="text-slate-900" /> Financial Desk
                    </h1>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Global Billing & Revenue Command</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowGenModal(true)}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg font-black text-xs flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm active:scale-95"
                    >
                        <Plus size={14} /> Generate Invoice
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowActionMenu(!showActionMenu)}
                            className={`p-2.5 rounded-xl border transition-all ${showActionMenu ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                        >
                            <MoreVertical size={20} />
                        </button>

                        {showActionMenu && (
                            <>
                                <div className="absolute right-0 mt-3 w-64 bg-white rounded-[24px] shadow-2xl border border-slate-100 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Actions</p>
                                    </div>
                                    <div className="p-2">
                                        <button
                                            onClick={() => {
                                                window.open(`${API_URL}/reports/billing?export_csv=true`, '_blank');
                                                setShowActionMenu(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all group"
                                        >
                                            <div className="p-2 bg-slate-100 group-hover:bg-white rounded-lg transition-colors">
                                                <FileText size={16} />
                                            </div>
                                            Export Billing CSV
                                        </button>

                                        <button
                                            onClick={() => {
                                                window.print();
                                                setShowActionMenu(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all group"
                                        >
                                            <div className="p-2 bg-slate-100 group-hover:bg-white rounded-lg transition-colors">
                                                <Printer size={16} />
                                            </div>
                                            Print Monthly View
                                        </button>

                                        <button
                                            onClick={() => {
                                                fetchInvoices();
                                                setShowActionMenu(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all group"
                                        >
                                            <div className="p-2 bg-slate-100 group-hover:bg-white rounded-lg transition-colors">
                                                <RefreshCcw size={16} />
                                            </div>
                                            Refresh Data
                                        </button>
                                    </div>
                                    <div className="p-4 bg-slate-50 border-t border-slate-100 italic text-[10px] text-slate-400">
                                        Accounting build v2.4 (GST Compliant)
                                    </div>
                                </div>
                                <div className="fixed inset-0 z-40" onClick={() => setShowActionMenu(false)}></div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-200/50 rounded-xl w-fit mb-3">
                {[
                    { id: 'dashboard', label: 'Overview', icon: Eye },
                    { id: 'invoices', label: 'Sales & Invoices', icon: Receipt },
                    { id: 'parties', label: 'Hospital Ledgers', icon: Building2 },
                    { id: 'vendors', label: 'Vendors', icon: Truck },
                    { id: 'expenses', label: 'Expenses', icon: ArrowDownLeft },
                    { id: 'reports', label: 'P&L', icon: PieChart },
                    { id: 'setup', label: 'Setup', icon: Settings2 },
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === tab.id
                                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                                : 'text-slate-500 hover:bg-white/50'
                                }`}
                        >
                            <Icon size={14} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Search/Stats (Only for Invoices) */}
            {activeTab === 'invoices' && (
                <>
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        {[
                            { label: 'Pending Collections', value: `₹${stats.total_pending.toLocaleString()}`, icon: <Clock size={14} className="text-amber-500" />, trend: 'Awaiting' },
                            { label: 'Total Revenue', value: `₹${stats.total_paid.toLocaleString()}`, icon: <ArrowUpRight size={14} className="text-emerald-500" />, trend: 'Realized' },
                            { label: 'Active Invoices', value: stats.total_invoices, icon: <Receipt size={14} className="text-indigo-500" />, trend: 'Count' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2.5 hover:shadow-md transition-shadow group">
                                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center transition-transform group-hover:scale-110">
                                    {stat.icon}
                                </div>
                                <div>
                                    <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest leading-none mb-0.5">{stat.label}</p>
                                    <div className="text-base font-black text-slate-800 leading-tight">{stat.value}</div>
                                </div>
                                <div className="ml-auto text-[8px] font-black text-slate-300 uppercase tracking-tighter">{stat.trend}</div>
                            </div>
                        ))}
                    </div>

                    {/* Filters & Search */}
                    <div className="bg-white p-2 px-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between mb-3">
                        <div className="flex items-center gap-1 w-full md:w-auto">
                            {['ALL', 'PENDING', 'PAID'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${filterStatus === status
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'text-slate-400 hover:bg-slate-50'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search by Invoice # or Hospital..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-xs font-medium"
                            />
                        </div>
                    </div>

                    {/* Invoices Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice Info</th>
                                        <th className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hospital</th>
                                        <th className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Date</th>
                                        <th className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={6} className="px-3 py-1.5">
                                                    <div className="h-8 bg-slate-50 rounded-lg"></div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : filteredInvoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Receipt size={32} className="opacity-20" />
                                                    <p className="text-[10px] font-bold uppercase tracking-widest">No matching invoices</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredInvoices.map((invoice) => (
                                        <tr key={invoice.invoice_id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-3 py-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-slate-100 text-slate-600 rounded flex items-center justify-center font-black text-[8px]">
                                                        INV
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-[11px]">#{invoice.invoice_number}</p>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[8px] font-black bg-slate-50 text-slate-400 px-1 py-0.5 rounded border border-slate-100 uppercase">{invoice.items?.length || 0} Items</span>
                                                            <span className="text-[9px] text-slate-400 font-medium">{format(new Date(invoice.created_at), 'MMM dd')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-1">
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 size={10} className="text-slate-400" />
                                                    <span className="text-[11px] font-bold text-slate-700">{invoice.hospital_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-1">
                                                <p className="font-black text-slate-800 text-[11px]">₹{invoice.total_amount.toLocaleString()}</p>
                                                <p className="text-[8px] text-emerald-600 font-black uppercase tracking-tighter flex items-center gap-0.5">
                                                    <Percent size={8} /> {invoice.gst_rate}% GST
                                                </p>
                                            </td>
                                            <td className="px-3 py-1">
                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-wider ${getStatusStyle(invoice.status)}`}>
                                                    {getStatusIcon(invoice.status)}
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-1">
                                                <p className="text-[11px] font-bold text-slate-700">{format(new Date(invoice.bill_date || invoice.created_at), 'dd/MM/yyyy')}</p>
                                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none">Bill Date</p>
                                            </td>
                                            <td className="px-3 py-1 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {(invoice.status === 'PENDING' || invoice.status === 'PAID') && (
                                                         <button
                                                             onClick={() => handleReceivePayment(invoice)}
                                                             className={`p-1 rounded-lg transition-colors ${
                                                                 invoice.status === 'PAID'
                                                                     ? 'text-indigo-600 hover:bg-indigo-50'
                                                                     : 'text-emerald-600 hover:bg-emerald-50'
                                                             }`}
                                                             title={invoice.status === 'PAID' ? "Edit Payment" : "Receive Payment"}
                                                         >
                                                             <DollarSign size={12} />
                                                         </button>
                                                     )}
                                                    <button
                                                        onClick={() => handleEditManual(invoice)}
                                                        className="p-1 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                                                        title="Edit Invoice"
                                                    >
                                                        <FileEdit size={12} />
                                                    </button>
                                                    <button
                                                        disabled={emailLoading === invoice.invoice_id}
                                                        onClick={() => handleSendEmail(invoice.invoice_id)}
                                                        className="p-1 text-slate-400 hover:text-slate-900 rounded-lg transition-colors"
                                                        title="Send Email"
                                                    >
                                                        {emailLoading === invoice.invoice_id ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handlePreview(invoice.invoice_id)}
                                                        className="p-1 text-slate-400 hover:text-slate-900 rounded-lg transition-colors"
                                                    >
                                                        <Eye size={12} />
                                                    </button>
                                                    {invoice.status === 'PENDING' && (
                                                        <button
                                                            disabled={deleteLoading === invoice.invoice_id}
                                                            onClick={() => handleDeleteInvoice(invoice.invoice_id)}
                                                            className="p-1 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                                                        >
                                                            {deleteLoading === invoice.invoice_id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Advanced Accounting Components */}
            {activeTab === 'dashboard' && <FinancialDashboard onViewAging={() => setActiveTab('aging')} />}
            {activeTab === 'parties' && <HospitalLedgerList />}
            {activeTab === 'vendors' && <VendorManager />}
            {activeTab === 'inventory' && <InventoryManager />}
            {activeTab === 'expenses' && <ExpenseManager />}
            {activeTab === 'reports' && <ProfitAndLoss />}
            {activeTab === 'setup' && <AccountingSettings />}
            {activeTab === 'aging' && <AgingReport onBack={() => setActiveTab('dashboard')} />}

            {/* Modals */}
            <InvoiceGenerationModal
                isOpen={showGenModal}
                onClose={() => setShowGenModal(false)}
                onSuccess={fetchInvoices}
            />

            <EditInvoiceModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={fetchInvoices}
                invoice={editInvoice}
            />

            <ReceivePaymentModal
                isOpen={showPayModal}
                onClose={() => setShowPayModal(false)}
                onSuccess={fetchInvoices}
                invoiceId={selectedInvoice?.invoice_id || null}
                invoiceNumber={selectedInvoice?.invoice_number || null}
                amount={selectedInvoice?.total_amount || null}
                invoice={selectedInvoice || undefined}
            />
        </div>
    );
}

