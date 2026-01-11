"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '../../config/api';
import {
    Activity,
    Server,
    Database,
    AlertTriangle,
    ShieldCheck,
    FileText,
    Users,
    HardDrive,
    Clock,
    ArrowUpRight,
    TrendingUp,
    AlertOctagon,
    RefreshCcw,
    CheckCircle2,
    XCircle,
    Eye,
    ScanLine
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function CommandCenter() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [warehouseCapacity, setWarehouseCapacity] = useState(0);
    const [systemHealth, setSystemHealth] = useState('good');
    const [qaIssues, setQaIssues] = useState<any[]>([]);
    const [showQaModal, setShowQaModal] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<any>(null);
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        // Simulations and Fetching
        const token = localStorage.getItem('token');
        if (!token) return router.push('/login');

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            // Ensure lowercase for consistent checks
            const role = (payload.role || '').toLowerCase();
            setUserRole(role);
        } catch (e) {
            console.error("Failed to parse token", e);
        }

        // Fetch Real Dashboard Stats
        fetch(`${API_URL}/stats/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                if (res.status === 401) {
                    localStorage.removeItem('token');
                    router.push('/login');
                    throw new Error("Unauthorized");
                }
                if (!res.ok) throw new Error("Failed to fetch stats");
                return res.json();
            })
            .then(data => {
                setStats(data);
                setWarehouseCapacity(data.warehouse ? data.warehouse.capacity_pct : 0);
                setSystemHealth(data.system ? data.system.health : 'Unknown');

                // Set Real QA Issues from Backend
                if (data.qa_issues) {
                    setQaIssues(data.qa_issues);
                }
            })
            .catch(err => console.error("Stats Fetch Error:", err));

        // Removed Simulation - Now using Real Backend Data
    }, []);

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen pb-20">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Activity className="text-indigo-600" /> Control Command Center
                    </h1>
                    <p className="text-slate-500 font-medium">Real-time system monitoring and integrity oversight.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-indigo-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-indigo-100">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Live Stream</span>
                    </div>
                    <div className="bg-emerald-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-emerald-100">
                        <ShieldCheck className="text-emerald-600 w-4 h-4" />
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">System Optimal</span>
                    </div>
                </div>
            </div>

            {/* Top Metrics Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${userRole === 'website_admin' ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-6 mb-8`}>

                {/* Super Admin Only Metrics */}
                {userRole === 'website_admin' && (
                    <>
                        <MetricCard
                            label="API Latency"
                            value={stats?.system?.uptime || "99%"}
                            trend="Optimal"
                            trendUp={true}
                            icon={<Server size={20} />}
                            color="blue"
                        />
                        <MetricCard
                            label="Network Load"
                            value={stats?.system?.network_load || "512 MB/s"}
                            trend="Normal"
                            trendUp={true}
                            icon={<Activity size={20} />}
                            color="cyan"
                        />
                    </>
                )}

                <MetricCard
                    label={userRole === 'website_admin' ? "Active Users" : userRole === 'mrd_staff' ? "Pending Requests" : "Total Patients"}
                    value={userRole === 'mrd_staff' ? (stats?.requests?.pending || 0) : (stats?.users?.total || 0)}
                    trend={userRole === 'mrd_staff' ? "Urgent" : (stats?.users?.trend || "+0%")}
                    trendUp={userRole === 'mrd_staff' ? (stats?.requests?.pending > 0) : true}
                    icon={userRole === 'mrd_staff' ? <FileText size={20} /> : <Users size={20} />}
                    color={userRole === 'mrd_staff' ? 'amber' : 'indigo'}
                />
                <MetricCard
                    label={userRole === 'mrd_staff' ? "Today's Scans" : "Storage Usage"}
                    value={userRole === 'mrd_staff' ? (stats?.requests?.todays_scans || 0) : (stats?.storage?.usage || "0 GB")}
                    trend={userRole === 'mrd_staff' ? "New" : (stats?.storage?.trend || "+0%")}
                    trendUp={true}
                    icon={userRole === 'mrd_staff' ? <ScanLine size={20} /> : <HardDrive size={20} />}
                    color="emerald"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Main Activity Feed / Chart */}
                <div className="xl:col-span-2 space-y-8">

                    {/* Activity Chart */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">
                                    {userRole === 'website_admin' ? 'System Traffic' : 'Patient Registration Activity'}
                                </h3>
                                <p className="text-slate-400 font-medium text-sm">Real-time data stream</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors">Daily</button>
                                <button className="px-4 py-2 bg-indigo-50 rounded-xl text-xs font-bold text-indigo-600 border border-indigo-100">Weekly</button>
                            </div>
                        </div>
                        <div className="h-64 w-full bg-white rounded-2xl flex items-center justify-center border border-slate-100 p-2 min-h-[256px]">
                            <div className="w-full h-full" style={{ minWidth: 100 }}>
                                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                    <AreaChart data={stats?.traffic_data || []}>
                                        <defs>
                                            <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                            interval={3}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#4f46e5"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorTraffic)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Recent Alerts (Real) */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Recent Activity & Alerts</h3>
                        <div className="space-y-4">
                            {stats?.recent_activity?.length > 0 ? (
                                stats.recent_activity.map((log: any) => (
                                    <AlertItem
                                        key={log.id}
                                        type={log.action.includes('FAIL') || log.action.includes('ERROR') ? 'error' : log.action.includes('WARN') ? 'warning' : 'info'}
                                        title={log.action.replace('_', ' ')}
                                        time={log.time}
                                        desc={log.details}
                                    />
                                ))
                            ) : (
                                <p className="text-slate-400 text-sm italic">No recent activity logged.</p>
                            )}
                        </div>
                    </div>

                </div>

                {/* Right Column: QA & Quick Actions */}
                <div className="space-y-8">

                    {/* QA / Missing Page Monitor (Super Admin Only) */}
                    {userRole === 'website_admin' && (
                        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black flex items-center gap-2">
                                        <ScanLine className="text-indigo-400" />
                                        QA Monitor
                                    </h3>
                                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase">2 Issues</span>
                                </div>

                                <div className="space-y-4">
                                    {qaIssues.map(issue => (
                                        <div key={issue.id} className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-red-400 text-[10px] font-black uppercase tracking-wider bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                                    {issue.issue}
                                                </span>
                                                <span className="text-slate-400 text-[10px]">{issue.timestamp}</span>
                                            </div>
                                            <p className="font-bold text-sm mb-3 truncate">{issue.file}</p>
                                            <button
                                                onClick={() => { setSelectedIssue(issue); setShowQaModal(true); }}
                                                className="w-full bg-white text-slate-900 py-2 rounded-lg text-xs font-black uppercase tracking-wide hover:bg-indigo-50 transition-colors"
                                            >
                                                Review Scan
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-600 rounded-full blur-[80px] opacity-50"></div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Quick Actions</h3>

                        {/* Admin Only Actions */}
                        {userRole === 'website_admin' && (
                            <div className="grid grid-cols-2 gap-4">
                                <ActionButton
                                    icon={<RefreshCcw size={18} />}
                                    label="Clear Cache"
                                    onClick={() => alert("Cache Cleared")}
                                />
                                <ActionButton
                                    icon={<Database size={18} />}
                                    label="Backup DB"
                                    onClick={() => alert("Backup Started")}
                                />
                                <ActionButton
                                    icon={<ShieldCheck size={18} />}
                                    label="Audit Logs"
                                    onClick={() => router.push('/dashboard/audit')}
                                />
                                <ActionButton
                                    icon={<Users size={18} />}
                                    label="User Mgmt"
                                    onClick={() => router.push('/dashboard/user_mgmt')}
                                />
                            </div>
                        )}

                        {/* Hospital Actions */}
                        {(userRole === 'hospital_admin' || userRole === 'mrd_staff') && (
                            <div className="grid grid-cols-2 gap-4">
                                {/* MRD Custom Actions */}
                                {userRole === 'mrd_staff' ? (
                                    <>
                                        <ActionButton
                                            icon={<ScanLine size={18} />}
                                            label="Digitize Records"
                                            onClick={() => router.push('/dashboard/records/upload')}
                                        />
                                        <ActionButton
                                            icon={<Users size={18} />}
                                            label="Search Patient"
                                            onClick={() => router.push('/dashboard/records')}
                                        />
                                        <ActionButton
                                            icon={<FileText size={18} />}
                                            label="View Pending"
                                            onClick={() => router.push('/dashboard/requests')}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <ActionButton
                                            icon={<FileText size={18} />}
                                            label="Request File"
                                            onClick={() => router.push('/dashboard/requests')}
                                        />

                                        <ActionButton
                                            icon={<Users size={18} />}
                                            label="Add Patient"
                                            onClick={() => router.push('/dashboard/records?action=new')}
                                        />
                                    </>
                                )}

                                {userRole === 'hospital_admin' && (
                                    <ActionButton
                                        icon={<Users size={18} />}
                                        label="Manage Staff"
                                        onClick={() => router.push('/dashboard/staff')}
                                    />
                                )}

                                {userRole === 'hospital_admin' && (
                                    <ActionButton
                                        icon={<FileText size={18} />}
                                        label="Digitize Records"
                                        onClick={() => router.push('/dashboard/records/upload')}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* QA Simulation Modal */}
            {showQaModal && selectedIssue && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="bg-red-50 p-6 border-b border-red-100 flex justify-between items-center">
                            <h3 className="text-xl font-black text-red-900 flex items-center gap-2">
                                <AlertTriangle className="text-red-600" /> QA Alert
                            </h3>
                            <button onClick={() => setShowQaModal(false)} className="bg-white p-2 rounded-full hover:bg-red-100 text-red-900 transition-colors">
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="flex gap-4 mb-6">
                                <div className="w-16 h-20 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs">
                                    Pg 1
                                </div>
                                <div className="w-16 h-20 bg-red-100 border-2 border-red-500 border-dashed rounded-lg flex items-center justify-center text-red-600 font-bold text-[10px] text-center p-1">
                                    MISSING<br />PAGE 2
                                </div>
                                <div className="w-16 h-20 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs">
                                    Pg 3
                                </div>
                            </div>

                            <h4 className="font-bold text-lg text-slate-800 mb-2">{selectedIssue.issue}</h4>
                            <p className="text-slate-600 text-sm mb-6">
                                {selectedIssue.details || "No details provided for this issue."}
                            </p>
                            <p className="text-xs text-slate-400 mb-6">
                                File: <strong>{selectedIssue.file}</strong> • Severity: <span className="uppercase">{selectedIssue.severity}</span>
                            </p>

                            <div className="flex gap-3">
                                <button onClick={() => setShowQaModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200">
                                    Flag for Rescan
                                </button>
                                <button onClick={async () => {
                                    try {
                                        const res = await fetch(`${API_URL}/qa/${selectedIssue.id}/resolve`, {
                                            method: 'POST',
                                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                                        });
                                        if (res.ok) {
                                            setQaIssues(prev => prev.filter(i => i.id !== selectedIssue.id));
                                            setShowQaModal(false);
                                        }
                                    } catch (e) { console.error(e); }
                                }} className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-200">
                                    Mark Resolved
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

// --- Components ---

const MetricCard = ({ label, value, sub, trend, trendUp, icon, color }: any) => {
    const bgColors: any = {
        blue: 'bg-blue-50 text-blue-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        amber: 'bg-amber-50 text-amber-600',
        emerald: 'bg-emerald-50 text-emerald-600'
    };

    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${bgColors[color]}`}>
                    {icon}
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {trend} {trendUp && <TrendingUp size={12} />}
                </div>
            </div>
            <div>
                <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">{label}</p>
                {sub && <p className="text-slate-400 text-[10px] font-medium mt-0.5">{sub}</p>}
            </div>
        </div>
    );
};

const AlertItem = ({ type, title, time, desc }: any) => {
    const colors: any = {
        warning: 'bg-amber-50 border-amber-100 text-amber-600',
        error: 'bg-red-50 border-red-100 text-red-600',
        info: 'bg-blue-50 border-blue-100 text-blue-600'
    };
    const icons: any = {
        warning: <AlertTriangle size={18} />,
        error: <AlertOctagon size={18} />,
        info: <CheckCircle2 size={18} />
    };

    return (
        <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className={`p-3 rounded-xl h-fit ${colors[type]}`}>
                {icons[type]}
            </div>
            <div>
                <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{time}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
            </div>
        </div>
    );
};

const ActionButton = ({ icon, label, onClick }: any) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all font-bold text-xs gap-2 active:scale-95"
    >
        {icon}
        {label}
    </button>
);
