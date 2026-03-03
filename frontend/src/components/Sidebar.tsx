"use client";
import {
    Users, LayoutDashboard, Settings, UserCircle, LogOut, FileText, ChevronDown, Activity, Calendar as CalendarIcon, Package, ShoppingBag, BrainCircuit, Ear, Factory
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

import { useTerminology } from '@/hooks/useTerminology';

interface SidebarProps {
    userRole: string;
}

export default function Sidebar({ userRole }: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { terms, specialty, enabledModules = [] } = useTerminology();

    const handleLogout = async () => {
        try {
            const { apiFetch } = await import('@/lib/api');
            await apiFetch('/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Logout failed:', e);
        } finally {
            localStorage.removeItem('userRole');
            localStorage.removeItem('userEmail');
            router.push('/login');
        }
    };

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

    return (
        <div className="w-72 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col flex-shrink-0 text-slate-300">
            {/* Brand Header */}
            <div className="h-24 flex flex-col items-center justify-center px-8 border-b border-slate-800 bg-slate-950 gap-2">
                <div className="bg-white rounded-lg px-3 py-1.5 w-full flex justify-center">
                    <img src="/logo/longlogo.png" alt="Digifort Labs" className="h-6 w-auto object-contain" />
                </div>
                {specialty !== 'General' && (
                    <div className={`px-3 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${specialty === 'Dental' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        specialty === 'ENT' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                            'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        }`}>
                        {specialty === 'Dental' ? '🦷 Dental Clinic' : specialty === 'ENT' ? '👂 ENT Specialty' : specialty}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 p-6 space-y-8 overflow-y-auto">
                {/* Main Menu */}
                <div className="space-y-2">
                    <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Main Menu</p>

                    {/* Super Admin Section */}
                    {(userRole === 'website_admin' || userRole === 'superadmin') && (
                        <>
                            <Link
                                href="/dashboard/organizations"
                                className={`block px-4 py-3 rounded-xl transition-all duration-200 border ${isActive('/dashboard/organizations')
                                    ? 'active bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/50'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3 font-medium">
                                    <span>🏢</span> Manage Clients
                                </div>
                            </Link>
                        </>
                    )}

                    {(userRole === 'website_admin' || userRole === 'superadmin' || userRole === 'hospital_admin') && (
                        <Link
                            href="/dashboard/audit"
                            className={`block px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/dashboard/audit')
                                ? 'active bg-slate-800 text-white font-medium'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span>📋</span> System Audit
                            </div>
                        </Link>
                    )}

                    <Link
                        href="/dashboard"
                        className={`block px-4 py-3 rounded-xl transition-all duration-200 ${pathname === '/dashboard'
                            ? 'active bg-slate-800 text-white font-medium border border-slate-700'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                            Dashboard Overview
                        </div>
                    </Link>

                    <Link
                        href="/dashboard/appointments"
                        className={`block px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/dashboard/appointments')
                            ? 'active bg-slate-800 text-white font-medium border border-slate-700'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span>📅</span> Appointments
                        </div>
                    </Link>

                    {/* Dental Specific Dashboard */}
                    {enabledModules.includes('dental') && (
                        <div className="space-y-1">
                            <Link
                                href="/dashboard/dental"
                                className={`block px-4 py-3 rounded-xl transition-all duration-200 border ${isActive('/dashboard/dental') && !isActive('/dashboard/dental/analytics')
                                    ? 'active bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/50'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3 font-medium">
                                    <span>🦷</span> Dental Clinic
                                </div>
                            </Link>

                            <Link
                                href="/dashboard/dental/analytics"
                                className={`block px-4 py-2 ml-4 rounded-xl transition-all duration-200 border ${isActive('/dashboard/dental/analytics')
                                    ? 'active bg-emerald-900/40 text-emerald-400 border-emerald-800/50'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3 text-sm font-medium">
                                    <span>📊</span> Revenue Analytics
                                </div>
                            </Link>

                            <Link
                                href="/dashboard/dental/inventory"
                                className={`block px-4 py-2 ml-4 mt-1 rounded-xl transition-all duration-200 border ${isActive('/dashboard/dental/inventory')
                                    ? 'active bg-emerald-900/40 text-emerald-400 border-emerald-800/50'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3 text-sm font-medium">
                                    <span>📦</span> Dental Inventory
                                </div>
                            </Link>
                        </div>
                    )}

                    {enabledModules.includes('pharma') && (
                        <div className="space-y-1">
                            <Link
                                href="/dashboard/pharma"
                                className={`block px-4 py-3 rounded-xl transition-all duration-200 border ${isActive('/dashboard/pharma')
                                    ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200 text-blue-800 shadow-sm'
                                    : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <div className="flex items-center gap-3 font-semibold">
                                    <Factory className="w-5 h-5" /> 🏭 Pharma Manufacturing
                                </div>
                            </Link>
                        </div>
                    )}

                    {/* ENT Specific Dashboard */}
                    {enabledModules.includes('ent') && (
                        <div className="space-y-1">
                            <Link
                                href="/dashboard/ent"
                                className={`block px-4 py-3 rounded-xl transition-all duration-200 border ${isActive('/dashboard/ent')
                                    ? 'active bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/50'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3 font-medium">
                                    <span>👂</span> ENT Clinic
                                </div>
                            </Link>
                        </div>
                    )}

                    {/* Warehouse (Moved to Main Menu) */}
                    {(userRole === 'hospital_admin' || userRole === 'website_admin' || userRole === 'superadmin' || userRole === 'mrd_staff' || userRole === 'website_staff') && (
                        <Link
                            href="/dashboard/storage"
                            className={`block px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/dashboard/storage') && !isActive('/dashboard/storage/requests')
                                ? 'active bg-slate-800 text-white font-medium border border-slate-700'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span>📦</span> Warehouse
                            </div>
                        </Link>
                    )}

                    {/* Patient Records (Core Module) */}
                    {(userRole === 'hospital_admin' || userRole === 'data_uploader' || userRole === 'website_staff' || userRole === 'mrd_staff') && enabledModules.includes('core') && (
                        <Link
                            href="/dashboard/records"
                            className={`block px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/dashboard/records')
                                ? 'active bg-slate-800 text-white font-medium border border-slate-700'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span>📂</span> {terms.patient} Records
                            </div>
                        </Link>
                    )}
                </div>

                {/* Operations Section */}
                {
                    (userRole === 'hospital_admin' || userRole === 'mrd_staff' || userRole === 'website_staff' || userRole === 'website_admin' || userRole === 'superadmin') && (
                        <div className="space-y-2">
                            <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Operations</p>

                            {userRole === 'mrd_staff' && (
                                <Link
                                    href="/dashboard/drafts"
                                    className={`block px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/dashboard/drafts')
                                        ? 'active bg-amber-900/20 text-amber-500 font-medium border border-amber-900'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span>📤</span> Draft Queue
                                    </div>
                                </Link>
                            )}
                        </div>
                    )
                }

                {/* Settings Section */}
                <div className="space-y-2">
                    <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Account</p>

                    {(userRole === 'hospital_admin' || userRole === 'website_admin' || userRole === 'superadmin' || userRole === 'website_staff') && (
                        <Link
                            href="/dashboard/settings"
                            className={`block px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/dashboard/settings')
                                ? 'active bg-slate-800 text-white font-medium border border-slate-700'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span>⚙️</span> Settings
                            </div>
                        </Link>
                    )}
                </div>

                {/* Logout Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-950">
                    <button onClick={handleLogout} className="w-full flex items-center justify-between px-4 py-3 text-sm text-red-500 hover:bg-red-950/20 hover:text-red-400 rounded-xl transition-all font-bold">
                        <span>Sign Out</span>
                        <span className="text-xl">→</span>
                    </button>
                    {userRole && <p className="text-[10px] text-center text-slate-600 mt-2 uppercase tracking-wider">{userRole.replace('_', ' ')}</p>}
                </div>
            </div>
        </div >
    );
}
