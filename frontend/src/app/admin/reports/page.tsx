"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL, apiFetch } from '../../../config/api';
import { Boxes, ShieldAlert, Download, RefreshCw, FileText, Stethoscope, Calendar, Building2, Filter, Search, ArrowUpDown, BarChart3, Receipt, FileDown, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PrintableReport from '../../../components/reports/PrintableReport';
import toast from 'react-hot-toast';

export default function ReportsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('clinical'); // clinical, inventory, audit
    const [isAuthorized, setIsAuthorized] = useState(false);
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
    
    // PDF Generation Ref
    const printRef = useRef<HTMLDivElement>(null);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

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
        const storedRole = localStorage.getItem('userRole') || '';
        if (!storedRole) {
            router.push('/login');
            return;
        }

        setUserRole(storedRole);
        setIsAuthorized(true);

        if (storedRole === 'superadmin' || storedRole === 'superadmin_staff') {
            fetchHospitals();
        }
    }, [router]);

    const fetchHospitals = async () => {
        try {
            const data = await apiFetch(`hospitals/`);
            if (data) setHospitals(data);
        } catch (e) { console.error(e); }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (selectedHospital) params.append('hospital_id', selectedHospital);
            if (searchQuery) params.append('search', searchQuery);

            const resData = await apiFetch(`reports/${activeTab}?${params.toString()}`);
            if (resData) {
                if (activeTab === 'clinical') {
                    setData(resData.details || resData.data);
                    setSummary(resData.summary);
                } else {
                    setData(resData);
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
    }, [activeTab, selectedHospital]);

    const applyFilters = () => {
        fetchReport();
    };

    const handleExportCSV = async () => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (selectedHospital) params.append('hospital_id', selectedHospital);
        if (searchQuery) params.append('search', searchQuery);
        params.append('export_csv', 'true');

        try {
            const res = await fetch(`${API_URL}/reports/${activeTab}?${params.toString()}`, {
                credentials: 'include'
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
                toast.error("CSV Export Failed");
            }
        } catch (e) {
            toast.error("Export Error");
        }
    };

    const handleExportPDF = async () => {
        if (!printRef.current) return;
        setIsExportingPDF(true);
        
        try {
            // Give react time to render the hidden component with data
            await new Promise((resolve) => setTimeout(resolve, 300));
            
            const element = printRef.current;
            const canvas = await html2canvas(element, {
                scale: 2, // High resolution
                useCORS: true,
                logging: false,
                windowWidth: 1000
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            // A4 page dimensions in mm
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            let heightLeft = pdfHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();

            while (heightLeft >= 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }

            pdf.save(`${activeTab}_report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("PDF Export failed:", error);
            toast.error("Failed to generate PDF");
        } finally {
            setIsExportingPDF(false);
        }
    };

    if (!isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <RefreshCw className="animate-spin text-indigo-600" size={40} />
            </div>
        );
    }

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <div className="min-h-screen bg-slate-50 relative font-sans">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-0">

                {/* Header */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-3">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <span className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                                <FileText size={32} />
                            </span>
                            Report Builder
                        </h1>
                        <p className="text-slate-500 font-medium ml-[4.5rem] mt-1">Generate professional analytical and financial reports</p>
                    </div>

                    {/* Report Filters */}
                    <div className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex-wrap">
                        {/* Search Input */}
                        <div className="relative flex-1 md:flex-none md:w-48">
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
                                    className="pl-10 pr-8 py-3 bg-slate-50 rounded-xl font-bold text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 border-none w-full md:w-48 appearance-none cursor-pointer"
                                >
                                    <option value="">Global (All Clients)</option>
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
                                className="pl-10 pr-4 py-3 bg-slate-50 rounded-xl font-bold text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 border-none cursor-pointer"
                            />
                        </div>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3.5 text-slate-400" size={16} />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="pl-10 pr-4 py-3 bg-slate-50 rounded-xl font-bold text-sm text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 border-none cursor-pointer"
                            />
                        </div>

                        <button
                            onClick={applyFilters}
                            className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-100 transition-colors"
                        >
                            <Filter size={16} /> Apply
                        </button>
                    </div>
                </div>

                {/* Tabs & Export Buttons */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                    <div className="flex gap-3 overflow-x-auto pb-2 w-full lg:w-auto">
                        <button
                            onClick={() => setActiveTab('clinical')}
                            className={`px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wide flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === 'clinical' ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-100/50 ring-1 ring-indigo-50' : 'bg-slate-100/50 text-slate-400 hover:bg-slate-200/50'}`}
                        >
                            <Stethoscope size={18} /> Patient Analytics
                        </button>
                        
                        
                        {(userRole === 'superadmin' || userRole === 'superadmin_staff') && (
                            <button
                                onClick={() => setActiveTab('inventory')}
                                className={`px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wide flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === 'inventory' ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-100/50 ring-1 ring-indigo-50' : 'bg-slate-100/50 text-slate-400 hover:bg-slate-200/50'}`}
                            >
                                <Boxes size={18} /> Inventory Status
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('audit')}
                            className={`px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wide flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === 'audit' ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-100/50 ring-1 ring-indigo-50' : 'bg-slate-100/50 text-slate-400 hover:bg-slate-200/50'}`}
                        >
                            <ShieldAlert size={18} /> Audit Logs
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleExportCSV}
                            className="bg-white text-slate-600 px-5 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all border border-slate-200"
                        >
                            <FileDown size={18} /> CSV
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={isExportingPDF || loading || !data || data.length === 0}
                            className="bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExportingPDF ? <RefreshCw className="animate-spin" size={18} /> : <Download size={18} />} 
                            Export PDF
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="mb-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Object.entries(summary).slice(0, 4).map(([key, value]: any, idx) => (
                                <div key={key} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{key.replace(/_/g, ' ')}</p>
                                    <h3 className={`text-4xl font-black text-indigo-600`}>
                                        {value}
                                    </h3>
                                </div>
                            ))}
                        </div>

                        {/* Charts Section */}
                        {activeTab === 'clinical' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                                        <BarChart3 className="text-indigo-600" size={20} /> Monthly Admissions
                                    </h3>
                                    <div className="h-64">
                                        {data && data.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={
                                                    (() => {
                                                        const rawData = data.reduce((acc: any, curr: any) => {
                                                            if (!curr.admission_date) {
                                                                acc['Unknown'] = (acc['Unknown'] || 0) + 1;
                                                                return acc;
                                                            }
                                                            const parts = curr.admission_date.split('/'); // DD/MM/YYYY
                                                            if (parts.length === 3) {
                                                                const monthYear = `${parts[2]}-${parts[1]}`; // YYYY-MM
                                                                acc[monthYear] = (acc[monthYear] || 0) + 1;
                                                            } else {
                                                                acc['Unknown'] = (acc['Unknown'] || 0) + 1;
                                                            }
                                                            return acc;
                                                        }, {});
                                                        
                                                        return Object.entries(rawData).map(([key, count]) => {
                                                            if (key === 'Unknown') return { name: key, count, sortKey: '9999-99' };
                                                            const [year, month] = key.split('-');
                                                            const dateObj = new Date(parseInt(year), parseInt(month) - 1);
                                                            return { 
                                                                name: `${dateObj.toLocaleString('default', { month: 'short' })} ${year}`, 
                                                                count, 
                                                                sortKey: key 
                                                            };
                                                        }).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
                                                    })()
                                                }>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                                                    <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={30} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data</div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                                        <PieChartIcon className="text-indigo-600" size={20} /> Top Categories
                                    </h3>
                                    <div className="h-64">
                                        {summary ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={Object.entries(summary).slice(0, 5).map(([name, value]) => ({ name, value }))}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {Object.entries(summary).slice(0, 5).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                                                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Data Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                    {loading ? (
                        <div className="h-96 flex flex-col items-center justify-center text-indigo-400 gap-4 font-bold animate-pulse">
                            <RefreshCw className="animate-spin" size={32} /> Loading Report Data...
                        </div>
                    ) : (data && data.length > 0) ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        {activeTab === 'inventory' && (
                                            <>
                                                <th className="px-6 py-4">Box Label</th>
                                                <th className="px-6 py-4">Location</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Utilization</th>
                                            </>
                                        )}
                                        {activeTab === 'audit' && (
                                            <>
                                                <th className="px-6 py-4">Time</th>
                                                <th className="px-6 py-4">User</th>
                                                <th className="px-6 py-4">Action</th>
                                                <th className="px-6 py-4">Details</th>
                                            </>
                                        )}
                                        {activeTab === 'clinical' && (
                                            <>
                                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('patient_name')}>
                                                    <div className="flex items-center gap-2">Name <ArrowUpDown size={12} className="text-slate-300 group-hover:text-indigo-400" /></div>
                                                </th>
                                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('patient_id')}>
                                                    <div className="flex items-center gap-2">ID <ArrowUpDown size={12} className="text-slate-300 group-hover:text-indigo-400" /></div>
                                                </th>
                                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleSort('admission_date')}>
                                                    <div className="flex items-center gap-2">Admission <ArrowUpDown size={12} className="text-slate-300 group-hover:text-indigo-400" /></div>
                                                </th>
                                                <th className="px-6 py-4">File</th>
                                                <th className="px-6 py-4">Tags</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-medium text-sm text-slate-600">
                                    {(activeTab === 'clinical' ? sortedData : data).map((row: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            {activeTab === 'inventory' && (
                                                <>
                                                    <td className="px-6 py-4 font-black text-indigo-600">{row.box_label}</td>
                                                    <td className="px-6 py-4 font-mono text-xs">{row.location}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${row.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                                            {row.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${row.utilization_pct}%` }}></div>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-500">{row.files_stored}/{row.capacity}</span>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                            {activeTab === 'audit' && (
                                                <>
                                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500">{row.timestamp}</td>
                                                    <td className="px-6 py-4 font-bold text-slate-800">{row.user}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">{row.action}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 text-xs">{row.details}</td>
                                                </>
                                            )}
                                            {activeTab === 'clinical' && (
                                                <>
                                                    <td className="px-6 py-4 font-bold text-slate-800">{row.patient_name}</td>
                                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{row.patient_id}</td>
                                                    <td className="px-6 py-4 text-xs whitespace-nowrap">{row.admission_date || '-'}</td>
                                                    <td className="px-6 py-4">
                                                        <Link
                                                            href={`/records?search=${row.patient_id}`}
                                                            className="text-indigo-600 font-bold hover:underline flex items-center gap-1 truncate max-w-[150px]"
                                                            title={row.filename}
                                                        >
                                                            {row.filename}
                                                        </Link>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-indigo-100">
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
                            <div className="p-6 bg-slate-50 rounded-full mb-4">
                                <FileText size={48} className="text-slate-200" />
                            </div>
                            <p className="font-bold text-lg text-slate-400">No Records Found</p>
                            <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or selecting a different date range.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Hidden Printable Report for PDF Export */}
            <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
                {data && (
                    <PrintableReport
                        ref={printRef}
                        reportType={activeTab}
                        data={activeTab === 'clinical' ? sortedData : data}
                        summary={summary}
                        dateRange={{ start: startDate, end: endDate }}
                        hospitalName={selectedHospital ? hospitals.find(h => h.hospital_id.toString() === selectedHospital)?.legal_name : undefined}
                        generatedBy={localStorage.getItem('userEmail') || 'Admin User'}
                    />
                )}
            </div>
        </div>
    );
}
