"use client";

import React, { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';

interface LogEntry {
    id: number;
    action: string;
    user: string;
    patient: string;
    details: string;
    module: string;
    time: string;
    timestamp: string;
}

interface RecentActivityLogProps {
    logs: LogEntry[];
}

export default function RecentActivityLog({ logs }: RecentActivityLogProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('ALL');
    const [userFilter, setUserFilter] = useState('ALL');

    const uniqueActions = useMemo(() => Array.from(new Set(logs.map(l => l.action))), [logs]);
    const uniqueUsers = useMemo(() => Array.from(new Set(logs.map(l => l.user))), [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = 
                (log.patient && log.patient.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (log.action && log.action.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (log.user && log.user.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
            const matchesUser = userFilter === 'ALL' || log.user === userFilter;

            return matchesSearch && matchesAction && matchesUser;
        });
    }, [logs, searchTerm, actionFilter, userFilter]);

    return (
        <div className="mt-8 mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-sm font-semibold text-slate-700">Recent Activity</h2>
                
                {/* Filters */}
                {logs.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-slate-700 placeholder-slate-400 w-48 transition-all"
                            />
                        </div>
                        
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-2 py-1">
                            <Filter size={12} className="text-slate-400" />
                            <select 
                                value={actionFilter}
                                onChange={(e) => setActionFilter(e.target.value)}
                                className="text-xs bg-transparent border-none focus:outline-none text-slate-600 font-semibold cursor-pointer w-24"
                            >
                                <option value="ALL">All Actions</option>
                                {uniqueActions.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
                            </select>
                            
                            <div className="w-px h-3 bg-slate-200 mx-1" />
                            
                            <select 
                                value={userFilter}
                                onChange={(e) => setUserFilter(e.target.value)}
                                className="text-xs bg-transparent border-none focus:outline-none text-slate-600 font-semibold cursor-pointer w-24"
                            >
                                <option value="ALL">All Users</option>
                                {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                {logs.length > 0 ? (
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse relative">
                            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-500">Time</th>
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-500">Action</th>
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-500">Patient</th>
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-500">Details</th>
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-500">User</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">{log.time}</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-block px-2 py-1 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-600 uppercase tracking-wider group-hover:bg-white transition-colors">
                                                    {log.action.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-slate-700">{log.patient && log.patient !== "Unknown" ? log.patient : "-"}</td>
                                            <td className="px-4 py-3 text-xs text-slate-600 truncate max-w-sm">{log.details || "-"}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500">{log.user}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                                            No logs match the current filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        No recent activity recorded today.
                    </div>
                )}
            </div>
        </div>
    );
}
