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

    const isPlatformAdmin = userRole === 'superadmin' || userRole === 'superadmin_staff' || userRole === 'website_admin';
    const isHospitalAdmin = userRole === 'hospital_admin';
    const isStaff = userRole === 'hospital_staff' || userRole === 'mrd_staff' || userRole === 'website_staff' || userRole === 'data_uploader' || userRole === 'warehouse_manager';

    return (
        <div className="w-72 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col flex-shrink-0 text-slate-300">
            {/* Brand Header */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950 gap-3">
                <div className="bg-white rounded-xl p-2 flex items-center justify-center shadow-lg shadow-white/5">
                    <img src="/logo/longlogo.png" alt="DF" className="h-8 w-auto object-contain" />
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 p-6 space-y-8 overflow-y-auto">
                {/* Global Actions - Scoped */}
                {(isPlatformAdmin || isHospitalAdmin || isStaff) && (
                    <div className="space-y-4">
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('open-global-patient-register'))}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-3 transition-all active:scale-95 group border border-indigo-400/30"
                        >
                            <div className="bg-white/20 p-2 rounded-xl group-hover:bg-white/30 transition-colors">
                                <Users className="w-5 h-5" />
                            </div>
                            <span className="tracking-tight uppercase text-sm">Add New {terms.patient}</span>
                        </button>
                    </div>
                )}

                {/* Platform Administration (Super/Website Admin Only) */}
                {isPlatformAdmin && (
                    <div className="space-y-2">
                        <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Platform Control</p>
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
                        <Link
                            href="/dashboard/accounting"
                            className={`block px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/dashboard/accounting')
                                ? 'active bg-slate-800 text-white font-medium border border-slate-700'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span>💰</span> Global Billing
                            </div>
                        </Link>
                        <Link
                            href="/dashboard/audit"
                            className={`block px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/dashboard/audit')
                                ? 'active bg-slate-800 text-white font-medium border border-slate-700'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span>📋</span> System Audit
                            </div>
                        </Link>
                    </div>
                )}
                {/* Hospital Management (Admin Only) */}
                {isHospitalAdmin && (
                    <div className="space-y-2">
                        <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Management</p>
                        <Link
                            href="/dashboard/accounting"
                            className={`block px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/dashboard/accounting')
                                ? 'active bg-slate-800 text-white font-medium border border-slate-700'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span>💰</span> Financials
                            </div>
                        </Link>
                        <Link
                            href="/dashboard/reports"
                            className={`block px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/dashboard/reports')
                                ? 'active bg-slate-800 text-white font-medium border border-slate-700'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span>📊</span> Business Intelligence
                            </div>
                        </Link>
                        <Link
                            href="/dashboard/audit"
                            className={`block px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/dashboard/audit')
                                ? 'active bg-slate-800 text-white font-medium'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span>📋</span> Hospital Audit
                            </div>
                        </Link>
                    </div>
                )}

                {/* Operations (All Authorized Roles) */}
                {(isPlatformAdmin || isHospitalAdmin || isStaff) && (
                    <div className="space-y-2">
                        <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Operations</p>
                        
                        <Link
                            href="/dashboard"
                            className={`block px-4 py-3 rounded-xl transition-all duration-200 ${pathname === '/dashboard'
                                ? 'active bg-slate-800 text-white font-medium border border-slate-700'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <LayoutDashboard className="w-5 h-5" />
                                Overview
                            </div>
                        </Link>

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

                        <Link
                            href="/dashboard/storage"
                            className={`block px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/dashboard/storage')
                                ? 'active bg-slate-800 text-white font-medium border border-slate-700'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span>📦</span> Warehouse
                            </div>
                        </Link>

                        {/* Specializations */}
                        {enabledModules.includes('dental') && (
                            <Link
                                href="/dashboard/dental"
                                className={`block px-4 py-3 rounded-xl transition-all duration-200 border ${isActive('/dashboard/dental')
                                    ? 'active bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/50'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3 font-medium">
                                    <span>🦷</span> Dental Clinic
                                </div>
                            </Link>
                        )}

                        {enabledModules.includes('ent') && (
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
                        )}
                    </div>
                )}


                {/* Settings Section */}
                <div className="space-y-2">
                    <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Account</p>

                    {(isPlatformAdmin || isHospitalAdmin || isStaff) && (
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
                    {userRole && (
                        <p className="text-[10px] text-center text-slate-600 mt-2 uppercase tracking-wider">
                            {userRole === 'hospital_admin' && specialty === 'Corporate' 
                                ? 'COMPANY ADMIN' 
                                : userRole.replace('_', ' ')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
