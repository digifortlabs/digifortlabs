import React from 'react';
import { AppWindow, Database, Ear, Building2, Stethoscope, Settings, Package, IndianRupee, ShieldCheck, BarChart3, Server } from 'lucide-react';

interface ModuleLauncherProps {
    enabledModules: string[];
    userRole: string;
    onLaunch: (path: string) => void;
    onUpsell: (module: string) => void;
}

const ModuleLauncher = ({ enabledModules, userRole, onLaunch, onUpsell }: ModuleLauncherProps) => {
    const isPrivileged = ['superadmin', 'superadmin_staff', 'website_admin'].includes(userRole);

    // Also read directly from localStorage in case the prop hasn't updated yet
    const effectiveModules = React.useMemo(() => {
        try {
            const stored = typeof window !== 'undefined' ? localStorage.getItem('userModules') : null;
            const fromStorage: string[] = stored ? JSON.parse(stored) : [];
            const merged = Array.from(new Set([...enabledModules, ...fromStorage]));
            return merged;
        } catch {
            return enabledModules;
        }
    }, [enabledModules]);

    const platformModules = [
        { id: 'hospitals', label: 'Tenants', icon: <Building2 size={20} />, color: 'blue', path: '/hospitals', req: [] },
        { id: 'billing', label: 'Billing', icon: <IndianRupee size={20} />, color: 'emerald', path: '/platform-billing', req: [] },
        { id: 'qa', label: 'Audit', icon: <ShieldCheck size={20} />, color: 'rose', path: '/qa', req: [] },
        { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} />, color: 'orange', path: '/reports', req: [] },
        { id: 'tools', label: 'Server Tools', icon: <Server size={20} />, color: 'indigo', path: '/server-manager', req: [] },
    ];

    const clinicalModules = [
        { id: 'mrd',       label: 'MRD',       icon: <Database size={20} />,    color: 'emerald', path: '/records',   req: ['mrd', 'core'] },
        { id: 'dental',    label: 'Dental',     icon: <AppWindow size={20} />,   color: 'teal',    path: '/dental',     req: ['dental'] },
        { id: 'ent',       label: 'ENT',        icon: <Ear size={20} />,         color: 'rose',    path: '/ent',        req: ['ent'] },
        { id: 'hms',       label: 'HMS',        icon: <Building2 size={20} />,   color: 'blue',    path: '/hms',        req: ['hms'] },
        { id: 'clinic',    label: 'Clinic',     icon: <Stethoscope size={20} />, color: 'orange',  path: '/clinic',     req: ['clinic'] },
        { id: 'inventory', label: 'Inventory',  icon: <Package size={20} />,     color: 'indigo',  path: '/inventory',  req: ['inventory', 'core'] },
    ];

    const modules = isPrivileged ? platformModules : clinicalModules;

    return (
        <div className="relative mb-5 p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <AppWindow size={14} className="text-blue-600" /> Module Command Center
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-7 gap-3 relative z-10">
                {modules.map((mod) => {
                    const isEnabled = isPrivileged || mod.req.some(r => effectiveModules.includes(r));
                    
                    return (
                        <button
                            key={mod.id}
                            onClick={() => {
                                if (isEnabled) {
                                    if (mod.id === 'mrd') localStorage.removeItem('mrd_hospital_id');
                                    else if (mod.id === 'dental') localStorage.removeItem('dental_hospital_id');
                                    else if (mod.id === 'ent') localStorage.removeItem('ent_hospital_id');
                                    else if (mod.id === 'clinic') localStorage.removeItem('clinic_hospital_id');
                                    else if (mod.id === 'hms') localStorage.removeItem('hms_hospital_id');
                                    else if (mod.id === 'inventory') localStorage.removeItem('inventory_hospital_id');
                                    onLaunch(mod.path);
                                } else {
                                    onUpsell(mod.label);
                                }
                            }}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 gap-2 border bg-white shadow-2xs hover:-translate-y-0.5 hover:shadow-sm cursor-pointer ${
                                isEnabled 
                                    ? 'border-slate-200 hover:border-blue-300 hover:bg-slate-50' 
                                    : 'border-slate-100 bg-slate-50/50 opacity-40 hover:opacity-70'
                            }`}
                        >
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                {React.cloneElement(mod.icon as any, { size: 18, strokeWidth: 2 })}
                            </div>
                            <span className="text-xs font-bold text-slate-700 tracking-tight text-center">{mod.label}</span>
                        </button>
                    );
                })}

                {/* Settings (Always enabled) */}
                <button
                    onClick={() => onLaunch('/settings')}
                    className="flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 gap-2 border bg-white shadow-2xs hover:-translate-y-0.5 hover:shadow-sm cursor-pointer border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                >
                    <div className="w-14 h-14 bg-slate-200/50 text-slate-500 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:bg-slate-850 group-hover:text-white group-hover:rotate-90 group-hover:shadow-[0_8px_20px_rgba(30,41,59,0.3)]">
                        <Settings size={24} strokeWidth={2.2} />
                    </div>
                    <span className="text-[11px] font-black text-slate-700 tracking-wider text-center uppercase group-hover:text-slate-950 transition-colors">Settings</span>
                </button>
            </div>
        </div>
    );
};

export default ModuleLauncher;
