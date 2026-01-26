
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '../../../config/api';

// Components
import WarehouseStats from './components/WarehouseStats';
import WarehouseMap from './components/WarehouseMap';
import WarehouseSearch from './components/WarehouseSearch';
import BulkScanner from './components/BulkScanner';
import FileTracker from './components/FileTracker';
import FileRequestManager from './components/FileRequestManager';
import RackManager from './components/RackManager';
import ArchivedFilesList from './components/ArchivedFilesList';
import LabelGenerator from './components/LabelGenerator';

// Icons
import { LayoutGrid, List, Scan, ArrowLeftRight, History, Printer, PackageSearch } from 'lucide-react';

export default function WarehousePage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('map');
    const [userRole, setUserRole] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Data State
    const [warehouseData, setWarehouseData] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [racks, setRacks] = useState<any[]>([]);
    const [boxes, setBoxes] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalFiles: 0, capacity: 0, utilization: 0, pending: 0, scannedToday: 0, openBoxes: 0 });

    const fetchAllData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const [layoutRes, logsRes, racksRes, boxesRes, reqsRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/storage/layout`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/storage/logs`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/storage/racks`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/storage/boxes`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/storage/requests`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/stats/dashboard`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            if (layoutRes.ok) setWarehouseData(await layoutRes.json());
            if (logsRes.ok) setLogs(await logsRes.json());

            let allBoxes: any[] = [];
            if (boxesRes.ok) {
                allBoxes = await boxesRes.json();
                setBoxes(allBoxes);
            }
            if (racksRes.ok) setRacks(await racksRes.json());

            // Calc Stats
            // allBoxes is already parsed, use it directly
            const totalFiles = allBoxes.reduce((acc: any, box: any) => acc + (box.patient_count || 0), 0);
            const openBoxes = allBoxes.filter((b: any) => b.status === "OPEN").length;
            const capacity = allBoxes.reduce((acc: any, box: any) => acc + (box.capacity || 0), 0);
            const utilization = capacity > 0 ? Math.round((totalFiles / capacity) * 100) : 0;

            let pending = 0;
            if (reqsRes.ok) {
                const reqs = await reqsRes.json();
                pending = reqs.filter((r: any) => ['Pending', 'Pending Approval'].includes(r.status)).length;
            }

            let scannedToday = 0;
            if (statsRes.ok) {
                const dash = await statsRes.json();
                scannedToday = dash?.requests?.todays_scans || 0;
            }

            setStats({ totalFiles, capacity, utilization, pending, scannedToday, openBoxes });

        } catch (e) {
            console.error("Sync Error", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUserRole(payload.role || '');
            fetchAllData();
        } catch (e) { console.error(e); }
    }, [router]);

    // Navigation Helper
    const handleNavigateToBox = (boxId: number) => {
        // Switch to manager view and ideally highlight box?
        // For now, simple switch
        setActiveTab('manager');
        alert(`Navigating to Box #${boxId} (Please find in Rack Manager for now)`);
    };

    // Tabs Config
    const MAIN_TABS = [
        { id: 'map', label: 'Visual Map', icon: LayoutGrid },
        { id: 'manager', label: 'Rack Manager', icon: List },
        { id: 'bulk', label: 'Bulk Scanner', icon: Scan },
        { id: 'requests', label: 'Requests', icon: PackageSearch },
        { id: 'scanner', label: 'Check-In/Out', icon: ArrowLeftRight },
        { id: 'logs', label: 'History', icon: History },
        { id: 'generator', label: 'Labels', icon: Printer },
    ];

    return (
        <div className="bg-slate-50 min-h-screen p-4 md:p-6 font-sans text-slate-900 pb-24">

            {/* Header Area */}
            <div className="w-full mx-auto space-y-6">

                {/* 1. Stats & Search Row */}
                <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
                    <div className="w-full xl:w-auto">
                        <WarehouseStats stats={stats} />
                    </div>
                    <div className="w-full xl:w-1/3">
                        <WarehouseSearch onNavigateToBox={handleNavigateToBox} />
                    </div>
                </div>

                {/* 2. Navigation Tabs */}
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex overflow-x-auto no-scrollbar gap-2">
                    {MAIN_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 3. Main Content Stage */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'map' && (
                        <WarehouseMap data={warehouseData} onSelectRack={(id) => { setActiveTab('manager'); }} />
                    )}

                    {activeTab === 'manager' && (
                        <RackManager racks={racks} boxes={boxes} refreshData={fetchAllData} />
                    )}

                    {activeTab === 'bulk' && (
                        <BulkScanner boxes={boxes} refreshData={fetchAllData} />
                    )}

                    {activeTab === 'requests' && <FileRequestManager />}

                    {activeTab === 'scanner' && <FileTracker refreshLogs={fetchAllData} />}

                    {activeTab === 'generator' && <LabelGenerator />}

                    {activeTab === 'logs' && (
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
                            <h2 className="text-2xl font-black text-slate-800 mb-6">Movement History</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Action</th>
                                            <th className="px-6 py-4">Patient</th>
                                            <th className="px-6 py-4">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {logs.map((log: any) => (
                                            <tr key={log.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${log.type === 'CHECK-IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {log.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-700">{log.name}</td>
                                                <td className="px-6 py-4 text-xs font-mono text-slate-400">{log.time}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
