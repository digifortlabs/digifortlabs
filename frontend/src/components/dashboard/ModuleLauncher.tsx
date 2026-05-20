import React from 'react';
import { AppWindow, Database, Ear, Building2, Stethoscope, Settings, Package } from 'lucide-react';
import { getDomainUrl } from '@/lib/utils';

interface ModuleLauncherProps {
    enabledModules: string[];
    userRole: string;
    onLaunch: (path: string) => void;
    onUpsell: (module: string) => void;
}

const ModuleLauncher = ({ enabledModules, userRole, onLaunch, onUpsell }: ModuleLauncherProps) => {
    const isSuperAdmin = userRole === 'superadmin';

    const modules = [
        { id: 'mrd', label: 'MRD', icon: <Database size={20} />, color: 'emerald', path: getDomainUrl('dashboard', '/records'), req: ['mrd', 'core'] },
        { id: 'dental', label: 'Dental', icon: <AppWindow size={20} />, color: 'teal', path: getDomainUrl('dashboard', '/dental'), req: ['dental'] },
        { id: 'ent', label: 'ENT', icon: <Ear size={20} />, color: 'rose', path: getDomainUrl('dashboard', '/ent'), req: ['ent'] },
        { id: 'hms', label: 'HMS', icon: <Building2 size={20} />, color: 'blue', path: getDomainUrl('dashboard', '/hms'), req: ['hms'] },
        { id: 'clinic', label: 'Clinic', icon: <Stethoscope size={20} />, color: 'orange', path: getDomainUrl('dashboard', '/clinic'), req: ['clinic'] },
        { id: 'inventory', label: 'Inventory', icon: <Package size={20} />, color: 'indigo', path: getDomainUrl('dashboard', '/inventory'), req: ['inventory', 'core'] },
    ];

    return (
        <div className="mb-6 p-5 sm:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-[11px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AppWindow size={14} /> Module Launcher
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-3 sm:gap-4">
                {modules.map((mod) => {
                    const isEnabled = isSuperAdmin || mod.req.some(r => enabledModules.includes(r));
                    
                    // Direct Tailwind classes for reliability
                    const bgClass = isEnabled 
                        ? (mod.color === 'emerald' ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-100' :
                           mod.color === 'teal' ? 'bg-teal-50 hover:bg-teal-100 border-teal-100' :
                           mod.color === 'rose' ? 'bg-rose-50 hover:bg-rose-100 border-rose-100' :
                           mod.color === 'blue' ? 'bg-blue-50 hover:bg-blue-100 border-blue-100' :
                           mod.color === 'orange' ? 'bg-orange-50 hover:bg-orange-100 border-orange-100' :
                           'bg-indigo-50 hover:bg-indigo-100 border-indigo-100')
                        : 'bg-slate-50 border-slate-100 opacity-70 hover:opacity-100';

                    const iconColorClass = isEnabled 
                        ? (mod.color === 'emerald' ? 'text-emerald-600' :
                           mod.color === 'teal' ? 'text-teal-600' :
                           mod.color === 'rose' ? 'text-rose-600' :
                           mod.color === 'blue' ? 'text-blue-600' :
                           mod.color === 'orange' ? 'text-orange-600' :
                           'text-indigo-600')
                        : 'text-slate-400';

                    return (
                        <button
                            key={mod.id}
                            onClick={() => isEnabled ? onLaunch(mod.path) : onUpsell(mod.label)}
                            className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-all gap-2 group border ${bgClass}`}
                        >
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${iconColorClass}`}>
                                {mod.icon}
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 text-center uppercase">{mod.label}</span>
                        </button>
                    );
                })}

                {/* Settings (Always enabled) */}
                <button
                    onClick={() => onLaunch(getDomainUrl('dashboard', '/settings'))}
                    className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-all gap-2 group border bg-slate-100 hover:bg-slate-200 border-slate-200"
                >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-700 group-hover:scale-110 transition-transform group-hover:rotate-45 duration-300">
                        <Settings size={20} />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 text-center uppercase">Settings</span>
                </button>
            </div>
        </div>
    );
};

export default ModuleLauncher;
