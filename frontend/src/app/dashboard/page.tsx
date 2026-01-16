"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    ScanLine,
    Building2,
    IndianRupee, // Changed from DollarSign
    Package,
    ChevronRight // Added
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { exportDashboardMetrics, generatePDFReport } from '../utils/reportUtils';

export default function CommandCenter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const hospitalId = searchParams?.get('hospital_id');
    const [stats, setStats] = useState<any>(null);
    const [warehouseCapacity, setWarehouseCapacity] = useState(0);
    const [systemHealth, setSystemHealth] = useState('good');
    const [qaIssues, setQaIssues] = useState<any[]>([]);
    const [showQaModal, setShowQaModal] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<any>(null);
    const [userRole, setUserRole] = useState('');
    const [isDetailedView, setIsDetailedView] = useState(false);

    // Patient List State
    const [patients, setPatients] = useState<any[]>([]);
    const [loadingPatients, setLoadingPatients] = useState(false);

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

        // Fetch Real Dashboard Stats (with optional hospital_id for drill-down)
        const url = hospitalId
            ? `${API_URL}/stats/dashboard?hospital_id=${hospitalId}`
            : `${API_URL}/stats/dashboard`;

        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
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
                setIsDetailedView(data.is_detailed || false);

                // Set Real QA Issues from Backend
                if (data.qa_issues) {
                    setQaIssues(data.qa_issues);
                }
            })
            .catch(err => console.error("Stats Fetch Error:", err));

        // Fetch Recent Patients if looking at specific hospital
        if (hospitalId) {
            setLoadingPatients(true);
            fetch(`${API_URL}/patients/?hospital_id=${hospitalId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    // Take top 5 recent
                    setPatients(Array.isArray(data) ? data.slice(0, 5) : []);
                })
                .catch(err => console.error("Patients Fetch Error:", err))
                .finally(() => setLoadingPatients(false));
        }

    }, [hospitalId]);

    return (
        <div className="p-4 sm:p-6 max-w-[1600px] mx-auto min-h-screen pb-20">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        {isDetailedView && stats?.hospital_name ? (
                            <>
                                <Building2 className="text-indigo-600" />
                                {stats.hospital_name}
                            </>
                        ) : (
                            <>
                                <Activity className="text-indigo-600" /> Control Command Center
                            </>
                        )}
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {isDetailedView
                            ? "Hospital-specific metrics, billing, and operational insights."
                            : "Real-time system monitoring and integrity oversight."}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-4">
                    <div className="bg-indigo-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-indigo-100">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Live Stream</span>
                    </div>
                    <div className="bg-emerald-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-emerald-100">
                        <ShieldCheck className="text-emerald-600 w-4 h-4" />
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Uptime: {stats?.system?.uptime || '...'}</span>
                    </div>

                    {/* Export Buttons - Show for detailed view or admins */}
                    {(isDetailedView || userRole === 'website_admin' || userRole === 'hospital_admin') && stats && (
                        <>
                            <button
                                onClick={() => exportDashboardMetrics(stats, stats?.hospital_name)}
                                className="bg-white px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors shadow-sm"
                                title="Export to CSV"
                            >
                                <Package className="text-indigo-600 w-4 h-4" />
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Export CSV</span>
                            </button>
                            <button
                                onClick={() => generatePDFReport(stats, stats?.hospital_name)}
                                className="bg-indigo-600 px-4 py-2 rounded-xl flex items-center gap-2 border border-indigo-700 hover:bg-indigo-700 transition-colors shadow-sm"
                                title="Generate PDF Report"
                            >
                                <FileText className="text-white w-4 h-4" />
                                <span className="text-xs font-bold text-white uppercase tracking-wider">PDF Report</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Top Metrics Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${(userRole === 'website_admin' || userRole === 'hospital_admin') ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-6 mb-8`}>

                {/* Super Admin Only Metrics */}
                {userRole === 'website_admin' && (
                    <>
                        <MetricCard
                            label="API Latency"
                            value={stats?.system?.latency || "0 ms"}
                            trend="Optimal"
                            trendUp={true}
                            icon={<Server size={20} />}
                            color="blue"
                        />
                        <MetricCard
                            label="Network Load"
                            value={stats?.system?.network_load || "0 MB/s"}
                            trend="Normal"
                            trendUp={true}
                            icon={<Activity size={20} />}
                            color="cyan" // Changed to cyan
                        />
                    </>
                )}

                <MetricCard
                    label={userRole === 'website_admin' ? "Active Users" : userRole === 'mrd_staff' ? "Pending Requests" : "Total Patients"}
                    value={userRole === 'mrd_staff' ? (stats?.requests?.pending || 0) : userRole === 'website_admin' ? (stats?.users?.active || 0) : (stats?.patients?.total || 0)}
                    trend={userRole === 'mrd_staff' ? (stats?.requests?.pending > 0 ? "Urgent" : "Normal") : (stats?.patients?.trend || "+0%")}
                    trendUp={userRole === 'mrd_staff' ? (stats?.requests?.pending > 0) : (stats?.patients?.trend?.startsWith('+') && stats?.patients?.trend !== "+0%")}
                    icon={userRole === 'mrd_staff' ? <FileText size={20} /> : <Users size={20} />}
                    color={userRole === 'mrd_staff' ? 'amber' : 'indigo'}
                    sub={userRole === 'website_admin' ? `Total Users: ${stats?.users?.total || 0}` : undefined}
                />

                {userRole === 'hospital_admin' && (
                    <MetricCard
                        label="Staff Members"
                        value={stats?.users?.total || 0}
                        trend={stats?.users?.trend || "+0%"}
                        trendUp={stats?.users?.trend?.startsWith('+') && stats?.users?.trend !== "+0%"}
                        icon={<Users size={20} />}
                        color="indigo"
                    />
                )}

                <MetricCard
                    label={(userRole === 'mrd_staff' || userRole === 'hospital_admin') ? "Today's Scans" : "Storage Usage"}
                    value={(userRole === 'mrd_staff' || userRole === 'hospital_admin') ? (stats?.requests?.todays_scans || 0) : (stats?.storage?.usage || "0 GB")}
                    trend={(userRole === 'mrd_staff' || userRole === 'hospital_admin') ? (stats?.requests?.todays_scans > 0 ? "Active" : "+0%") : (stats?.storage?.trend || "+0%")}
                    trendUp={true}
                    icon={(userRole === 'mrd_staff' || userRole === 'hospital_admin') ? <ScanLine size={20} /> : <HardDrive size={20} />}
                    color="emerald"
                />

                {userRole === 'hospital_admin' && (
                    <MetricCard
                        label="Storage Usage"
                        value={stats?.storage?.usage || "0 GB"}
                        trend={stats?.storage?.trend || "+0%"}
                        trendUp={stats?.storage?.trend?.startsWith('+') && stats?.storage?.trend !== "+0%"}
                        icon={<HardDrive size={20} />}
                        color="emerald"
                    />
                )}

                {/* Billing Card - Show for detailed view (Hospital Admin or Super Admin drill-down) */}
                {isDetailedView && stats?.billing && (
                    <MetricCard
                        label="Total Cost"
                        value={`₹${stats.billing.total_estimated_cost?.toLocaleString() || '0'}`} // Changed to Rupee
                        trend={`${stats.billing.files_count || 0} files`}
                        trendUp={true}
                        icon={<IndianRupee size={20} />} // Changed Icon
                        color="purple" // Changed to purple
                        sub={`${stats.billing.subscription_tier} Plan • ₹${stats.billing.price_per_file}/file`} // Changed to Rupee
                    />
                )}
            </div>

            {/* Patient List (New Section) */}
            {hospitalId && (
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-800">Recent Patients</h2>
                        <button
                            onClick={() => router.push(`/dashboard/records?hospital_id=${hospitalId}`)}
                            className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                            View All <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Patient Name</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">MRD / UHID</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Discharged</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loadingPatients ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-slate-400">Loading patients...</td></tr>
                                ) : patients.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">No recent patients found.</td></tr>
                                ) : (
                                    patients.map((p) => (
                                        <tr key={p.record_id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/records/view?id=${p.record_id}`)}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                        {p.full_name?.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-slate-700">{p.full_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-sm text-slate-600">{p.patient_u_id}</div>
                                                {p.uhid && <div className="text-[10px] text-slate-400 font-bold">UHID: {p.uhid}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600">
                                                {p.discharge_date ? new Date(p.discharge_date).toLocaleDateString('en-IN') : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {p.physical_box_id ? (
                                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase">Archived</span>
                                                ) : (
                                                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded uppercase">Digital</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}


            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* ... (Rest of the existing layout: Main Activity Feed & QA) ... */}
                {/* Main Activity Feed */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Recent Alerts (Real) */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Recent File Movements</h3>
                            <Activity size={16} className="text-slate-400" />
                        </div>
                        <div className="space-y-1">
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

                    {/* QA / Missing Page Monitor (Super Admin & Hospital Admin) */}
                    {(userRole === 'website_admin' || userRole === 'hospital_admin') && (
                        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black flex items-center gap-2">
                                        <ScanLine className="text-indigo-400" />
                                        QA Monitor
                                    </h3>
                                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase">
                                        {qaIssues.length} {qaIssues.length === 1 ? 'Issue' : 'Issues'}
                                    </span>
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
                        {(userRole === 'hospital_admin' || userRole === 'mrd_staff' || userRole === 'website_admin' || userRole === 'website_staff') && (
                            <div className="grid grid-cols-2 gap-4">

                                {/* Universal Admin Action: Confirm Uploads */}
                                {(userRole === 'hospital_admin' || userRole === 'website_admin' || userRole === 'website_staff') && (
                                    <button
                                        onClick={async () => {
                                            if (!confirm("Are you sure you want to confirm all pending uploads immediately? This will finalize their storage locations.")) return;
                                            try {
                                                const token = localStorage.getItem('token');
                                                const res = await fetch(`${API_URL}/storage/confirm-all${hospitalId ? `?hospital_id=${hospitalId}` : ''}`, {
                                                    method: 'POST',
                                                    headers: { Authorization: `Bearer ${token}` }
                                                });
                                                const data = await res.json();

                                                if (!res.ok) {
                                                    throw new Error(data.detail || data.message || "Request failed");
                                                }

                                                alert(data.message || "Operation successful");
                                                window.location.reload();
                                            } catch (e: any) {
                                                alert(e.message || "Failed to confirm uploads");
                                            }
                                        }}
                                        className="col-span-2 bg-indigo-600 text-white p-4 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                                    >
                                        <CheckCircle2 size={20} />
                                        Confirm Pending Uploads
                                    </button>
                                )}

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
                                        onClick={() => router.push('/dashboard/user_mgmt')}
                                    />
                                )}

                                {(userRole === 'hospital_admin' || userRole === 'website_staff') && (
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
                            {selectedIssue.issue.toLowerCase().includes('page') ? (
                                <div className="flex gap-4 mb-6">
                                    <div className="w-16 h-20 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs uppercase text-center p-1">
                                        Prev<br />Pg
                                    </div>
                                    <div className="w-16 h-20 bg-red-100 border-2 border-red-500 border-dashed rounded-lg flex items-center justify-center text-red-600 font-bold text-[10px] text-center p-1 uppercase">
                                        {selectedIssue.issue.replace(' ', '\n')}<br />ERROR
                                    </div>
                                    <div className="w-16 h-20 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs uppercase text-center p-1">
                                        Next<br />Pg
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-200 border-dashed flex items-center justify-center">
                                    <div className="text-center">
                                        <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${selectedIssue.severity === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                            <AlertTriangle size={24} />
                                        </div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{selectedIssue.issue}</p>
                                    </div>
                                </div>
                            )}

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
        emerald: 'bg-emerald-50 text-emerald-600',
        cyan: 'bg-cyan-50 text-cyan-600', // Added
        purple: 'bg-purple-50 text-purple-600' // Added
    };

    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${bgColors[color] || bgColors.indigo}`}>
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
    const icons: any = {
        UPLOADED: <ArrowUpRight size={14} className="text-indigo-600" />,
        CONFIRMED: <CheckCircle2 size={14} className="text-emerald-600" />,
        DRAFT_DISCARDED: <XCircle size={14} className="text-slate-400" />,
        DELETION_REQUESTED: <AlertOctagon size={14} className="text-red-500" />,
        DELETED: <AlertOctagon size={14} className="text-red-600" />,
        INFO: <CheckCircle2 size={14} className="text-blue-500" />
    };

    const actionType = title.split(' ').join('_').toUpperCase();
    const icon = icons[actionType] || icons.INFO;

    return (
        <div className="flex gap-3 py-2 px-4 rounded-xl hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 items-center">
            <div className="p-2 rounded-lg bg-white border border-slate-100 shadow-sm shrink-0">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center bg-white/0">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-tight truncate">{title}</h4>
                    <span className="text-[9px] font-bold text-slate-400 shrink-0">{time}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium truncate opacity-80">{desc}</p>
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
