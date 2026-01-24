
import React from 'react';
import {
    LayoutGrid,
    ScanLine,
    Scan,
    Printer,
    History,
    Archive,
    FileText,
    Building2,
    Package
} from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    userRole: string;
}

const WarehouseSidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole }) => {
    const navItems = [
        { id: 'warehouse', label: 'Warehouse Map', icon: LayoutGrid },
        { id: 'archive', label: 'Archive View', icon: Archive },
        { id: 'requests', label: 'File Requests', icon: FileText },
        { id: 'bulk', label: 'Bulk Scan', icon: ScanLine },
        { id: 'scanner', label: 'File Tracker', icon: Scan },
        { id: 'manager', label: 'Rack Manager', icon: Building2 },
        { id: 'generator', label: 'Label Printer', icon: Printer },
        { id: 'logs', label: 'History Logs', icon: History },
    ];

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-52 bg-slate-900 h-[calc(100vh-2rem)] rounded-[2rem] p-4 shadow-2xl sticky top-4">
                {/* Header */}
                <div className="mb-6 px-1 pt-1">
                    <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <Package className="text-white" size={18} />
                        </div>
                        WAREHOUSE
                    </h1>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 pl-1">Command Center</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                                    ? 'bg-indigo-600/10 text-white'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                )}
                                <item.icon size={18} className={isActive ? 'text-indigo-400' : 'group-hover:text-white'} />
                                <span className={`text-xs font-bold ${isActive ? 'text-white' : ''}`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                {/* Footer Status */}
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-800 mt-auto">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">System Online</span>
                    </div>
                    <p className="text-[9px] text-slate-600">v3.2.0</p>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-4 py-2 z-50 flex justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.2)]">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}
                        >
                            <div className={`p-1.5 rounded-full ${isActive ? 'bg-indigo-500/10' : ''}`}>
                                <item.icon size={18} />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wide">{item.label.split(' ')[0]}</span>
                        </button>
                    )
                })}
            </div>
        </>
    );
};

export default WarehouseSidebar;
