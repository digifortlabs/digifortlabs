
'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// --- Improved Tooth SVG Assets ---
// Generic paths for categories of teeth
// Root: Generic single root shape
const ROOT_SINGLE = "M10,2 L25,2 L28,25 Q17.5,40 7,25 Z";
// Root: Molar (2 roots)
const ROOT_DOUBLE = "M5,2 L35,2 L38,20 L32,35 L28,25 L20,15 L12,25 L8,35 L2,20 Z";

// Crowns
const CROWN_INCISOR = "M5,15 Q5,5 10,2 L25,2 Q30,5 30,15 L28,30 Q17.5,32 7,30 Z";
const CROWN_CANINE = "M5,15 Q5,5 10,2 L25,2 Q30,5 30,15 L17.5,35 Z";
const CROWN_PREMOLAR = "M2,15 Q2,5 10,2 L30,2 Q38,5 38,15 L35,30 Q20,32 5,30 Z";
const CROWN_MOLAR = "M0,15 Q0,5 10,2 L35,2 Q45,5 45,15 L42,32 Q22.5,34 3,32 Z";

// Mapping FDI IDs to Shapes
const getToothShape = (id: number) => {
    const n = id % 10; // Last digit (1-8)
    // 1=Central Incisor, 2=Lateral Incisor, 3=Canine, 4=1st Premolar, 5=2nd Premolar, 6=1st Molar, 7=2nd Molar, 8=3rd Molar

    // Scale and adjust viewbox for different types?
    // Let's keep it simple with standardized width/height ratios or just use generic types for now.

    if (n === 1 || n === 2) return { type: 'Incisor', root: ROOT_SINGLE, crown: CROWN_INCISOR, width: 35, height: 45 };
    if (n === 3) return { type: 'Canine', root: ROOT_SINGLE, crown: CROWN_CANINE, width: 35, height: 45 };
    if (n === 4 || n === 5) return { type: 'Premolar', root: ROOT_SINGLE, crown: CROWN_PREMOLAR, width: 40, height: 40 };
    return { type: 'Molar', root: ROOT_DOUBLE, crown: CROWN_MOLAR, width: 45, height: 50 };
};

// --- Data ---
// FDI Notation
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

const CONDITIONS = [
    { id: 'caries', label: 'Caries', color: 'bg-red-500', icon: '🦠' },
    { id: 'fracture', label: 'Fracture', color: 'bg-orange-500', icon: '⚡' },
    { id: 'mobility', label: 'Mobility', color: 'bg-yellow-500', icon: '〰️' },
    { id: 'root_stump', label: 'Root Stump', color: 'bg-gray-700', icon: '🦷' },
    { id: 'missing', label: 'Missing Tooth', color: 'bg-black', icon: '❌' }, // Replaced with visual X
    { id: 'impacted', label: 'Impacted', color: 'bg-purple-500', icon: '↘️' }, // Replaced with rotation/overlay
    { id: 'supra_erupted', label: 'Supra Erupted', color: 'bg-blue-500', icon: '⬆️' },
    { id: 'abscess', label: 'Periapical Abscess', color: 'bg-red-700', icon: '🔴' },
];

interface ToothProps {
    id: number;
    status?: string[];
    selected: boolean;
    onClick: (id: number) => void;
}

const Tooth = ({ id, status = [], selected, onClick }: ToothProps) => {
    const shape = getToothShape(id);
    const isUpper = id < 30; // 11-28 are upper

    // --- Condition Checks ---
    const isMissing = status.includes('missing');
    const isImpacted = status.includes('impacted');
    const isRootStump = status.includes('root_stump');
    const hasCaries = status.includes('caries');
    const hasAbscess = status.includes('abscess');
    const isFracture = status.includes('fracture');
    const isSupra = status.includes('supra_erupted');
    const isMobility = status.includes('mobility');

    return (
        <div
            onClick={() => onClick(id)}
            className={cn(
                "flex flex-col items-center cursor-pointer transition-all relative group select-none",
                selected ? "scale-110 z-10" : "hover:scale-105",
                isSupra && (isUpper ? "translate-y-2" : "-translate-y-2"), // Simple shift for supra-eruption
                isMobility && "animate-pulse" // Simple pulse for mobility
            )}
            title={`Tooth #${id} ${status.length > 0 ? `(${status.join(', ')})` : ''}`}
        >
            {/* Visual Representation Container */}
            <div className={cn(
                "relative transition-transform duration-300",
                isImpacted && "rotate-45 opacity-80 translate-y-2" // Impacted: Rotated
            )}
                style={{ width: shape.width, height: shape.height }}
            >
                {/* TOOTH SVG */}
                <svg
                    viewBox={`0 0 ${shape.width} ${shape.height}`}
                    className={cn(
                        "w-full h-full drop-shadow-sm transition-all duration-300",
                        isUpper ? "rotate-180" : "" // Flip upper teeth to point roots up
                    )}
                >
                    <defs>
                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.3" />
                        </filter>
                    </defs>

                    {/* ROOT (Hidden if extracted/missing, but shown for stump) */}
                    {!isMissing && (
                        <path
                            d={shape.root}
                            fill="#f3f4f6" // Light gray root
                            stroke="#9ca3af"
                            strokeWidth="1"
                            className="transition-colors"
                        />
                    )}

                    {/* CROWN (Hidden if missing or root stump) */}
                    {!isMissing && !isRootStump && (
                        <path
                            d={shape.crown}
                            fill="#ffffff" // White crown
                            stroke="#9ca3af"
                            strokeWidth="1"
                            className="transition-colors"
                        />
                    )}

                    {/* --- Visual Overlays on SVG --- */}

                    {/* Caries: Dark Spot on Crown */}
                    {hasCaries && !isMissing && !isRootStump && (
                        <circle cx={shape.width / 2} cy={shape.height * 0.4} r="4" fill="rgba(60, 20, 20, 0.8)" />
                    )}

                    {/* Fracture: ZigZag Line */}
                    {isFracture && !isMissing && !isRootStump && (
                        <path d={`M${shape.width * 0.2},${shape.height * 0.3} L${shape.width * 0.5},${shape.height * 0.5} L${shape.width * 0.8},${shape.height * 0.3}`} fill="none" stroke="red" strokeWidth="2" />
                    )}

                    {/* Abscess: Red Circle at Root Apex */}
                    {hasAbscess && !isMissing && (
                        <circle cx={shape.width / 2} cy={shape.height * 0.85} r="4" fill="rgba(220, 38, 38, 0.8)" className="animate-pulse" />
                    )}

                </svg>

                {/* --- HTML Level Overlays (Non-Rotated with Tooth necessarily) --- */}

                {/* Missing: Big Red X */}
                {isMissing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-red-500 font-bold text-4xl opacity-80">✕</span>
                    </div>
                )}

                {/* Selection Highlight Ring */}
                {selected && (
                    <div className="absolute inset-[-4px] border-2 border-blue-500 rounded-lg pointer-events-none animate-pulse" />
                )}
            </div>

            {/* Label */}
            <span className={cn(
                "text-[10px] font-bold mt-1 tracking-tighter",
                selected ? "text-blue-600" : "text-gray-400"
            )}>{id}</span>

            {/* Status Dots (for fallback or extra info) */}
            <div className="flex gap-0.5 mt-0.5 h-1.5 flex-wrap justify-center max-w-[40px]">
                {status.map(s => {
                    // Don't show dots for visually distinct conditions to reduce clutter
                    if (['missing', 'caries', 'abscess', 'fracture', 'root_stump', 'impacted'].includes(s)) return null;
                    const cond = CONDITIONS.find(c => c.id === s);
                    if (!cond) return null;
                    return <div key={s} className={cn("w-1.5 h-1.5 rounded-full", cond.color)} title={cond.label} />
                })}
            </div>
        </div>
    );
};

interface OdontogramProps {
    toothStatus: Record<number, string[]>;
    setToothStatus: (status: Record<number, string[]> | ((prev: Record<number, string[]>) => Record<number, string[]>)) => void;
    chiefComplaint: string;
    setChiefComplaint: (complaint: string) => void;
    advice: string;
    setAdvice: (advice: string) => void;
}

export default function Odontogram({
    toothStatus,
    setToothStatus,
    chiefComplaint,
    setChiefComplaint,
    advice,
    setAdvice
}: OdontogramProps) {
    const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);

    const handleToothClick = (id: number) => {
        setSelectedTeeth(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const applyCondition = (conditionId: string) => {
        if (selectedTeeth.length === 0) return;

        setToothStatus(prev => {
            const next = { ...prev };
            selectedTeeth.forEach(id => {
                const currentConditions = next[id] || [];

                // Toggle condition
                if (currentConditions.includes(conditionId)) {
                    next[id] = currentConditions.filter(c => c !== conditionId);
                } else {
                    // Exclusive Logic: Cannot be Missing AND Impacted AND Root Stump simultaneously (usually)
                    let newConditions = [...currentConditions];

                    // If setting Missing, clear others visual states that conflict
                    if (conditionId === 'missing') {
                        newConditions = newConditions.filter(c => c !== 'root_stump' && c !== 'impacted');
                    }
                    // If setting Root Stump, clear Missing
                    if (conditionId === 'root_stump') {
                        newConditions = newConditions.filter(c => c !== 'missing');
                    }

                    next[id] = [...newConditions, conditionId];
                }
            });
            return next;
        });
    };

    const clearSelection = () => setSelectedTeeth([]);
    const selectAll = () => setSelectedTeeth([...UPPER_RIGHT, ...UPPER_LEFT, ...LOWER_RIGHT, ...LOWER_LEFT]);
    const removeAllConditions = () => setToothStatus({});

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-8">

            <div className="flex flex-col xl:flex-row gap-8">
                {/* LEFT: Chart */}
                <div className="flex-1 space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b pb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Clinical Examination</h2>
                        <div className="text-sm text-muted-foreground">
                            Date: {new Date().toLocaleDateString()}
                        </div>
                    </div>

                    {/* Teeth Container */}
                    <div className="flex flex-col items-center space-y-12 overflow-x-auto pb-4 px-4">
                        {/* Upper Arch */}
                        <div className="flex justify-center gap-1 min-w-max border-b-2 border-dashed border-gray-200 pb-4 relative">
                            <span className="absolute -left-8 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 -rotate-90">UPPER</span>
                            <div className="flex gap-1 border-r-2 border-gray-300 pr-2">
                                {UPPER_RIGHT.map(id => (
                                    <Tooth key={id} id={id} status={toothStatus[id]} selected={selectedTeeth.includes(id)} onClick={handleToothClick} />
                                ))}
                            </div>
                            <div className="flex gap-1 pl-2">
                                {UPPER_LEFT.map(id => (
                                    <Tooth key={id} id={id} status={toothStatus[id]} selected={selectedTeeth.includes(id)} onClick={handleToothClick} />
                                ))}
                            </div>
                        </div>

                        {/* Lower Arch */}
                        <div className="flex justify-center gap-1 min-w-max relative">
                            <span className="absolute -left-8 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 -rotate-90">LOWER</span>
                            <div className="flex gap-1 border-r-2 border-gray-300 pr-2">
                                {LOWER_RIGHT.map(id => (
                                    <Tooth key={id} id={id} status={toothStatus[id]} selected={selectedTeeth.includes(id)} onClick={handleToothClick} />
                                ))}
                            </div>
                            <div className="flex gap-1 pl-2">
                                {LOWER_LEFT.map(id => (
                                    <Tooth key={id} id={id} status={toothStatus[id]} selected={selectedTeeth.includes(id)} onClick={handleToothClick} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                        <Button variant={selectedTeeth.length > 0 ? "default" : "outline"} onClick={selectAll} className="bg-blue-900 hover:bg-blue-800 text-white">
                            Select All
                        </Button>
                        <Button variant="outline" onClick={clearSelection}>
                            Clear Selection
                        </Button>
                        <Button variant="outline" onClick={removeAllConditions} className="text-red-600 hover:bg-red-50">
                            Remove All Conditions
                        </Button>
                        <div className="flex-1" />
                        <Button variant="secondary" className="bg-blue-900 text-white hover:bg-blue-800">Notes - Upper</Button>
                        <Button variant="secondary" className="bg-blue-900 text-white hover:bg-blue-800">Notes - Lower</Button>
                    </div>

                    {/* Inputs Section */}
                    <div className="grid gap-6 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="complaints" className="text-gray-500 uppercase text-xs font-bold tracking-wider">Clinical Notes</Label>
                            <Textarea
                                id="complaints"
                                placeholder="Enter patient's chief complaints..."
                                className="min-h-[100px] resize-none focus-visible:ring-blue-500"
                                value={chiefComplaint}
                                onChange={e => setChiefComplaint(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="advice" className="text-gray-500 uppercase text-xs font-bold tracking-wider">Advice</Label>
                            <div className="border-t border-b py-2 border-gray-200">
                                <Textarea
                                    id="advice"
                                    placeholder="Enter medical advice..."
                                    className="min-h-[60px] border-0 focus-visible:ring-0 resize-none px-0"
                                    value={advice}
                                    onChange={e => setAdvice(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                </div>

                {/* RIGHT: Sidebar */}
                <div className="w-full xl:w-72 space-y-3">
                    <h3 className="font-bold text-gray-700 mb-2">Conditions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
                        {CONDITIONS.map(condition => (
                            <div
                                key={condition.id}
                                onClick={() => applyCondition(condition.id)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-all bg-white shadow-sm",
                                    selectedTeeth.length > 0 ? "opacity-100 hover:border-blue-300 hover:shadow-md" : "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <div className={cn("w-10 h-10 flex items-center justify-center text-xl bg-gray-50 rounded-lg border", condition.color.replace('bg-', 'text-'))}>
                                    {condition.icon}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm text-gray-800">{condition.label}</span>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Global Code</span>
                                </div>

                                {/* Active Indicator if any selected tooth has this condition */}
                                {selectedTeeth.some(id => toothStatus[id]?.includes(condition.id)) && (
                                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-gray-50 rounded-lg border text-xs text-gray-500 space-y-2">
                        <p className="font-bold text-gray-700">Legend:</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li><span className="font-bold">Missing:</span> Marked with 'X'</li>
                            <li><span className="font-bold">Impacted:</span> Tilted 45°</li>
                            <li><span className="font-bold">Root Stump:</span> Crown hidden</li>
                            <li><span className="font-bold">Caries:</span> Dark spot on crown</li>
                            <li><span className="font-bold">Fracture:</span> Red zigzag line</li>
                            <li><span className="font-bold">Abscess:</span> Red pulse at root</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
