
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '../../../config/api';

// Shared Layout
import WarehouseSidebar from './components/WarehouseSidebar';
import WarehouseStats from './components/WarehouseStats';

// Tab Components
import AisleGrid from './components/AisleGrid';
import BulkScanner from './components/BulkScanner';
import FileTracker from './components/FileTracker';
import LabelGenerator from './components/LabelGenerator';
import RackManager from './components/RackManager';

import { History } from 'lucide-react';

export default function WarehousePage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('warehouse');
    const [userRole, setUserRole] = useState('');

    // Global Data State
    const [warehouseData, setWarehouseData] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [racks, setRacks] = useState<any[]>([]);
    const [boxes, setBoxes] = useState<any[]>([]);

    const [stats, setStats] = useState({ totalFiles: 0, capacity: 0, utilization: 0, pending: 0 });

    const fetchAllData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const [layoutRes, logsRes, racksRes, boxesRes, reqsRes] = await Promise.all([
                fetch(`${API_URL}/storage/layout`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/storage/logs`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/storage/racks`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/storage/boxes`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/storage/requests`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            if (layoutRes.ok) setWarehouseData(await layoutRes.json());
            if (logsRes.ok) setLogs(await logsRes.json());

            let allBoxes: any[] = [];
            if (boxesRes.ok) {
                allBoxes = await boxesRes.json();
                setBoxes(allBoxes);
            }

            if (racksRes.ok) setRacks(await racksRes.json());

            // Calculate Stats
            const totalFiles = allBoxes.reduce((acc, box) => acc + (box.patient_count || 0), 0);
            const capacity = allBoxes.reduce((acc, box) => acc + (box.capacity || 0), 0);
            const utilization = capacity > 0 ? Math.round((totalFiles / capacity) * 100) : 0;

            let pending = 0;
            if (reqsRes.ok) {
                const allReqs = await reqsRes.json();
                pending = allReqs.filter((r: any) => ['Pending', 'Pending Approval'].includes(r.status)).length;
            }

            setStats({ totalFiles, capacity, utilization, pending });

        } catch (e) {
            console.error("Data Sync Error", e);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUserRole(payload.role || '');
            fetchAllData();
        } catch (e) {
            console.error(e);
        }
    }, [router]);


    return (
        <div className="flex bg-slate-100 min-h-screen p-2 sm:p-4 gap-4 sm:gap-6 font-sans text-slate-900 pb-24 lg:pb-4">
            {/* 1. Sidebar */}
            <WarehouseSidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} />

            {/* 2. Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0">

                {/* 3. Global Stats Header (Always Visible) */}
                <WarehouseStats stats={stats} />

                {/* 4. Dynamic Content */}
                <div className="flex-1 ">
                    {activeTab === 'warehouse' && <AisleGrid data={warehouseData} />}

                    {activeTab === 'bulk' && (
                        <BulkScanner boxes={boxes} refreshData={fetchAllData} />
                    )}

                    {activeTab === 'scanner' && (
                        <FileTracker refreshLogs={fetchAllData} />
                    )}

                    {activeTab === 'generator' && (
                        <LabelGenerator />
                    )}

                    {activeTab === 'logs' && (
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">Movement History</h2>
                                    <p className="text-slate-400 text-sm font-medium">Tracking all physical file check-ins and check-outs.</p>
                                </div>
                                <button onClick={fetchAllData} className="bg-white p-2 rounded-xl text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-200">
                                    <History size={20} />
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-8 py-4">Type</th>
                                            <th className="px-8 py-4">Patient / UHID</th>
                                            <th className="px-8 py-4">Destination</th>
                                            <th className="px-8 py-4">Timestamp</th>
                                            <th className="px-8 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {logs.map((log: any) => (
                                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${log.type === 'CHECK-IN' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"
                                                        }`}>
                                                        {log.type}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="font-bold text-slate-800 text-sm">{log.name}</p>
                                                    <p className="text-xs font-mono text-slate-400">{log.uhid}</p>
                                                </td>
                                                <td className="px-8 py-6 text-sm font-medium text-slate-600">{log.dest}</td>
                                                <td className="px-8 py-6 text-xs text-slate-400 font-medium">{new Date(log.time).toLocaleString()}</td>
                                                <td className="px-8 py-6 text-emerald-600 font-bold text-xs uppercase">Success</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'manager' && (
                        <RackManager racks={racks} boxes={boxes} refreshData={fetchAllData} />
                    )}
                </div>

                <div className="mt-8 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    Digifort Labs Warehouse Control System v3.2
                </div>
            </main>
        </div>
    );
}
