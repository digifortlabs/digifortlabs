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
            {/* Unified Top Bar */}
            <div className="flex items-center gap-3 mb-6 bg-white border border-slate-200/80 rounded-2xl px-4 py-3 shadow-sm">
                {/* Icon + Title */}
                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <Icon size={16} className="text-indigo-600" strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-slate-900 text-sm tracking-tight hidden sm:inline">{title}</span>
                </div>

                <div className="w-px h-6 bg-slate-200 shrink-0" />

                {/* Search */}
                {onSearchChange && (
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white font-medium transition-all text-sm placeholder:text-slate-400"
                        />
                        {isSearching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-indigo-500" size={14} />
                        )}
                    </div>
                )}

                {/* Tabs (if any) */}
                {tabs && (
                    <div className="flex bg-slate-100 p-1 rounded-xl">
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

                {/* Actions pushed to right */}
                <div className="flex items-center gap-3 ml-auto shrink-0">
                    {actions}
                </div>
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
