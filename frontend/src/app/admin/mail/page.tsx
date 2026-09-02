'use client';

import React, { useState, useEffect } from 'react';
import { 
    Inbox, Send, Star, Archive, Search, Mail, Plus, Trash2, 
    RefreshCw, Filter, Shield, Tag, FileText, CheckCircle2, 
    XCircle, Clock, ExternalLink, ArrowLeft, Loader2, Sparkles,
    User, Building2, SendHorizontal, Eye, Paperclip, ChevronRight
} from 'lucide-react';
import { apiFetch } from '@/config/api';
import toast from 'react-hot-toast';

interface EmailLog {
    id: number;
    mail_type: 'INBOX' | 'OUTBOX';
    category: string;
    sender_email: string;
    sender_name?: string;
    recipient_email: string;
    recipient_name?: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body_html?: string;
    body_text?: string;
    status: string;
    is_starred: boolean;
    is_archived: boolean;
    hospital_id?: number;
    created_at: string;
}

interface MailStats {
    inbox_count: number;
    outbox_count: number;
    unread_count: number;
    starred_count: number;
}

export default function AdminMailPage() {
    const [activeFolder, setActiveFolder] = useState<'inbox' | 'outbox' | 'starred' | 'archived'>('outbox');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    
    const [emails, setEmails] = useState<EmailLog[]>([]);
    const [stats, setStats] = useState<MailStats>({ inbox_count: 0, outbox_count: 0, unread_count: 0, starred_count: 0 });
    const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Compose Modal
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [composeForm, setComposeForm] = useState({
        recipient_email: '',
        recipient_name: '',
        subject: '',
        category: 'CUSTOM',
        body_html: ''
    });
    const [sending, setSending] = useState(false);
    const [hospitals, setHospitals] = useState<any[]>([]);

    useEffect(() => {
        fetchStats();
        fetchHospitals();
    }, []);

    useEffect(() => {
        fetchEmails();
    }, [activeFolder, selectedCategory]);

    const fetchStats = async () => {
        try {
            const data = await apiFetch('/platform-mail/stats');
            setStats(data || { inbox_count: 0, outbox_count: 0, unread_count: 0, starred_count: 0 });
        } catch (error) {
            console.error('Error fetching mail stats:', error);
        }
    };

    const fetchHospitals = async () => {
        try {
            const data = await apiFetch('/hospitals');
            setHospitals(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching hospitals:', error);
        }
    };

    const fetchEmails = async () => {
        setLoading(true);
        try {
            let url = `/platform-mail/?folder=${activeFolder}`;
            if (selectedCategory !== 'ALL') {
                url += `&category=${selectedCategory}`;
            }
            if (searchQuery) {
                url += `&search=${encodeURIComponent(searchQuery)}`;
            }
            const data = await apiFetch(url);
            setEmails(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching emails:', error);
            setEmails([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchEmails();
    };

    const handleSelectEmail = async (email: EmailLog) => {
        setSelectedEmail(email);
        if (email.mail_type === 'INBOX' && email.status === 'UNREAD') {
            try {
                await apiFetch(`/platform-mail/${email.id}`);
                setEmails(prev => prev.map(m => m.id === email.id ? { ...m, status: 'READ' } : m));
                fetchStats();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleToggleStar = async (e: React.MouseEvent, emailId: number) => {
        e.stopPropagation();
        try {
            const data = await apiFetch(`/platform-mail/${emailId}/star`, { method: 'PATCH' });
            setEmails(prev => prev.map(m => m.id === emailId ? { ...m, is_starred: data?.is_starred ?? m.is_starred } : m));
            if (selectedEmail?.id === emailId) {
                setSelectedEmail(prev => prev ? { ...prev, is_starred: data?.is_starred ?? prev.is_starred } : null);
            }
            fetchStats();
        } catch (err) {
            toast.error('Failed to update star');
        }
    };

    const handleToggleArchive = async (emailId: number) => {
        try {
            const data = await apiFetch(`/platform-mail/${emailId}/archive`, { method: 'PATCH' });
            toast.success(data?.is_archived ? 'Archived email' : 'Unarchived email');
            fetchEmails();
            fetchStats();
        } catch (err) {
            toast.error('Failed to archive email');
        }
    };

    const handleDelete = async (emailId: number) => {
        if (!confirm('Are you sure you want to delete this email record?')) return;
        try {
            await apiFetch(`/platform-mail/${emailId}`, { method: 'DELETE' });
            toast.success('Email record deleted');
            if (selectedEmail?.id === emailId) setSelectedEmail(null);
            fetchEmails();
            fetchStats();
        } catch (err) {
            toast.error('Failed to delete email');
        }
    };

    const handleSendSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!composeForm.recipient_email || !composeForm.subject || !composeForm.body_html) {
            toast.error('Please fill in recipient, subject, and content.');
            return;
        }

        setSending(true);
        try {
            await apiFetch('/platform-mail/send', {
                method: 'POST',
                body: composeForm
            });
            toast.success('Email sent successfully! (BCC sent to info & admin)');
            setIsComposeOpen(false);
            setComposeForm({ recipient_email: '', recipient_name: '', subject: '', category: 'CUSTOM', body_html: '' });
            fetchEmails();
            fetchStats();
        } catch (error: any) {
            console.error('Error sending email:', error);
            toast.error(error.message || 'Failed to send email');
        } finally {
            setSending(false);
        }
    };

    const applyTemplate = (type: 'tax_invoice' | 'notice' | 'welcome') => {
        if (type === 'tax_invoice') {
            setComposeForm(prev => ({
                ...prev,
                subject: 'Official Notice: Platform Invoice Generated',
                category: 'TAX_INVOICE',
                body_html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #4f46e5;">Digifort Labs Billing Notice</h2>
                    <p>Dear Administrator,</p>
                    <p>Your platform invoice has been generated. Both <strong>info@digifortlabs.com</strong> and <strong>admin@digifortlabs.com</strong> are copied for official compliance.</p>
                    <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Digifort Labs Pvt. Ltd. • Empowering Healthcare Providers</p>
                </div>`
            }));
        } else if (type === 'notice') {
            setComposeForm(prev => ({
                ...prev,
                subject: 'System Maintenance & Security Update Notice',
                category: 'NOTICE',
                body_html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #0284c7;">System Maintenance Announcement</h2>
                    <p>Hello,</p>
                    <p>Please be advised that system maintenance is scheduled. All system activities and logs are safely backed up.</p>
                    <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Digifort Security & Technical Team</p>
                </div>`
            }));
        }
    };

    const getCategoryBadge = (cat: string) => {
        switch (cat) {
            case 'TAX_INVOICE':
                return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">Tax Invoice</span>;
            case 'FILE_REQUEST':
                return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">File Request</span>;
            case 'LOGIN_ALERT':
                return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">Security Alert</span>;
            default:
                return <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">{cat}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 flex flex-col font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700/60 shadow-xl">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                        <Mail size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            Super Admin Mail Center
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono uppercase">
                                Dual BCC Enabled
                            </span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            All system emails auto-synced & BCC copied to <code className="text-indigo-300">info@digifortlabs.com</code> & <code className="text-indigo-300">admin@digifortlabs.com</code>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsComposeOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={16} />
                        <span>Compose Mail</span>
                    </button>

                    <button
                        onClick={() => { fetchEmails(); fetchStats(); }}
                        className="p-2.5 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-xl text-xs transition-all"
                        title="Refresh Mailbox"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Layout: Sidebar + Mail List + Reader */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
                {/* Folder Sidebar */}
                <div className="lg:col-span-2 bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 p-3 flex flex-col gap-1">
                    <button
                        onClick={() => setActiveFolder('outbox')}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                            activeFolder === 'outbox'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <Send size={15} />
                            <span>Outbox (Sent)</span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-700 text-slate-300 font-mono">
                            {stats.outbox_count}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveFolder('inbox')}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                            activeFolder === 'inbox'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <Inbox size={15} />
                            <span>Inbox</span>
                        </div>
                        {stats.unread_count > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                                {stats.unread_count}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveFolder('starred')}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                            activeFolder === 'starred'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <Star size={15} className="text-amber-400 fill-amber-400" />
                            <span>Starred</span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-700 text-slate-300 font-mono">
                            {stats.starred_count}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveFolder('archived')}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                            activeFolder === 'archived'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <Archive size={15} />
                            <span>Archive</span>
                        </div>
                    </button>

                    <hr className="my-3 border-slate-700/60" />

                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-1">Filter Categories</p>
                    {['ALL', 'TAX_INVOICE', 'FILE_REQUEST', 'LOGIN_ALERT', 'CUSTOM'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                selectedCategory === cat
                                    ? 'bg-slate-700 text-indigo-300 font-bold border border-slate-600'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                        >
                            <span className="truncate">{cat === 'ALL' ? 'All Categories' : cat}</span>
                        </button>
                    ))}
                </div>

                {/* Email List Column */}
                <div className="lg:col-span-4 bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 flex flex-col overflow-hidden">
                    {/* Search Bar */}
                    <form onSubmit={handleSearchSubmit} className="p-3 border-b border-slate-700/60 bg-slate-800/40">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search recipient, subject..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-900/80 border border-slate-700 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-500"
                            />
                        </div>
                    </form>

                    {/* List Items */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-700/40">
                        {loading ? (
                            <div className="flex items-center justify-center p-12 text-slate-400">
                                <Loader2 className="animate-spin text-indigo-500 mr-2" size={20} />
                                <span className="text-xs">Loading mail logs...</span>
                            </div>
                        ) : emails.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-center">
                                <Mail size={32} className="mb-2 opacity-50" />
                                <p className="text-xs font-semibold">No emails found</p>
                                <p className="text-[11px] text-slate-600 mt-1">Try switching folders or clearing filters</p>
                            </div>
                        ) : (
                            emails.map(email => (
                                <div
                                    key={email.id}
                                    onClick={() => handleSelectEmail(email)}
                                    className={`p-3 cursor-pointer transition-all border-l-4 ${
                                        selectedEmail?.id === email.id
                                            ? 'bg-slate-700/70 border-indigo-500 text-white'
                                            : email.status === 'UNREAD'
                                            ? 'bg-indigo-950/20 border-indigo-400/80 hover:bg-slate-700/40 text-slate-200'
                                            : 'border-transparent hover:bg-slate-700/30 text-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-1.5 truncate">
                                            <span className="font-bold text-xs truncate text-slate-100">
                                                {email.mail_type === 'OUTBOX' ? `To: ${email.recipient_email}` : `From: ${email.sender_email}`}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <button onClick={(e) => handleToggleStar(e, email.id)}>
                                                <Star
                                                    size={14}
                                                    className={email.is_starred ? 'text-amber-400 fill-amber-400' : 'text-slate-500 hover:text-slate-300'}
                                                />
                                            </button>
                                            <span className="text-[10px] text-slate-400 font-mono">
                                                {new Date(email.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    <h4 className="text-xs font-semibold text-slate-200 truncate mb-1">
                                        {email.subject}
                                    </h4>

                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] text-slate-400 truncate">
                                            {email.body_text || 'HTML Email Body'}
                                        </span>
                                        {getCategoryBadge(email.category)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Email Reader Column */}
                <div className="lg:col-span-6 bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-700/50 flex flex-col overflow-hidden">
                    {selectedEmail ? (
                        <div className="flex flex-col h-full">
                            {/* Reader Top Bar */}
                            <div className="p-4 border-b border-slate-700/60 bg-slate-800/80 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                        {selectedEmail.subject}
                                    </h2>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Sent on {new Date(selectedEmail.created_at).toLocaleString()}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleStar({ stopPropagation: () => {} } as any, selectedEmail.id)}
                                        className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg"
                                        title="Star Email"
                                    >
                                        <Star size={15} className={selectedEmail.is_starred ? 'text-amber-400 fill-amber-400' : ''} />
                                    </button>
                                    <button
                                        onClick={() => handleToggleArchive(selectedEmail.id)}
                                        className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg"
                                        title="Archive Email"
                                    >
                                        <Archive size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(selectedEmail.id)}
                                        className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-lg"
                                        title="Delete Log"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* Header Info */}
                            <div className="p-4 bg-slate-900/60 border-b border-slate-700/50 text-xs space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400 font-semibold w-16">From:</span>
                                    <span className="text-indigo-300 font-mono">{selectedEmail.sender_email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400 font-semibold w-16">To:</span>
                                    <span className="text-slate-200 font-mono">{selectedEmail.recipient_email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400 font-semibold w-16">BCC:</span>
                                    <span className="text-amber-300/90 font-mono text-[11px]">
                                        {selectedEmail.bcc || 'info@digifortlabs.com, admin@digifortlabs.com'}
                                    </span>
                                </div>
                            </div>

                            {/* HTML Body View */}
                            <div className="flex-1 p-4 bg-slate-950/40 overflow-y-auto">
                                <div className="bg-white text-slate-900 rounded-xl p-6 shadow-2xl min-h-[400px]">
                                    {selectedEmail.body_html ? (
                                        <div dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
                                    ) : (
                                        <p className="text-slate-700 whitespace-pre-wrap">{selectedEmail.body_text || 'No content'}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-12 text-slate-500 text-center">
                            <Mail size={48} className="mb-3 opacity-40 text-indigo-400" />
                            <p className="text-sm font-bold text-slate-300">Select an email to view full content</p>
                            <p className="text-xs text-slate-500 mt-1">Select any item from the Outbox or Inbox column</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Compose Email Modal */}
            {isComposeOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 text-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-900/60">
                            <div className="flex items-center gap-2 text-sm font-bold text-white">
                                <SendHorizontal size={18} className="text-indigo-400" />
                                <span>Compose Super Admin Email</span>
                            </div>
                            <button onClick={() => setIsComposeOpen(false)} className="text-slate-400 hover:text-white">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSendSubmit} className="p-5 space-y-4">
                            {/* Templates Quick Actions */}
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-700/60">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Templates:</span>
                                <button
                                    type="button"
                                    onClick={() => applyTemplate('tax_invoice')}
                                    className="px-2.5 py-1 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-300 rounded-lg text-[11px] font-medium"
                                >
                                    Tax Invoice Notice
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyTemplate('notice')}
                                    className="px-2.5 py-1 bg-sky-950/50 hover:bg-sky-900/60 border border-sky-800 text-sky-300 rounded-lg text-[11px] font-medium"
                                >
                                    System Maintenance
                                </button>
                            </div>

                            {/* Recipient */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                    Recipient Email Address
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        required
                                        placeholder="hospital@example.com or admin@example.com"
                                        value={composeForm.recipient_email}
                                        onChange={e => setComposeForm({ ...composeForm, recipient_email: e.target.value })}
                                        className="flex-1 bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500"
                                    />
                                    <select
                                        onChange={e => {
                                            if (e.target.value) {
                                                const h = hospitals.find(x => x.hospital_id === parseInt(e.target.value));
                                                if (h && h.email) {
                                                    setComposeForm(prev => ({
                                                        ...prev,
                                                        recipient_email: h.email,
                                                        recipient_name: h.legal_name
                                                    }));
                                                }
                                            }
                                        }}
                                        className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2.5 outline-none"
                                    >
                                        <option value="">Select Hospital</option>
                                        {hospitals.map(h => (
                                            <option key={h.hospital_id} value={h.hospital_id}>
                                                {h.legal_name} ({h.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Dual BCC Notice */}
                            <div className="bg-indigo-950/30 border border-indigo-800/40 p-2.5 rounded-xl flex items-center justify-between text-[11px] text-indigo-300">
                                <span>BCC Recipients (Auto-Included):</span>
                                <code className="bg-slate-900 px-2 py-0.5 rounded border border-indigo-700/50 text-indigo-200">
                                    info@digifortlabs.com, admin@digifortlabs.com
                                </code>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Invoice / Notice Subject..."
                                    value={composeForm.subject}
                                    onChange={e => setComposeForm({ ...composeForm, subject: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500"
                                />
                            </div>

                            {/* HTML Body */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Body (HTML supported)</label>
                                <textarea
                                    required
                                    rows={8}
                                    placeholder="Enter email content or HTML template..."
                                    value={composeForm.body_html}
                                    onChange={e => setComposeForm({ ...composeForm, body_html: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl p-3 outline-none focus:border-indigo-500 font-mono"
                                />
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setIsComposeOpen(false)}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
                                >
                                    {sending ? <Loader2 size={14} className="animate-spin" /> : <SendHorizontal size={14} />}
                                    <span>Send Email</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
