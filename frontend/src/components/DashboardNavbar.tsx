"use client";
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';

interface DashboardNavbarProps {
    userRole: string;
}

export default function DashboardNavbar({ userRole }: DashboardNavbarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [hospitalName, setHospitalName] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const decoded = JSON.parse(jsonPayload);
                if (decoded.hospital_name) {
                    setHospitalName(decoded.hospital_name);
                }
            } catch (e) {
                console.error("Error decoding token", e);
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

    return (
        <nav className="fixed top-0 w-full z-40 bg-slate-900 border-b border-slate-800 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left Side: Logo & Main Nav */}
                    <div className="flex items-center gap-8">
                        {/* Brand */}
                        <div className="flex-shrink-0 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
                                D
                            </div>
                            <span className="text-lg font-bold text-white tracking-tight hidden md:block">DIGIFORT LABS</span>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-2">
                            <Link
                                href="/dashboard"
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === '/dashboard'
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                Overview
                            </Link>

                            {/* Super Admin Links */}
                            {userRole === 'website_admin' && (
                                <Link
                                    href="/dashboard/hospital_mgmt"
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/dashboard/hospital_mgmt')
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    Hospitals
                                </Link>
                            )}

                            {/* Records Link - Admins & MRD Staff */}
                            {(userRole === 'hospital_admin' || userRole === 'mrd_staff' || userRole === 'website_admin') && (
                                <Link
                                    href="/dashboard/records"
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/dashboard/records')
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    Records
                                </Link>
                            )}

                            {/* Audit Link - Super Admin & Hospital Admin */}
                            {(userRole === 'website_admin' || userRole === 'hospital_admin') && (
                                <Link
                                    href="/dashboard/audit"
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/dashboard/audit')
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    Audit
                                </Link>
                            )}

                            {/* Warehouse Link (Added by Request) */}
                            {/* Warehouse Link - Super Admin Only */}
                            {/* Warehouse Link - Super Admin Only (Restricted by User Request) */}
                            {userRole === 'website_admin' && (
                                <Link
                                    href="/dashboard/storage"
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/dashboard/storage') && !isActive('/dashboard/storage/requests')
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    Warehouse
                                </Link>
                            )}



                            {/* Operations */}
                            {(userRole === 'hospital_admin' || userRole === 'mrd_staff' || userRole === 'website_staff' || userRole === 'website_admin') && (
                                <>


                                    {/* Team Management - Hospital Admin Only */}
                                    {userRole === 'hospital_admin' && (
                                        <Link
                                            href="/dashboard/user_mgmt"
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/dashboard/user_mgmt')
                                                ? 'bg-slate-800 text-white'
                                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                                }`}
                                        >
                                            Staff
                                        </Link>
                                    )}

                                    {/* File Retrieval Requests */}
                                    <Link
                                        href="/dashboard/requests"
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/dashboard/requests')
                                            ? 'bg-slate-800 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                            }`}
                                    >
                                        File Requests
                                    </Link>
                                    {/* Physical Archive - Visible to MRD and Admins */}
                                    {(userRole === 'mrd_staff' || userRole === 'hospital_admin' || userRole === 'website_admin' || userRole === 'website_staff') && (
                                        <Link
                                            href="/dashboard/archive"
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/dashboard/archive')
                                                ? 'bg-slate-800 text-white'
                                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                                }`}
                                        >
                                            Archive
                                        </Link>
                                    )}

                                    {userRole === 'mrd_staff' && (
                                        <Link
                                            href="/dashboard/drafts"
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/dashboard/drafts')
                                                ? 'bg-amber-900/20 text-amber-500 border border-amber-900/50'
                                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                                }`}
                                        >
                                            Drafts
                                        </Link>
                                    )}


                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Account & Logout */}
                    <div className="flex items-center gap-4">
                        {/* Hospital Badge for Tenants */}
                        {hospitalName && (
                            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                                <Building2 size={14} className="text-indigo-400" />
                                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest truncate max-w-[150px]">
                                    {hospitalName}
                                </span>
                            </div>
                        )}

                        {(userRole === 'hospital_admin' || userRole === 'website_admin' || userRole === 'website_staff') && (
                            <Link
                                href="/dashboard/settings"
                                className={`text-slate-400 hover:text-white transition-colors ${isActive('/dashboard/settings') ? 'text-white' : ''}`}
                                title="Settings"
                            >
                                <span className="text-xl">⚙️</span>
                            </Link>
                        )}

                        <div className="flex items-center gap-4 pl-4 border-l border-slate-700">
                            {userRole && (
                                <span className="hidden lg:block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {userRole.replace('_', ' ')}
                                </span>
                            )}
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-lg shadow-red-900/20"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Placeholder (Hidden for now as desktop focus is primary request, but structure handles resizing decently) */}
        </nav>
    );
}
