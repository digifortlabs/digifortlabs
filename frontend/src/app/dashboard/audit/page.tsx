"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { API_URL } from '../../../config/api';

export default function AuditPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [userRole, setUserRole] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
        if (payload.role !== 'website_admin' && payload.role !== 'hospital_admin') {
            alert("Unauthorized Access");
            router.push('/dashboard');
            return;
        }
        fetchLogs(token, page);
    }, [router, page]);

    const fetchLogs = async (token: string, p: number) => {
        setIsLoading(true);
        const apiUrl = API_URL;
        try {
            const res = await fetch(`${apiUrl}/audit/logs?page=${p}&page_size=20`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setTotal(data.total);
                setPages(data.pages);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">📋 System Audit Trail</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Every action taken by users across the platform is recorded here.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded shadow-sm border border-slate-200 w-full sm:w-auto text-center">
                    <span className="text-sm font-bold text-slate-600">{total} Total Events</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="text-xs uppercase font-bold text-slate-500">
                            <th className="px-6 py-4">Timestamp</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-20 text-center text-gray-400 italic">
                                    Loading audit logs...
                                </td>
                            </tr>
                        ) : logs.length > 0 ? logs.map((log) => (
                            <tr key={log.log_id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-xs font-medium text-slate-500 font-mono">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight
                                            ${log.action.includes('ONBOARD') ? 'bg-blue-100 text-blue-700' :
                                            log.action.includes('APPROVE') ? 'bg-green-100 text-green-700' :
                                                log.action.includes('REJECT') ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {log.action.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-700">
                                    {log.user_email || `User #${log.user_id}`}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 italic">
                                    {log.details}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-20 text-center text-gray-400">
                                    No audit entries found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 border rounded-md text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
                >
                    &larr; Previous
                </button>
                <span className="text-sm font-medium text-slate-500">
                    Page <span className="text-slate-800 font-bold">{page}</span> of {pages}
                </span>
                <button
                    disabled={page === pages}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 border rounded-md text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
                >
                    Next &rarr;
                </button>
            </div>
        </div>

    );
}
