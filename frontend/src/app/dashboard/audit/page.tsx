"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '../../../config/api';
import { Search, Calendar, Filter, Download, ShieldCheck, User, Clock, Activity, ArrowLeft, ArrowRight } from 'lucide-react';

export default function AuditPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchLogs(token, page);
    }, [router, page]); // Dependency on page mainly. Filters trigger manual fetch? Or auto? Let's do manual Apply for consistency with Reports.

    const fetchLogs = async (token: string, p: number = 1) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', p.toString());
            params.append('page_size', '20');
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (actionFilter) params.append('action', actionFilter);
            if (searchQuery) params.append('search', searchQuery);

            const res = await fetch(`${API_URL}/audit/logs?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setTotal(data.total);
                setPages(data.pages);
                setPage(data.page);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyFilters = () => {
        setPage(1);
        const token = localStorage.getItem('token');
        if (token) fetchLogs(token, 1);
    };

    const handleExport = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (actionFilter) params.append('action', actionFilter);
        if (searchQuery) params.append('search', searchQuery);
        params.append('export_csv', 'true');

        try {
            const res = await fetch(`${API_URL}/audit/logs?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert("Export Failed");
            }
        } catch (e) {
            console.error(e);
            alert("Export Error");
        }
    };

    return (
        <div className="flex-1 p-4 sm:p-8 space-y-8 bg-slate-50 min-h-screen">

            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="p-3 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-200">
                            <ShieldCheck size={28} />
                        </span>
                        System Audit Trail
                    </h1>
                    <p className="text-slate-500 font-medium ml-[4.5rem] mt-1">
                        Secure immutable log of all platform activities
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                        <Activity size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Events</p>
                        <p className="text-xl font-black text-slate-800">{total.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search user, details..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl font-bold text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 placeholder-slate-400"
                        />
                    </div>

                    {/* Action Filter */}
                    <div className="relative group">
                        <Filter className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl font-bold text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 appearance-none cursor-pointer"
                        >
                            <option value="">All Actions</option>
                            <option value="LOGIN">Login & Auth</option>
                            <option value="VIEW">View Records</option>
                            <option value="UPLOAD">Uploads</option>
                            <option value="DELETE">Deletions</option>
                            <option value="DOWNLOAD">Downloads</option>
                            <option value="UPDATE">Updates</option>
                        </select>
                    </div>

                    {/* Dates */}
                    <div className="relative group">
                        <Calendar className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl font-bold text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>
                    <div className="relative group">
                        <Calendar className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl font-bold text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>
                </div>

                <div className="flex gap-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-4">
                    <button
                        onClick={handleApplyFilters}
                        className="flex-1 lg:flex-none px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                        Apply
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex-1 lg:flex-none px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                        <Download size={18} /> Export
                    </button>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-left first:pl-10">Timestamp</th>
                                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-left">Action</th>
                                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-left">User</th>
                                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-left w-1/3">Context Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-32 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
                                            <p className="font-bold text-sm">Loading Audit Trail...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length > 0 ? (
                                logs.map((log) => {
                                    // Action Color Logic
                                    let actionColor = "bg-slate-100 text-slate-600";
                                    if (log.action.includes('LOGIN') || log.action.includes('AUTH')) actionColor = "bg-indigo-50 text-indigo-600";
                                    else if (log.action.includes('DELETE') || log.action.includes('REJECT')) actionColor = "bg-rose-50 text-rose-600";
                                    else if (log.action.includes('UPLOAD') || log.action.includes('CREATE')) actionColor = "bg-emerald-50 text-emerald-600";
                                    else if (log.action.includes('DOWNLOAD')) actionColor = "bg-amber-50 text-amber-600";

                                    return (
                                        <tr key={log.log_id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-8 py-5 first:pl-10">
                                                <div className="flex items-center gap-3">
                                                    <Clock size={16} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                                    <span className="font-medium text-slate-600 text-sm font-mono">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border border-transparent ${actionColor}`}>
                                                    {log.action.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                                                        {(log.user_email || 'S').substring(0, 1)}
                                                    </div>
                                                    <span className="font-bold text-slate-700 text-sm">{log.user_email}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm font-medium text-slate-600 leading-relaxed truncate max-w-md" title={log.details}>
                                                    {log.details}
                                                </p>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-32 text-center text-slate-400">
                                        <ShieldCheck size={48} className="mx-auto mb-4 text-slate-200" />
                                        <p className="font-bold">No Audit Records Found</p>
                                        <p className="text-xs mt-1">Try adjusting your filters.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {pages > 1 && (
                    <div className="bg-slate-50 border-t border-slate-200 p-6 flex justify-between items-center">
                        <button
                            disabled={page === 1}
                            onClick={() => { setPage(page - 1); fetchLogs(localStorage.getItem('token') || '', page - 1); }}
                            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm"
                        >
                            <ArrowLeft size={16} /> Previous
                        </button>

                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            Page {page} of {pages}
                        </span>

                        <button
                            disabled={page === pages}
                            onClick={() => { setPage(page + 1); fetchLogs(localStorage.getItem('token') || '', page + 1); }}
                            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm"
                        >
                            Next <ArrowRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
