"use client";

import React, { useState, useEffect } from 'react';
import { API_URL } from '../../../config/api';
import { Receipt, Boxes, ShieldAlert, Download, RefreshCw, FileText, Stethoscope } from 'lucide-react';

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('billing'); // billing, inventory, audit, clinical
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<any>(null);

    const fetchReport = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/reports/${activeTab}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                if (activeTab === 'billing') {
                    setData(json.data);
                    setSummary(json.summary);
                } else if (activeTab === 'clinical') {
                    setData(json.details);
                    setSummary(json.summary);
                } else {
                    setData(json);
                    setSummary(null);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [activeTab]);

    const markAsPaid = async (fileId: number) => {
        if (!confirm("Confirm marking this file as PAID?")) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/reports/billing/mark-paid`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ file_ids: [fileId], is_paid: true })
            });
            if (res.ok) {
                fetchReport(); // Refresh
            } else {
                alert("Failed to update status");
            }
        } catch (e) {
            console.error(e);
            alert("Error updating status");
        }
    };

    const handleExport = async () => {
        const token = localStorage.getItem('token');
        window.open(`${API_URL}/reports/${activeTab}?export_csv=true&token=${token}`, '_blank');
        // Note: For Bearer token in URL context, usually backend needs to support query param auth or we fetch blob.
        // For simplicity, we'll try fetch blob trigger.

        try {
            const res = await fetch(`${API_URL}/reports/${activeTab}?export_csv=true`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${activeTab}_report.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e) {
            alert("Export Failed");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 relative font-sans">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <span className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                                <FileText size={32} />
                            </span>
                            Reports Center
                        </h1>
                        <p className="text-slate-500 font-medium ml-[4.5rem] mt-1">Export analytical data for billing and auditing</p>
                    </div>

                    <button
                        onClick={handleExport}
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                    >
                        <Download size={20} /> Export CSV
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
                    <button
                        onClick={() => setActiveTab('billing')}
                        className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wide flex items-center gap-3 transition-all ${activeTab === 'billing' ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100 ring-1 ring-indigo-50' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                        <Receipt size={20} /> Billing Report
                    </button>
                    <button
                        onClick={() => setActiveTab('clinical')}
                        className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wide flex items-center gap-3 transition-all ${activeTab === 'clinical' ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100 ring-1 ring-indigo-50' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                        <Stethoscope size={20} /> Clinical Data
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wide flex items-center gap-3 transition-all ${activeTab === 'inventory' ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100 ring-1 ring-indigo-50' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                        <Boxes size={20} /> Inventory Report
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wide flex items-center gap-3 transition-all ${activeTab === 'audit' ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100 ring-1 ring-indigo-50' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                        <ShieldAlert size={20} /> Audit Log
                    </button>
                </div>

                {/* Summary Card (Billing & Clinical) */}
                {summary && (activeTab === 'billing' || activeTab === 'clinical') && (
                    <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4">
                        {activeTab === 'billing' ? (
                            <>
                                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Files</p>
                                    <h3 className="text-3xl font-black text-slate-800">{summary.total_files}</h3>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Cost</p>
                                    <h3 className="text-3xl font-black text-indigo-600">₹{summary.total_cost}</h3>
                                </div>
                            </>
                        ) : (
                            // Clinical Summary
                            Object.entries(summary).slice(0, 3).map(([key, value]: any) => (
                                <div key={key} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{key}</p>
                                    <h3 className="text-3xl font-black text-indigo-600">{value}</h3>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Data Table */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                    {loading ? (
                        <div className="h-96 flex items-center justify-center text-slate-400 gap-3 font-bold">
                            <RefreshCw className="animate-spin" /> Loading Data...
                        </div>
                    ) : (data && data.length > 0) ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        {activeTab === 'billing' && (
                                            <>
                                                <th className="px-8 py-5">Date</th>
                                                <th className="px-8 py-5">Patient Details</th>
                                                <th className="px-8 py-5">File Info</th>
                                                <th className="px-8 py-5 text-right">Cost (INR)</th>
                                                <th className="px-8 py-5 text-center">Payment Status</th>
                                                <th className="px-8 py-5 text-right">Action</th>
                                            </>
                                        )}
                                        {activeTab === 'inventory' && (
                                            <>
                                                <th className="px-8 py-5">Box Label</th>
                                                <th className="px-8 py-5">Location</th>
                                                <th className="px-8 py-5">Status</th>
                                                <th className="px-8 py-5">Utilization</th>
                                            </>
                                        )}
                                        {activeTab === 'audit' && (
                                            <>
                                                <th className="px-8 py-5">Time</th>
                                                <th className="px-8 py-5">User</th>
                                                <th className="px-8 py-5">Action</th>
                                                <th className="px-8 py-5">Details</th>
                                            </>
                                        )}
                                        {activeTab === 'clinical' && (
                                            <>
                                                <th className="px-8 py-5">Date</th>
                                                <th className="px-8 py-5">Patient Details</th>
                                                <th className="px-8 py-5">File</th>
                                                <th className="px-8 py-5">Tags</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-sm text-slate-600">
                                    {data.map((row: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            {activeTab === 'billing' && (
                                                <>
                                                    <td className="px-8 py-4 whitespace-nowrap">{row.upload_date}</td>
                                                    <td className="px-8 py-4">
                                                        <div className="font-bold text-slate-800">{row.patient_name}</div>
                                                        <div className="text-xs text-slate-400 font-mono">{row.mrd}</div>
                                                    </td>
                                                    <td className="px-8 py-4">
                                                        <div className="text-indigo-600 font-bold truncate max-w-[200px]">{row.filename}</div>
                                                        <div className="text-xs text-slate-400">{row.file_size_mb} MB • {row.page_count} Pages</div>
                                                    </td>
                                                    <td className="px-8 py-4 text-right font-bold text-slate-800">₹{row.cost}</td>
                                                    <td className="px-8 py-4 text-center">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${row.is_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                                                            {row.is_paid ? 'PAID' : 'PENDING'}
                                                        </span>
                                                        {row.payment_date && <div className="text-[10px] text-slate-400 mt-1">{row.payment_date}</div>}
                                                    </td>
                                                    <td className="px-8 py-4 text-right">
                                                        {!row.is_paid && (
                                                            <button
                                                                onClick={() => markAsPaid(row.file_id)}
                                                                className="text-[10px] font-bold bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-700 transition-colors"
                                                            >
                                                                Mark Paid
                                                            </button>
                                                        )}
                                                    </td>
                                                </>
                                            )}
                                            {activeTab === 'inventory' && (
                                                <>
                                                    <td className="px-8 py-4 font-bold text-indigo-600">{row.box_label}</td>
                                                    <td className="px-8 py-4 font-mono text-xs">{row.location}</td>
                                                    <td className="px-8 py-4">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${row.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                                            {row.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${row.utilization_pct}%` }}></div>
                                                            </div>
                                                            <span className="text-xs font-bold">{row.files_stored}/{row.capacity}</span>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                            {activeTab === 'audit' && (
                                                <>
                                                    <td className="px-8 py-4 whitespace-nowrap font-mono text-xs">{row.timestamp}</td>
                                                    <td className="px-8 py-4 font-bold text-slate-800">{row.user}</td>
                                                    <td className="px-8 py-4">
                                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider">{row.action}</span>
                                                    </td>
                                                    <td className="px-8 py-4 text-slate-500">{row.details}</td>
                                                </>
                                            )}
                                            {activeTab === 'clinical' && (
                                                <>
                                                    <td className="px-8 py-4 whitespace-nowrap">{row.upload_date}</td>
                                                    <td className="px-8 py-4 font-bold text-slate-800">{row.patient_name}</td>
                                                    <td className="px-8 py-4 text-indigo-600 font-medium">{row.filename}</td>
                                                    <td className="px-8 py-4">
                                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-[10px] font-black uppercase border border-indigo-100">
                                                            {row.tags}
                                                        </span>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="h-96 flex flex-col items-center justify-center text-slate-300">
                            <FileText size={48} className="mb-4 text-slate-200" />
                            <p className="font-bold">No Records Found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
