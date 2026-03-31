"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Save, History, Plus, AlertCircle } from 'lucide-react';

interface PeriodontalChartProps {
    patientId: number;
    onSave: (data: any) => void;
}

export default function PeriodontalChart({ patientId, onSave }: PeriodontalChartProps) {
    // Initializing state for 32 teeth
    const initialMeasurements = Array.from({ length: 32 }, (_, i) => ({
        tooth_number: i + 1,
        pd: [0, 0, 0, 0, 0, 0], // db, b, mb, dl, l, ml
        gm: [0, 0, 0, 0, 0, 0],
        bop: [false, false, false, false, false, false]
    }));

    const [measurements, setMeasurements] = useState(initialMeasurements);
    const [notes, setNotes] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const updateValue = (toothNum: number, field: 'pd' | 'gm' | 'bop', index: number, value: any) => {
        setMeasurements(prev => prev.map(m => {
            if (m.tooth_number === toothNum) {
                const newData = [...m[field] as any[]];
                newData[index] = value;
                return { ...m, [field]: newData };
            }
            return m;
        }));
    };

    const handleSave = () => {
        // Transform internal state [0,0,0,0,0,0] to flat object for API
        const payload = {
            notes,
            measurements: measurements.map(m => ({
                tooth_number: m.tooth_number,
                pd_db: m.pd[0], pd_b: m.pd[1], pd_mb: m.pd[2],
                pd_dl: m.pd[3], pd_l: m.pd[4], pd_ml: m.pd[5],
                gm_db: m.gm[0], gm_b: m.gm[1], gm_mb: m.gm[2],
                gm_dl: m.gm[3], gm_l: m.gm[4], gm_ml: m.gm[5],
                bop_db: m.bop[0], bop_b: m.bop[1], bop_mb: m.bop[2],
                bop_dl: m.bop[3], bop_l: m.bop[4], bop_ml: m.bop[5]
            }))
        };
        onSave(payload);
    };

    const renderToothInputs = (tooth: any) => {
        const labels = ['DB', 'B', 'MB', 'DL', 'L', 'ML'];
        return (
            <div className="flex flex-col gap-1 p-2 border rounded hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded">#{tooth.tooth_number}</span>
                </div>

                {/* Pocket Depths */}
                <div className="grid grid-cols-3 gap-1 mb-1">
                    {tooth.pd.slice(0, 3).map((v: number, i: number) => (
                        <div key={`pd-b-${i}`} className="flex flex-col">
                            <span className="text-[8px] text-slate-400 font-bold uppercase">{labels[i]}</span>
                            <input
                                type="number"
                                className={cn(
                                    "w-full text-center text-xs p-1 h-7 border rounded outline-none transition-colors",
                                    v >= 4 ? "bg-red-50 border-red-200 text-red-700 font-bold" : "bg-white border-slate-200"
                                )}
                                value={v || ""}
                                onChange={(e) => updateValue(tooth.tooth_number, 'pd', i, parseInt(e.target.value) || 0)}
                            />
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-1">
                    {tooth.pd.slice(3, 6).map((v: number, i: number) => (
                        <div key={`pd-l-${i}`} className="flex flex-col">
                            <span className="text-[8px] text-slate-400 font-bold uppercase">{labels[i + 3]}</span>
                            <input
                                type="number"
                                className={cn(
                                    "w-full text-center text-xs p-1 h-7 border rounded outline-none transition-colors",
                                    v >= 4 ? "bg-red-50 border-red-200 text-red-700 font-bold" : "bg-white border-slate-200"
                                )}
                                value={v || ""}
                                onChange={(e) => updateValue(tooth.tooth_number, 'pd', i + 3, parseInt(e.target.value) || 0)}
                            />
                        </div>
                    ))}
                </div>

                {/* Bleeding on Probing (BOP) markers */}
                <div className="flex justify-between mt-1 px-1">
                    {tooth.bop.slice(0, 3).map((v: boolean, i: number) => (
                        <div
                            key={`bop-${i}`}
                            onClick={() => updateValue(tooth.tooth_number, 'bop', i, !v)}
                            className={cn(
                                "w-2 h-2 rounded-full cursor-pointer",
                                v ? "bg-red-500 shadow-sm shadow-red-500/50" : "bg-slate-200"
                            )}
                            title={`BOP ${labels[i]}`}
                        />
                    ))}
                    <div className="w-px h-2 bg-slate-200 mx-1" />
                    {tooth.bop.slice(3, 6).map((v: boolean, i: number) => (
                        <div
                            key={`bop-l-${i}`}
                            onClick={() => updateValue(tooth.tooth_number, 'bop', i + 3, !v)}
                            className={cn(
                                "w-2 h-2 rounded-full cursor-pointer",
                                v ? "bg-red-500 shadow-sm shadow-red-500/50" : "bg-slate-200"
                            )}
                            title={`BOP ${labels[i + 3]}`}
                        />
                    ))}
                </div>
            </div>
        );
    };

    const upperArch = measurements.filter(m => m.tooth_number >= 1 && m.tooth_number <= 16);
    const lowerArch = measurements.filter(m => m.tooth_number >= 17 && m.tooth_number <= 32);

    return (
        <Card className="border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div>
                    <CardTitle className="text-xl">Periodontal Examination</CardTitle>
                    <p className="text-sm text-slate-500">6-point pocket depth (PD) and bleeding assessment</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <History className="w-4 h-4" /> History
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-900 hover:bg-blue-800 text-white gap-2 shadow-md"
                    >
                        <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Exam'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-12">
                    {/* Upper Arch */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-slate-900 text-white border-none text-[10px] uppercase tracking-wider">Upper Arch (1-16)</Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                            {upperArch.map(renderToothInputs)}
                        </div>
                    </div>

                    {/* Lower Arch */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-slate-900 text-white border-none text-[10px] uppercase tracking-wider">Lower Arch (17-32)</Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                            {lowerArch.map(renderToothInputs)}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">Clinical Notes / Findings</label>
                            <textarea
                                className="w-full h-24 p-4 rounded-xl bg-slate-50 border-none outline-none text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-blue-100 transition-all"
                                placeholder="Enter detailed periodontal findings, mobility scores, furcation involvement..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-80 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <div className="flex gap-2 text-amber-800">
                                <AlertCircle className="w-4 h-4 fill-amber-300 text-amber-600 flex-shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-wider">Legend</p>
                                    <p className="text-[11px] leading-relaxed">
                                        <span className="font-bold">Red Field:</span> Pocket Depth ≥ 4mm<br />
                                        <span className="font-bold">Red Dot:</span> Bleeding on Probing (BOP)<br />
                                        <span className="font-bold">Inputs:</span> DB (Disto-buccal), B (Buccal), MB (Mesio-buccal)...
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
