"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, CalendarDays, IndianRupee, Package, FileText,
    Activity, TrendingUp, Clock, ArrowRight, ShieldCheck,
    AlertTriangle, CheckCircle2, Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch } from '@/config/api';
import { formatDateTime } from '@/lib/dateFormatter';

const QUICK_ACTIONS = [
    { label: 'Patients', desc: 'View & manage patient records', icon: Users, href: '/hospital/patients', color: 'blue' },
    { label: 'Appointments', desc: 'Schedule and track appointments', icon: CalendarDays, href: '/hospital/appointments', color: 'teal' },
    { label: 'Inventory', desc: 'Track supplies and equipment', icon: Package, href: '/hospital/inventory', color: 'violet' },
    { label: 'Reports', desc: 'Analytics and performance data', icon: TrendingUp, href: '/hospital/reports', color: 'emerald' },
    { label: 'Accounting', desc: 'Billing, invoices & ledger', icon: IndianRupee, href: '/hospital/accounting', color: 'amber', adminOnly: true },
    { label: 'Settings', desc: 'Hospital configuration', icon: ShieldCheck, href: '/hospital/settings', color: 'slate', adminOnly: true },
    { label: 'WhatsApp', desc: 'Connect messaging', icon: Smartphone, href: '/hospital/whatsapp', color: 'emerald', adminOnly: true },
];

const COLOR_MAP: Record<string, string> = {
    blue:    'from-blue-50 to-blue-100/60 border-blue-200/50 text-blue-600 group-hover:shadow-blue-500/10',
    teal:    'from-teal-50 to-teal-100/60 border-teal-200/50 text-teal-600 group-hover:shadow-teal-500/10',
    violet:  'from-violet-50 to-violet-100/60 border-violet-200/50 text-violet-600 group-hover:shadow-violet-500/10',
    emerald: 'from-emerald-50 to-emerald-100/60 border-emerald-200/50 text-emerald-600 group-hover:shadow-emerald-500/10',
    amber:   'from-amber-50 to-amber-100/60 border-amber-200/50 text-amber-600 group-hover:shadow-amber-500/10',
    slate:   'from-slate-50 to-slate-100/60 border-slate-200/50 text-slate-600 group-hover:shadow-slate-500/10',
};

export default function HospitalPage() {
    const router = useRouter();
    const [userRole, setUserRole] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userFullName, setUserFullName] = useState('');
    const [stats, setStats] = useState<any>(null);
    const [currentTime, setCurrentTime] = useState('');
    const [sessionDuration, setSessionDuration] = useState('00:00:00');

    useEffect(() => {
        const role = localStorage.getItem('userRole') || '';
        setUserRole(role);
        setUserEmail(localStorage.getItem('userEmail') || '');
        setUserFullName(localStorage.getItem('userFullName') || '');

        const fetchStats = async () => {
            try {
                const data = await apiFetch('stats/dashboard');
                setStats(data);
            } catch (e) {
                console.error('[Hospital Dashboard] stats fetch failed:', e);
            }
        };
        fetchStats();
    }, []);

    useEffect(() => {
        const tick = () => setCurrentTime(
            new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
        );
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const loginTimeStr = localStorage.getItem('loginTime');
        let iat = loginTimeStr ? parseInt(loginTimeStr) : Math.floor(Date.now() / 1000);
        const tick = () => {
            const diff = Math.floor(Date.now() / 1000) - iat;
            const h = Math.floor(diff / 3600).toString().padStart(2, '0');
            const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');
            setSessionDuration(`${h}:${m}:${s}`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    const isAdmin = userRole === 'hospital_admin';
    const visibleActions = QUICK_ACTIONS.filter(a => !a.adminOnly || isAdmin);
    const firstName = userFullName || userEmail.split('@')[0]?.split('.')[0] || 'User';


    return (
        <div className="space-y-8">

            {/* ── PAGE HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Good {getGreeting()}, <span className="capitalize">{firstName}</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1 text-sm">
                        {isAdmin ? 'Hospital Management Overview' : 'Your Hospital Workstation'}
                    </p>
                </div>

                {/* Status chips */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-xs font-black text-slate-700 font-mono">{sessionDuration}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white rounded-xl shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-black font-mono">{currentTime}</span>
                    </div>
                </div>
            </div>

            {/* ── KPI CARDS ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    {
                        label: 'Total Patients',
                        value: stats?.patients?.total?.toLocaleString() ?? '—',
                        trend: stats?.patients?.trend,
                        icon: Users,
                        color: 'blue',
                    },
                    {
                        label: 'Storage Used',
                        value: stats?.storage?.usage ?? '— GB',
                        trend: `${stats?.storage?.capacity_pct ?? 0}% capacity`,
                        icon: Activity,
                        color: 'teal',
                    },
                    {
                        label: 'System Health',
                        value: stats?.system?.health ?? 'Optimal',
                        trend: 'All systems nominal',
                        icon: ShieldCheck,
                        color: 'emerald',
                    },
                ].map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={i} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${COLOR_MAP[kpi.color].split(' ').slice(0,3).join(' ')} border flex items-center justify-center`}>
                                    <Icon size={20} strokeWidth={2.5} className={COLOR_MAP[kpi.color].split(' ')[3]} />
                                </div>
                                {kpi.trend && (
                                    <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
                                        {kpi.trend}
                                    </span>
                                )}
                            </div>
                            <p className="text-3xl font-black text-slate-900 tracking-tight capitalize">{kpi.value}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{kpi.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* ── CLINICAL OPERATIONS ── */}
            {stats?.clinical_ops && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'OPD Today', value: stats.clinical_ops.opd_today, icon: Users, color: 'blue' },
                        { label: 'IPD Admitted', value: stats.clinical_ops.ipd_admitted, icon: Activity, color: 'emerald' },
                        { label: 'OT In Use', value: stats.clinical_ops.ot_in_use, icon: Activity, color: 'violet' },
                        { label: 'ER Active', value: stats.clinical_ops.er_active, icon: AlertTriangle, color: 'amber' },
                    ].map((kpi, i) => {
                        const Icon = kpi.icon;
                        return (
                            <div key={i} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLOR_MAP[kpi.color].split(' ').slice(0,3).join(' ')} border flex items-center justify-center shrink-0`}>
                                    <Icon size={18} strokeWidth={2.5} className={COLOR_MAP[kpi.color].split(' ')[3]} />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-slate-900 leading-none">{kpi.value}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{kpi.label}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}


            {/* ── MODULE LAUNCHER ── */}
            <div>
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Modules</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {visibleActions.map((action) => {
                        const Icon = action.icon;
                        const colorClasses = COLOR_MAP[action.color] || COLOR_MAP.slate;
                        const [from, to, border, text] = colorClasses.split(' ');
                        return (
                            <button
                                key={action.href || action.action}
                                onClick={() => {
                                    if (action.href) {
                                        router.push(action.href);
                                    }
                                }}
                                className="group flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${from} ${to} ${border} border flex items-center justify-center ${text} group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon size={22} strokeWidth={2.5} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-black text-slate-800 leading-tight">{action.label}</p>
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-tight hidden sm:block">{action.desc}</p>
                                </div>
                                <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all duration-200" />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── RECENT ACTIVITY ── */}
            {stats?.recent_activity?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Activity size={16} className="text-blue-600" strokeWidth={2.5} />
                            <h3 className="text-sm font-black text-slate-800">Recent Activity</h3>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{stats.recent_activity.length} events</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {stats.recent_activity.slice(0, 5).map((log: any) => {
                            const isError = log.action.includes('FAIL') || log.action.includes('ERROR');
                            return (
                                <div key={log.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/60 transition-colors">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isError ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                        {isError ? <AlertTriangle size={14} strokeWidth={2.5} /> : <CheckCircle2 size={14} strokeWidth={2.5} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-700 truncate">{log.action.replace(/_/g, ' ')}</p>
                                        {log.details && <p className="text-xs text-slate-400 truncate">{log.details}</p>}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-bold shrink-0">{log.time}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
}
