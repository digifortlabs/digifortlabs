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
import RecentActivityLog from '@/components/dashboard/RecentActivityLog';

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
        
        // Poll every 15 seconds for live activity updates
        const intervalId = setInterval(fetchStats, 15000);
        return () => clearInterval(intervalId);
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
        <div className="w-full h-full flex flex-col space-y-6 pb-8">

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
                            <div key={i} className="bg-white rounded-md border border-slate-200 p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                <div className={`w-8 h-8 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0`}>
                                    <Icon size={16} strokeWidth={2} className="text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-xl font-semibold text-slate-800 leading-none">{kpi.value}</p>
                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">{kpi.label}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}


            {/* ── MODULE LAUNCHER ── */}
            <div>
                <h2 className="text-sm font-semibold text-slate-700 mb-4">Modules</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {visibleActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={action.href || action.label}
                                onClick={() => {
                                    if (action.href) {
                                        router.push(action.href);
                                    }
                                }}
                                className="group flex flex-col items-center gap-2.5 p-4 bg-white rounded-md border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 text-center"
                            >
                                <div className={`w-10 h-10 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 transition-colors duration-200 group-hover:bg-indigo-100`}>
                                    <Icon size={18} strokeWidth={2} />
                                </div>
                                <div>
                                    <p className="text-[13px] font-semibold text-slate-700 leading-tight">{action.label}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── RECENT ACTIVITY LOG ── */}
            <RecentActivityLog logs={stats?.recent_activity || []} />

        </div>
    );
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
}
