"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { X, BedDouble, User, Users, Stethoscope, Zap, PlusSquare, Clock } from 'lucide-react';

interface PatientItem {
    id: string;
    status: string;
    patient: string | null;
    condition: string | null;
}

interface DepartmentPanelProps {
    id: string;
    title: string;
    items: PatientItem[];
    onClose: () => void;
}

export default function DepartmentPanel({ id, title, items, onClose }: DepartmentPanelProps) {
    const isIPD = id === 'ipd';
    const isER = id === 'er';
    const isOT = id === 'ot';
    
    // Determine if we should use the intense "occupied" coloring (Neon Red)
    // For IPD/ER/OT, we highlight "occupied" or "active". For OPD/Reception, we use standard blue/cyan.
    const useIntenseColors = isIPD || isER || isOT;

    const getIcon = () => {
        switch(id) {
            case 'reception': return Users;
            case 'waiting': return Clock;
            case 'opd': return Stethoscope;
            case 'ipd': return BedDouble;
            case 'er': return Zap;
            case 'ot': return PlusSquare;
            default: return Users;
        }
    };
    
    const Icon = getIcon();

    const activeCount = items.filter(i => 
        i.status === 'occupied' || i.status === 'active' || i.status === 'critical' || i.status === 'waiting'
    ).length;
    const inactiveCount = items.length - activeCount;

    return (
        <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="absolute top-0 right-0 w-[350px] h-full bg-slate-900/80 backdrop-blur-md border-l border-slate-700/50 shadow-2xl z-50 flex flex-col pointer-events-auto"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/40">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                        <Icon size={16} className="text-blue-400" />
                    </div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">{title}</h2>
                </div>
                <button 
                    onClick={onClose}
                    className="p-1.5 rounded-md hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                
                {/* Stats Summary */}
                <div className="flex gap-2 mb-6">
                    <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 flex flex-col items-center justify-center">
                        <span className="text-lg font-black text-red-400 font-mono">{activeCount}</span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">{useIntenseColors ? "Active" : "Waiting"}</span>
                    </div>
                    <div className="flex-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-2.5 flex flex-col items-center justify-center">
                        <span className="text-lg font-black text-cyan-400 font-mono">{inactiveCount}</span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Other</span>
                    </div>
                </div>

                <div className="space-y-3 font-mono">
                    {items.length === 0 && (
                        <div className="text-center text-slate-500 text-xs py-8 border border-dashed border-slate-700 rounded-lg">
                            No active records found.
                        </div>
                    )}
                    
                    {items.map((item, idx) => {
                        const isOccupied = item.status === 'occupied' || item.status === 'active' || item.status === 'critical';
                        const isWait = item.status === 'waiting';
                        
                        let cardStyle = 'bg-slate-800/20 border-cyan-500/30 hover:border-cyan-400/50 hover:bg-cyan-950/20';
                        let idColor = 'text-cyan-400';
                        let badgeStyle = 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
                        
                        if (useIntenseColors && isOccupied) {
                            cardStyle = 'bg-red-950/20 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:border-red-500/60';
                            idColor = 'text-red-400';
                            badgeStyle = 'bg-red-500/20 text-red-300 border-red-500/30';
                        } else if (isWait) {
                            cardStyle = 'bg-yellow-950/20 border-yellow-500/40 hover:border-yellow-500/60 text-yellow-400';
                            idColor = 'text-yellow-400';
                            badgeStyle = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
                        }

                        return (
                            <div 
                                key={`${item.id}-${idx}`}
                                className={`relative p-3 rounded-lg border flex flex-col gap-2 transition-all duration-200 ${cardStyle}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs font-bold tracking-widest ${idColor}`}>
                                        {item.id}
                                    </span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold border ${badgeStyle}`}>
                                        {item.status || "Unknown"}
                                    </span>
                                </div>
                                
                                {item.patient ? (
                                    <div className="flex flex-col gap-1 mt-1">
                                        <div className="flex items-center gap-2 text-slate-200">
                                            <User size={14} className={`${useIntenseColors && isOccupied ? 'text-red-400' : isWait ? 'text-yellow-400' : 'text-cyan-400'} opacity-80`} />
                                            <span className="text-xs font-semibold">{item.patient}</span>
                                        </div>
                                        {item.condition && (
                                            <span className="text-[10px] text-slate-500 ml-5">Cond: {item.condition}</span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center py-2 opacity-30 mt-1">
                                        <Icon size={24} className="text-cyan-400" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
