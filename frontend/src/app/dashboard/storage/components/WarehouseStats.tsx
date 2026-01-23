
import React from 'react';
import { Package, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

const WarehouseStats = ({ stats }: { stats: { totalFiles: number, capacity: number, utilization: number, pending: number, scannedToday: number, openBoxes: number } }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {/* Capacity Card */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Package size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">Total Files / Boxes</p>
                    <h3 className="text-lg font-black text-slate-800 leading-tight">
                        {stats?.totalFiles || 0} <span className="text-[10px] text-slate-400 font-bold">/ {stats?.openBoxes || 0} Open</span>
                    </h3>
                </div>
            </div>

            {/* Utilization Card */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle2 size={20} />
                </div>
                <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Scanned Today</p>
                    <h3 className="text-lg font-black text-slate-800">{stats?.scannedToday || 0}</h3>
                </div>
            </div>

            {/* Pending Requests */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <FileText size={20} />
                </div>
                <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Retrieval Req</p>
                    <h3 className="text-lg font-black text-slate-800">{stats?.pending || 0} Pending</h3>
                </div>
            </div>

            {/* Storage Utilization */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Utilization</p>
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-slate-800">{stats?.utilization || 0}%</h3>
                        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats?.utilization || 0}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WarehouseStats;
