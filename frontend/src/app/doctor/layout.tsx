"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import GreetingBar from '@/components/hospital/GreetingBar';
import {
    CalendarDays, Users, Stethoscope, FileText,
    Settings, LogOut, Menu, X, ChevronDown, Activity
} from 'lucide-react';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';

const NAV_ITEMS = [
    { label: 'My Schedule', href: '/doctor', icon: CalendarDays },
    { label: 'My Patients', href: '/doctor/patients', icon: Users },
    { label: 'OPD', href: '/doctor/opd', icon: Stethoscope },
    { label: 'Notes', href: '/doctor/notes', icon: FileText },
    { label: 'Settings', href: '/doctor/settings', icon: Settings },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    
    // Hospital Switcher State
    const [allowedHospitals, setAllowedHospitals] = useState<any[]>([]);
    const [activeHospitalId, setActiveHospitalId] = useState<string>('');
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

    useEffect(() => {
        // Consume cross-subdomain auth handoff hash
        if (window.location.hash.startsWith('#_auth=')) {
            try {
                const raw = window.location.hash.slice('#_auth='.length);
                const encoded = raw.split('#')[0];
                const payload = JSON.parse(atob(encoded));
                if (payload.access_token) localStorage.setItem('access_token', payload.access_token);
                if (payload.userRole) localStorage.setItem('userRole', payload.userRole);
                if (payload.userEmail) localStorage.setItem('userEmail', payload.userEmail);
                if (payload.userSpecialty) localStorage.setItem('userSpecialty', payload.userSpecialty);
                if (payload.userModules) localStorage.setItem('userModules', JSON.stringify(payload.userModules));
                if (payload.userTerminology) localStorage.setItem('userTerminology', JSON.stringify(payload.userTerminology));
                if (payload.loginTime) localStorage.setItem('loginTime', payload.loginTime.toString());
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            } catch (e) {
                console.warn('[Doctor Auth] Failed to parse auth handoff:', e);
            }
        }

        const checkAuth = async () => {
            try {
                const { apiFetch } = await import('@/config/api');
                const user = await apiFetch('/users/me');

                const role = user.role || '';
                if (role !== 'doctor') {
                    router.replace('/login');
                    return;
                }
                localStorage.setItem('userRole', role);
                if (user.email) {
                    localStorage.setItem('userEmail', user.email);
                    setUserEmail(user.email);
                }
                if (user.hospital_id) localStorage.setItem('hospital_id', user.hospital_id.toString());
                const hName = (
                    user.hospital_name ||
                    user.hospital?.legal_name ||
                    user.hospital?.name ||
                    ''
                );
                if (hName) localStorage.setItem('hospitalName', hName);
                if (user.full_name) localStorage.setItem('userFullName', user.full_name);
                window.dispatchEvent(new CustomEvent('hospitalProfileUpdated', { detail: { name: hName || '', fullName: user.full_name || '' } }));

                const spec = localStorage.getItem('userSpecialty') || '';
                setSpecialty(spec);
                
                if (user.allowed_hospitals && user.allowed_hospitals.length > 0) {
                    setAllowedHospitals(user.allowed_hospitals);
                    const currentId = localStorage.getItem('hospital_id') || user.allowed_hospitals[0].hospital_id.toString();
                    setActiveHospitalId(currentId);
                    localStorage.setItem('hospital_id', currentId);
                    // Update the hospital name for the GreetingBar to the active one
                    const activeHosp = user.allowed_hospitals.find((h:any) => h.hospital_id.toString() === currentId);
                    if (activeHosp) {
                        localStorage.setItem('hospitalName', activeHosp.legal_name);
                        window.dispatchEvent(new CustomEvent('hospitalProfileUpdated', { detail: { name: activeHosp.legal_name, fullName: user.full_name || '' } }));
                    }
                }

            } catch {
                ['access_token','userRole','userEmail','userSpecialty','userModules',
                 'userTerminology','loginTime','hospital_id'].forEach(k => localStorage.removeItem(k));
                router.push('/login');
                return;
            }
            setIsAuthReady(true);
        };

        checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogout = () => {
        ['access_token','userRole','userEmail','userSpecialty','userModules',
         'userTerminology','loginTime','hospital_id','globalHospitalId',
         'mrd_hospital_id','dental_hospital_id','ent_hospital_id',
         'clinic_hospital_id','hms_hospital_id','inventory_hospital_id',
         'userGroupId','sidebarCollapsed'].forEach(k => localStorage.removeItem(k));
        router.push('/login');
    };

    if (!isAuthReady) {
        return <DashboardSkeleton />;
    }

    const displayName = userEmail.split('@')[0]?.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Doctor';

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-violet-500/30">
            {/* Subtle ambient glow */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-violet-600/8 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 -left-[200px] w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[100px]" />
            </div>

            {/* Slim sidebar */}
            <aside className="fixed left-0 top-0 h-full w-16 lg:w-60 bg-slate-900/90 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col transition-all duration-300">
                {/* Logo */}
                <div className="flex items-center gap-3 px-3 lg:px-5 py-5 border-b border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
                        <Stethoscope size={18} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div className="hidden lg:block overflow-hidden">
                        <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest leading-none">Doctor Portal</p>
                        <p className="text-sm font-black text-white leading-tight truncate">{displayName}</p>
                    </div>
                </div>

                {/* Nav items */}
                <nav className="flex-1 py-4 px-2 lg:px-3 flex flex-col gap-1">
                    {NAV_ITEMS.map(item => {
                        const Icon = item.icon;
                        const active = pathname === item.href || (item.href !== '/doctor' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 group relative ${
                                    active
                                        ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                }`}
                            >
                                <Icon size={18} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
                                <span className="hidden lg:block">{item.label}</span>
                                {/* Tooltip for collapsed state */}
                                <span className="absolute left-14 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none lg:hidden z-50 border border-white/10">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom — specialty chip + logout */}
                <div className="px-2 lg:px-3 pb-5 flex flex-col gap-2 border-t border-white/5 pt-4">
                    {specialty && (
                        <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
                            <Activity size={13} className="text-violet-400 shrink-0" />
                            <span className="text-[11px] font-bold text-slate-400 capitalize truncate">{specialty.replace(/_/g, ' ')}</span>
                        </div>
                    )}
                    
                    {/* Hospital Switcher */}
                    {allowedHospitals.length > 0 && (
                        <div className="relative mt-2">
                            <button
                                onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-violet-600/10 border border-violet-500/20 text-left transition-all hover:bg-violet-600/20"
                            >
                                <div className="flex flex-col overflow-hidden min-w-0">
                                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest hidden lg:block">Active Hospital</span>
                                    <span className="text-xs font-black text-white truncate hidden lg:block">
                                        {allowedHospitals.find(h => h.hospital_id.toString() === activeHospitalId)?.legal_name || "Select Hospital"}
                                    </span>
                                    <span className="lg:hidden flex justify-center w-full">
                                        <Activity size={18} className="text-violet-400" />
                                    </span>
                                </div>
                                <ChevronDown size={14} className={`text-violet-400 transition-transform hidden lg:block ${isSwitcherOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isSwitcherOpen && (
                                <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-800 border border-white/10 rounded-xl overflow-hidden shadow-xl z-50">
                                    {allowedHospitals.map(h => (
                                        <button
                                            key={h.hospital_id}
                                            onClick={() => {
                                                setActiveHospitalId(h.hospital_id.toString());
                                                localStorage.setItem('hospital_id', h.hospital_id.toString());
                                                localStorage.setItem('hospitalName', h.legal_name);
                                                window.dispatchEvent(new CustomEvent('hospitalProfileUpdated', { detail: { name: h.legal_name, fullName: localStorage.getItem('userFullName') || '' } }));
                                                setIsSwitcherOpen(false);
                                                window.location.reload(); // Reload to refresh data context
                                            }}
                                            className={`w-full text-left px-3 py-2.5 text-xs font-bold transition-colors ${activeHospitalId === h.hospital_id.toString() ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-white/5'}`}
                                        >
                                            <span className="block truncate">{h.legal_name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
                    >
                        <LogOut size={18} strokeWidth={2} className="shrink-0" />
                        <span className="hidden lg:block">Sign Out</span>
                        <span className="absolute left-14 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none lg:hidden z-50 border border-white/10">
                            Sign Out
                        </span>
                    </button>
                </div>
            </aside>

            {/* Main content — offset for sidebar */}
            <div className="relative z-10 pl-16 lg:pl-60 min-h-screen flex flex-col">
                {/* Sticky greeting bar — always visible on every doctor page */}
                <div className="sticky top-0 z-30">
                    <GreetingBar />
                </div>
                <main className="flex-1 p-4 md:p-6 lg:p-8 animate-in fade-in duration-700">
                    {children}
                </main>
            </div>
        </div>
    );
}
