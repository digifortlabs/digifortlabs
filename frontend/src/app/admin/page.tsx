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

import { Suspense } from 'react';

function CommandCenter() {
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
        if (h === 'optimal' || h === 'good') return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', glow: 'from-emerald-500/15 to-emerald-500/5', iconBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/60 border-emerald-200/50' };
        if (h === 'warning' || h === 'degraded') return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', glow: 'from-amber-500/15 to-amber-500/5', iconBg: 'bg-gradient-to-br from-amber-50 to-amber-100/60 border-amber-200/50' };
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500', badge: 'bg-red-100 text-red-700', glow: 'from-red-500/15 to-red-500/5', iconBg: 'bg-gradient-to-br from-red-50 to-red-100/60 border-red-200/50' };
    })();

    const categoryColors: Record<string, string> = {
        STANDARD: '#6366f1', MLC: '#ef4444', BIRTH: '#10b981', DEATH: '#64748b'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#F4F6FB] to-indigo-50/30 px-5 sm:px-7 pb-20 pt-4 font-sans selection:bg-indigo-500/30">

            {/* ── PAGE HEADER ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-7 gap-4">
                <div className="relative">
                    {/* Glowing mesh background circle */}
                    <div className="absolute -left-6 -top-6 w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
                    <div className="flex items-center gap-3.5 mb-1 relative z-10">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 shadow-lg shadow-indigo-500/30 flex items-center justify-center border border-white/20 relative group overflow-hidden">
                            <div className="absolute inset-0 bg-white/25 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                            <Activity className="text-white w-5.5 h-5.5 relative z-10 animate-pulse" strokeWidth={2.5} />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 tracking-tight leading-tight">
                            {isPlatformAdmin && !isDetailedView
                                ? 'Global Platform Analytics'
                                : isHospitalAdmin || (isDetailedView && stats?.hospital_name)
                                    ? stats?.hospital_name || 'Hospital Command Center'
                                    : 'Workstation Dashboard'}
                        </h1>
                    </div>
                    <p className="text-xs text-slate-500 font-bold ml-[3.25rem] tracking-wide max-w-xl">
                        {isPlatformAdmin && !isDetailedView
                            ? 'Aggregated real-time telemetry across all registered enterprises and nodes'
                            : isHospitalAdmin
                                ? 'Operational performance, staff productivity, and financial oversight'
                                : 'Pending tasks, recent records, and real-time operational tools'}
                    </p>
                </div>

                {/* Header Status Chips */}
                <div className="flex items-center gap-3 flex-wrap relative z-10">
                    {/* Session Chip */}
                    <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl px-4.5 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:border-indigo-400/40 hover:shadow-[0_8px_30px_rgba(99,102,241,0.06)] hover:-translate-y-0.5 transition-all duration-300 group">
                        <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600 transition-colors group-hover:bg-indigo-100/80 group-hover:text-indigo-700 relative overflow-hidden">
                            <Clock className="w-4 h-4 relative z-10" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Session</p>
                            <p className="text-xs font-black text-slate-800 leading-none font-mono tracking-wide flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping inline-block" />
                                {sessionDuration}
                            </p>
                        </div>
                    </div>

                    {/* Last Login Chip */}
                    <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl px-4.5 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:border-emerald-400/40 hover:shadow-[0_8px_30px_rgba(16,185,129,0.06)] hover:-translate-y-0.5 transition-all duration-300 group">
                        <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600 transition-colors group-hover:bg-emerald-100/80 group-hover:text-emerald-700">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Last Login</p>
                            <p className="text-xs font-black text-slate-800 leading-none flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                {stats?.system?.uptime ? formatDateTime(stats.system.uptime) : 'Initial Session'}
                            </p>
                        </div>
                    </div>

                    {/* Local Time Dark Widget */}
                    <div className="flex items-center gap-3 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800/80 rounded-2xl px-5 py-2.5 shadow-[0_12px_30px_rgba(15,23,42,0.15)] hover:border-indigo-500/40 hover:shadow-[0_12px_30px_rgba(99,102,241,0.1)] hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 border border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1.5 text-left">Local Time</p>
                            <p className="text-xs sm:text-sm font-black text-white leading-none font-mono tracking-wider">{currentTime || '--:--:--'}</p>
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
                        onLaunch={(path) => {
                            const globalHospitalId = localStorage.getItem('globalHospitalId');
                            const url = globalHospitalId ? `/admin${path}?hospital_id=${globalHospitalId}` : `/admin${path}`;
                            router.push(url);
                        }}
                        onUpsell={(module) => setUpsellModule(module)}
                    />
                </div>
            )}

            {/* ── PRIMARY KPI ROW ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">

                {/* Total Entities / Patients */}
                <div className="bg-gradient-to-br from-white/95 to-slate-50/80 backdrop-blur-xl rounded-[2.25rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:border-indigo-500/30 hover:shadow-[0_20px_50px_rgba(99,102,241,0.08)] hover:-translate-y-1.5 transition-all duration-500 p-6 relative overflow-hidden group">
                    {/* Glowing Accent Blur */}
                    <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 rounded-full blur-2xl pointer-events-none -translate-y-1/3 translate-x-1/4 group-hover:scale-125 transition-transform duration-700 ease-out"></div>
                    <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-200/50 shadow-sm flex items-center justify-center text-indigo-600 transition-all duration-300 group-hover:scale-110 group-hover:shadow-indigo-500/10">
                            <Users className="w-6 h-6" strokeWidth={2.5} />
                        </div>
                        <span className={`text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1 ${
                            stats?.patients?.trend && stats.patients.trend !== '+0%'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/60 shadow-sm'
                                : 'bg-slate-50/80 text-slate-500 border border-slate-200/50'
                        }`}>
                            <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                            {stats?.patients?.trend || '+0%'}
                        </span>
                    </div>
                    <p className="text-4.5xl font-black text-slate-950 mb-1 tabular-nums tracking-tight relative z-10 group-hover:text-indigo-950 transition-colors">
                        {(stats?.patients?.total || 0).toLocaleString()}
                    </p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest relative z-10">
                        {isPlatformAdmin && !isDetailedView ? 'Total Platform Entities' : `Total ${terms?.patient || 'Patient'}s`}
                    </p>
                </div>

                {/* Storage */}
                <div className="bg-gradient-to-br from-white/95 to-slate-50/80 backdrop-blur-xl rounded-[2.25rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:border-blue-500/30 hover:shadow-[0_20px_50px_rgba(59,130,246,0.08)] hover:-translate-y-1.5 transition-all duration-500 p-6 relative overflow-hidden group">
                    {/* Glowing Accent Blur */}
                    <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 rounded-full blur-2xl pointer-events-none -translate-y-1/3 translate-x-1/4 group-hover:scale-125 transition-transform duration-700 ease-out"></div>
                    <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/60 border border-blue-200/50 shadow-sm flex items-center justify-center text-blue-600 transition-all duration-300 group-hover:scale-110 group-hover:shadow-blue-500/10">
                            <HardDrive className="w-6 h-6" strokeWidth={2.5} />
                        </div>
                        <span className="text-[11px] font-black px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100/60 shadow-sm flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                            {stats?.storage?.capacity_pct || 0}% used
                        </span>
                    </div>
                    <p className="text-4.5xl font-black text-slate-950 mb-1 tracking-tight relative z-10 group-hover:text-blue-950 transition-colors">{stats?.storage?.usage || '0 GB'}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3.5 relative z-10">Storage Overhead</p>
                    <div className="w-full bg-slate-100/60 border border-slate-200/20 rounded-full h-2.5 relative z-10 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-600 shadow-[0_0_12px_rgba(37,99,235,0.45)] transition-all duration-1000 ease-out relative overflow-hidden"
                            style={{ width: `${Math.min(stats?.storage?.capacity_pct || 0, 100)}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 translate-x-[-150%] animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* System Health */}
                <div className="bg-gradient-to-br from-white/95 to-slate-50/80 backdrop-blur-xl rounded-[2.25rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.08)] hover:-translate-y-1.5 transition-all duration-500 p-6 relative overflow-hidden group hover:border-emerald-500/30">
                    {/* Glowing Accent Blur */}
                    <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-br ${healthColor.glow} rounded-full blur-2xl pointer-events-none -translate-y-1/3 translate-x-1/4 group-hover:scale-125 transition-transform duration-700 ease-out`}></div>
                    <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className={`w-12 h-12 rounded-2xl ${healthColor.iconBg} flex items-center justify-center ${healthColor.text} transition-all duration-300 group-hover:scale-110`}>
                            <ShieldCheck className="w-6 h-6" strokeWidth={2.5} />
                        </div>
                        <span className={`text-[11px] font-black px-3 py-1 rounded-full ${healthColor.badge} border ${healthColor.border} flex items-center gap-1.5 shadow-sm`}>
                            <span className={`w-2 h-2 rounded-full ${healthColor.dot} inline-block animate-ping`} />
                            Stable
                        </span>
                    </div>
                    <p className={`text-4.5xl font-black mb-1 tracking-tight capitalize relative z-10 ${healthColor.text}`}>
                        {stats?.system?.health || 'Optimal'}
                    </p>
                    <p className={`text-xs font-bold uppercase tracking-widest relative z-10 ${healthColor.text} opacity-85`}>System Health</p>
                </div>
            </div>

            {/* ── SECONDARY KPI ROW ────────────────────────────────────── */}
            {(isPlatformAdmin || isHospitalAdmin) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                    {[
                        {
                            label: isPlatformAdmin ? 'Global Active Requests' : 'Pending Actions',
                            value: stats?.requests?.pending || 0,
                            icon: <FileText size={18} strokeWidth={2.5} />,
                            color: 'amber',
                            badge: stats?.requests?.pending > 0 ? 'Urgent' : 'Clear',
                            badgeOk: stats?.requests?.pending === 0
                        },
                        {
                            label: isPlatformAdmin ? 'System Throughput' : 'Your Activity',
                            value: stats?.requests?.todays_scans || 0,
                            icon: <Zap size={18} strokeWidth={2.5} />,
                            color: 'emerald',
                            badge: 'Live',
                            badgeOk: true
                        },
                        {
                            label: 'Pending QA',
                            value: stats?.qa?.pending || 0,
                            icon: <AlertTriangle size={18} strokeWidth={2.5} />,
                            color: 'violet',
                            badge: 'Audit',
                            badgeOk: stats?.qa?.pending === 0
                        },
                        {
                            label: 'Staff Active',
                            value: stats?.staff_active || 0,
                            icon: <Users size={18} strokeWidth={2.5} />,
                            color: 'sky',
                            badge: 'Online',
                            badgeOk: true
                        },
                        {
                            label: 'Recent Uploads',
                            value: stats?.recent_uploads || 0,
                            icon: <CloudUpload size={18} strokeWidth={2.5} />,
                            color: 'teal',
                            badge: '24h',
                            badgeOk: true
                        },
                    ].map((m, i) => {
                        const colorMap: Record<string, { icon: string; badge: string; bg: string, border: string, glow: string }> = {
                            amber:  { icon: 'text-amber-600',  badge: m.badgeOk ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/60 shadow-sm' : 'bg-amber-50 text-amber-600 border border-amber-100/60 shadow-sm',  bg: 'bg-gradient-to-br from-amber-50 to-amber-100/60', border: 'border-amber-200/50', glow: 'from-amber-500/10 to-transparent' },
                            emerald:{ icon: 'text-emerald-600',badge: 'bg-emerald-50 text-emerald-600 border border-emerald-100/60 shadow-sm', bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/60', border: 'border-emerald-200/50', glow: 'from-emerald-500/10 to-transparent' },
                            violet: { icon: 'text-violet-600', badge: m.badgeOk ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/60 shadow-sm' : 'bg-violet-50 text-violet-600 border border-violet-100/60 shadow-sm', bg: 'bg-gradient-to-br from-violet-50 to-violet-100/60', border: 'border-violet-200/50', glow: 'from-violet-500/10 to-transparent' },
                            sky:    { icon: 'text-sky-600',    badge: 'bg-sky-50 text-sky-600 border border-sky-100/60 shadow-sm',    bg: 'bg-gradient-to-br from-sky-50 to-sky-100/60', border: 'border-sky-200/50', glow: 'from-sky-500/10 to-transparent' },
                            teal:   { icon: 'text-teal-600',   badge: 'bg-teal-50 text-teal-600 border border-teal-100/60 shadow-sm',   bg: 'bg-gradient-to-br from-teal-50 to-teal-100/60', border: 'border-teal-200/50', glow: 'from-teal-500/10 to-transparent' },
                        };
                        const c = colorMap[m.color];
                        return (
                            <div key={i} className="bg-gradient-to-br from-white/95 to-slate-50/80 backdrop-blur-xl rounded-[1.75rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:border-indigo-500/20 hover:shadow-[0_15px_35px_rgba(99,102,241,0.06)] hover:-translate-y-1 transition-all duration-300 p-4.5 relative group overflow-hidden">
                                <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br ${c.glow} rounded-full blur-2xl opacity-60 pointer-events-none -translate-y-1/3 translate-x-1/4 group-hover:scale-125 transition-transform duration-500`}></div>
                                <div className="flex items-center justify-between mb-3 relative z-10">
                                    <div className={`w-10 h-10 rounded-[12px] ${c.bg} ${c.border} flex items-center justify-center ${c.icon} transition-transform duration-300 group-hover:scale-110`}>
                                        {m.icon}
                                    </div>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${c.badge}`}>{m.badge}</span>
                                </div>
                                <p className="text-3xl font-black text-slate-900 tabular-nums tracking-tight relative z-10">{m.value.toLocaleString()}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 leading-tight relative z-10">{m.label}</p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── CHARTS ROW ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">

                {/* Activity Trend — full width */}
                <div className="lg:col-span-5 bg-gradient-to-br from-white/95 to-slate-50/80 backdrop-blur-xl rounded-[2.25rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.01)] p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-200/50 flex items-center justify-center text-indigo-600 transition-transform duration-300 group-hover:scale-110">
                                <TrendingUp size={18} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-950 transition-colors">Activity Trend</h3>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Last 7 Days</span>
                            </div>
                        </div>
                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            Uploads
                        </span>
                    </div>
                    {stats?.activity_trend && stats.activity_trend.length > 0 ? (
                        <div className="w-full h-[220px] relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.activity_trend} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                                    <defs>
                                        <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} axisLine={false} tickLine={false} dx={-10} />
                                    <Tooltip
                                        contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', fontSize: '11px', color: '#fff', fontWeight: 800, padding: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
                                        itemStyle={{ color: '#818cf8', fontWeight: 900 }}
                                        cursor={{ stroke: '#818cf8', strokeWidth: 2, strokeDasharray: '6 6' }}
                                    />
                                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3.5} fill="url(#actGrad)" activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 3 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[220px] flex flex-col items-center justify-center gap-3 text-slate-400">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                                <BarChart3 size={24} className="text-slate-300" strokeWidth={2.5} />
                            </div>
                            <p className="text-sm font-bold text-slate-500">No activity in this period</p>
                        </div>
                    )}
                </div>


            </div>

            {/* ── RECENT PATIENTS (hospital drill-down) ────────────────── */}
            {hospitalId && userRole !== 'superadmin' && (
                <div className="bg-gradient-to-br from-white/95 to-slate-50/80 backdrop-blur-xl rounded-[2.25rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.01)] mb-6 overflow-hidden">
                    <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
                        <h3 className="text-sm font-black text-slate-900">Recent {terms?.patient || 'Patient'}s</h3>
                        <button onClick={() => router.push(`/admin/records?hospital_id=${hospitalId}`)}
                            className="text-[11px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100 px-4 py-2 rounded-xl flex items-center gap-2 border border-indigo-200/30 shadow-sm hover:shadow-indigo-500/5 transition-all duration-300">
                            View All <ChevronRight size={14} strokeWidth={3} />
                        </button>
                    </div>
                    <table className="w-full">
                        <thead className="bg-slate-100/40 border-b border-slate-200/30">
                            <tr>
                                {['Name', 'MRD / UHID', 'Discharged', 'Status'].map(h => (
                                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {loadingPatients ? (
                                <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm">Loading…</td></tr>
                            ) : patients.length === 0 ? (
                                <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm italic">No recent records found.</td></tr>
                            ) : patients.map(p => (
                                <tr key={p.record_id} onClick={() => router.push(`/admin/records/view?id=${p.record_id}`)}
                                    className="hover:bg-indigo-50/20 cursor-pointer transition-all duration-200 group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/80 border border-indigo-200/30 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                                {p.full_name?.charAt(0)}
                                            </div>
                                            <span className="font-bold text-sm text-slate-850 group-hover:text-indigo-950 transition-colors">{p.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 font-mono text-sm text-slate-600">
                                        {p.patient_u_id}
                                        {p.uhid && <div className="text-[10px] text-slate-400">UHID: {p.uhid}</div>}
                                    </td>
                                    <td className="px-5 py-3 text-sm text-slate-500">{formatDate(p.discharge_date)}</td>
                                    <td className="px-5 py-3">
                                        {p.physical_box_id
                                            ? <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full uppercase shadow-sm">Archived</span>
                                            : <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full uppercase shadow-sm">Digital</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── BOTTOM ROW: ACTIVITY + QUICK ACTIONS ─────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* Recent File Movements */}
                <div className="xl:col-span-2 bg-gradient-to-br from-white/95 to-slate-50/80 backdrop-blur-xl rounded-[2.25rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.01)] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-200/50 flex items-center justify-center text-indigo-600 transition-transform duration-300 group-hover:scale-110">
                                <Activity size={18} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900">Recent File Movements</h3>
                        </div>
                        {stats?.recent_activity?.length > 0 && (
                            <span className="text-[10px] font-bold text-slate-400">{stats.recent_activity.length} events</span>
                        )}
                    </div>
                    <div className="divide-y divide-slate-100/50 max-h-[350px] overflow-y-auto custom-scrollbar">
                        {stats?.recent_activity?.length > 0 ? stats.recent_activity.slice(0, 6).map((log: any) => {
                            const isError = log.action.includes('FAIL') || log.action.includes('ERROR');
                            const isWarn = log.action.includes('WARN');
                            return (
                                <div key={log.id} className="flex items-start gap-3 px-5 py-3 hover:bg-indigo-50/20 transition-all duration-300 group cursor-pointer">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-200/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md ${
                                        isError
                                            ? 'bg-gradient-to-br from-red-50 to-red-100/60 text-red-500 border-red-200/50'
                                            : isWarn
                                                ? 'bg-gradient-to-br from-amber-50 to-amber-100/60 text-amber-500 border-amber-200/50'
                                                : 'bg-gradient-to-br from-indigo-50 to-indigo-100/60 text-indigo-500 border-indigo-200/50'
                                    }`}>
                                        {isError
                                            ? <AlertTriangle size={14} strokeWidth={2.2} />
                                            : isWarn
                                                ? <AlertTriangle size={14} strokeWidth={2.2} />
                                                : <Activity size={14} strokeWidth={2.2} />}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[11px] font-bold text-slate-700 truncate group-hover:text-indigo-950 transition-colors">{log.action.replace(/_/g, ' ')}</p>
                                            <span className="text-[9px] text-slate-400 font-bold shrink-0">{log.time}</span>
                                        </div>
                                        {log.details && <p className="text-[10px] text-slate-500 truncate mt-0.5">{log.details}</p>}
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
                <div className="space-y-5">

                    {/* QA Monitor */}
                    {(userRole === 'website_admin' || userRole === 'hospital_admin' || userRole === 'superadmin') && (
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-6 relative overflow-hidden shadow-xl shadow-slate-900/20 group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px] pointer-events-none -translate-y-1/2 translate-x-1/4 group-hover:bg-indigo-500/30 transition-colors"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/10 text-indigo-400 p-2 rounded-xl backdrop-blur-md">
                                            <ScanLine size={18} strokeWidth={2.5} />
                                        </div>
                                        <h3 className="text-sm font-black text-white">QA Monitor</h3>
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
                    <div className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-slate-200/60 shadow-sm p-6 relative overflow-hidden">
                        <h3 className="text-sm font-black text-slate-900 mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3 relative z-10">
                            {isPlatformAdmin && !isDetailedView && (<>
                                {[
                                    { icon: <RefreshCcw size={18} strokeWidth={2.5} />, label: 'Clear Cache', onClick: handleClearCache, color: 'slate' },
                                    { icon: <IndianRupee size={18} strokeWidth={2.5} />, label: 'Global Billing', onClick: () => router.push('/admin/accounting'), color: 'emerald' },
                                    { icon: <Building2 size={18} strokeWidth={2.5} />, label: 'Manage Clients', onClick: () => router.push('/admin/hospitals'), color: 'indigo' },
                                    { icon: <Archive size={18} strokeWidth={2.5} />, label: 'Global Archives', onClick: () => router.push('/admin/archive'), color: 'slate' },
                                ].map((a, i) => (
                                    <button key={i} onClick={a.onClick}
                                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-100 hover:-translate-y-1 text-slate-500 hover:text-indigo-600 transition-all duration-300 group">
                                        <div className="group-hover:scale-110 transition-transform duration-300">{a.icon}</div>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-center">{a.label}</span>
                                    </button>
                                ))}
                            </>)}

                            {(isHospitalAdmin || isDetailedView) && (<>
                                {[
                                    { icon: <IndianRupee size={18} strokeWidth={2.5} />, label: 'Financials', onClick: () => router.push('/admin/accounting') },
                                    { icon: <TrendingUp size={18} strokeWidth={2.5} />, label: 'Analytics', onClick: () => router.push('/admin/reports') },
                                    { icon: <Users size={18} strokeWidth={2.5} />, label: 'Manage Staff', onClick: () => router.push('/admin/user_mgmt') },
                                    { icon: <Settings size={18} strokeWidth={2.5} />, label: 'Settings', onClick: () => router.push('/admin/settings') },
                                ].map((a, i) => (
                                    <button key={i} onClick={a.onClick}
                                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-100 hover:-translate-y-1 text-slate-500 hover:text-indigo-600 transition-all duration-300 group">
                                        <div className="group-hover:scale-110 transition-transform duration-300">{a.icon}</div>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-center">{a.label}</span>
                                    </button>
                                ))}
                            </>)}

                            {isStaff && (<>
                                {[
                                    { icon: <FileText size={18} strokeWidth={2.5} />, label: 'Request File', onClick: () => router.push('/admin/requests') },
                                    { icon: <Users size={18} strokeWidth={2.5} />, label: 'Add Patient', onClick: () => router.push('/admin/records?action=new') },
                                    { icon: <Package size={18} strokeWidth={2.5} />, label: 'Inventory', onClick: () => router.push('/admin/inventory') },
                                    { icon: <HardDrive size={18} strokeWidth={2.5} />, label: 'Draft Queue', onClick: () => router.push('/admin/drafts') },
                                ].map((a, i) => (
                                    <button key={i} onClick={a.onClick}
                                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-100 hover:-translate-y-1 text-slate-500 hover:text-indigo-600 transition-all duration-300 group">
                                        <div className="group-hover:scale-110 transition-transform duration-300">{a.icon}</div>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-center">{a.label}</span>
                                    </button>
                                ))}
                            </>)}


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
                                        await apiFetch(`qa/${selectedIssue.id}/resolve`, { method: 'POST' });
                                        setQaIssues(prev => prev.filter(i => i.id !== selectedIssue.id));
                                        setShowQaModal(false);
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

export default function Page() { return <Suspense fallback={<div className='flex items-center justify-center h-screen'><div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div></div>}><CommandCenter /></Suspense>; }
