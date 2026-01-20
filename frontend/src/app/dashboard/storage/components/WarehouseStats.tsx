
import React from 'react';
import { Package, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

const WarehouseStats = ({ stats }: { stats: { totalFiles: number, capacity: number, utilization: number, pending: number } }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {/* Capacity Card */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Package size={20} />
                </div>
                <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Files</p>
                    <h3 className="text-lg font-black text-slate-800">{stats?.totalFiles || 0}</h3>
                </div>
            </div>

            {/* Utilization Card */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle2 size={20} />
                </div>
                <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Utilization</p>
                    <h3 className="text-lg font-black text-slate-800">{stats?.utilization || 0}%</h3>
                </div>
            </div>

            {/* Pending Requests */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <FileText size={20} />
                </div>
                <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Retrievals</p>
                    <h3 className="text-lg font-black text-slate-800">{stats?.pending || 0} Pending</h3>
                </div>
            </div>

            {/* Alerts */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                    <AlertTriangle size={20} />
                </div>
                <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">System Alerts</p>
                    <h3 className="text-lg font-black text-slate-800">No Issues</h3>
                </div>
            </div>
        </div>
    );
};

export default WarehouseStats;
