"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard, Users, CalendarDays, IndianRupee, Settings,
    LogOut, Menu, X, ChevronDown, Building2, Activity, Package, UserPlus, Bed, Trash2,
    ChevronLeft, ChevronRight, Stethoscope, Ear, Scissors, Pill
} from 'lucide-react';
import { getCurrentSubdomain } from '@/lib/utils';

interface IconProps {
    size?: number;
    className?: string;
    strokeWidth?: number;
}

const Tooth = ({ size = 16, className = '', strokeWidth = 2 }: IconProps) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M4 8.5C4 6 6 4 8.5 4C10.43 4 12 5.57 12 7.5C12 5.57 13.57 4 15.5 4C18 4 20 6 20 8.5C20 12.75 17 14 17 18C17 19.1 16.1 20 15 20C13.9 20 13 19.1 13 18C13 16.5 12 16.5 12 16.5C12 16.5 11 16.5 11 18C11 19.1 10.1 20 9 20C7.9 20 7 19.1 7 18C7 14 4 12.75 4 8.5Z" />
        </svg>
    );
};

const CATEGORIZED_NAV_ITEMS = [
    {
        category: 'Core Operations',
        items: [
            { label: 'Dashboard', href: '/hospital', icon: LayoutDashboard },
            { label: 'Patients', href: '/hospital/patients', icon: Users, roles: ['hospital_admin', 'doctor_opd', 'reception_staff'] },
            { label: 'Records & Archives', href: '/hospital/records', icon: Users, roles: ['hospital_admin', 'mrd_staff'] },
            { label: 'Recycle Bin', href: '/hospital/recycle-bin', icon: Trash2, roles: ['hospital_admin', 'platform_staff'] },
            { label: 'Appointments', href: '/hospital/appointments', icon: CalendarDays, roles: ['hospital_admin', 'doctor_opd', 'reception_staff'] },
        ]
    },
    {
        category: 'Clinical Specialties',
        items: [
            { label: 'Emergency / Casualty', href: '/hospital/emergency', icon: Activity, roles: ['hospital_admin', 'reception_staff', 'doctor_opd', 'doctor_ipd', 'nurse_ipd'] },
            { label: 'HMS Operations', href: '/hospital/hms', icon: Bed, roles: ['hospital_admin', 'nurse_ipd', 'doctor_ipd'], module: 'hms' },
            { label: 'Clinic OPD', href: '/hospital/clinic', icon: Stethoscope, roles: ['hospital_admin', 'doctor_opd'], module: 'clinic' },
            { label: 'Dental Portal', href: '/hospital/dental', icon: Tooth, roles: ['hospital_admin', 'doctor_opd'], module: 'dental' },
            { label: 'ENT Specialty', href: '/hospital/ent', icon: Ear, roles: ['hospital_admin', 'doctor_opd'], module: 'ent' },
            { label: 'Operation Theater', href: '/hospital/ot', icon: Scissors, roles: ['hospital_admin', 'doctor_opd', 'doctor_ipd', 'nurse_ipd'], module: 'hms' },
            { label: 'Pharmacy', href: '/hospital/pharmacy', icon: Pill, roles: ['hospital_admin', 'pharmacy_staff'], module: 'pharmacy' },
        ]
    },
    {
        category: 'Administration',
        items: [
            { label: 'Accounting & Billing', href: '/hospital/accounting', icon: IndianRupee, roles: ['hospital_admin', 'account_staff'], module: 'accounting' },
            { label: 'Inventory & Stock', href: '/hospital/inventory', icon: Package, roles: ['hospital_admin', 'mrd_staff'], module: 'inventory' },
            { label: 'Staff Management', href: '/hospital/staff', icon: UserPlus, roles: ['hospital_admin'] },
            { label: 'Doctors Directory', href: '/hospital/doctors', icon: Users, roles: ['hospital_admin'] },
            { label: 'Portal Settings', href: '/hospital/settings', icon: Settings, roles: ['hospital_admin'] },
        ]
    }
];

export default function HospitalNavbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [hospitalName, setHospitalName] = useState('Hospital Portal');
    const [hospitalLogo, setHospitalLogo] = useState<string | null>(null);
    const [userModules, setUserModules] = useState<string[]>([]);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        setUserRole(localStorage.getItem('userRole') || '');
        setUserEmail(localStorage.getItem('userEmail') || '');
        
        try {
            const modulesStr = localStorage.getItem('userModules');
            if (modulesStr) {
                setUserModules(JSON.parse(modulesStr));
            }
        } catch (e) {
            console.error(e);
        }
        
        const savedName = localStorage.getItem('hospitalName');
        const savedLogo = localStorage.getItem('hospitalLogo');
        
        if (savedLogo) {
            setHospitalLogo(savedLogo);
        }

        if (savedName) {
            setHospitalName(savedName);
        } else {
            const slug = getCurrentSubdomain();
            if (slug && slug !== 'admin') {
                setHospitalName(slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '));
            }
        }

        const savedCollapsed = localStorage.getItem('sidebarCollapsed');
        if (savedCollapsed !== null) {
            setIsCollapsed(savedCollapsed === 'true');
        }
    }, []);

    const toggleCollapse = () => {
        const nextState = !isCollapsed;
        setIsCollapsed(nextState);
        localStorage.setItem('sidebarCollapsed', String(nextState));
        window.dispatchEvent(new CustomEvent('hospitalSidebarCollapseChange', { detail: { collapsed: nextState } }));
    };

    const filterCategoryItems = (items: typeof CATEGORIZED_NAV_ITEMS[0]['items']) => {
        return items.filter(item => {
            if (item.roles && !item.roles.includes(userRole)) return false;
            // @ts-ignore
            if (item.module && !userModules.includes(item.module)) return false;
            return true;
        });
    };

    const handleLogout = () => {
        ['access_token','userRole','userEmail','userSpecialty','userModules',
         'userTerminology','loginTime','hospital_id','globalHospitalId',
         'mrd_hospital_id','dental_hospital_id','ent_hospital_id',
         'clinic_hospital_id','hms_hospital_id','inventory_hospital_id',
         'userGroupId','sidebarCollapsed', 'hospitalName', 'hospitalLogo'].forEach(k => localStorage.removeItem(k));
        router.push('/login');
    };

    // Helper to render links
    const renderNavLinks = (isMobile: boolean = false, collapsed: boolean = false) => {
        return CATEGORIZED_NAV_ITEMS.map(cat => {
            const visibleItems = filterCategoryItems(cat.items);
            if (visibleItems.length === 0) return null;

            return (
                <div key={cat.category} className={collapsed && !isMobile ? "mb-4 border-b border-slate-100/50 pb-4 last:border-0" : "mb-6"}>
                    {(!collapsed || isMobile) && (
                        <p className="px-4 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400 animate-in fade-in duration-300">
                            {cat.category}
                        </p>
                    )}
                    <div className="flex flex-col gap-1">
                        {visibleItems.map(item => {
                            const Icon = item.icon;
                            const active = pathname === item.href || (item.href !== '/hospital' && pathname.startsWith(item.href));
                            
                            if (collapsed && !isMobile) {
                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 relative group mx-auto ${
                                            active
                                                ? 'bg-gradient-to-br from-blue-50 to-indigo-50/50 text-blue-700 border border-blue-100/80 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Icon size={18} strokeWidth={2.5} className={active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'} />
                                        
                                        {/* Premium Hover Tooltip */}
                                        <span className="absolute left-14 bg-slate-900 border border-slate-800 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-xl opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-75 whitespace-nowrap z-50">
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            }

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => isMobile && setMobileOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 relative group ${
                                        active
                                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50/50 text-blue-700 shadow-sm border-l-4 border-blue-600 pl-3'
                                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                    }`}
                                >
                                    <Icon size={16} strokeWidth={2.5} className={active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'} />
                                    <span className="animate-in fade-in duration-300">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            );
        });
    };

    // User Profile quick view subcomponent
    const renderUserProfile = (collapsed: boolean = false) => {
        if (collapsed) {
            return (
                <div className="py-4 border-t border-slate-100 bg-slate-50/40 flex flex-col items-center gap-3 flex-shrink-0">
                    {/* User Avatar with Tooltip */}
                    <div className="relative group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/10 cursor-pointer">
                            {userEmail.charAt(0).toUpperCase() || 'U'}
                        </div>
                        {/* Profile Info Tooltip */}
                        <div className="absolute left-14 bottom-2 bg-slate-900 border border-slate-800 text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-xl opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-75 whitespace-nowrap z-50">
                            <p className="font-extrabold text-blue-400 uppercase tracking-widest leading-none mb-1">{hospitalName}</p>
                            <p className="text-xs text-white mb-1.5">{userEmail || 'User'}</p>
                            <span className="inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                {userRole.replace(/_/g, ' ')}
                            </span>
                        </div>
                    </div>

                    {/* Small Pulsing Live Indicator */}
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-white shadow-sm" title="Connection status: Live" />

                    {/* Compact Sign Out Button */}
                    <button
                        onClick={handleLogout}
                        className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors border border-transparent hover:border-red-100 group relative"
                        title="Sign Out"
                    >
                        <LogOut size={16} />
                        <span className="absolute left-14 bg-slate-900 border border-slate-800 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-xl opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-75 whitespace-nowrap z-50">
                            Sign Out
                        </span>
                    </button>
                </div>
            );
        }

        return (
            <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex-shrink-0">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/10">
                        {userEmail.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1 truncate">{hospitalName}</p>
                        <p className="text-xs font-bold text-slate-700 truncate leading-snug">{userEmail || 'User'}</p>
                        <span className="inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 mt-1">
                            {userRole.replace(/_/g, ' ')}
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">Live</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border border-transparent hover:border-red-100"
                    >
                        <LogOut size={13} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Desktop Left Sidebar */}
            <aside className={`hidden lg:flex fixed left-0 top-0 h-screen bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-lg flex-col z-40 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16 overflow-visible' : 'w-72'}`}>
                {/* Brand Logo Header */}
                <div className={`h-16 border-b border-slate-100 flex items-center bg-white/40 relative transition-all duration-300 flex-shrink-0 ${isCollapsed ? 'px-4 justify-center' : 'px-6 gap-3'}`}>
                    {hospitalLogo ? (
                        <img src={hospitalLogo} alt="Hospital Logo" className={`object-contain bg-white shadow-sm flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-8 h-8 rounded-lg' : 'w-9 h-9 rounded-xl'}`} />
                    ) : (
                        <div className={`bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-8 h-8 rounded-lg font-black text-sm' : 'w-9 h-9 rounded-xl'}`}>
                            <Building2 size={isCollapsed ? 14 : 16} className="text-white animate-in zoom-in duration-300" strokeWidth={2.5} />
                        </div>
                    )}
                    {!isCollapsed && (
                        <div className="min-w-0 animate-in fade-in duration-300">
                            <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest leading-none mb-1">Hospital Portal</p>
                            <p className="text-sm font-extrabold text-slate-800 leading-tight tracking-tight truncate">{hospitalName}</p>
                        </div>
                    )}

                    {/* Modern Border Collapse Button */}
                    <button 
                        onClick={toggleCollapse}
                        className={`p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all duration-200 absolute top-1/2 -translate-y-1/2 z-50 ${
                            isCollapsed 
                                ? '-right-3 bg-white border border-slate-200 rounded-full shadow-md p-0.5 hover:scale-110 active:scale-95' 
                                : 'right-4 border border-slate-100 hover:border-slate-200 shadow-sm bg-white'
                        }`}
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-blue-600" /> : <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />}
                    </button>
                </div>

                {/* Categorized Menu Links Container */}
                <div className={`flex-1 py-6 scrollbar-thin transition-all duration-300 ${isCollapsed ? 'px-2 overflow-visible' : 'px-4 overflow-y-auto'}`}>
                    {renderNavLinks(false, isCollapsed)}
                </div>

                {/* Secure User Profile & Controls at Bottom */}
                {renderUserProfile(isCollapsed)}
            </aside>

            {/* Mobile Header Bar */}
            <header className="lg:hidden fixed top-0 left-0 w-full h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm flex items-center justify-between px-4 z-40">
                <div className="flex items-center gap-3">
                    {hospitalLogo ? (
                        <img src={hospitalLogo} alt="Hospital Logo" className="w-8 h-8 object-contain rounded-lg" />
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white">
                            <Building2 size={14} strokeWidth={2.5} />
                        </div>
                    )}
                    <span className="text-sm font-black text-slate-800 truncate">{hospitalName}</span>
                </div>
                <button
                    onClick={() => setMobileOpen(o => !o)}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
                >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </header>

            {/* Mobile Sidebar Overlay Drawer */}
            {mobileOpen && (
                <>
                    {/* Backdrop */}
                    <div className="lg:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />
                    
                    {/* Sliding Panel */}
                    <aside className="lg:hidden fixed left-0 top-0 h-screen w-80 bg-white flex flex-col z-50 animate-in slide-in-from-left duration-300 shadow-2xl">
                        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {hospitalLogo ? (
                                    <img src={hospitalLogo} alt="Logo" className="w-8 h-8 object-contain" />
                                ) : (
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white">
                                        <Building2 size={14} />
                                    </div>
                                )}
                                <span className="text-sm font-black text-slate-800">{hospitalName}</span>
                            </div>
                            <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-50">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-6">
                            {renderNavLinks(true)}
                        </div>

                        {renderUserProfile()}
                    </aside>
                </>
            )}
        </>
    );
}
