"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Calendar, Save } from 'lucide-react';
import { apiFetch } from '@/config/api';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DoctorSchedulePage() {
    const [blocks, setBlocks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch("doctors/me/schedule");
            setBlocks(data || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load schedule");
        } finally {
            setIsLoading(false);
        }
    };

    const addBlock = (dayIndex: number) => {
        setBlocks([...blocks, {
            day_of_week: dayIndex,
            start_time: '09:00',
            end_time: '13:00',
            session_type: 'OPD',
            is_active: true
        }]);
    };

    const removeBlock = (index: number) => {
        setBlocks(blocks.filter((_, i) => i !== index));
    };

    const updateBlock = (index: number, field: string, value: any) => {
        const newBlocks = [...blocks];
        newBlocks[index][field] = value;
        setBlocks(newBlocks);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiFetch("doctors/me/schedule", {
                method: 'POST',
                body: blocks
            });
            toast.success("Schedule updated successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save schedule");
        } finally {
            setIsSaving(false);
        }
    };

    const getBlocksForDay = (dayIndex: number) => {
        return blocks.map((b, i) => ({ ...b, originalIndex: i })).filter(b => b.day_of_week === dayIndex).sort((a,b) => a.start_time.localeCompare(b.start_time));
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Calendar className="text-indigo-600 w-8 h-8" /> 
                        My Schedule & Setup
                    </h1>
                    <p className="text-slate-500 mt-1">Configure your working blocks (OPD, IPD, OT) for the currently selected hospital.</p>
                </div>
                <Button onClick={handleSave} disabled={isLoading || isSaving} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                    <Save size={16} /> {isSaving ? "Saving..." : "Save Schedule"}
                </Button>
            </div>

            {isLoading ? (
                <div className="py-24 text-center text-slate-500 flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                    Loading your schedule...
                </div>
            ) : (
                <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    {DAYS.map((day, dayIndex) => {
                        const dayBlocks = getBlocksForDay(dayIndex);
                        return (
                            <div key={day} className="border rounded-xl p-5 bg-slate-50/50">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-slate-800 text-lg">{day}</h4>
                                    <Button variant="outline" size="sm" onClick={() => addBlock(dayIndex)} className="gap-2 bg-white">
                                        <Plus className="w-4 h-4" /> Add Block
                                    </Button>
                                </div>
                                
                                {dayBlocks.length === 0 ? (
                                    <div className="py-4 text-center text-slate-400 text-sm font-medium border-2 border-dashed rounded-lg bg-white">
                                        Off Duty
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {dayBlocks.map(block => (
                                            <div key={block.originalIndex} className="flex flex-wrap sm:flex-nowrap items-center gap-4 bg-white p-3 rounded-lg border shadow-sm">
                                                <div className="w-40">
                                                    <Select value={block.session_type} onValueChange={(val) => updateBlock(block.originalIndex, 'session_type', val)}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="OPD">OPD Visit</SelectItem>
                                                            <SelectItem value="IPD">IPD Rounds</SelectItem>
                                                            <SelectItem value="OT">Surgery (OT)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Input 
                                                    type="time" 
                                                    value={block.start_time} 
                                                    onChange={(e) => updateBlock(block.originalIndex, 'start_time', e.target.value)}
                                                    className="w-32"
                                                />
                                                <span className="text-slate-400 font-medium">to</span>
                                                <Input 
                                                    type="time" 
                                                    value={block.end_time} 
                                                    onChange={(e) => updateBlock(block.originalIndex, 'end_time', e.target.value)}
                                                    className="w-32"
                                                />
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto" onClick={() => removeBlock(block.originalIndex)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
