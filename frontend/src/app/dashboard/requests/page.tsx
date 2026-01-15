"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Search, Plus, Clock, CheckCircle2, AlertCircle, Box } from 'lucide-react';
import { API_URL } from '../../../config/api';

export default function FileRequests() {
    const [requests, setRequests] = useState<any[]>([]);
    const [view, setView] = useState('list'); // 'list' | 'new'
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [userRole, setUserRole] = useState<string>('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role);
            } catch (e) {
                console.error("Token decode failed", e);
            }
        }
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/storage/requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setRequests(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    const activeRequests = requests.filter(r => ['Pending', 'In Transit', 'Approved', 'Pending Approval', 'Return Requested'].includes(r.status));
    const historyRequests = requests.filter(r => ['Delivered', 'Rejected', 'Cancelled', 'Returned'].includes(r.status));

    // super_admin is mapped to 'website_admin' string usually, but let's check both
    const canManageRequests = ['website_admin', 'super_admin', 'mrd_staff', 'platform_staff'].includes(userRole);

    const searchPatients = async (query: string) => {
        if (!query) { setSearchResults([]); return; }
        const token = localStorage.getItem('token');
        try {
            // Re-using existing patient search/list endpoint? 
            // We likely need a search endpoint. For now, we might fetch all (inefficient) or use a search param if supported.
            // Let's assume GET /patients/?search=query logic or similar. 
            // Checking backend: Listing patients supports filtering? No.
            // So we will just fetch all patients for now (for the hospital).
            const res = await fetch(`${API_URL}/patients/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const filtered = data.filter((p: any) =>
                    p.full_name.toLowerCase().includes(query.toLowerCase()) ||
                    p.patient_u_id.includes(query)
                );
                setSearchResults(filtered);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRequest = async (patient: any) => {
        if (!patient.physical_box_id) {
            alert("This patient file is not physically archived yet.");
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/storage/requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    box_id: patient.physical_box_id,
                    requester_name: "Auto" // Backend will populate this with user email
                })
            });

            if (res.ok) {
                alert("Request Submitted Successfully!");
                setView('list');
                fetchRequests();
            } else {
                const d = await res.json();
                alert(d.detail || "Failed");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const updateStatus = async (id: number, status: string) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/storage/requests/${id}/status?status=${status}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                alert(`Request ${status}`);
                fetchRequests();
            } else {
                alert("Action Failed");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const deleteRequest = async (id: number) => {
        if (!confirm("Are you sure you want to delete this request?")) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/storage/requests/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchRequests();
            } else {
                alert("Failed to delete request.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Auto-search debounce
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (view === 'new') searchPatients(searchTerm);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, view]);


    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 text-slate-900">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
                        <FileText className="text-indigo-600" /> File Requests
                    </h1>
                    <p className="text-sm sm:text-base text-slate-500 mt-1 sm:mt-2">Request physical files from the warehouse.</p>
                </div>

                {view === 'list' ? (
                    <button
                        onClick={() => setView('new')}
                        className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition"
                    >
                        <Plus size={20} /> New Request
                    </button>
                ) : (
                    <button
                        onClick={() => setView('list')}
                        className="w-full sm:w-auto bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition"
                    >
                        Cancel
                    </button>
                )}
            </div>

            {view === 'list' ? (
                <div className="space-y-12">
                    {/* ACTIVE REQUESTS */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Clock className="text-indigo-600" size={20} /> Active Requests
                        </h3>
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Location</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Box Label</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Requester</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Date</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {activeRequests.map(req => (
                                        <tr key={req.request_id} className="hover:bg-slate-50/50 transition">
                                            <td className="p-6">
                                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${req.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-slate-100 text-slate-500 border-slate-200'
                                                    }`}>
                                                    <Clock size={12} /> {req.status}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${req.status === 'Delivered' ? 'bg-indigo-100 text-indigo-700' :
                                                    req.status === 'In Transit' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {req.status === 'Delivered' ? '🏥 At Hospital' :
                                                        req.status === 'In Transit' ? '🚚 In Transit' :
                                                            '🏢 Warehouse'}
                                                </span>
                                            </td>
                                            <td className="p-6 font-bold text-slate-700 flex items-center gap-2">
                                                <Box size={16} className="text-indigo-400" />
                                                {req.box_label}
                                            </td>
                                            <td className="p-6 text-sm font-medium text-slate-600">{req.requester_name}</td>
                                            <td className="p-6 text-sm text-slate-400">{new Date(req.request_date).toLocaleDateString()}</td>
                                            <td className="p-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canManageRequests && req.status === 'Pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => updateStatus(req.request_id, 'In Transit')}
                                                                className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition"
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => updateStatus(req.request_id, 'Rejected')}
                                                                className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-100 transition"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {canManageRequests && req.status === 'In Transit' && (
                                                        <button
                                                            onClick={() => updateStatus(req.request_id, 'Delivered')}
                                                            className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition"
                                                        >
                                                            Deliver
                                                        </button>
                                                    )}
                                                    {canManageRequests && req.status === 'Return Requested' && (
                                                        <button
                                                            onClick={() => updateStatus(req.request_id, 'Returned')}
                                                            className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold hover:bg-purple-100 transition"
                                                        >
                                                            Confirm Return
                                                        </button>
                                                    )}

                                                    {/* EVERYONE can delete/cancel their own request */}
                                                    <button
                                                        onClick={() => deleteRequest(req.request_id)}
                                                        className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {activeRequests.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-slate-400 italic">No active requests.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* HISTORY OF FILE REQUESTS */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <CheckCircle2 className="text-emerald-600" size={20} /> Request History
                        </h3>
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-x-auto opacity-80 hover:opacity-100 transition">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Location</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Box Label</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Requester</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Date</th>
                                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {historyRequests.map(req => (
                                        <tr key={req.request_id} className="hover:bg-slate-50/50 transition">
                                            <td className="p-6">
                                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${req.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    'bg-slate-100 text-slate-500 border-slate-200'
                                                    }`}>
                                                    {req.status === 'Delivered' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${req.status === 'Delivered' ? 'bg-indigo-100 text-indigo-700' :
                                                    'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {req.status === 'Delivered' ? '🏥 At Hospital' : '🏢 Warehouse'}
                                                </span>
                                            </td>
                                            <td className="p-6 font-bold text-slate-700 flex items-center gap-2">
                                                <Box size={16} className="text-indigo-400" />
                                                {req.box_label}
                                            </td>
                                            <td className="p-6 text-sm font-medium text-slate-600">{req.requester_name}</td>
                                            <td className="p-6 text-sm text-slate-400">{new Date(req.request_date).toLocaleDateString()}</td>
                                            <td className="p-6 text-right">
                                                {req.status === 'Delivered' && (
                                                    <button
                                                        onClick={() => updateStatus(req.request_id, 'Return Requested')}
                                                        className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold hover:bg-purple-100 transition"
                                                    >
                                                        Return to Warehouse
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {historyRequests.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-12 text-center text-slate-400 italic">No history available.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-6">Find Patient File</h2>

                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by Patient Name or ID..."
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium transition"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {searchResults.map(patient => (
                                <div key={patient.record_id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 hover:shadow-md transition group">
                                    <div>
                                        <h4 className="font-bold text-slate-900">{patient.full_name}</h4>
                                        <p className="text-sm text-slate-500">ID: {patient.patient_u_id}</p>
                                    </div>

                                    {patient.physical_box_id ? (
                                        <button
                                            onClick={() => handleRequest(patient)}
                                            className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-sm group-hover:bg-indigo-600 group-hover:text-white transition"
                                        >
                                            Request File
                                        </button>
                                    ) : (
                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                            Not Archived
                                        </span>
                                    )}
                                </div>
                            ))}
                            {searchTerm && searchResults.length === 0 && (
                                <div className="text-center p-8 text-slate-400">No patients found.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
