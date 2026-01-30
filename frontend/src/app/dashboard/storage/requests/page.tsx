"use client";
import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import { API_URL } from '../../../../config/api';

interface Request {
    request_id: number;
    box_label: string;
    requester_name: string;
    status: string;
    request_date: string;
}

import { formatDate } from '../../../../lib/dateFormatter';

export default function RequestsPage() {
    const router = useRouter();
    const [userRole, setUserRole] = useState('');
    const [requests, setRequests] = useState<Request[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
        fetchRequests(token);
    }, [router]);

    const fetchRequests = async (token: string) => {
        setIsLoading(true);
        const apiUrl = API_URL;
        try {
            const res = await fetch(`${apiUrl}/storage/requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setRequests(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const updateStatus = async (id: number, status: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const apiUrl = API_URL;
        try {
            const res = await fetch(`${apiUrl}/storage/requests/${id}/status?status=${status}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchRequests(token);
            }
        } catch (e) { console.error(e); }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-700';
            case 'Pending Approval': return 'bg-orange-100 text-orange-700';
            case 'In Transit': return 'bg-blue-100 text-blue-700';
            case 'Delivered': return 'bg-green-100 text-green-700';
            case 'Returned': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="flex-1 p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">🚚 File Retrieval Requests</h1>
                    <p className="text-gray-500 text-sm">Track physical file movement from archives.</p>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requester</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Box Target</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Requested</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status Flow</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {requests.length > 0 ? requests.map((req) => (
                            <tr key={req.request_id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">{req.requester_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-mono text-xs font-bold">
                                            {req.box_label}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(req.request_date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(req.status)}`}>
                                            {req.status}
                                        </span>
                                        {/* Action Buttons */}
                                        {req.status === 'Pending Approval' && (userRole === 'hospital_admin' || userRole === 'website_admin') && (
                                            <button onClick={() => updateStatus(req.request_id, 'Pending')} className="text-xs text-indigo-600 font-bold underline ml-2">Approve</button>
                                        )}
                                        {req.status === 'Pending' && (
                                            <button onClick={() => updateStatus(req.request_id, 'In Transit')} className="text-xs text-blue-600 underline ml-2">Ship</button>
                                        )}
                                        {req.status === 'In Transit' && (
                                            <button onClick={() => updateStatus(req.request_id, 'Delivered')} className="text-xs text-green-600 underline ml-2">Deliver</button>
                                        )}
                                        {req.status === 'Delivered' && (
                                            <button onClick={() => updateStatus(req.request_id, 'Returned')} className="text-xs text-gray-500 underline ml-2">Return</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No active retrieval requests.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

    );
}
