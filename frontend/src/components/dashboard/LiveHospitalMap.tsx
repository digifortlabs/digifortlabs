"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, PlusSquare, Users, Bed, Pill, Zap, Stethoscope, Clock, Maximize, Minimize } from 'lucide-react';
import DepartmentPanel from './DepartmentPanel';

interface ActivityLog {
    id: number;
    action: string;
    user: string;
    patient: string;
    details: string;
    module: string;
    time: string;
    timestamp: string;
}

interface LiveHospitalMapProps {
    recentActivity: ActivityLog[];
    clinicalOps?: any;
}

const NODES = {
    RECEPTION: { x: 50, y: 85, label: "Reception", icon: Users, id: 'reception' },
    WAITING_AREA: { x: 25, y: 85, label: "Waiting Area", icon: Clock, id: 'waiting' },
    OPD: { x: 25, y: 50, label: "Outpatient (OPD)", icon: Stethoscope, id: 'opd' },
    ER: { x: 75, y: 50, label: "Emergency (ER)", icon: Zap, id: 'er' },
    IPD: { x: 50, y: 20, label: "Inpatient (IPD)", icon: Bed, id: 'ipd' },
    OT: { x: 85, y: 15, label: "Operation Theater", icon: PlusSquare, id: 'ot' },
};

export default function LiveHospitalMap({ recentActivity, clinicalOps }: LiveHospitalMapProps) {
    const [dots, setDots] = useState<any[]>([]);
    const [selectedPanel, setSelectedPanel] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        if (!recentActivity || recentActivity.length === 0) return;

        // Take the latest 5 events, assign them paths
        const newDots = recentActivity.slice(0, 5).map((log, i) => {
            // Determine path based on module
            let startNode = NODES.RECEPTION;
            let endNode = NODES.OPD;
            let color = "bg-blue-400"; // Staff
            
            const moduleName = (log.module || "").toUpperCase();
            
            if (moduleName.includes("PATIENT") || moduleName.includes("APPOINTMENT")) {
                startNode = NODES.RECEPTION;
                endNode = NODES.OPD;
                color = "bg-green-400"; // Patient
            } else if (moduleName.includes("EMERGENCY")) {
                startNode = NODES.RECEPTION;
                endNode = NODES.ER;
                color = "bg-amber-400"; // Urgent
            } else if (moduleName.includes("ADMISSION") || moduleName.includes("BED")) {
                startNode = NODES.ER;
                endNode = NODES.IPD;
                color = "bg-green-400";
            } else if (moduleName.includes("BILLING")) {
                startNode = NODES.OPD;
                endNode = NODES.RECEPTION;
                color = "bg-purple-400";
            } else if (moduleName.includes("RECORDS") || moduleName.includes("UPLOAD") || moduleName.includes("FILE")) {
                startNode = NODES.RECEPTION;
                endNode = NODES.RECEPTION;
                color = "bg-indigo-400"; // Data
            } else if (moduleName.includes("AUTH") || moduleName.includes("LOGIN")) {
                startNode = NODES.RECEPTION;
                endNode = NODES.RECEPTION;
                color = "bg-slate-400";
            }

            // If start and end are the same (e.g. data upload), pick a random nearby spot to jiggle to
            if (startNode === endNode) {
                 const randomOffset = { 
                     x: endNode.x + (Math.random() * 10 - 5),
                     y: endNode.y + (Math.random() * 10 - 5)
                 };
                 endNode = { ...endNode, ...randomOffset };
            }

            return {
                id: log.id + "-" + i + "-" + Date.now(), // unique ID so it re-triggers
                log,
                startNode,
                endNode,
                color,
                delay: i * 0.8 // Stagger the animations
            };
        });

        setDots(newDots);
    }, [recentActivity]);

    return (
        <div 
            ref={containerRef}
            className={`relative w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl ${isFullscreen ? 'h-screen rounded-none border-none' : 'h-[500px]'} font-mono select-none`}
        >
            {/* ── AUTO-ADJUSTING MAP CONTAINER ── */}
            <div 
                className="absolute inset-y-0 left-0 transition-all duration-300 ease-in-out"
                style={{ right: selectedPanel ? '350px' : '0px' }}
            >
                {/* ── BACKGROUND BLUEPRINT GRID ── */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ 
                    backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                 }} 
            />

            {/* ── CONNECTION LINES ── */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                <line x1="50%" y1="85%" x2="25%" y2="85%" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="25%" y1="85%" x2="25%" y2="50%" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="50%" y1="85%" x2="25%" y2="50%" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="50%" y1="85%" x2="75%" y2="50%" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="25%" y1="50%" x2="50%" y2="20%" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="75%" y1="50%" x2="50%" y2="20%" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="75%" y1="50%" x2="85%" y2="15%" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
            </svg>

            {/* ── NODES ── */}
            {Object.values(NODES).map((node, i) => {
                let count = 0;
                if (clinicalOps) {
                    if (node.id === 'opd') count = clinicalOps.opd_today || 0;
                    if (node.id === 'ipd') count = clinicalOps.ipd_admitted || 0;
                    if (node.id === 'er') count = clinicalOps.er_active || 0;
                    if (node.id === 'ot') count = clinicalOps.ot_in_use || 0;
                }

                return (
                    <div 
                        key={node.label} 
                        onClick={() => setSelectedPanel(node.id)}
                        className={`absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer`}
                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    >
                        <div className={`w-12 h-12 rounded-full border border-slate-700 bg-slate-800/80 backdrop-blur flex items-center justify-center shadow-lg relative z-10 group hover:border-slate-500 transition-colors ${selectedPanel === node.id ? 'ring-2 ring-blue-500 border-blue-400' : ''}`}>
                            <node.icon size={20} className="text-slate-400 group-hover:text-slate-200 transition-colors" />
                            {/* Counter Badge */}
                            {count > 0 && (
                                <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1 border border-slate-800 shadow-sm z-20">
                                    {count}
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 mt-2 bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur">
                            {node.label}
                        </span>
                    </div>
                );
            })}

            {/* ── ANIMATED ACTIVITY DOTS ── */}
            <AnimatePresence>
                {dots.map((dot) => (
                    <motion.div
                        key={dot.id}
                        initial={{ left: `${dot.startNode.x}%`, top: `${dot.startNode.y}%`, opacity: 0, scale: 0.5 }}
                        animate={{ 
                            left: `${dot.endNode.x}%`, 
                            top: `${dot.endNode.y}%`, 
                            opacity: [0, 1, 1, 0],
                            scale: [0.5, 1, 1, 0.5]
                        }}
                        transition={{ 
                            duration: 5, 
                            delay: dot.delay,
                            ease: "easeInOut",
                            times: [0, 0.2, 0.8, 1], // opacity keyframes
                            repeat: 0
                        }}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto group cursor-pointer"
                    >
                        {/* The glowing dot */}
                        <div className={`w-3 h-3 rounded-full ${dot.color} shadow-[0_0_12px_rgba(255,255,255,0.7)] ring-2 ring-white/20`} />
                        
                        {/* Tooltip on hover */}
                        <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl transition-opacity pointer-events-none z-50">
                            <p className="text-[10px] text-slate-400 mb-1">{dot.log.time}</p>
                            <p className="text-xs text-white font-medium capitalize leading-tight">{dot.log.action.replace(/_/g, ' ').toLowerCase()}</p>
                            <p className="text-[10px] text-slate-400 mt-1 truncate">By: {dot.log.user}</p>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
            </div> {/* End of auto-adjusting container */}
            
            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur border border-slate-700 rounded-md p-3 flex flex-col gap-2 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.8)]" />
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Patient Flow</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.8)]" />
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Staff Action</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Urgent / ER</span>
                </div>
            </div>
            
            {/* Live Indicator & Fullscreen */}
            <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
                <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-md border border-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Live Feed</span>
                </div>
                
                <button 
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded-md bg-slate-800/80 backdrop-blur border border-slate-700 hover:bg-slate-700/80 text-slate-400 hover:text-white transition-colors"
                >
                    {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                </button>
            </div>

            {/* Side Panels */}
            <AnimatePresence>
                {selectedPanel && (
                    <DepartmentPanel 
                        id={selectedPanel}
                        title={Object.values(NODES).find(n => n.id === selectedPanel)?.label || "Department"}
                        items={clinicalOps?.lists?.[selectedPanel] || []}
                        onClose={() => setSelectedPanel(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
