"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Search, Plus, Clock, CheckCircle2, AlertCircle, Box } from 'lucide-react';
import { API_URL } from '../../../config/api';

export default function FileRequests() {
    const [requests, setRequests] = useState<any[]>([]);
    const [view, setView] = useState('list'); // 'list' | 'new'
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
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
                    box_id: patient.physical_box_id, // Requesting the BOX the file is in
                    requester_name: "Staff Request" // Backend should ideally pick user name
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

    // Auto-search debounce
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (view === 'new') searchPatients(searchTerm);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, view]);


    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <FileText className="text-indigo-600" /> File Requests
                    </h1>
                    <p className="text-slate-500 mt-2">Request physical files from the warehouse.</p>
                </div>

                {view === 'list' ? (
                    <button
                        onClick={() => setView('new')}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition"
                    >
                        <Plus size={20} /> New Request
                    </button>
                ) : (
                    <button
                        onClick={() => setView('list')}
                        className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition"
                    >
                        Cancel
                    </button>
                )}
            </div>

            {view === 'list' ? (
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Box Label</th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Requester</th>
                                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {requests.map(req => (
                                <tr key={req.request_id} className="hover:bg-slate-50/50 transition">
                                    <td className="p-6">
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${req.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    'bg-slate-100 text-slate-500 border-slate-200'
                                            }`}>
                                            {req.status === 'Pending' && <Clock size={12} />}
                                            {req.status === 'Approved' && <CheckCircle2 size={12} />}
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="p-6 font-bold text-slate-700 flex items-center gap-2">
                                        <Box size={16} className="text-indigo-400" />
                                        {req.box_label}
                                    </td>
                                    <td className="p-6 text-sm font-medium text-slate-600">{req.requester_name}</td>
                                    <td className="p-6 text-sm text-slate-400">{new Date(req.request_date).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-400 italic">No active file requests properly.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
