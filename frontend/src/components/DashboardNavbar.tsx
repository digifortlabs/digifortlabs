"use client";
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Building2, Menu, X, Settings, LogOut, LayoutDashboard, Database, Archive, FileClock, Users as UsersIcon, Box, FileText } from 'lucide-react';

interface DashboardNavbarProps {
    userRole: string;
}

export default function DashboardNavbar({ userRole }: DashboardNavbarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [hospitalName, setHospitalName] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        setIsMenuOpen(false);
        localStorage.removeItem('token');
        router.push('/login');
    };

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

    return (
        <nav className="fixed top-0 w-full z-40 bg-slate-900 border-b border-slate-800 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Mobile Menu Toggle */}
                    <div className="flex md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-slate-400 hover:text-white p-2 transition-colors"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                    {/* Left Side: Logo & Main Nav */}
                    <div className="flex items-center gap-4 md:gap-8">
                        {/* Brand */}
                        <div className="flex-shrink-0 flex items-center">
                            <div className="bg-white rounded-lg px-2 py-1">
                                <img src="/logo/longlogo.png" alt="Digifort Labs" className="h-8 w-auto object-contain" />
                            </div>
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
                            {userRole === 'superadmin' && (
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
                            {(userRole === 'hospital_admin' || userRole === 'warehouse_manager' || userRole === 'superadmin') && (
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



                            {/* Reports Link - Admins */}
                            {(userRole === 'superadmin' || userRole === 'hospital_admin') && (
                                <Link
                                    href="/dashboard/reports"
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/dashboard/reports')
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    Reports
                                </Link>
                            )}

                            {/* Warehouse Link (Added by Request) */}
                            {/* Warehouse Link - Super Admin Only */}
                            {/* Warehouse Link - Super Admin Only */}
                            {userRole === 'superadmin' && (
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
                            {(userRole === 'hospital_admin' || userRole === 'warehouse_manager' || userRole === 'superadmin_staff' || userRole === 'superadmin') && (
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
                                    {(userRole === 'warehouse_manager' || userRole === 'hospital_admin' || userRole === 'superadmin' || userRole === 'superadmin_staff') && (
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

                                    {userRole === 'warehouse_manager' && (
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

                        <Link
                            href="/dashboard/downloads"
                            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                            title="Download Desktop Scanner"
                        >
                            <span className="text-xs font-bold text-slate-300">Scanner App</span>
                        </Link>

                        {(userRole === 'hospital_admin' || userRole === 'superadmin' || userRole === 'superadmin_staff') && (
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

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="md:hidden bg-slate-900 border-b border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-5 duration-200">
                    <div className="flex flex-col p-4 space-y-2">
                        <Link
                            href="/dashboard"
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${pathname === '/dashboard'
                                ? 'bg-slate-800 text-white'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <LayoutDashboard size={18} /> Overview
                        </Link>

                        {userRole === 'superadmin' && (
                            <Link
                                href="/dashboard/hospital_mgmt"
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive('/dashboard/hospital_mgmt')
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <Building2 size={18} /> Hospitals
                            </Link>
                        )}

                        {(userRole === 'hospital_admin' || userRole === 'warehouse_manager' || userRole === 'superadmin') && (
                            <Link
                                href="/dashboard/records"
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive('/dashboard/records')
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <Database size={18} /> Records
                            </Link>
                        )}

                        {(userRole === 'hospital_admin' || userRole === 'warehouse_manager' || userRole === 'superadmin_staff' || userRole === 'superadmin') && (
                            <>
                                {userRole === 'hospital_admin' && (
                                    <Link
                                        href="/dashboard/user_mgmt"
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive('/dashboard/user_mgmt')
                                            ? 'bg-slate-800 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                            }`}
                                    >
                                        <UsersIcon size={18} /> Staff Management
                                    </Link>
                                )}

                                <Link
                                    href="/dashboard/requests"
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive('/dashboard/requests')
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <FileClock size={18} /> File Requests
                                </Link>

                                <Link
                                    href="/dashboard/archive"
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive('/dashboard/archive')
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <Archive size={18} /> Physical Archive
                                </Link>
                            </>
                        )}

                        {/* Reports Link - Admins */}
                        {(userRole === 'superadmin' || userRole === 'hospital_admin') && (
                            <Link
                                href="/dashboard/reports"
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive('/dashboard/reports')
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <FileText size={18} /> Reports
                            </Link>
                        )}

                        {userRole === 'superadmin' && (
                            <Link
                                href="/dashboard/storage"
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive('/dashboard/storage') && !isActive('/dashboard/storage/requests')
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <Box size={18} /> Warehouse
                            </Link>
                        )}

                        <div className="pt-4 mt-4 border-t border-slate-800">
                            {(userRole === 'hospital_admin' || userRole === 'superadmin' || userRole === 'superadmin_staff') && (
                                <Link
                                    href="/dashboard/settings"
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive('/dashboard/settings')
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <Settings size={18} /> Settings
                                </Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                                <LogOut size={18} /> Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
