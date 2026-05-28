"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard, Users, CalendarDays, IndianRupee, Settings,
    LogOut, Menu, X, ChevronDown, Building2, Activity, Package, UserPlus, Bed, Trash2
} from 'lucide-react';
import { getCurrentSubdomain } from '@/lib/utils';

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
            { label: 'HMS Operations', href: '/hospital/hms', icon: Bed, roles: ['hospital_admin', 'nurse_ipd', 'doctor_ipd'] },
            { label: 'Clinic OPD', href: '/hospital/clinic', icon: Activity, roles: ['hospital_admin', 'doctor_opd'] },
            { label: 'Dental Portal', href: '/hospital/dental', icon: Activity, roles: ['hospital_admin', 'doctor_opd'] },
            { label: 'ENT Specialty', href: '/hospital/ent', icon: Activity, roles: ['hospital_admin', 'doctor_opd'] },
        ]
    },
    {
        category: 'Administration',
        items: [
            { label: 'Accounting & Billing', href: '/hospital/accounting', icon: IndianRupee, roles: ['hospital_admin', 'account_staff'] },
            { label: 'Inventory & Stock', href: '/hospital/inventory', icon: Package, roles: ['hospital_admin', 'mrd_staff'] },
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

    useEffect(() => {
        setUserRole(localStorage.getItem('userRole') || '');
        setUserEmail(localStorage.getItem('userEmail') || '');
        
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
    }, []);

    const filterCategoryItems = (items: typeof CATEGORIZED_NAV_ITEMS[0]['items']) => {
        return items.filter(item => {
            if (!item.roles) return true;
            return item.roles.includes(userRole);
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
    const renderNavLinks = (isMobile: boolean = false) => {
        return CATEGORIZED_NAV_ITEMS.map(cat => {
            const visibleItems = filterCategoryItems(cat.items);
            if (visibleItems.length === 0) return null;

            return (
                <div key={cat.category} className="mb-6">
                    <p className="px-4 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {cat.category}
                    </p>
                    <div className="flex flex-col gap-1">
                        {visibleItems.map(item => {
                            const Icon = item.icon;
                            const active = pathname === item.href || (item.href !== '/hospital' && pathname.startsWith(item.href));
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
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            );
        });
    };

    // User Profile quick view subcomponent
    const renderUserProfile = () => {
        return (
            <div className="p-4 border-t border-slate-100 bg-slate-50/40">
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
            <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-lg flex-col z-40">
                {/* Brand Logo Header */}
                <div className="h-16 px-6 border-b border-slate-100 flex items-center gap-3 bg-white/40">
                    {hospitalLogo ? (
                        <img src={hospitalLogo} alt="Hospital Logo" className="w-9 h-9 object-contain rounded-xl bg-white shadow-sm" />
                    ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Building2 size={16} className="text-white" strokeWidth={2.5} />
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest leading-none mb-1">Hospital Portal</p>
                        <p className="text-base font-extrabold text-slate-800 leading-tight tracking-tight truncate">{hospitalName}</p>
                    </div>
                </div>

                {/* Categorized Menu Links Container */}
                <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
                    {renderNavLinks(false)}
                </div>

                {/* Secure User Profile & Controls at Bottom */}
                {renderUserProfile()}
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
