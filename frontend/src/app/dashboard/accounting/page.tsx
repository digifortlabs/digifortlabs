"use client";

import { useEffect, useState } from 'react';
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
    Printer
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

export default function AccountingPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({
        total_pending: 0,
        total_paid: 0,
        total_invoices: 0
    });

    // Modal states
    const [showGenModal, setShowGenModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
    const [emailLoading, setEmailLoading] = useState<number | null>(null);
    const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'parties' | 'expenses' | 'reports' | 'setup' | 'vendors'>('invoices');

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/accounting/');
            setInvoices(data);

            // Calculate stats
            const pending = data.filter((inv: Invoice) => inv.status === 'PENDING').reduce((acc: number, inv: Invoice) => acc + inv.total_amount, 0);
            const paid = data.filter((inv: Invoice) => inv.status === 'PAID').reduce((acc: number, inv: Invoice) => acc + inv.total_amount, 0);

            setStats({
                total_pending: pending,
                total_paid: paid,
                total_invoices: data.length
            });
        } catch (error) {
            console.error("Error fetching invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleSendEmail = async (invoiceId: number) => {
        setEmailLoading(invoiceId);
        try {
            await apiFetch(`/accounting/${invoiceId}/send-email`, { method: 'POST' });
            alert("Invoice email sent successfully!");
        } catch (error) {
            console.error("Error sending email:", error);
            alert("Failed to send invoice email.");
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
            alert("Failed to delete invoice.");
        } finally {
            setDeleteLoading(null);
        }
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesStatus = filterStatus === 'ALL' || inv.status === filterStatus;
        const matchesSearch = inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.hospital_name.toLowerCase().includes(searchTerm.toLowerCase());
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

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Receipt className="text-indigo-600" size={32} />
                        Financial Desk
                    </h1>
                    <p className="text-slate-500 mt-1">Manage hospital billings, invoices, and payment tracking.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowGenModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={18} />
                        Generate Invoice
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
            <div className="flex items-center gap-1 p-1 bg-slate-200/50 rounded-2xl w-fit">
                {[
                    { id: 'dashboard', label: 'Company Overview', icon: Eye },
                    { id: 'invoices', label: 'Sales & Invoices', icon: Receipt },
                    { id: 'parties', label: 'Hospital Ledgers', icon: Building2 },
                    { id: 'vendors', label: 'Vendor Payables', icon: Truck },
                    { id: 'expenses', label: 'Expenses & Costs', icon: ArrowDownLeft },
                    { id: 'reports', label: 'Tax & P&L', icon: PieChart },
                    { id: 'setup', label: 'Sequence Setup', icon: Settings2 },
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-white text-indigo-600 shadow-sm shadow-slate-200'
                                : 'text-slate-500 hover:bg-white/50'
                                }`}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Search/Stats (Only for Invoices) */}
            {activeTab === 'invoices' && (
                <>
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Pending Collections', value: `₹${stats.total_pending.toLocaleString()}`, icon: <Clock className="text-amber-500" />, trend: 'Waiting for Payment', color: 'border-amber-200' },
                            { label: 'Total Revenue', value: `₹${stats.total_paid.toLocaleString()}`, icon: <ArrowUpRight className="text-emerald-500" />, trend: 'Collected to date', color: 'border-emerald-200' },
                            { label: 'Active Invoices', value: stats.total_invoices, icon: <Receipt className="text-indigo-500" />, trend: 'In current system', color: 'border-indigo-200' },
                        ].map((stat, i) => (
                            <div key={i} className={`bg-white p-6 rounded-2xl border ${stat.color} shadow-sm space-y-4`}>
                                <div className="flex items-center justify-between">
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        {stat.icon}
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.trend}</span>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filters & Search */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            {['ALL', 'PENDING', 'PAID'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${filterStatus === status
                                        ? 'bg-slate-900 text-white shadow-md shadow-slate-200'
                                        : 'text-slate-500 hover:bg-slate-100'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by Invoice # or Hospital..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Invoices Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-bottom border-slate-200">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Info</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hospital</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Issue Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={6} className="px-6 py-4">
                                                    <div className="h-10 bg-slate-50 rounded-lg"></div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : filteredInvoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Receipt size={40} className="opacity-20" />
                                                    <p>No invoices found matching your criteria.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredInvoices.map((invoice) => (
                                        <tr key={invoice.invoice_id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xs">
                                                        INV
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">#{invoice.invoice_number}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">{invoice.items?.length || 0} Files</span>
                                                            <span className="text-slate-300">•</span>
                                                            <p className="text-xs text-slate-500 flex items-center gap-1" title="Created On">
                                                                <Clock size={10} /> {format(new Date(invoice.created_at), 'MMM dd')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={16} className="text-slate-400" />
                                                    <span className="font-medium text-slate-700">{invoice.hospital_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900">₹{invoice.total_amount.toLocaleString()}</p>
                                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter flex items-center gap-1">
                                                    <Percent size={8} /> {invoice.gst_rate}% GST Incl.
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(invoice.status)}`}>
                                                    {getStatusIcon(invoice.status)}
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-700">{format(new Date(invoice.bill_date || invoice.created_at), 'dd/MM/yyyy')}</p>
                                                <p className="text-[10px] text-slate-400 uppercase">Bill Date</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {invoice.status === 'PENDING' && (
                                                        <button
                                                            onClick={() => handleReceivePayment(invoice)}
                                                            title="Mark as Paid"
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100"
                                                        >
                                                            <DollarSign size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        disabled={emailLoading === invoice.invoice_id}
                                                        onClick={() => handleSendEmail(invoice.invoice_id)}
                                                        title="Send Email"
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    >
                                                        {emailLoading === invoice.invoice_id ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handlePreview(invoice.invoice_id)}
                                                        title="View/Preview Tax Invoice"
                                                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                                                    >
                                                        <Eye size={18} />
                                                    </button>

                                                    <button
                                                        onClick={() => handleEditManual(invoice)}
                                                        title="Edit Invoice Details"
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-100"
                                                    >
                                                        <Settings2 size={18} />
                                                    </button>

                                                    {invoice.status === 'PENDING' && (
                                                        <button
                                                            disabled={deleteLoading === invoice.invoice_id}
                                                            onClick={() => handleDeleteInvoice(invoice.invoice_id)}
                                                            title="Cancel & Delete Invoice"
                                                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100"
                                                        >
                                                            {deleteLoading === invoice.invoice_id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                                        </button>
                                                    )}

                                                    <button
                                                        title="More Actions"
                                                        className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
                                                    >
                                                        <ChevronRight size={18} />
                                                    </button>
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
            {activeTab === 'dashboard' && <FinancialDashboard />}
            {activeTab === 'parties' && <HospitalLedgerList />}
            {activeTab === 'vendors' && <VendorManager />}
            {activeTab === 'expenses' && <ExpenseManager />}
            {activeTab === 'reports' && <ProfitAndLoss />}
            {activeTab === 'setup' && <AccountingSettings />}

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
            />
        </div>
    );
}
