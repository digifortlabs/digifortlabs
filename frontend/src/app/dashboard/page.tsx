"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URL, apiFetch } from '../../config/api';
import { formatDateTime, formatDate } from '@/lib/dateFormatter';
import {
    Activity, AlertTriangle, ShieldCheck, FileText, Users,
    HardDrive, Clock, ArrowUpRight, TrendingUp, RefreshCcw,
    CheckCircle2, XCircle, Eye, ScanLine, Building2, IndianRupee,
    Package, ChevronRight, AppWindow, Loader2, Archive, Settings,
    BarChart3, CloudUpload, Zap, Server
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useTerminology } from '@/hooks/useTerminology';
import ModuleLauncher from '@/components/dashboard/ModuleLauncher';

export default function CommandCenter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const hospitalId = searchParams?.get('hospital_id');
    const { terms, enabledModules } = useTerminology();
    const [stats, setStats] = useState<any>(null);
    const [systemHealth, setSystemHealth] = useState('good');
    const [qaIssues, setQaIssues] = useState<any[]>([]);
    const [showQaModal, setShowQaModal] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<any>(null);
    const [userRole, setUserRole] = useState('');
    const [isDetailedView, setIsDetailedView] = useState(false);
    const [sessionDuration, setSessionDuration] = useState('00:00:00');
    const [currentTime, setCurrentTime] = useState('');
    const [upsellModule, setUpsellModule] = useState<string | null>(null);
    const [patients, setPatients] = useState<any[]>([]);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('success');

    const triggerToast = (msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
        setToastMessage(msg);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
    };

    const handleClearCache = async () => {
        try {
            const res = await apiFetch(`platform/clear-cache`, { method: 'POST' });
            if (res === null) throw new Error('Backend clear failed');
            Object.keys(localStorage).forEach(key => {
                if (key !== 'token' && key !== 'userRole') localStorage.removeItem(key);
            });
            sessionStorage.clear();
            triggerToast('System and local cache cleared. Refreshing...', 'success');
            setTimeout(() => window.location.reload(), 1500);
        } catch (e) {
            triggerToast('Resetting local state only...', 'warning');
            Object.keys(localStorage).forEach(key => {
                if (key !== 'token') localStorage.removeItem(key);
            });
            setTimeout(() => window.location.reload(), 1500);
        }
    };

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean; title: string; message: string;
        onConfirm: (input?: string) => any; type?: 'danger' | 'warning' | 'info' | 'success';
        confirmText?: string; requiresInput?: boolean; inputPlaceholder?: string;
        isLoading?: boolean; closeOnConfirm?: boolean;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { }, type: 'danger', isLoading: false, closeOnConfirm: true });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedRole = (localStorage.getItem('userRole') || '').toLowerCase();
            if (!storedRole) { router.push('/login'); return; }
            setUserRole(storedRole);
        }
        const fetchDashboardData = async () => {
            const url = hospitalId ? `stats/dashboard?hospital_id=${hospitalId}` : `stats/dashboard`;
            try {
                const data = await apiFetch(url);
                if (!data) return;
                setStats(data);
                setSystemHealth(data.system ? data.system.health : 'Unknown');
                setIsDetailedView(data.is_detailed || false);
                if (data.qa_issues) setQaIssues(data.qa_issues);
            } catch (err) { console.error('Stats Fetch Error:', err); }
            if (hospitalId) {
                setLoadingPatients(true);
                try {
                    const patientData = await apiFetch(`patients/?hospital_id=${hospitalId}`);
                    if (patientData) setPatients(Array.isArray(patientData) ? patientData.slice(0, 5) : []);
                } catch (err) { console.error('Patients Fetch Error:', err); }
                finally { setLoadingPatients(false); }
            }
        };
        fetchDashboardData();
    }, [hospitalId, router]);

    useEffect(() => {
        const loginTimeStr = localStorage.getItem('loginTime');
        let iat = loginTimeStr ? parseInt(loginTimeStr) : null;
        if (!iat) { iat = Math.floor(Date.now() / 1000); localStorage.setItem('loginTime', iat.toString()); }
        const updateTimer = () => {
            const now = Math.floor(Date.now() / 1000);
            const diff = now - (iat as number);
            const h = Math.floor(diff / 3600).toString().padStart(2, '0');
            const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');
            setSessionDuration(`${h}:${m}:${s}`);
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const updateClock = () => {
            setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    const isPlatformAdmin = userRole === 'superadmin' || userRole === 'superadmin_staff' || userRole === 'website_admin';
    const isHospitalAdmin = userRole === 'hospital_admin';
    const isStaff = userRole === 'hospital_staff' || userRole === 'mrd_staff' || userRole === 'website_staff' || userRole === 'data_uploader' || userRole === 'warehouse_manager';

    const healthColor = (() => {
        const h = (systemHealth || stats?.system?.health || 'good').toLowerCase();
        if (h === 'optimal' || h === 'good') return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' };
        if (h === 'warning' || h === 'degraded') return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' };
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500', badge: 'bg-red-100 text-red-700' };
    })();

    const categoryColors: Record<string, string> = {
        STANDARD: '#6366f1', MLC: '#ef4444', BIRTH: '#10b981', DEATH: '#64748b'
    };

    return (
        <div className="min-h-screen bg-[#F4F6FB] px-5 sm:px-7 pb-20 pt-2">

            {/* ── PAGE HEADER ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <Activity className="text-white w-4 h-4" />
                        </div>
                        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                            {isPlatformAdmin && !isDetailedView
                                ? 'Global Platform Analytics'
                                : isHospitalAdmin || (isDetailedView && stats?.hospital_name)
                                    ? stats?.hospital_name || 'Hospital Command Center'
                                    : 'Workstation Dashboard'}
                        </h1>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium ml-9">
                        {isPlatformAdmin && !isDetailedView
                            ? 'Aggregated telemetry across all registered enterprises and clients'
                            : isHospitalAdmin
                                ? 'Operational performance, staff productivity, and financial oversight'
                                : 'Pending tasks, recent records, and real-time operational tools'}
                    </p>
                </div>

                {/* Header Status Chips */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                        <Clock className="text-indigo-500 w-3.5 h-3.5" />
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Session</p>
                            <p className="text-xs font-black text-slate-800 leading-none font-mono">{sessionDuration}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                        <ShieldCheck className="text-emerald-500 w-3.5 h-3.5" />
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Last Login</p>
                            <p className="text-xs font-black text-slate-800 leading-none">
                                {stats?.system?.uptime ? formatDateTime(stats.system.uptime) : 'Initial Session'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-4 py-1.5 shadow-md">
                        <div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-0.5">Local Time</p>
                            <p className="text-base font-black text-white leading-none font-mono tracking-wide">{currentTime || '--:--:--'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MODULE LAUNCHER ─────────────────────────────────────── */}
            {enabledModules && (
                <div className="mb-5">
                    <ModuleLauncher
                        enabledModules={enabledModules}
                        userRole={userRole}
                        onLaunch={(path) => router.push(path)}
                        onUpsell={(module) => setUpsellModule(module)}
                    />
                </div>
            )}

            {/* ── PRIMARY KPI ROW ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">

                {/* Total Entities / Patients */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-indigo-500">
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                            <Users className="text-indigo-600 w-4.5 h-4.5" size={18} />
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            stats?.patients?.trend && stats.patients.trend !== '+0%'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-slate-100 text-slate-500'
                        }`}>
                            {stats?.patients?.trend || '+0%'}
                        </span>
                    </div>
                    <p className="text-3xl font-black text-slate-900 mb-0.5 tabular-nums">
                        {(stats?.patients?.total || 0).toLocaleString()}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                        {isPlatformAdmin && !isDetailedView ? 'Total Platform Entities' : `Total ${terms?.patient || 'Patient'}s`}
                    </p>
                </div>

                {/* Storage */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-l-4 border-l-blue-500">
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                            <HardDrive className="text-blue-600" size={18} />
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                            {stats?.storage?.capacity_pct || 0}% used
                        </span>
                    </div>
                    <p className="text-3xl font-black text-slate-900 mb-0.5">{stats?.storage?.usage || '0 GB'}</p>
                    <p className="text-xs font-semibold text-slate-500 mb-2">Storage Overhead</p>
                    <div className="w-full bg-slate-100 rounded-full h-1">
                        <div
                            className="h-1 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-700"
                            style={{ width: `${Math.min(stats?.storage?.capacity_pct || 0, 100)}%` }}
                        />
                    </div>
                </div>

                {/* System Health */}
                <div className={`rounded-xl border shadow-sm p-5 border-l-4 ${healthColor.bg} ${healthColor.border} border-l-${healthColor.dot.replace('bg-', '')}`}
                    style={{ borderLeftColor: healthColor.dot === 'bg-emerald-500' ? '#10b981' : healthColor.dot === 'bg-amber-500' ? '#f59e0b' : '#ef4444' }}>
                    <div className="flex items-start justify-between mb-3">
                        <div className={`w-9 h-9 rounded-lg ${healthColor.bg} border ${healthColor.border} flex items-center justify-center`}>
                            <ShieldCheck className={`${healthColor.text}`} size={18} />
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${healthColor.badge} flex items-center gap-1`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${healthColor.dot} inline-block`} />
                            Stable
                        </span>
                    </div>
                    <p className={`text-3xl font-black mb-0.5 capitalize ${healthColor.text}`}>
                        {stats?.system?.health || 'Optimal'}
                    </p>
                    <p className={`text-xs font-semibold ${healthColor.text} opacity-70`}>System Health</p>
                </div>
            </div>

            {/* ── SECONDARY KPI ROW ────────────────────────────────────── */}
            {(isPlatformAdmin || isHospitalAdmin) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {[
                        {
                            label: isPlatformAdmin ? 'Global Active Requests' : 'Pending Actions',
                            value: stats?.requests?.pending || 0,
                            icon: <FileText size={15} />,
                            color: 'amber',
                            badge: stats?.requests?.pending > 0 ? 'Urgent' : 'Clear',
                            badgeOk: stats?.requests?.pending === 0
                        },
                        {
                            label: isPlatformAdmin ? 'System Throughput' : 'Your Activity',
                            value: stats?.requests?.todays_scans || 0,
                            icon: <Zap size={15} />,
                            color: 'emerald',
                            badge: 'Live',
                            badgeOk: true
                        },
                        {
                            label: 'Pending QA',
                            value: stats?.qa?.pending || 0,
                            icon: <AlertTriangle size={15} />,
                            color: 'violet',
                            badge: 'Audit',
                            badgeOk: stats?.qa?.pending === 0
                        },
                        {
                            label: 'Staff Active',
                            value: stats?.staff_active || 0,
                            icon: <Users size={15} />,
                            color: 'sky',
                            badge: 'Online',
                            badgeOk: true
                        },
                        {
                            label: 'Recent Uploads',
                            value: stats?.recent_uploads || 0,
                            icon: <CloudUpload size={15} />,
                            color: 'teal',
                            badge: '24h',
                            badgeOk: true
                        },
                    ].map((m, i) => {
                        const colorMap: Record<string, { icon: string; badge: string; bg: string }> = {
                            amber:  { icon: 'text-amber-600',  badge: m.badgeOk ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600',  bg: 'bg-amber-50' },
                            emerald:{ icon: 'text-emerald-600',badge: 'bg-emerald-50 text-emerald-600', bg: 'bg-emerald-50' },
                            violet: { icon: 'text-violet-600', badge: m.badgeOk ? 'bg-emerald-50 text-emerald-600' : 'bg-violet-50 text-violet-600', bg: 'bg-violet-50' },
                            sky:    { icon: 'text-sky-600',    badge: 'bg-sky-50 text-sky-600',    bg: 'bg-sky-50' },
                            teal:   { icon: 'text-teal-600',   badge: 'bg-teal-50 text-teal-600',   bg: 'bg-teal-50' },
                        };
                        const c = colorMap[m.color];
                        return (
                            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`w-7 h-7 rounded-md ${c.bg} flex items-center justify-center ${c.icon}`}>
                                        {m.icon}
                                    </div>
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${c.badge}`}>{m.badge}</span>
                                </div>
                                <p className="text-2xl font-black text-slate-900 tabular-nums">{m.value.toLocaleString()}</p>
                                <p className="text-[11px] font-medium text-slate-400 mt-0.5 leading-tight">{m.label}</p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── CHARTS ROW ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">

                {/* Activity Trend — wider */}
                <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={15} className="text-indigo-500" />
                            <h3 className="text-sm font-bold text-slate-800">Activity Trend</h3>
                            <span className="text-[10px] text-slate-400 font-medium">Last 7 Days</span>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Uploads</span>
                    </div>
                    {stats?.activity_trend && stats.activity_trend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={190}>
                            <AreaChart data={stats.activity_trend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                                <defs>
                                    <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', fontSize: '11px', color: '#fff', fontWeight: 700 }}
                                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 2' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fill="url(#actGrad)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[190px] flex flex-col items-center justify-center gap-3 text-slate-400">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                <BarChart3 size={22} className="text-slate-300" />
                            </div>
                            <p className="text-sm font-medium text-slate-400">No activity in this period</p>
                            <p className="text-xs text-slate-300">Data will appear as records are processed</p>
                        </div>
                    )}
                </div>

                {/* Category Distribution — narrower */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText size={15} className="text-indigo-500" />
                        <h3 className="text-sm font-bold text-slate-800">File Distribution</h3>
                    </div>
                    {stats?.category_breakdown && stats.category_breakdown.length > 0 ? (
                        <div className="space-y-3">
                            {(() => {
                                const total = stats.category_breakdown.reduce((s: number, c: any) => s + c.value, 0);
                                return stats.category_breakdown.map((cat: any, idx: number) => {
                                    const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0;
                                    const hex = categoryColors[cat.name] || '#6366f1';
                                    return (
                                        <div key={idx}>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: hex }} />
                                                    <span className="text-xs font-semibold text-slate-700">{cat.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-500 tabular-nums">{cat.value.toLocaleString()}</span>
                                                    <span className="text-[10px] font-black text-slate-400 w-8 text-right">{pct}%</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: hex }} />
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    ) : (
                        <div className="h-[190px] flex flex-col items-center justify-center gap-3 text-slate-400">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                <FileText size={22} className="text-slate-300" />
                            </div>
                            <p className="text-sm font-medium">No category data yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── RECENT PATIENTS (hospital drill-down) ────────────────── */}
            {hospitalId && userRole !== 'superadmin' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-5 overflow-hidden">
                    <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800">Recent {terms?.patient || 'Patient'}s</h3>
                        <button onClick={() => router.push(`/dashboard/records?hospital_id=${hospitalId}`)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                            View All <ChevronRight size={14} />
                        </button>
                    </div>
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                {['Name', 'MRD / UHID', 'Discharged', 'Status'].map(h => (
                                    <th key={h} className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loadingPatients ? (
                                <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm">Loading…</td></tr>
                            ) : patients.length === 0 ? (
                                <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm italic">No recent records found.</td></tr>
                            ) : patients.map(p => (
                                <tr key={p.record_id} onClick={() => router.push(`/dashboard/records/view?id=${p.record_id}`)}
                                    className="hover:bg-slate-50 cursor-pointer transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                {p.full_name?.charAt(0)}
                                            </div>
                                            <span className="font-semibold text-sm text-slate-700">{p.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 font-mono text-sm text-slate-600">
                                        {p.patient_u_id}
                                        {p.uhid && <div className="text-[10px] text-slate-400">UHID: {p.uhid}</div>}
                                    </td>
                                    <td className="px-5 py-3 text-sm text-slate-500">{formatDate(p.discharge_date)}</td>
                                    <td className="px-5 py-3">
                                        {p.physical_box_id
                                            ? <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase">Archived</span>
                                            : <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase">Digital</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── BOTTOM ROW: ACTIVITY + QUICK ACTIONS ─────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                {/* Recent File Movements */}
                <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Activity size={15} className="text-indigo-500" />
                            <h3 className="text-sm font-bold text-slate-800">Recent File Movements</h3>
                        </div>
                        {stats?.recent_activity?.length > 0 && (
                            <span className="text-[10px] font-bold text-slate-400">{stats.recent_activity.length} events</span>
                        )}
                    </div>
                    <div className="divide-y divide-slate-50">
                        {stats?.recent_activity?.length > 0 ? stats.recent_activity.map((log: any) => {
                            const isError = log.action.includes('FAIL') || log.action.includes('ERROR');
                            const isWarn = log.action.includes('WARN');
                            return (
                                <div key={log.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                        isError ? 'bg-red-50' : isWarn ? 'bg-amber-50' : 'bg-indigo-50'
                                    }`}>
                                        {isError
                                            ? <AlertTriangle size={13} className="text-red-500" />
                                            : isWarn
                                                ? <AlertTriangle size={13} className="text-amber-500" />
                                                : <Activity size={13} className="text-indigo-500" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs font-bold text-slate-700 truncate">{log.action.replace(/_/g, ' ')}</p>
                                            <span className="text-[10px] text-slate-400 shrink-0">{log.time}</span>
                                        </div>
                                        {log.details && <p className="text-[11px] text-slate-500 truncate mt-0.5">{log.details}</p>}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                                <Activity size={24} className="text-slate-200" />
                                <p className="text-sm font-medium">No recent activity logged</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">

                    {/* QA Monitor */}
                    {(userRole === 'website_admin' || userRole === 'hospital_admin' || userRole === 'superadmin') && (
                        <div className="bg-slate-900 rounded-xl p-5 relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <ScanLine size={15} className="text-indigo-400" />
                                        <h3 className="text-sm font-bold text-white">QA Monitor</h3>
                                    </div>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${qaIssues.length > 0 ? 'bg-red-500 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                        {qaIssues.length > 0 ? `${qaIssues.length} Issues` : 'All Clear'}
                                    </span>
                                </div>
                                {qaIssues.length > 0 ? (
                                    <div className="space-y-2">
                                        {qaIssues.slice(0, 3).map(issue => (
                                            <div key={issue.id} className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors">
                                                <div className="flex justify-between items-start mb-1.5">
                                                    <span className="text-[10px] font-black text-red-400 uppercase tracking-wide">{issue.issue}</span>
                                                    <span className="text-[10px] text-slate-500">{issue.timestamp}</span>
                                                </div>
                                                <p className="text-xs font-medium text-slate-300 truncate mb-2">{issue.file}</p>
                                                <button onClick={() => { setSelectedIssue(issue); setShowQaModal(true); }}
                                                    className="w-full bg-white text-slate-900 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wide hover:bg-indigo-50 transition-colors">
                                                    Review
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center py-6 gap-2">
                                        <CheckCircle2 size={28} className="text-emerald-400" />
                                        <p className="text-sm font-semibold text-slate-300">No QA issues found</p>
                                        <p className="text-[11px] text-slate-500 text-center">All records meet quality standards</p>
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-indigo-600 rounded-full blur-[60px] opacity-40 pointer-events-none" />
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-slate-800 mb-3">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {isPlatformAdmin && !isDetailedView && (<>
                                {[
                                    { icon: <RefreshCcw size={15} />, label: 'Clear Cache', onClick: handleClearCache, color: 'slate' },
                                    { icon: <IndianRupee size={15} />, label: 'Global Billing', onClick: () => router.push('/dashboard/accounting'), color: 'emerald' },
                                    { icon: <Building2 size={15} />, label: 'Manage Clients', onClick: () => router.push('/dashboard/hospitals'), color: 'indigo' },
                                    { icon: <Archive size={15} />, label: 'Global Archives', onClick: () => router.push('/dashboard/archive'), color: 'slate' },
                                ].map((a, i) => (
                                    <button key={i} onClick={a.onClick}
                                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-700 text-slate-600 transition-all group">
                                        <div className="group-hover:text-indigo-600">{a.icon}</div>
                                        <span className="text-[10px] font-bold text-center leading-tight">{a.label}</span>
                                    </button>
                                ))}
                            </>)}

                            {(isHospitalAdmin || isDetailedView) && (<>
                                {[
                                    { icon: <IndianRupee size={15} />, label: 'Financials', onClick: () => router.push('/dashboard/accounting') },
                                    { icon: <TrendingUp size={15} />, label: 'Analytics', onClick: () => router.push('/dashboard/reports') },
                                    { icon: <Users size={15} />, label: 'Manage Staff', onClick: () => router.push('/dashboard/user_mgmt') },
                                    { icon: <Settings size={15} />, label: 'Settings', onClick: () => router.push('/dashboard/settings') },
                                ].map((a, i) => (
                                    <button key={i} onClick={a.onClick}
                                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-700 text-slate-600 transition-all group">
                                        <div className="group-hover:text-indigo-600">{a.icon}</div>
                                        <span className="text-[10px] font-bold text-center leading-tight">{a.label}</span>
                                    </button>
                                ))}
                            </>)}

                            {isStaff && (<>
                                {[
                                    { icon: <FileText size={15} />, label: 'Request File', onClick: () => router.push('/dashboard/requests') },
                                    { icon: <Users size={15} />, label: 'Add Patient', onClick: () => router.push('/dashboard/records?action=new') },
                                    { icon: <Package size={15} />, label: 'Warehouse', onClick: () => router.push('/dashboard/storage') },
                                    { icon: <HardDrive size={15} />, label: 'Draft Queue', onClick: () => router.push('/dashboard/drafts') },
                                ].map((a, i) => (
                                    <button key={i} onClick={a.onClick}
                                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-700 text-slate-600 transition-all group">
                                        <div className="group-hover:text-indigo-600">{a.icon}</div>
                                        <span className="text-[10px] font-bold text-center leading-tight">{a.label}</span>
                                    </button>
                                ))}
                            </>)}

                            {(isPlatformAdmin || isHospitalAdmin) && (
                                <button disabled={confirmModal.isLoading}
                                    onClick={() => setConfirmModal({
                                        isOpen: true, title: 'Confirm All Drafts',
                                        message: 'Are you sure you want to confirm all pending uploads immediately? This will finalize their storage locations.',
                                        type: 'success', confirmText: 'Confirm All', closeOnConfirm: false,
                                        onConfirm: async () => {
                                            setConfirmModal(prev => ({ ...prev, isLoading: true }));
                                            try {
                                                const drafts = await apiFetch(`storage/drafts${hospitalId ? `?hospital_id=${hospitalId}` : ''}`);
                                                if (!Array.isArray(drafts)) throw new Error('Failed to fetch drafts list');
                                                if (drafts.length === 0) {
                                                    setConfirmModal(prev => ({ ...prev, isLoading: false, message: 'No pending drafts found.', confirmText: 'OK', onConfirm: () => setConfirmModal(p => ({ ...p, isOpen: false })) }));
                                                    return;
                                                }
                                                let successCount = 0;
                                                for (const file of drafts) { await apiFetch(`patients/files/${file.file_id}/confirm`, { method: 'POST' }); successCount++; }
                                                setConfirmModal(prev => ({ ...prev, isLoading: false, title: 'Complete', message: `Confirmed ${successCount} of ${drafts.length} files.`, confirmText: 'OK', onConfirm: () => { setConfirmModal(p => ({ ...p, isOpen: false })); window.location.reload(); } }));
                                            } catch (e: any) {
                                                setConfirmModal(prev => ({ ...prev, isLoading: false, type: 'danger', message: e.message || 'Failed to confirm uploads', confirmText: 'Dismiss', onConfirm: () => setConfirmModal(p => ({ ...p, isOpen: false })) }));
                                            }
                                        }
                                    })}
                                    className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors mt-1">
                                    {confirmModal.isLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                    Confirm All Pending Uploads
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── QA MODAL ─────────────────────────────────────────────── */}
            {showQaModal && selectedIssue && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
                        <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex justify-between items-center">
                            <h3 className="font-black text-red-900 flex items-center gap-2">
                                <AlertTriangle className="text-red-600" size={18} /> QA Alert
                            </h3>
                            <button onClick={() => setShowQaModal(false)} className="w-8 h-8 rounded-full bg-white hover:bg-red-100 flex items-center justify-center text-red-700 transition-colors">
                                <XCircle size={16} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${selectedIssue.severity === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                <AlertTriangle size={22} />
                            </div>
                            <h4 className="font-bold text-lg text-slate-800 text-center mb-2">{selectedIssue.issue}</h4>
                            <p className="text-slate-500 text-sm text-center mb-4">{selectedIssue.details || 'No details provided.'}</p>
                            <p className="text-xs text-slate-400 text-center mb-6">File: <strong>{selectedIssue.file}</strong> · Severity: <span className="uppercase">{selectedIssue.severity}</span></p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowQaModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200">Flag for Rescan</button>
                                <button onClick={async () => {
                                    try {
                                        const res = await fetch(`${API_URL}/qa/${selectedIssue.id}/resolve`, { method: 'POST', credentials: 'include' });
                                        if (res.ok) { setQaIssues(prev => prev.filter(i => i.id !== selectedIssue.id)); setShowQaModal(false); }
                                    } catch (e) { console.error(e); }
                                }} className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-100">Mark Resolved</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── UPSELL MODAL ─────────────────────────────────────────── */}
            {upsellModule && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center">
                                    <AppWindow size={18} className="text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Module Locked</h3>
                                    <p className="text-xs text-slate-400">{upsellModule} requires upgrade</p>
                                </div>
                            </div>
                            <button onClick={() => setUpsellModule(null)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                                <XCircle size={16} />
                            </button>
                        </div>
                        <div className="p-6 text-center">
                            <ShieldCheck size={32} className="text-slate-300 mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-700 mb-1">The <strong className="text-indigo-600">{upsellModule}</strong> module is not active.</p>
                            <p className="text-xs text-slate-400">Contact our team to activate this module for your account.</p>
                        </div>
                        <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-2">
                            <a href={`mailto:sales@digifortlabs.com?subject=Activate%20Module:%20${upsellModule}`}
                                className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center justify-center gap-1.5">
                                <FileText size={13} /> Email Sales
                            </a>
                            <a href="tel:+918452834884"
                                className="flex-[1.5] py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-200 transition-colors flex items-center justify-center gap-1.5">
                                <Users size={13} /> Call Expert
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TOAST ────────────────────────────────────────────────── */}
            {showToast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
                    <div className={`px-5 py-2.5 rounded-xl shadow-xl border flex items-center gap-2.5 text-sm font-bold ${
                        toastType === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' :
                        toastType === 'error'   ? 'bg-red-500 border-red-400 text-white' :
                        toastType === 'warning' ? 'bg-amber-500 border-amber-400 text-white' :
                                                  'bg-indigo-600 border-indigo-500 text-white'
                    }`}>
                        {toastType === 'success' && <CheckCircle2 size={16} />}
                        {(toastType === 'error' || toastType === 'warning') && <AlertTriangle size={16} />}
                        {toastMessage}
                    </div>
                </div>
            )}

            {/* ── CONFIRMATION MODAL ───────────────────────────────────── */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
                onConfirm={confirmModal.onConfirm}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                requiresInput={confirmModal.requiresInput}
                isLoading={confirmModal.isLoading}
                closeOnConfirm={confirmModal.closeOnConfirm}
                inputPlaceholder={confirmModal.inputPlaceholder}
            />
        </div>
    );
}
