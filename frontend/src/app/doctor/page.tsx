"use client";

import { useEffect, useState } from 'react';
import {
    CalendarDays, Clock, Users, Stethoscope, CheckCircle2,
    AlertCircle, ChevronRight, Activity, FileText, ArrowRight,
    Timer, User
} from 'lucide-react';
import { apiFetch } from '@/config/api';
import { formatDate } from '@/lib/dateFormatter';

type Appointment = {
    id: number;
    patient_name: string;
    time: string;
    status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
    reason?: string;
    token?: number;
};

const STATUS_STYLES: Record<string, string> = {
    waiting:     'bg-amber-500/15 text-amber-400 border-amber-500/25',
    in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    completed:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    cancelled:   'bg-red-500/15 text-red-400 border-red-500/25',
};

const STATUS_LABEL: Record<string, string> = {
    waiting:     'Waiting',
    in_progress: 'In Progress',
    completed:   'Completed',
    cancelled:   'Cancelled',
};

export default function DoctorPage() {
    const [userEmail, setUserEmail] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [stats, setStats] = useState({ total: 0, waiting: 0, completed: 0, inProgress: 0 });
    const [currentTime, setCurrentTime] = useState('');
    const [today, setToday] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setUserEmail(localStorage.getItem('userEmail') || '');
        setSpecialty(localStorage.getItem('userSpecialty') || '');

        const now = new Date();
        setToday(now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

        const fetchAppointments = async () => {
            try {
                const hospitalId = localStorage.getItem('hospital_id');
                const url = `appointments/today${hospitalId ? `?hospital_id=${hospitalId}` : ''}`;
                const data = await apiFetch(url);
                if (Array.isArray(data)) {
                    setAppointments(data);
                    setStats({
                        total: data.length,
                        waiting: data.filter((a: Appointment) => a.status === 'waiting').length,
                        inProgress: data.filter((a: Appointment) => a.status === 'in_progress').length,
                        completed: data.filter((a: Appointment) => a.status === 'completed').length,
                    });
                }
            } catch {
                // appointments endpoint may not exist yet — show empty state
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, []);

    useEffect(() => {
        const tick = () => setCurrentTime(
            new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
        );
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    const displayName = userEmail.split('@')[0]?.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Doctor';
    const nextWaiting = appointments.find(a => a.status === 'waiting');

    return (
        <div className="space-y-6 max-w-5xl">

            {/* ── HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-violet-400 uppercase tracking-widest">{today}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Dr. {displayName}
                    </h1>
                    {specialty && (
                        <p className="text-slate-400 font-medium mt-1 text-sm capitalize">{specialty.replace(/_/g, ' ')}</p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-white/5 rounded-xl">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-sm font-black text-white font-mono">{currentTime}</span>
                    </div>
                </div>
            </div>

            {/* ── NEXT PATIENT CARD ── */}
            {nextWaiting ? (
                <div className="relative bg-gradient-to-br from-violet-600/20 to-indigo-600/10 border border-violet-500/20 rounded-2xl p-5 overflow-hidden">
                    <div className="absolute right-0 top-0 w-40 h-40 bg-violet-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">Next Patient</p>
                            <h2 className="text-xl font-black text-white">{nextWaiting.patient_name}</h2>
                            {nextWaiting.reason && <p className="text-sm text-slate-400 mt-1">{nextWaiting.reason}</p>}
                            <div className="flex items-center gap-3 mt-3">
                                <div className="flex items-center gap-1.5 text-slate-300">
                                    <Timer size={14} />
                                    <span className="text-sm font-bold">{nextWaiting.time}</span>
                                </div>
                                {nextWaiting.token && (
                                    <span className="text-xs font-black text-violet-300 bg-violet-500/20 px-2.5 py-1 rounded-full border border-violet-500/30">
                                        Token #{nextWaiting.token}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                            <User size={22} className="text-violet-300" strokeWidth={2.5} />
                        </div>
                    </div>
                    <button className="mt-4 w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-black transition-colors shadow-lg shadow-violet-500/20">
                        Start Consultation <ArrowRight size={16} />
                    </button>
                </div>
            ) : (
                !loading && (
                    <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 text-center">
                        <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-300">No patients waiting right now</p>
                        <p className="text-xs text-slate-500 mt-1">Your queue is clear</p>
                    </div>
                )
            )}

            {/* ── STATS ROW ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Today's Total", value: stats.total, icon: CalendarDays, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
                    { label: 'Waiting', value: stats.waiting, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                    { label: 'In Progress', value: stats.inProgress, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <div key={i} className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 hover:bg-slate-900/80 transition-colors">
                            <div className={`w-9 h-9 rounded-xl ${s.bg} border flex items-center justify-center mb-3`}>
                                <Icon size={16} className={s.color} strokeWidth={2.5} />
                            </div>
                            <p className="text-2xl font-black text-white">{s.value}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{s.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* ── APPOINTMENT QUEUE ── */}
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Stethoscope size={16} className="text-violet-400" strokeWidth={2.5} />
                        <h3 className="text-sm font-black text-white">Today's OPD Queue</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{appointments.length} appointments</span>
                </div>

                {loading ? (
                    <div className="py-12 flex justify-center">
                        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="py-12 text-center">
                        <CalendarDays size={28} className="text-slate-700 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-500">No appointments scheduled for today</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {appointments.map((appt) => (
                            <div key={appt.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors group cursor-pointer">
                                {appt.token && (
                                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center shrink-0">
                                        <span className="text-xs font-black text-slate-400">#{appt.token}</span>
                                    </div>
                                )}
                                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                                    <User size={15} className="text-violet-400" strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{appt.patient_name}</p>
                                    {appt.reason && <p className="text-xs text-slate-500 truncate">{appt.reason}</p>}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="flex items-center gap-1 text-slate-500">
                                        <Clock size={12} />
                                        <span className="text-xs font-bold">{appt.time}</span>
                                    </div>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${STATUS_STYLES[appt.status] || STATUS_STYLES.waiting}`}>
                                        {STATUS_LABEL[appt.status] || appt.status}
                                    </span>
                                    <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── QUICK ACTIONS ── */}
            <div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'My Patients', icon: Users, href: '/doctor/patients', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
                        { label: 'OPD Register', icon: Stethoscope, href: '/doctor/opd', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                        { label: 'Write Note', icon: FileText, href: '/doctor/notes/new', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
                        { label: 'All Appointments', icon: CalendarDays, href: '/doctor/appointments', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                    ].map((action) => {
                        const Icon = action.icon;
                        return (
                            <a
                                key={action.href}
                                href={action.href}
                                className="flex flex-col items-center gap-2.5 p-4 bg-slate-900/60 border border-white/5 rounded-2xl hover:bg-slate-800/80 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-200 group"
                            >
                                <div className={`w-10 h-10 rounded-xl border ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                                    <Icon size={18} strokeWidth={2.5} />
                                </div>
                                <span className="text-xs font-black text-slate-300 text-center">{action.label}</span>
                            </a>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
