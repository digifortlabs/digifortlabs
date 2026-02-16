'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

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
            const token = localStorage.getItem('token');
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/audit/logs`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page,
                    page_size: 20,
                    search: search || undefined,
                    action: actionFilter || undefined,
                },
            });
            setLogs(res.data.logs);
            setTotalPages(res.data.pages);
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
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/audit/logs`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { export_csv: true },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            alert('Export failed');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">System Audit Logs</h1>
                <button
                    onClick={handleExport}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                >
                    Download CSV
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-white p-4 rounded shadow">
                <input
                    type="text"
                    placeholder="Search User, Details, or Action..."
                    className="border p-2 rounded"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    className="border p-2 rounded"
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                >
                    <option value="">All Actions</option>
                    <option value="LOGIN">Login / Auth</option>
                    <option value="UPLOAD">File Uploads</option>
                    <option value="VIEW">View Records</option>
                    <option value="DELETE">Deletions</option>
                    <option value="UPDATE">Updates</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded shadow overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Time</th>
                            <th className="p-4 font-semibold text-gray-600">User</th>
                            <th className="p-4 font-semibold text-gray-600">Action</th>
                            <th className="p-4 font-semibold text-gray-600">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading logs...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">No logs found.</td></tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.log_id} className="hover:bg-gray-50">
                                    <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                                        {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                                    </td>
                                    <td className="p-4 font-medium text-blue-600">{log.user_email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${log.action.includes('DELETE') ? 'bg-red-100 text-red-800' :
                                                log.action.includes('LOGIN') ? 'bg-green-100 text-green-800' :
                                                    log.action.includes('UPLOAD') ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-700">{log.details}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                >
                    Previous
                </button>
                <span className="text-gray-600">Page {page} of {totalPages}</span>
                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
