'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/config/api';
import { format } from 'date-fns';
import { Search, Download, Clock, User, Activity, Filter } from 'lucide-react';

interface AuditLog {
    log_id: number;
    timestamp: string;
    action: string;
    details: string;
    user_email: string;
}

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');

    // Fetch Logs
    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('page_size', '20');
            if (search) params.append('search', search);
            if (actionFilter) params.append('action', actionFilter);

            const data = await apiFetch(`audit/logs?${params.toString()}`);
            if (data) {
                setLogs(data.logs);
                setTotalPages(data.pages);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs();
        }, 500); // Debounce search
        return () => clearTimeout(timer);
    }, [page, search, actionFilter]);

    const handleExport = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/audit/logs?export_csv=true`, {
                credentials: 'include'
            });

            if (!response.ok) throw new Error("Export failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error(error);
            alert('Export failed');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-3 lg:p-4 pt-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-2">
                <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5 leading-none">
                        <Activity size={20} className="text-slate-900" /> Audit Center
                    </h1>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Real-time System Activity Monitoring</p>
                </div>
                <button
                    onClick={handleExport}
                    className="bg-slate-900 text-white px-3 py-1.5 rounded-lg font-black text-[10px] flex items-center gap-1.5 hover:bg-slate-800 transition-all shadow-sm active:scale-95 uppercase tracking-wider"
                >
                    <Download size={12} /> Download CSV
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <div className="md:col-span-3 relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search User, Details, or Action..."
                        className="w-full pl-10 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 text-xs transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="relative">
                    <Filter className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <select
                        className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 text-[11px] appearance-none cursor-pointer"
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                    >
                        <option value="">All Actions</option>
                        <option value="LOGIN">Auth Events</option>
                        <option value="UPLOAD">File Activity</option>
                        <option value="VIEW">Data Access</option>
                        <option value="DELETE">Risk Events (Delete)</option>
                        <option value="UPDATE">System Updates</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Clock size={12} /> Timestamp
                            </th>
                            <th className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <User size={12} className="inline mr-1" /> Principal
                            </th>
                            <th className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                            <th className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400 text-xs font-bold">Initializing Telemetry...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400 text-xs font-bold">No Records Found</td></tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.log_id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-3 py-0.5 text-[10px] text-slate-500 font-semibold whitespace-nowrap">
                                        {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                                    </td>
                                    <td className="px-3 py-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-600">
                                                {log.user_email.substring(0, 1).toUpperCase()}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-700">{log.user_email}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                log.action.includes('DELETE') ? 'bg-red-500' :
                                                log.action.includes('LOGIN') ? 'bg-emerald-500' :
                                                log.action.includes('UPLOAD') ? 'bg-indigo-500' :
                                                'bg-slate-400'
                                            }`}></div>
                                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-600">
                                                {log.action}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-0.5 text-[10px] text-slate-500 font-medium leading-relaxed max-w-md truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                                        {log.details}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-3 flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
                <div className="flex gap-1">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1 bg-slate-100 text-slate-600 rounded-md font-bold text-[10px] disabled:opacity-30 hover:bg-slate-200 transition-colors"
                    >
                        PREV
                    </button>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 bg-slate-900 text-white rounded-md font-bold text-[10px] disabled:opacity-30 hover:bg-slate-800 transition-colors shadow-sm"
                    >
                        NEXT
                    </button>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {page} / {totalPages}</span>
            </div>
        </div>
    );
}

