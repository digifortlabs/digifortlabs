"use client";
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface SidebarProps {
    userRole: string;
}

export default function Sidebar({ userRole }: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

    return (
        <div className="w-72 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col flex-shrink-0 text-slate-300">
            {/* Brand Header */}
            <div className="h-20 flex items-center px-8 border-b border-slate-800 bg-slate-950">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
                        D
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight">DIGIFORT LABS</span>
                </div>
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
                                href="/dashboard/super-admin"
                                className={`block px-4 py-3 rounded-xl transition-all duration-200 border ${isActive('/dashboard/super-admin')
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/50'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3 font-medium">
                                    <span>🌍</span> Platform Admin
                                </div>
                            </Link>

                            <Link
                                href="/dashboard/audit"
                                className={`block px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/dashboard/audit')
                                    ? 'bg-slate-800 text-white font-medium'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span>📋</span> System Audit
                                </div>
                            </Link>
                        </>
                    )}

                    <Link
                        href="/dashboard"
                        className={`block px-4 py-3 rounded-xl transition-all duration-200 ${pathname === '/dashboard'
                            ? 'bg-slate-800 text-white font-medium border border-slate-700'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                            Dashboard Overview
                        </div>
                    </Link>

                    {/* Warehouse (Moved to Main Menu) */}
                    {(userRole === 'hospital_admin' || userRole === 'website_admin' || userRole === 'mrd_staff' || userRole === 'website_staff') && (
                        <Link
                            href="/dashboard/storage"
                            className={`block px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/dashboard/storage') && !isActive('/dashboard/storage/requests')
                                ? 'bg-slate-800 text-white font-medium border border-slate-700'
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
                                ? 'bg-slate-800 text-white font-medium border border-slate-700'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span>📂</span> Patient Records
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
                                        ? 'bg-amber-900/20 text-amber-500 font-medium border border-amber-900'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span>📤</span> Draft Queue
                                    </div>
                                </Link>
                            )}


                            <Link
                                href="/dashboard/requests"
                                className={`block px-4 py-3 rounded-xl transition-all duration-200 ${isActive('/dashboard/requests')
                                    ? 'bg-slate-800 text-white font-medium border border-slate-700'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span>🚚</span> Retrievals
                                </div>
                            </Link>
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
                                ? 'bg-slate-800 text-white font-medium border border-slate-700'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span>⚙️</span> Settings
                            </div>
                        </Link>
                    )}
                </div>
            </div >

            {/* Logout Footer */}
            < div className="p-6 border-t border-slate-800 bg-slate-950" >
                <button onClick={handleLogout} className="w-full flex items-center justify-between px-4 py-3 text-sm text-red-500 hover:bg-red-950/20 hover:text-red-400 rounded-xl transition-all font-bold">
                    <span>Sign Out</span>
                    <span className="text-xl">→</span>
                </button>
                {userRole && <p className="text-[10px] text-center text-slate-600 mt-2 uppercase tracking-wider">{userRole.replace('_', ' ')}</p>}
            </div >
        </div >
    );
}
