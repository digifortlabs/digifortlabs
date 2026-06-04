"use client";
import {
    Users, LayoutDashboard, Settings, UserCircle, LogOut, FileText, ChevronDown, Activity, Calendar as CalendarIcon, Package, ShoppingBag, BrainCircuit, Ear, Factory, BarChart3, ShieldCheck,
    Building2, DollarSign, ClipboardList, Inbox, Archive, FolderOpen, Clock, Shield, ChevronLeft, ChevronRight, Wallet, Trash2, Smartphone
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useTerminology } from '@/hooks/useTerminology';
import { getDomainUrl } from '@/lib/utils';

interface SidebarProps {
    userRole: string;
    hospitalSlug?: string;
}

export default function Sidebar({ userRole, hospitalSlug }: SidebarProps) {
    const dashboardSubdomain = hospitalSlug || null;
    const router = useRouter();
    const pathname = usePathname();
    const { terms, specialty, enabledModules = [], pricingTier = 'C' } = useTerminology();
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        if (saved !== null) {
            setIsCollapsed(saved === 'true');
        }
    }, []);

    const handleLogout = async () => {
        const { logout } = await import('@/config/api');
        await logout();
    };

    const toggleCollapse = () => {
        const nextState = !isCollapsed;
        setIsCollapsed(nextState);
        localStorage.setItem('sidebarCollapsed', String(nextState));
    };

    const isActive = (path: string) => pathname === path || (pathname?.startsWith(path + '/') ?? false);

    const isPlatformAdmin = ['superadmin', 'superadmin_staff', 'website_admin', 'warehouse_manager'].includes(userRole);
    const isGroupAdmin = userRole === 'group_admin';
    const isHospitalAdmin = userRole === 'hospital_admin';
    const isStaff = ['hospital_staff', 'mrd_staff', 'website_staff', 'data_uploader'].includes(userRole);

    const showWarehouse = isPlatformAdmin || (pricingTier === 'C');
    const showFinancials = isPlatformAdmin || isHospitalAdmin || isGroupAdmin;
    const showAnalytics = isPlatformAdmin || isHospitalAdmin || isGroupAdmin;

    return (
        <div className={`bg-slate-900 border-r border-slate-800 hidden md:flex flex-col flex-shrink-0 text-slate-300 transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-16 overflow-visible' : 'w-64'}`}>
            {/* Brand Header */}
            <div className="h-16 flex items-center justify-center border-b border-slate-800 bg-slate-950 px-4 relative transition-all duration-300">
                <div className={`bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/5 transition-all duration-300 ${
                    isCollapsed ? 'w-10 h-10' : 'w-[80%] h-11'
                }`}>
                    <img 
                        src={isCollapsed ? "/logo/logo.png" : "/logo/longlogo.png"} 
                        alt="DF" 
                        className={`object-contain transition-all duration-300 ${
                            isCollapsed ? 'h-5 w-5' : 'h-7 w-auto'
                        }`} 
                    />
                </div>
                
                {/* Modern Border Collapse Button */}
                <button 
                    onClick={toggleCollapse}
                    className={`p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all duration-200 absolute ${
                        isCollapsed 
                            ? '-right-3 top-5 bg-slate-900 border border-slate-800 rounded-full shadow-lg p-0.5 hover:scale-110 active:scale-95 z-50' 
                            : 'right-4 top-1/2 -translate-y-1/2'
                    }`}
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Navigation */}
            <div className={`flex-1 p-5 space-y-6 ${isCollapsed ? 'px-2.5 overflow-visible' : 'overflow-y-auto'}`}>
                {/* Global Overview (Always on Top) */}
                <div className="space-y-1">
                    <Link
                        href={getDomainUrl(dashboardSubdomain, '/admin') || '/admin'}
                        className={`block rounded-xl transition-all duration-200 border relative group ${pathname === '/admin'
                            ? 'active bg-slate-800 text-white font-medium border-slate-700'
                            : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                            } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                    >
                        <div className="flex items-center gap-3 text-xs">
                            <LayoutDashboard className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                            {!isCollapsed && <span>Overview</span>}
                        </div>
                        
                        {isCollapsed && (
                            <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                Overview
                            </span>
                        )}
                    </Link>
                </div>

                {/* Global Actions - Scoped */}
                {(!isPlatformAdmin && (isHospitalAdmin || isStaff)) && (
                    <div className="space-y-4">
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('open-global-patient-register'))}
                            className={`bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-900/50 flex items-center justify-center transition-all active:scale-95 group border border-indigo-400/30 relative ${
                                isCollapsed ? 'w-10 h-10 mx-auto' : 'w-full py-3 gap-3'
                            }`}
                        >
                            <div className="bg-white/20 p-2 rounded-xl group-hover:bg-white/30 transition-colors">
                                <Users className="w-4 h-4" />
                            </div>
                            {!isCollapsed && <span className="tracking-tight uppercase text-xs">Add New {terms.patient}</span>}
                            
                            {isCollapsed && (
                                <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                    Add New {terms.patient}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* Platform Administration (Super/Website Admin Only) */}
                {isPlatformAdmin && (
                    <div className="space-y-1">
                        {!isCollapsed && <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Platform Control</p>}
                        
                        <Link
                            href={getDomainUrl('admin', '/admin/hospitals')}
                            className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/admin/hospitals')
                                ? 'active bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/50'
                                : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                        >
                            <div className="flex items-center gap-3 text-xs font-semibold">
                                <Building2 className="w-4 h-4" />
                                {!isCollapsed && <span>Manage Clients</span>}
                            </div>
                            
                            {isCollapsed && (
                                <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                    Manage Clients
                                </span>
                            )}
                        </Link>
                        
                        <Link
                            href={getDomainUrl('admin', '/admin/platform-billing')}
                            className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/admin/platform-billing')
                                ? 'active bg-slate-800 text-white font-medium border-slate-700'
                                : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                        >
                            <div className="flex items-center gap-3 text-xs font-semibold">
                                <Wallet className="w-4 h-4" />
                                {!isCollapsed && <span>Platform Billing</span>}
                            </div>
                            
                            {isCollapsed && (
                                <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                    Platform Billing
                                </span>
                            )}
                        </Link>
                        
                        <Link
                            href={getDomainUrl('admin', '/admin/whatsapp')}
                            className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/admin/whatsapp')
                                ? 'active bg-slate-800 text-white font-medium border-slate-700'
                                : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                        >
                            <div className="flex items-center gap-3 text-xs font-semibold">
                                <Smartphone className="w-4 h-4 text-green-500" />
                                {!isCollapsed && <span>WhatsApp Connections</span>}
                            </div>
                            
                            {isCollapsed && (
                                <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                    WhatsApp Connections
                                </span>
                            )}
                        </Link>
                        
                        <Link
                            href={getDomainUrl(dashboardSubdomain, '/admin/audit')}
                            className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/admin/audit')
                                ? 'active bg-slate-800 text-white font-medium border-slate-700'
                                : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                        >
                            <div className="flex items-center gap-3 text-xs">
                                <ClipboardList className="w-4 h-4 text-slate-400" />
                                {!isCollapsed && <span>System Audit</span>}
                            </div>
                            
                            {isCollapsed && (
                                <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                    System Audit
                                </span>
                            )}
                        </Link>
                        
                        <Link
                            href={getDomainUrl('admin', '/admin/qa')}
                            className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/admin/qa')
                                ? 'active bg-slate-800 text-white font-medium border-slate-700'
                                : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                        >
                            <div className="flex items-center gap-3 text-xs">
                                <Activity className="w-4 h-4 text-rose-500" />
                                {!isCollapsed && <span>QA Monitor</span>}
                            </div>
                            
                            {isCollapsed && (
                                <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                    QA Monitor
                                </span>
                            )}
                        </Link>
                    </div>
                )}

                {/* Hospital Management (Admin & Group Admin) */}
                {(isHospitalAdmin || isGroupAdmin) && (
                    <div className="space-y-1">
                        {!isCollapsed && <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Management</p>}
                        
                        {showFinancials && (
                            <Link
                                href={getDomainUrl(dashboardSubdomain, '/accounting')}
                                className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/accounting')
                                    ? 'active bg-slate-800 text-white font-medium border-slate-700'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                            >
                                <div className="flex items-center gap-3 text-xs">
                                    <DollarSign className="w-4 h-4 text-emerald-500" />
                                    {!isCollapsed && <span>Financials</span>}
                                </div>
                                
                                {isCollapsed && (
                                    <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                        Financials
                                    </span>
                                )}
                            </Link>
                        )}
                        
                        {showAnalytics && (
                            <Link
                                href={getDomainUrl(dashboardSubdomain, '/reports')}
                                className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/reports')
                                    ? 'active bg-slate-800 text-white font-medium border-slate-700'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                            >
                                <div className="flex items-center gap-3 text-xs">
                                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                                    {!isCollapsed && <span>Business Intelligence</span>}
                                </div>
                                
                                {isCollapsed && (
                                    <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                        Business Intelligence
                                    </span>
                                )}
                            </Link>
                        )}
                        
                        <Link
                            href={getDomainUrl('admin', '/compliance')}
                            className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/compliance')
                                ? 'active bg-slate-800 text-white font-medium border-slate-700'
                                : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                        >
                            <div className="flex items-center gap-3 text-xs font-bold text-indigo-400">
                                <ShieldCheck className="w-4 h-4" />
                                {!isCollapsed && <span>Compliance Hub</span>}
                            </div>
                            
                            {isCollapsed && (
                                <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                    Compliance Hub
                                </span>
                            )}
                        </Link>
                        
                        <Link
                            href={getDomainUrl(dashboardSubdomain, '/audit')}
                            className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/audit')
                                ? 'active bg-slate-800 text-white font-medium border-slate-700'
                                : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                        >
                            <div className="flex items-center gap-3 text-xs">
                                <ClipboardList className="w-4 h-4 text-slate-400" />
                                {!isCollapsed && <span>Audit Logs</span>}
                            </div>
                            
                            {isCollapsed && (
                                <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                    Audit Logs
                                </span>
                            )}
                        </Link>
                    </div>
                )}

                {/* Operations (All Authorized Roles) */}
                {(isPlatformAdmin || isHospitalAdmin || isStaff) && (
                    <div className="space-y-1">
                        {!isCollapsed && <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Operations</p>}

                        {(isGroupAdmin || (typeof window !== 'undefined' && localStorage.getItem('userGroupId'))) && (
                            <Link
                                href={getDomainUrl(dashboardSubdomain, '/group-overview')}
                                className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/group-overview')
                                    ? 'active bg-indigo-600/10 text-indigo-400 font-bold border border-indigo-900/30'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                            >
                                <div className="flex items-center gap-3 text-xs">
                                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                                    {!isCollapsed && <span>Group Analytics</span>}
                                </div>
                                
                                {isCollapsed && (
                                    <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                        Group Analytics
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* File Requests (MRD File Management) */}
                        {(isPlatformAdmin || isHospitalAdmin || isGroupAdmin || userRole === 'warehouse_manager' || userRole === 'mrd_staff') && (
                            <Link
                                href={getDomainUrl(dashboardSubdomain, '/requests')}
                                className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/requests')
                                    ? 'active bg-slate-800 text-white font-medium border-slate-700'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                            >
                                <div className="flex items-center gap-3 text-xs">
                                    <Inbox className="w-4 h-4 text-blue-400" />
                                    {!isCollapsed && <span>File Requests</span>}
                                </div>
                                
                                {isCollapsed && (
                                    <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                        File Requests
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* Physical Archive (MRD File Management) */}
                        {(isPlatformAdmin || isHospitalAdmin || isGroupAdmin || userRole === 'warehouse_manager' || userRole === 'mrd_staff') && (
                            <Link
                                href={getDomainUrl(dashboardSubdomain, '/archive')}
                                className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/archive')
                                    ? 'active bg-slate-800 text-white font-medium border border-slate-700'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                            >
                                <div className="flex items-center gap-3 text-xs">
                                    <Archive className="w-4 h-4 text-amber-500" />
                                    {!isCollapsed && <span>Physical Archive</span>}
                                </div>
                                
                                {isCollapsed && (
                                    <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                        Physical Archive
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* MRD Dashboard */}
                        {(isPlatformAdmin || isHospitalAdmin || isGroupAdmin || userRole === 'mrd_staff') && (
                            <Link
                                href={getDomainUrl(dashboardSubdomain, '/mrd')}
                                className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/mrd')
                                    ? 'active bg-slate-800 text-white font-medium border border-slate-700'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                            >
                                <div className="flex items-center gap-3 text-xs">
                                    <Archive className="w-4 h-4 text-indigo-500" />
                                    {!isCollapsed && <span>MRD Dashboard</span>}
                                </div>
                                
                                {isCollapsed && (
                                    <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                        MRD Dashboard
                                    </span>
                                )}
                            </Link>
                        )}

                        <Link
                            href={getDomainUrl(dashboardSubdomain, '/records')}
                            className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/records')
                                ? 'active bg-slate-800 text-white font-medium border-slate-700'
                                : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                        >
                            <div className="flex items-center gap-3 text-xs">
                                <FolderOpen className="w-4 h-4 text-slate-400" />
                                {!isCollapsed && <span>{terms.patient} Records</span>}
                            </div>
                            
                            {isCollapsed && (
                                <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                    {terms.patient} Records
                                </span>
                            )}
                        </Link>

                        <Link
                            href={getDomainUrl(dashboardSubdomain, '/recycle-bin')}
                            className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/recycle-bin')
                                ? 'active bg-slate-800 text-white font-medium border-slate-700'
                                : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                        >
                            <div className="flex items-center gap-3 text-xs">
                                <Trash2 className="w-4 h-4 text-red-400" />
                                {!isCollapsed && <span>Recycle Bin</span>}
                            </div>
                            
                            {isCollapsed && (
                                <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                    Recycle Bin
                                </span>
                            )}
                        </Link>

                        {/* Hide appointments for Platform Admin */}
                        {!isPlatformAdmin && (
                            <Link
                                href={getDomainUrl(dashboardSubdomain, '/appointments')}
                                className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/appointments')
                                    ? 'active bg-slate-800 text-white font-medium border-slate-700'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                            >
                                <div className="flex items-center gap-3 text-xs">
                                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                                    {!isCollapsed && <span>Appointments</span>}
                                </div>
                                
                                {isCollapsed && (
                                    <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                        Appointments
                                    </span>
                                )}
                            </Link>
                        )}
                        
                        {/* Emergency / Casualty (Not for Platform Admin) */}
                        {!isPlatformAdmin && (terms.hospital.toLowerCase().includes('hospital') || specialty === 'General' || isHospitalAdmin) && (
                            <Link
                                href={getDomainUrl(dashboardSubdomain, '/emergency')}
                                className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/emergency')
                                    ? 'active bg-red-600/10 text-red-500 font-bold border border-red-900/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                            >
                                <div className="flex items-center gap-3 text-xs">
                                    <svg className={`w-4 h-4 ${isActive('/emergency') ? 'text-red-500' : 'text-red-400 group-hover:text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    {!isCollapsed && <span className={isActive('/emergency') ? 'text-red-500' : 'text-red-400'}>Emergency / Casualty</span>}
                                </div>
                                
                                {isCollapsed && (
                                    <span className="absolute left-16 bg-red-900 border border-red-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50">
                                        Emergency
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* Doctors Management */}
                        {(isHospitalAdmin || isGroupAdmin || isPlatformAdmin) && (
                            <Link
                                href={getDomainUrl(dashboardSubdomain, '/doctors')}
                                className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/doctors')
                                    ? 'active bg-slate-800 text-white font-medium border-slate-700'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                            >
                                <div className="flex items-center gap-3 text-xs">
                                    <Users className="w-4 h-4 text-indigo-400" />
                                    {!isCollapsed && <span>Doctors Directory</span>}
                                </div>
                                
                                {isCollapsed && (
                                    <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                        Doctors Directory
                                    </span>
                                )}
                            </Link>
                        )}

                        {userRole === 'mrd_staff' && (
                            <Link
                                href={getDomainUrl(dashboardSubdomain, '/drafts')}
                                className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/drafts')
                                    ? 'active bg-amber-900/20 text-amber-500 font-medium border border-amber-900'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                            >
                                <div className="flex items-center gap-3 text-xs">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                    {!isCollapsed && <span>Draft Queue</span>}
                                </div>
                                
                                {isCollapsed && (
                                    <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                        Draft Queue
                                    </span>
                                )}
                            </Link>
                        )}

                        {showWarehouse && (
                            <Link
                                href={getDomainUrl('admin', '/inventory')}
                                className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/inventory')
                                    ? 'active bg-slate-800 text-white font-medium border border-slate-700'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                            >
                                <div className="flex items-center gap-3 text-xs">
                                    <Package className="w-4 h-4 text-slate-400" />
                                    {!isCollapsed && <span>Inventory</span>}
                                </div>
                                
                                {isCollapsed && (
                                    <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                        Inventory
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* Specializations */}
                        {enabledModules.includes('dental') && (
                            <Link
                                href={getDomainUrl(dashboardSubdomain, '/dental')}
                                className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/dental')
                                    ? 'active bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/50'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                            >
                                <div className="flex items-center gap-3 text-xs font-semibold">
                                    <Activity className="w-4 h-4 text-emerald-400" />
                                    {!isCollapsed && <span>Dental Clinic</span>}
                                </div>
                                
                                {isCollapsed && (
                                    <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                        Dental Clinic
                                    </span>
                                )}
                            </Link>
                        )}

                        {enabledModules.includes('ent') && (
                            <Link
                                href={getDomainUrl(dashboardSubdomain, '/ent')}
                                className={`block rounded-xl transition-all duration-200 border relative group ${isActive('/ent')
                                    ? 'active bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/50'
                                    : 'text-slate-400 hover:bg-slate-800 border-transparent hover:text-white'
                                    } ${isCollapsed ? 'p-2.5 w-10 h-10 mx-auto flex items-center justify-center' : 'px-4 py-2'}`}
                            >
                                <div className="flex items-center gap-3 text-xs font-semibold">
                                    <Ear className="w-4 h-4 text-blue-400" />
                                    {!isCollapsed && <span>ENT Clinic</span>}
                                </div>
                                
                                {isCollapsed && (
                                    <span className="absolute left-16 bg-slate-900 border border-slate-800 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 whitespace-nowrap z-50 border-slate-700/50">
                                        ENT Clinic
                                    </span>
                                )}
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
