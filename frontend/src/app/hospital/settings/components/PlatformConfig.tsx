"use client";

import React from 'react';
import { 
    Settings, 
    ShieldAlert, 
    Zap, 
    Terminal, 
    RefreshCcw, 
    Activity,
    AlertCircle,
    Info,
    CheckCircle2,
    Loader2
} from 'lucide-react';

interface PlatformConfigProps {
    systemSettings: any;
    setSystemSettings: (s: any) => void;
    updateSystemSetting: (key: string, value: string) => void;
    runBulkOCR: () => void;
    ocrLoading: boolean;
    ocrStats: any;
    ocrLogs: string[];
    systemErrors: any[];
    loadingErrors: boolean;
    fetchSystemErrors: () => void;
}

export default function PlatformConfig({
    systemSettings,
    setSystemSettings,
    updateSystemSetting,
    runBulkOCR,
    ocrLoading,
    ocrStats,
    ocrLogs,
    systemErrors,
    loadingErrors,
    fetchSystemErrors
}: PlatformConfigProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Global Switches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-50 p-3 rounded-2xl text-red-600">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900">Maintenance Mode</h4>
                            <p className="text-xs text-slate-500 font-medium tracking-tight">Locks all hospital logins for updates.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={systemSettings.maintenance_mode === 'true'}
                            onChange={(e) => updateSystemSetting('maintenance_mode', e.target.checked ? 'true' : 'false')}
                        />
                        <div className="w-12 h-7 bg-slate-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                            <Info size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900">Global Announcement</h4>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Saved automatically on blur</p>
                        </div>
                    </div>
                    <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                        placeholder="System alert or news banner..."
                        value={systemSettings.announcement}
                        onChange={(e) => setSystemSettings({ ...systemSettings, announcement: e.target.value })}
                        onBlur={(e) => updateSystemSetting('announcement', e.target.value)}
                    />
                </div>
            </div>

            {/* OCR & Bulk Processing */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
                <div className="flex flex-col lg:flex-row justify-between gap-10">
                    <div className="lg:max-w-md">
                        <div className="flex items-center gap-3 mb-6">
                            <Zap className="text-amber-400 fill-amber-400" size={32} />
                            <h2 className="text-3xl font-black tracking-tight">Bulk Extraction Engine</h2>
                        </div>
                        <p className="text-slate-400 text-sm font-medium mb-8">Process pending medical records in large batches using the platform's dedicated AI resources. Use this to catch up on massive digitization backlogs.</p>
                        
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Pending</p>
                                <p className="text-2xl font-black text-white">{ocrStats.pending}</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-1">Active</p>
                                <p className="text-2xl font-black text-amber-400">{ocrStats.analyzing}</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">Done</p>
                                <p className="text-2xl font-black text-emerald-400">{ocrStats.completed}</p>
                            </div>
                        </div>

                        <button
                            onClick={runBulkOCR}
                            disabled={ocrLoading || ocrStats.analyzing > 0}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-black py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                        >
                            {ocrLoading ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    <span>Initiating...</span>
                                </>
                            ) : ocrStats.analyzing > 0 ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    <span>Engine Running...</span>
                                </>
                            ) : (
                                <>
                                    <RefreshCcw size={18} />
                                    <span>Initiate Batch Run</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="bg-black/50 border border-white/10 rounded-3xl h-full flex flex-col overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                                <div className="flex items-center gap-2">
                                    <Terminal size={16} className="text-slate-400" />
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Live Process Logs</span>
                                </div>
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                </div>
                            </div>
                            <div className="flex-1 p-6 font-mono text-xs text-indigo-300 overflow-y-auto max-h-[350px] leading-relaxed">
                                {ocrLogs.length > 0 ? ocrLogs.map((log, i) => (
                                    <div key={i} className="mb-1">
                                        <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                        {log}
                                    </div>
                                )) : (
                                    <div className="text-slate-600 italic">Waiting for process initiation...</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Monitor */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Activity className="text-red-500" /> System Integrity Monitor
                        </h2>
                        <p className="text-slate-500 text-sm font-medium mt-1">Cross-tenant backend exception tracking.</p>
                    </div>
                    <button
                        onClick={fetchSystemErrors}
                        disabled={loadingErrors}
                        className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCcw size={20} className={loadingErrors ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {loadingErrors ? (
                        <div className="py-20 flex flex-col items-center justify-center opacity-30">
                            <Loader2 className="animate-spin mb-4" size={32} />
                            <p className="text-xs font-black uppercase tracking-widest">Scanning logs...</p>
                        </div>
                    ) : systemErrors.length > 0 ? (
                        systemErrors.map((err, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:border-red-200 hover:bg-red-50/30 transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase">
                                            {err.error_type}
                                        </span>
                                        {err.endpoint && (
                                            <span className="bg-slate-200 text-slate-600 text-[10px] font-mono px-2 py-0.5 rounded-lg">
                                                {err.method} {err.endpoint}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-bold">{new Date(err.timestamp).toLocaleString()}</span>
                                </div>
                                <p className="text-sm font-bold text-slate-800 font-mono break-all">{err.error_message}</p>
                            </div>
                        ))
                    ) : (
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-10 flex flex-col items-center text-center">
                            <CheckCircle2 className="text-emerald-500 mb-4 opacity-40" size={48} />
                            <p className="text-emerald-900 font-black text-lg">Platform Nominal</p>
                            <p className="text-emerald-600/70 text-sm font-medium">No system errors detected in the last 24 hours.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
