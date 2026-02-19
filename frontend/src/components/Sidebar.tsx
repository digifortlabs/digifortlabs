"use client";
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

import { useTerminology } from '@/hooks/useTerminology';

interface SidebarProps {
    userRole: string;
}

export default function Sidebar({ userRole }: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { terms, specialty } = useTerminology();

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
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
                    {userRole === 'website_admin' && (
                        <>
                            <Link
                                href="/dashboard/hospital_mgmt"
                                className={`block px-4 py-3 rounded-xl transition-all duration-200 border ${isActive('/dashboard/hospital_mgmt')
                                    ? 'active bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/50'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3 font-medium">
                                    <span>🌍</span> Platform Admin
                                </div>
                            </Link>
                        </>
                    )}

                    {(userRole === 'website_admin' || userRole === 'hospital_admin') && (
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

                    {/* Dental Specific Dashboard */}
                    {specialty === 'Dental' && (
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

                    {/* Warehouse (Moved to Main Menu) */}
                    {(userRole === 'hospital_admin' || userRole === 'website_admin' || userRole === 'mrd_staff' || userRole === 'website_staff') && (
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

                    {/* Patient Records */}
                    {(userRole === 'hospital_admin' || userRole === 'data_uploader' || userRole === 'website_staff' || userRole === 'mrd_staff') && (
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
                    (userRole === 'hospital_admin' || userRole === 'mrd_staff' || userRole === 'website_staff' || userRole === 'website_admin') && (
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

                    {(userRole === 'hospital_admin' || userRole === 'website_admin' || userRole === 'website_staff') && (
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
