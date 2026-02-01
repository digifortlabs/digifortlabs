"use client";
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Building2, Menu, X, Settings, LogOut, LayoutDashboard, Database, Archive, FileClock, Users as UsersIcon, Box, FileText, Receipt, Shield, HardDrive } from 'lucide-react';

interface DashboardNavbarProps {
    userRole: string;
}

export default function DashboardNavbar({ userRole }: DashboardNavbarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [hospitalName, setHospitalName] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

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
                    document.title = `DF | ${decoded.hospital_name}`;
                } else {
                    document.title = "Digifort Labs | Dashboard";
                }
                if (decoded.sub) {
                    setUserEmail(decoded.sub);
                    localStorage.setItem('userEmail', decoded.sub);
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

    const isSuperAdmin = userRole === 'superadmin';
    const isHospitalAdmin = userRole === 'hospital_admin';
    const isWarehouseManager = userRole === 'warehouse_manager';
    const isStaff = userRole === 'superadmin_staff';

    // Grouping Logic
    const showStorage = isSuperAdmin || isWarehouseManager;
    const showRequests = isHospitalAdmin || isWarehouseManager || isStaff || isSuperAdmin;
    const showArchive = isWarehouseManager || isHospitalAdmin || isSuperAdmin || isStaff;
    const showDrafts = isWarehouseManager || isSuperAdmin;
    const showWarehouseMenu = showStorage || showRequests || showArchive || showDrafts;

    return (
        <nav className="fixed top-0 w-full z-40 bg-slate-900 border-b border-slate-800 shadow-md">
            <div className="w-full px-4 lg:px-6">
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
                    <div className="flex items-center gap-2 lg:gap-8">
                        {/* Brand */}
                        <div className="flex-shrink-0 flex items-center">
                            <div className="bg-white rounded-lg px-1.5 py-1 md:px-2 md:py-1 transition-all">
                                <img src="/logo/longlogo.png" alt="Digifort Labs" className="h-6 md:h-8 w-auto object-contain" />
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
                            <Link
                                href="/dashboard"
                                className={`px-2 lg:px-3 py-2 rounded-md text-[11px] lg:text-sm font-medium transition-colors ${pathname === '/dashboard'
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                Overview
                            </Link>

                            {/* Super Admin Links */}
                            {isSuperAdmin && (
                                <Link
                                    href="/dashboard/hospital_mgmt"
                                    className={`px-2 lg:px-3 py-2 rounded-md text-[11px] lg:text-sm font-medium transition-colors ${isActive('/dashboard/hospital_mgmt')
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    Hospitals
                                </Link>
                            )}

                            {/* Records Link */}
                            {(isHospitalAdmin || isWarehouseManager || isSuperAdmin) && (
                                <Link
                                    href="/dashboard/records"
                                    className={`px-2 lg:px-3 py-2 rounded-md text-[11px] lg:text-sm font-medium transition-colors ${isActive('/dashboard/records')
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    Records
                                </Link>
                            )}

                            {/* Reports & Accounting */}
                            {isSuperAdmin && (
                                <>
                                    <Link
                                        href="/dashboard/reports"
                                        className={`px-2 lg:px-3 py-2 rounded-md text-[11px] lg:text-sm font-medium transition-colors ${isActive('/dashboard/reports')
                                            ? 'bg-slate-800 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                            }`}
                                    >
                                        Reports
                                    </Link>
                                    <Link
                                        href="/dashboard/accounting"
                                        className={`px-2 lg:px-3 py-2 rounded-md text-[11px] lg:text-sm font-medium transition-colors ${isActive('/dashboard/accounting')
                                            ? 'bg-slate-800 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                            }`}
                                    >
                                        Accounting
                                    </Link>
                                </>
                            )}

                            {/* Audit Logs */}
                            {isSuperAdmin && (
                                <Link
                                    href="/dashboard/audit"
                                    className={`px-2 lg:px-3 py-2 rounded-md text-[11px] lg:text-sm font-medium transition-colors ${isActive('/dashboard/audit')
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    Audit Logs
                                </Link>
                            )}

                            {/* Warehouse Dropdown */}
                            {showWarehouseMenu && (
                                <div className="relative group">
                                    <button
                                        className={`flex items-center gap-1 px-2 lg:px-3 py-2 rounded-md text-[11px] lg:text-sm font-medium transition-colors ${isActive('/dashboard/storage') || isActive('/dashboard/requests') || isActive('/dashboard/archive') || isActive('/dashboard/drafts')
                                            ? 'bg-slate-800 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                            }`}
                                    >
                                        Warehouse <span className="text-[10px]">▼</span>
                                    </button>
                                    <div className="absolute left-0 mt-0 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden hidden group-hover:block animate-in fade-in zoom-in-95 duration-150">
                                        <div className="p-1 space-y-0.5">
                                            {showStorage && (
                                                <Link href="/dashboard/storage" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg">
                                                    Overview
                                                </Link>
                                            )}
                                            {showRequests && (
                                                <Link href="/dashboard/requests" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg">
                                                    File Requests
                                                </Link>
                                            )}
                                            {showArchive && (
                                                <Link href="/dashboard/archive" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg">
                                                    Physical Archive
                                                </Link>
                                            )}
                                            {showDrafts && (
                                                <Link href="/dashboard/drafts" className="block px-4 py-2 text-sm text-amber-500 hover:bg-slate-800 hover:text-amber-400 rounded-lg">
                                                    Drafts
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Staff Mgmt */}
                            {isHospitalAdmin && (
                                <Link
                                    href="/dashboard/user_mgmt"
                                    className={`px-2 lg:px-3 py-2 rounded-md text-[11px] lg:text-sm font-medium transition-colors ${isActive('/dashboard/user_mgmt')
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    Staff
                                </Link>
                            )}

                        </div>
                    </div>

                    {/* Right Side: Account & Profile */}
                    <div className="flex items-center gap-4">
                        {/* Hospital Badge for Tenants */}
                        {hospitalName && (
                            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                                <Building2 size={14} className="text-indigo-400" />
                                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest whitespace-nowrap">
                                    {hospitalName}
                                </span>
                            </div>
                        )}

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            >
                                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20 border border-indigo-400">
                                    {(userEmail || 'U').charAt(0).toUpperCase()}
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-3 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                    {/* Header */}
                                    <div className="p-4 border-b border-slate-800 bg-slate-800/30">
                                        <p className="text-sm font-bold text-white truncate">{userEmail}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                                {userRole?.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Links */}
                                    <div className="p-2 space-y-1">
                                        {(userRole === 'hospital_admin' || userRole === 'superadmin' || userRole === 'superadmin_staff') && (
                                            <Link
                                                href="/dashboard/settings"
                                                onClick={() => setIsProfileOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                                            >
                                                <Settings size={16} /> Settings
                                            </Link>
                                        )}

                                        {isSuperAdmin && (
                                            <Link
                                                href="/dashboard/server-manager"
                                                onClick={() => setIsProfileOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-500 hover:bg-slate-800 hover:text-amber-400 transition-colors"
                                            >
                                                <HardDrive size={16} /> Server Manager
                                            </Link>
                                        )}

                                        <Link
                                            href="/dashboard/downloads"
                                            onClick={() => setIsProfileOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                                        >
                                            <Archive size={16} /> Scanner App
                                        </Link>
                                    </div>

                                    {/* Footer */}
                                    <div className="p-2 border-t border-slate-800 mt-1">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                                        >
                                            <LogOut size={16} /> Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
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

                        {/* Reports & Accounting Link - Admins */}
                        {userRole === 'superadmin' && (
                            <>
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
                                <Link
                                    href="/dashboard/accounting"
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive('/dashboard/accounting')
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <Receipt size={18} /> Accounting
                                </Link>
                            </>
                        )}

                        {isSuperAdmin && (
                            <Link
                                href="/dashboard/audit"
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive('/dashboard/audit')
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <Shield size={18} /> Audit Logs
                            </Link>
                        )}

                        {(userRole === 'superadmin' || userRole === 'warehouse_manager') && (
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
