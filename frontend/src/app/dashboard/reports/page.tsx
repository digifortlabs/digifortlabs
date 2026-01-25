"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_URL } from '../../../config/api';
import { Boxes, ShieldAlert, Download, RefreshCw, FileText, Stethoscope, Calendar, Building2, Filter, Search, ArrowUpDown } from 'lucide-react';

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('clinical'); // inventory, audit, clinical
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<any>(null);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedHospital, setSelectedHospital] = useState('');

    // Admin State
    const [userRole, setUserRole] = useState('');
    const [hospitals, setHospitals] = useState<any[]>([]);

    // Sorting
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = React.useMemo(() => {
        if (!data) return [];
        if (!sortConfig) return data;

        return [...data].sort((a, b) => {
            const aValue = a[sortConfig.key] || '';
            const bValue = b[sortConfig.key] || '';

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [data, sortConfig]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role || '');
                if (payload.role === 'superadmin') {
                    fetchHospitals(token);
                }
            } catch (e) { console.error(e); }
        }
    }, []);

    const fetchHospitals = async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/hospitals/`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setHospitals(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchReport = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (selectedHospital) params.append('hospital_id', selectedHospital);
            if (searchQuery) params.append('search', searchQuery);

            const res = await fetch(`${API_URL}/reports/${activeTab}?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                if (activeTab === 'clinical') {
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
    }, [activeTab, selectedHospital]); // Auto-refresh on tab/hospital change.

    const applyFilters = () => {
        fetchReport();
    };

    const handleExport = async () => {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (selectedHospital) params.append('hospital_id', selectedHospital);
        if (searchQuery) params.append('search', searchQuery);
        params.append('export_csv', 'true');

        try {
            const res = await fetch(`${API_URL}/reports/${activeTab}?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert("Export Failed");
            }
        } catch (e) {
            alert("Export Error");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 relative font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Header */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <span className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                                <FileText size={32} />
                            </span>
                            Reports Center
                        </h1>
                        <p className="text-slate-500 font-medium ml-[4.5rem] mt-1">Export analytical data for clinical and auditing</p>
                    </div>

                    {/* Report Filters */}
                    <div className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex-wrap">
                        {/* Search Input */}
                        <div className="relative flex-1 md:flex-none md:w-64">
                            <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl font-bold text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 border-none"
                            />
                        </div>

                        {userRole === 'superadmin' && (
                            <div className="relative">
                                <Building2 className="absolute left-3 top-3.5 text-slate-400" size={16} />
                                <select
                                    value={selectedHospital}
                                    onChange={(e) => setSelectedHospital(e.target.value)}
                                    className="pl-10 pr-4 py-3 bg-slate-50 rounded-xl font-bold text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 border-none w-full md:w-48 appearance-none"
                                >
                                    <option value="">All Hospitals</option>
                                    {hospitals.map(h => (
                                        <option key={h.hospital_id} value={h.hospital_id}>{h.legal_name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="relative">
                            <Calendar className="absolute left-3 top-3.5 text-slate-400" size={16} />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="pl-10 pr-4 py-3 bg-slate-50 rounded-xl font-bold text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 border-none"
                            />
                        </div>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3.5 text-slate-400" size={16} />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="pl-10 pr-4 py-3 bg-slate-50 rounded-xl font-bold text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 border-none"
                            />
                        </div>

                        <button
                            onClick={applyFilters}
                            className="bg-indigo-50 text-indigo-600 px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-100 transition-colors"
                        >
                            <Filter size={16} /> Apply
                        </button>

                        <div className="w-[1px] bg-slate-200 mx-1 hidden md:block"></div>

                        <button
                            onClick={handleExport}
                            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                        >
                            <Download size={20} /> Export
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
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

                {/* Summary Card (Clinical Only) */}
                {summary && (activeTab === 'clinical') && (
                    <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4">
                        {Object.entries(summary).slice(0, 3).map(([key, value]: any) => (
                            <div key={key} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{key}</p>
                                <h3 className="text-3xl font-black text-indigo-600">{value}</h3>
                            </div>
                        ))}
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
                                        {activeTab === 'inventory' && (
                                            <>
                                                <th className="px-4 py-3">Box Label</th>
                                                <th className="px-4 py-3">Location</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Utilization</th>
                                            </>
                                        )}
                                        {activeTab === 'audit' && (
                                            <>
                                                <th className="px-4 py-3">Time</th>
                                                <th className="px-4 py-3">User</th>
                                                <th className="px-4 py-3">Action</th>
                                                <th className="px-4 py-3">Details</th>
                                            </>
                                        )}
                                        {activeTab === 'clinical' && (
                                            <>
                                                <th className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('patient_name')}>
                                                    <div className="flex items-center gap-1">Name <ArrowUpDown size={12} className="text-slate-300" /></div>
                                                </th>
                                                <th className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('patient_id')}>
                                                    <div className="flex items-center gap-1">ID <ArrowUpDown size={12} className="text-slate-300" /></div>
                                                </th>
                                                <th className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('admission_date')}>
                                                    <div className="flex items-center gap-1">Admission <ArrowUpDown size={12} className="text-slate-300" /></div>
                                                </th>
                                                <th className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('discharge_date')}>
                                                    <div className="flex items-center gap-1">Discharge <ArrowUpDown size={12} className="text-slate-300" /></div>
                                                </th>
                                                <th className="px-4 py-3">File</th>
                                                <th className="px-4 py-3">Tags</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-sm text-slate-600">
                                    {(activeTab === 'clinical' ? sortedData : data).map((row: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            {activeTab === 'inventory' && (
                                                <>
                                                    <td className="px-4 py-3 font-bold text-indigo-600">{row.box_label}</td>
                                                    <td className="px-4 py-3 font-mono text-xs">{row.location}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${row.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                                            {row.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-24">
                                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${row.utilization_pct}%` }}></div>
                                                            </div>
                                                            <span className="text-[10px] font-bold">{row.files_stored}/{row.capacity}</span>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                            {activeTab === 'audit' && (
                                                <>
                                                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{row.timestamp}</td>
                                                    <td className="px-4 py-3 font-bold text-slate-800">{row.user}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">{row.action}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-500 text-xs">{row.details}</td>
                                                </>
                                            )}
                                            {activeTab === 'clinical' && (
                                                <>
                                                    <td className="px-4 py-3 font-bold text-slate-800">{row.patient_name}</td>
                                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.patient_id}</td>
                                                    <td className="px-4 py-3 text-xs whitespace-nowrap">{row.admission_date || '-'}</td>
                                                    <td className="px-4 py-3 text-xs whitespace-nowrap">{row.discharge_date || '-'}</td>
                                                    <td className="px-4 py-3">
                                                        <Link
                                                            href={`/dashboard/records?search=${row.patient_id}`}
                                                            className="text-indigo-600 font-medium hover:underline flex items-center gap-1 truncate max-w-[150px]"
                                                            title={row.filename}
                                                        >
                                                            {row.filename}
                                                        </Link>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-indigo-100">
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
