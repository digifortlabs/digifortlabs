"use client";

import React from 'react';
import { Search, Loader2, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardPageShellProps {
    title: string;
    description?: string;
    icon: LucideIcon;
    children: React.ReactNode;
    actions?: React.ReactNode;
    searchPlaceholder?: string;
    searchTerm?: string;
    onSearchChange?: (val: string) => void;
    isSearching?: boolean;
    tabs?: { id: string; label: string }[];
    activeTab?: string;
    onTabChange?: (id: string) => void;
    loading?: boolean;
}

export default function DashboardPageShell({
    title,
    description,
    icon: Icon,
    children,
    actions,
    searchPlaceholder = "Search...",
    searchTerm,
    onSearchChange,
    isSearching,
    tabs,
    activeTab,
    onTabChange,
    loading
}: DashboardPageShellProps) {
    return (
        <div className="min-h-screen bg-slate-50/50 p-3 lg:p-4 pt-4">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <Icon size={24} className="text-indigo-600" /> {title}
                    </h1>
                    {description && <p className="text-slate-500 mt-1 text-xs">{description}</p>}
                </div>
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-6">
                {tabs && (
                    <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange?.(tab.id)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all",
                                    activeTab === tab.id
                                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                        : "text-slate-500 hover:bg-white/50"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                {onSearchChange && (
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium transition text-sm"
                        />
                        {isSearching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-indigo-500" size={16} />
                        )}
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className={cn("relative", loading && "opacity-50 pointer-events-none")}>
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <Loader2 className="animate-spin text-indigo-600" size={40} />
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}
