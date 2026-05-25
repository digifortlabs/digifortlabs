import React from 'react';
import { AppWindow, Database, Ear, Building2, Stethoscope, Settings, Package } from 'lucide-react';

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

    const modules = [
        { id: 'mrd',       label: 'MRD',       icon: <Database size={20} />,    color: 'emerald', path: '/records',   req: ['mrd', 'core'] },
        { id: 'dental',    label: 'Dental',     icon: <AppWindow size={20} />,   color: 'teal',    path: '/dental',     req: ['dental'] },
        { id: 'ent',       label: 'ENT',        icon: <Ear size={20} />,         color: 'rose',    path: '/ent',        req: ['ent'] },
        { id: 'hms',       label: 'HMS',        icon: <Building2 size={20} />,   color: 'blue',    path: '/hms',        req: ['hms'] },
        { id: 'clinic',    label: 'Clinic',     icon: <Stethoscope size={20} />, color: 'orange',  path: '/clinic',     req: ['clinic'] },
        { id: 'inventory', label: 'Inventory',  icon: <Package size={20} />,     color: 'indigo',  path: '/inventory',  req: ['inventory', 'core'] },
    ];

    return (
        <div className="relative mb-6 p-6 sm:p-8 bg-gradient-to-br from-white/60 via-white/80 to-slate-50/50 backdrop-blur-2xl rounded-[2.25rem] shadow-[0_8px_32px_rgba(99,102,241,0.02)] border border-white/80 overflow-hidden">
            {/* Ambient neon blurs */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[90px] pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[90px] pointer-events-none translate-y-1/2 -translate-x-1/4"></div>
            
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 flex items-center gap-2 relative z-10">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <AppWindow size={14} className="text-indigo-500" /> Module Command Center
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4 relative z-10">
                {modules.map((mod) => {
                    const isEnabled = isPrivileged || mod.req.some(r => effectiveModules.includes(r));
                    
                    const bgClass = isEnabled 
                        ? (mod.color === 'emerald' ? 'from-emerald-500/[0.08] to-emerald-500/[0.02] border-emerald-500/15 hover:border-emerald-500/40 hover:shadow-emerald-500/20' :
                           mod.color === 'teal' ? 'from-teal-500/[0.08] to-teal-500/[0.02] border-teal-500/15 hover:border-teal-500/40 hover:shadow-teal-500/20' :
                           mod.color === 'rose' ? 'from-rose-500/[0.08] to-rose-500/[0.02] border-rose-500/15 hover:border-rose-500/40 hover:shadow-rose-500/20' :
                           mod.color === 'blue' ? 'from-blue-500/[0.08] to-blue-500/[0.02] border-blue-500/15 hover:border-blue-500/40 hover:shadow-blue-500/20' :
                           mod.color === 'orange' ? 'from-orange-500/[0.08] to-orange-500/[0.02] border-orange-500/15 hover:border-orange-500/40 hover:shadow-orange-500/20' :
                           'from-indigo-500/[0.08] to-indigo-500/[0.02] border-indigo-500/15 hover:border-indigo-500/40 hover:shadow-indigo-500/20')
                        : 'from-slate-100/40 to-slate-50/20 border-slate-200/40 opacity-45 hover:opacity-80';

                    const iconColorClass = isEnabled 
                        ? (mod.color === 'emerald' ? 'text-emerald-500 bg-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-[0_8px_20px_rgba(16,185,129,0.35)]' :
                           mod.color === 'teal' ? 'text-teal-500 bg-teal-500/10 group-hover:bg-teal-500 group-hover:text-white group-hover:shadow-[0_8px_20px_rgba(20,184,166,0.35)]' :
                           mod.color === 'rose' ? 'text-rose-500 bg-rose-500/10 group-hover:bg-rose-500 group-hover:text-white group-hover:shadow-[0_8px_20px_rgba(244,63,94,0.35)]' :
                           mod.color === 'blue' ? 'text-blue-500 bg-blue-500/10 group-hover:bg-blue-500 group-hover:text-white group-hover:shadow-[0_8px_20px_rgba(59,130,246,0.35)]' :
                           mod.color === 'orange' ? 'text-orange-500 bg-orange-500/10 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-[0_8px_20px_rgba(249,115,22,0.35)]' :
                           'text-indigo-500 bg-indigo-500/10 group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-[0_8px_20px_rgba(99,102,241,0.35)]')
                        : 'text-slate-400 bg-slate-200/50';

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
                            className={`flex flex-col items-center justify-center p-6 rounded-[2rem] transition-all duration-500 gap-4 group border bg-gradient-to-br shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] relative overflow-hidden cursor-pointer ${bgClass}`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${iconColorClass}`}>
                                {React.cloneElement(mod.icon as any, { size: 24, strokeWidth: 2.2 })}
                            </div>
                            <span className="text-[11px] font-black text-slate-700 tracking-wider text-center uppercase group-hover:text-slate-950 transition-colors">{mod.label}</span>
                        </button>
                    );
                })}

                {/* Settings (Always enabled) */}
                <button
                    onClick={() => onLaunch('/settings')}
                    className="flex flex-col items-center justify-center p-6 rounded-[2rem] transition-all duration-500 gap-4 group border bg-gradient-to-br from-slate-100/60 to-slate-50/40 border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-slate-400/30 hover:shadow-slate-500/10"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
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
