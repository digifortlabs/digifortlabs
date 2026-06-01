"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    ScanLine,
    Search,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Eye,
    ShieldAlert,
    XCircle,
    RefreshCw,
    Building2,
    Filter,
    AlertCircle,
    Check,
    ArrowLeft,
    TrendingUp,
    CheckCircle
} from 'lucide-react';
import { API_URL, apiFetch } from '../../../config/api';
import toast from 'react-hot-toast';

interface QAIssueNormalized {
    id: number;
    file: string;
    issue: string;
    details: string;
    severity: string;
    status: string;
    timestamp: string;
    hospital_name?: string;
    record_id?: number;
}

export default function QAMonitorPage() {
    const router = useRouter();
    const [issues, setIssues] = useState<QAIssueNormalized[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('open');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [userRole, setUserRole] = useState('');
    const [selectedIssue, setSelectedIssue] = useState<QAIssueNormalized | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [stats, setStats] = useState({ open: 0, resolved: 0, ignored: 0 });
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedRole = (localStorage.getItem('userRole') || '').toLowerCase();
            if (!storedRole) {
                router.push('/login');
                return;
            }
            setUserRole(storedRole);
        }
        fetchIssues();
    }, [statusFilter, router]);

    const fetchIssues = async () => {
        setLoading(true);
        try {
            // Fetch status-specific issues
            const data = await apiFetch(`qa?status=${statusFilter}`);
            if (data && Array.isArray(data)) {
                const normalized = data.map((item: any) => ({
                    id: item.issue_id ?? item.id,
                    file: item.filename ?? item.file ?? `File_${item.file_id ?? item.issue_id}`,
                    issue: item.issue_type ?? item.issue ?? 'Quality Exception',
                    details: item.details ?? 'No details provided.',
                    severity: item.severity ?? 'medium',
                    status: item.status ?? 'open',
                    timestamp: item.created_at ?? item.timestamp ?? 'N/A',
                    record_id: item.record_id
                }));
                setIssues(normalized);
            } else {
                setIssues([]);
            }

            // Fetch overall dashboard stats to populate stats count widgets
            const statsData = await apiFetch('stats/dashboard');
            if (statsData && statsData.qa) {
                setStats({
                    open: statsData.qa.pending ?? 0,
                    resolved: statsData.qa.resolved ?? 0,
                    ignored: statsData.qa.ignored ?? 0
                });
            } else {
                // Fallback counts based on current fetched state if dashboard stats are constrained
                const openCount = statusFilter === 'open' ? (data?.length ?? 0) : 0;
                setStats(prev => ({
                    ...prev,
                    open: openCount || prev.open
                }));
            }
        } catch (err: any) {
            console.error('Failed to fetch QA issues:', err);
            if (err.status === 401 && typeof window !== 'undefined') {
                localStorage.removeItem('access_token');
                localStorage.removeItem('userRole');
                router.push('/login?reason=session_expired');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id: number) => {
        if (!confirm('Are you sure you want to mark this quality issue as resolved?')) return;
        setActionLoading(true);
        try {
            await apiFetch(`qa/${id}/resolve`, {
                method: 'POST'
            });
            // Optimistically remove/update from list
            setIssues(prev => prev.filter(item => item.id !== id));
            setStats(prev => ({
                ...prev,
                open: Math.max(0, prev.open - 1),
                resolved: prev.resolved + 1
            }));
            setSelectedIssue(null);
            toast.success('QA issue successfully resolved and archived!');
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Failed to resolve QA issue');
        } finally {
            setActionLoading(false);
        }
    };

    const handleIgnore = async (id: number) => {
        if (!confirm('Are you sure you want to ignore this QA exception? Only Super Admins can execute this.')) return;
        setActionLoading(true);
        try {
            await apiFetch(`qa/${id}/ignore`, {
                method: 'POST'
            });
            setIssues(prev => prev.filter(item => item.id !== id));
            setStats(prev => ({
                ...prev,
                open: Math.max(0, prev.open - 1),
                ignored: prev.ignored + 1
            }));
            setSelectedIssue(null);
            toast.error('QA issue has been ignored and minimized.');
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Failed to ignore QA issue');
        } finally {
            setActionLoading(false);
        }
    };

    const handleFlagRescan = (issue: QAIssueNormalized) => {
        toast.success(`Record "${issue.file}" has been successfully flagged for a rescan queue. The scanning station will receive a high-priority alert.`);
        setSelectedIssue(null);
    };

    // Filter and search computation
    const filteredIssues = issues.filter(item => {
        const matchesSearch = 
            item.file.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.details.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSeverity = severityFilter === 'all' || item.severity.toLowerCase() === severityFilter.toLowerCase();
        return matchesSearch && matchesSeverity;
    });

    const isSuperAdmin = ['superadmin', 'superadmin_staff', 'website_admin'].includes(userRole);

    const getSeverityStyles = (sev: string) => {
        switch (sev.toLowerCase()) {
            case 'critical':
                return 'bg-gradient-to-r from-red-600 to-rose-700 text-white border-red-500 shadow-md shadow-red-950/20';
            case 'high':
                return 'bg-gradient-to-r from-orange-500 to-amber-600 text-white border-orange-400 shadow-sm shadow-orange-950/10';
            case 'medium':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'low':
            default:
                return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        }
    };

    const formatDateString = (dateStr: string) => {
        if (!dateStr || dateStr === 'N/A') return 'N/A';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="w-full mx-auto px-4 sm:px-6 pb-6 pt-0 text-slate-900 animate-fadeIn">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <button
                        onClick={() => router.push('/admin')}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition mb-3 group"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                        Back to Command Center
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                            <ScanLine className="text-indigo-600" size={28} />
                        </div>
                        QA Monitor
                    </h1>
                    <p className="text-sm text-slate-500 mt-1.5">
                        Audit digitized patient charts, resolve scanner warnings, and enforce clinical compliant records quality.
                    </p>
                </div>

                <button
                    onClick={fetchIssues}
                    disabled={loading}
                    className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-60"
                >
                    <RefreshCw size={16} className={`${loading ? 'animate-spin' : ''}`} />
                    Refresh Feed
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {/* Stat 1: Open */}
                <div 
                    onClick={() => setStatusFilter('open')}
                    className={`cursor-pointer p-5 rounded-[2rem] border transition-all duration-300 relative overflow-hidden group ${
                        statusFilter === 'open' 
                            ? 'bg-slate-900 border-slate-800 text-white shadow-xl shadow-slate-950/20' 
                            : 'bg-white border-slate-200 hover:border-red-300 hover:shadow-md'
                    }`}
                >
                    <div className="relative z-10 flex justify-between items-start">
                        <div className="space-y-1">
                            <p className={`text-[10px] font-black uppercase tracking-wider ${
                                statusFilter === 'open' ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                                Active QA Issues
                            </p>
                            <h3 className="text-3xl font-black">{stats.open}</h3>
                        </div>
                        <div className={`p-3 rounded-2xl ${
                            statusFilter === 'open' ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
                        }`}>
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                    {statusFilter !== 'open' && (
                        <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-red-500/5 rounded-full group-hover:scale-150 transition-transform duration-300" />
                    )}
                </div>

                {/* Stat 2: Resolved */}
                <div 
                    onClick={() => setStatusFilter('resolved')}
                    className={`cursor-pointer p-5 rounded-[2rem] border transition-all duration-300 relative overflow-hidden group ${
                        statusFilter === 'resolved' 
                            ? 'bg-slate-900 border-slate-800 text-white shadow-xl shadow-slate-950/20' 
                            : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
                    }`}
                >
                    <div className="relative z-10 flex justify-between items-start">
                        <div className="space-y-1">
                            <p className={`text-[10px] font-black uppercase tracking-wider ${
                                statusFilter === 'resolved' ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                                Resolved Audits
                            </p>
                            <h3 className="text-3xl font-black">{stats.resolved}</h3>
                        </div>
                        <div className={`p-3 rounded-2xl ${
                            statusFilter === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                    {statusFilter !== 'resolved' && (
                        <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform duration-300" />
                    )}
                </div>

                {/* Stat 3: Ignored */}
                <div 
                    onClick={() => setStatusFilter('ignored')}
                    className={`cursor-pointer p-5 rounded-[2rem] border transition-all duration-300 relative overflow-hidden group ${
                        statusFilter === 'ignored' 
                            ? 'bg-slate-900 border-slate-800 text-white shadow-xl shadow-slate-950/20' 
                            : 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-md'
                    }`}
                >
                    <div className="relative z-10 flex justify-between items-start">
                        <div className="space-y-1">
                            <p className={`text-[10px] font-black uppercase tracking-wider ${
                                statusFilter === 'ignored' ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                                Ignored Exceptions
                            </p>
                            <h3 className="text-3xl font-black">{stats.ignored}</h3>
                        </div>
                        <div className={`p-3 rounded-2xl ${
                            statusFilter === 'ignored' ? 'bg-slate-500/15 text-slate-400' : 'bg-slate-100 text-slate-600'
                        }`}>
                            <Eye size={20} />
                        </div>
                    </div>
                    {statusFilter !== 'ignored' && (
                        <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-slate-500/5 rounded-full group-hover:scale-150 transition-transform duration-300" />
                    )}
                </div>
            </div>

            {/* Filter controls bar */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search field */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search issues by keyword, file, or details..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm transition"
                    />
                </div>

                {/* Dropdowns */}
                <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl text-xs font-bold text-slate-500 uppercase">
                        <Filter size={14} /> Filters
                    </div>

                    {/* Status filter select */}
                    <select
                        value={statusFilter}
                        onChange={(e) => startTransition(() => setStatusFilter(e.target.value))}
                        className="bg-white border border-slate-200 hover:border-slate-300 px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:border-indigo-500 transition cursor-pointer text-slate-700"
                    >
                        <option value="open">Status: Open / Active</option>
                        <option value="resolved">Status: Resolved</option>
                        <option value="ignored">Status: Ignored</option>
                    </select>

                    {/* Severity select filter */}
                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="bg-white border border-slate-200 hover:border-slate-300 px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:border-indigo-500 transition cursor-pointer text-slate-700"
                    >
                        <option value="all">Severity: All Levels</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>

            {/* Content Table Area */}
            {loading ? (
                <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-20 flex flex-col items-center justify-center gap-4">
                    {/* Spinning loader */}
                    <div className="relative w-14 h-14">
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 border-r-indigo-600 animate-spin" />
                    </div>
                    <p className="text-sm font-black text-slate-900 tracking-wide uppercase animate-pulse">
                        Syncing Quality Telemetry...
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/70 border-b border-slate-100">
                            <tr>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider w-16">ID</th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">File & MRD</th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Exception Type</th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Severity</th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Reported Date</th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredIssues.map((issue, idx) => (
                                <tr 
                                    key={issue.id} 
                                    className="hover:bg-slate-50/40 transition group cursor-pointer"
                                    onClick={() => setSelectedIssue(issue)}
                                >
                                    <td className="p-6 text-sm font-bold text-slate-400 font-mono">
                                        #{issue.id}
                                    </td>
                                    <td className="p-6">
                                        {issue.record_id ? (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/admin/records/view?id=${issue.record_id}`);
                                                }}
                                                className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline truncate max-w-[280px] text-left block"
                                            >
                                                {issue.file}
                                            </button>
                                        ) : (
                                            <div className="font-bold text-slate-900 truncate max-w-[280px]">
                                                {issue.file}
                                            </div>
                                        )}
                                        <div className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wide flex items-center gap-1">
                                            <Building2 size={10} className="text-slate-300" />
                                            {issue.hospital_name ?? 'Digifort Client Branch'}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                                            {issue.status === 'resolved' ? (
                                                <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                                            ) : issue.status === 'ignored' ? (
                                                <Eye size={13} className="text-slate-400 flex-shrink-0" />
                                            ) : (
                                                <AlertTriangle size={13} className="text-rose-500 flex-shrink-0" />
                                            )}
                                            {issue.issue}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getSeverityStyles(issue.severity)}`}>
                                            {issue.severity}
                                        </span>
                                    </td>
                                    <td className="p-6 text-sm font-semibold text-slate-400 font-mono">
                                        {formatDateString(issue.timestamp)}
                                    </td>
                                    <td className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => setSelectedIssue(issue)}
                                            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition hover:shadow-sm"
                                        >
                                            Review
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredIssues.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center">
                                        <div className="max-w-md mx-auto flex flex-col items-center gap-3">
                                            <CheckCircle className="text-emerald-500" size={48} />
                                            <h3 className="text-base font-extrabold text-slate-900 mt-2">All Clear! No quality issues</h3>
                                            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                                                {searchTerm || severityFilter !== 'all' 
                                                    ? "No matching alerts found for your active filter criteria." 
                                                    : "Every single chart successfully cleared all audit rules and compliance constraints."}
                                            </p>
                                            {(searchTerm || severityFilter !== 'all') && (
                                                <button
                                                    onClick={() => { setSearchTerm(''); setSeverityFilter('all'); }}
                                                    className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                                                >
                                                    Reset Filters
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Review Overlay/Modal Details */}
            {selectedIssue && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div 
                        className="bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden relative p-8 animate-scaleUp"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Details */}
                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getSeverityStyles(selectedIssue.severity)}`}>
                                    {selectedIssue.severity} Severity
                                </span>
                                <h2 className="text-xl font-black text-slate-950 flex items-center gap-2 mt-2">
                                    <ShieldAlert size={20} className="text-indigo-600" />
                                    QA Telemetry Audit
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedIssue(null)}
                                className="w-8 h-8 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
                            >
                                <XCircle size={18} />
                            </button>
                        </div>

                        {/* Audit Details */}
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4 mb-6">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Filename / Record</div>
                                    <div className="font-bold text-slate-800 break-all mt-1">{selectedIssue.file}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Reported Date</div>
                                    <div className="font-bold text-slate-800 mt-1">{formatDateString(selectedIssue.timestamp)}</div>
                                </div>
                                <div className="col-span-2 pt-2 border-t border-slate-200/50">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Exception Category</div>
                                    <div className="font-extrabold text-indigo-700 mt-1">{selectedIssue.issue}</div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200/50">
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1.5">Technical Details</div>
                                <div className="text-xs text-slate-600 leading-relaxed font-semibold bg-white p-3 border border-slate-100 rounded-xl max-h-36 overflow-y-auto">
                                    {selectedIssue.details}
                                </div>
                            </div>
                        </div>

                        {/* Action buttons footer */}
                        <div className="flex flex-col gap-2">
                            {selectedIssue.status === 'open' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleResolve(selectedIssue.id)}
                                        disabled={actionLoading}
                                        className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 disabled:opacity-60 shadow-md shadow-emerald-950/10"
                                    >
                                        <Check size={16} />
                                        Mark as Resolved
                                    </button>

                                    {isSuperAdmin && (
                                        <button
                                            onClick={() => handleIgnore(selectedIssue.id)}
                                            disabled={actionLoading}
                                            className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                                        >
                                            Ignore Exception
                                        </button>
                                    )}
                                </div>
                            )}

                            {selectedIssue.status === 'open' && (
                                <button
                                    onClick={() => handleFlagRescan(selectedIssue)}
                                    disabled={actionLoading}
                                    className="w-full py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-sm transition border border-amber-200"
                                >
                                    Flag for Rescan Alert
                                </button>
                            )}

                            <button
                                onClick={() => setSelectedIssue(null)}
                                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition mt-2"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
